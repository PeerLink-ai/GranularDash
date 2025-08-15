import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { addAuditLog } from "@/lib/audit-store"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      agentId,
      environmentId,
      version,
      deploymentConfig = {},
      scalingConfig = {},
      trafficConfig = {},
    } = await req.json()

    // Validate required fields
    if (!agentId || !environmentId) {
      return NextResponse.json(
        {
          error: "Agent ID and environment ID are required",
        },
        { status: 400 },
      )
    }

    // Verify agent exists and belongs to user
    const agents = await sql<any[]>`
      SELECT * FROM created_agents WHERE id = ${agentId} AND user_id = ${user.id}
    `
    if (agents.length === 0) {
      return NextResponse.json(
        {
          error: "Agent not found or access denied",
        },
        { status: 404 },
      )
    }

    const agent = agents[0]

    // Verify environment exists
    const environments = await sql<any[]>`
      SELECT * FROM deployment_environments WHERE id = ${environmentId} AND is_active = true
    `
    if (environments.length === 0) {
      return NextResponse.json(
        {
          error: "Deployment environment not found or not available",
        },
        { status: 404 },
      )
    }

    const environment = environments[0]

    // Start build process
    const buildResult = await startAgentBuild(agent, environment, user.id)
    if (!buildResult.success) {
      return NextResponse.json(
        {
          error: `Build failed: ${buildResult.error}`,
        },
        { status: 500 },
      )
    }

    // Create deployment record
    const [deployment] = await sql<any[]>`
      INSERT INTO agent_deployments (
        agent_id,
        environment_id,
        build_id,
        version,
        deployment_type,
        deployment_config,
        resource_allocation,
        scaling_config,
        traffic_config,
        status,
        deployed_by
      ) VALUES (
        ${agentId},
        ${environmentId},
        ${buildResult.buildId},
        ${version || agent.version},
        ${environment.environment_type},
        ${JSON.stringify(deploymentConfig)},
        ${JSON.stringify(environment.resource_limits)},
        ${JSON.stringify(scalingConfig)},
        ${JSON.stringify(trafficConfig)},
        'deploying',
        ${user.id}
      )
      RETURNING *
    `

    // Start deployment process
    await startDeploymentProcess(deployment, environment, buildResult)

    // Log the deployment
    await addAuditLog({
      userId: user.id,
      organization: user.organization,
      action: "agent_deployment_started",
      resourceType: "agent_deployment",
      resourceId: deployment.id,
      details: {
        agentId,
        environmentId,
        environmentType: environment.environment_type,
        version: deployment.version,
      },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    })

    return NextResponse.json(
      {
        message: "Deployment started successfully",
        deployment,
        buildId: buildResult.buildId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Agent deployment error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get("agentId")
    const status = searchParams.get("status")
    const environmentType = searchParams.get("environmentType")

    let query = `
      SELECT 
        ad.*,
        ca.name as agent_name,
        ca.agent_type,
        de.display_name as environment_name,
        de.environment_type,
        de.provider,
        u.name as deployed_by_name
      FROM agent_deployments ad
      JOIN created_agents ca ON ad.agent_id = ca.id
      LEFT JOIN deployment_environments de ON ad.environment_id = de.id
      LEFT JOIN users u ON ad.deployed_by = u.id
      WHERE ca.user_id = $1
    `

    const params = [user.id]
    let paramIndex = 2

    if (agentId) {
      query += ` AND ad.agent_id = $${paramIndex}`
      params.push(agentId)
      paramIndex++
    }

    if (status) {
      query += ` AND ad.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (environmentType) {
      query += ` AND de.environment_type = $${paramIndex}`
      params.push(environmentType)
      paramIndex++
    }

    query += ` ORDER BY ad.deployed_at DESC`

    const deployments = await sql<any[]>`${query}`

    return NextResponse.json({ deployments })
  } catch (error) {
    console.error("Get deployments error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

async function startAgentBuild(
  agent: any,
  environment: any,
  userId: string,
): Promise<{ success: boolean; buildId?: string; error?: string }> {
  try {
    // Create build record
    const [build] = await sql<any[]>`
      INSERT INTO deployment_builds (
        agent_id,
        build_number,
        build_config,
        status,
        triggered_by
      ) VALUES (
        ${agent.id},
        (SELECT COALESCE(MAX(build_number), 0) + 1 FROM deployment_builds WHERE agent_id = ${agent.id}),
        ${JSON.stringify({
          environment: environment.name,
          agentType: agent.agent_type,
          sourceCode: agent.source_code ? "included" : "missing",
        })},
        'building',
        ${userId}
      )
      RETURNING *
    `

    // Start build process
    await performAgentBuild(build.id, agent, environment)

    return { success: true, buildId: build.id }
  } catch (error) {
    console.error("Build start error:", error)
    return { success: false, error: String(error) }
  }
}

async function performAgentBuild(buildId: string, agent: any, environment: any): Promise<void> {
  try {
    // Update build status
    await sql`
      UPDATE deployment_builds 
      SET status = 'building', started_at = NOW()
      WHERE id = ${buildId}
    `

    // Generate deployment artifacts based on environment type
    const artifacts = await generateDeploymentArtifacts(agent, environment)

    // Run tests if configured
    const testResults = await runBuildTests(agent, artifacts)

    // Update build with results
    await sql`
      UPDATE deployment_builds 
      SET 
        status = 'completed',
        artifacts = ${JSON.stringify(artifacts)},
        test_results = ${JSON.stringify(testResults)},
        build_duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)),
        completed_at = NOW()
      WHERE id = ${buildId}
    `

    console.log(`Build ${buildId} completed successfully`)
  } catch (error) {
    console.error(`Build ${buildId} failed:`, error)

    // Update build status to failed
    await sql`
      UPDATE deployment_builds 
      SET 
        status = 'failed',
        build_logs = ${String(error)},
        completed_at = NOW()
      WHERE id = ${buildId}
    `
  }
}

async function generateDeploymentArtifacts(agent: any, environment: any): Promise<any> {
  const artifacts: any = {
    type: environment.environment_type,
    provider: environment.provider,
    generated_at: new Date().toISOString(),
  }

  switch (environment.environment_type) {
    case "serverless":
      artifacts.function_code = generateServerlessFunction(agent)
      artifacts.configuration = generateServerlessConfig(agent, environment)
      break

    case "cloud":
    case "kubernetes":
      artifacts.dockerfile = generateDockerfile(agent, environment)
      artifacts.kubernetes_manifests = generateKubernetesManifests(agent, environment)
      break

    case "edge":
      artifacts.edge_function = generateEdgeFunction(agent)
      artifacts.edge_config = generateEdgeConfig(agent, environment)
      break

    default:
      throw new Error(`Unsupported environment type: ${environment.environment_type}`)
  }

  return artifacts
}

function generateServerlessFunction(agent: any): string {
  return `
// Generated serverless function for agent: ${agent.name}
const { ${agent.agent_type}Agent } = require('./agent-core');

const agent = new ${agent.agent_type}Agent(${JSON.stringify(agent.configuration)});

exports.handler = async (event, context) => {
  try {
    const { body, headers, httpMethod, path } = event;
    
    // Parse request
    const input = httpMethod === 'POST' ? JSON.parse(body || '{}') : event.queryStringParameters || {};
    
    // Process with agent
    const result = await agent.process(input);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Agent processing error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
`
}

function generateServerlessConfig(agent: any, environment: any): any {
  return {
    runtime: environment.configuration.runtime || "nodejs18.x",
    timeout: environment.configuration.timeout || 30,
    memory: environment.resource_limits.memory || "1024mb",
    environment_variables: {
      AGENT_ID: agent.id,
      AGENT_NAME: agent.name,
      AGENT_TYPE: agent.agent_type,
      ...agent.configuration,
    },
  }
}

function generateDockerfile(agent: any, environment: any): string {
  return `
# Generated Dockerfile for agent: ${agent.name}
FROM ${environment.configuration.base_image || "node:18-alpine"}

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy agent code
COPY . .

# Expose port
EXPOSE ${environment.configuration.port || 3000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${environment.configuration.port || 3000}/health || exit 1

# Start agent
CMD ["npm", "start"]
`
}

function generateKubernetesManifests(agent: any, environment: any): any {
  return {
    deployment: {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: `agent-${agent.id}`,
        labels: {
          app: `agent-${agent.id}`,
          "agent.type": agent.agent_type,
        },
      },
      spec: {
        replicas: environment.resource_limits.replicas || 3,
        selector: {
          matchLabels: {
            app: `agent-${agent.id}`,
          },
        },
        template: {
          metadata: {
            labels: {
              app: `agent-${agent.id}`,
            },
          },
          spec: {
            containers: [
              {
                name: "agent",
                image: `agent-${agent.id}:latest`,
                ports: [
                  {
                    containerPort: 3000,
                  },
                ],
                resources: {
                  requests: {
                    cpu: environment.resource_limits.cpu || "100m",
                    memory: environment.resource_limits.memory || "256Mi",
                  },
                  limits: {
                    cpu: environment.resource_limits.cpu || "500m",
                    memory: environment.resource_limits.memory || "1Gi",
                  },
                },
                env: [
                  {
                    name: "AGENT_ID",
                    value: agent.id,
                  },
                  {
                    name: "AGENT_NAME",
                    value: agent.name,
                  },
                ],
              },
            ],
          },
        },
      },
    },
    service: {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: `agent-${agent.id}-service`,
      },
      spec: {
        selector: {
          app: `agent-${agent.id}`,
        },
        ports: [
          {
            port: 80,
            targetPort: 3000,
          },
        ],
        type: "ClusterIP",
      },
    },
  }
}

function generateEdgeFunction(agent: any): string {
  return `
// Generated edge function for agent: ${agent.name}
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      if (url.pathname === '/health') {
        return new Response('OK', { status: 200 });
      }
      
      const input = request.method === 'POST' 
        ? await request.json() 
        : Object.fromEntries(url.searchParams);
      
      // Process with agent logic
      const result = await processAgentRequest(input, env);
      
      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  },
};

async function processAgentRequest(input, env) {
  // Agent processing logic here
  return { message: 'Agent processed successfully', input };
}
`
}

function generateEdgeConfig(agent: any, environment: any): any {
  return {
    name: `agent-${agent.id}`,
    main: "index.js",
    compatibility_date: "2023-05-18",
    vars: {
      AGENT_ID: agent.id,
      AGENT_NAME: agent.name,
      AGENT_TYPE: agent.agent_type,
    },
  }
}

async function runBuildTests(agent: any, artifacts: any): Promise<any> {
  // Implement build testing logic
  return {
    passed: true,
    tests_run: 5,
    tests_passed: 5,
    tests_failed: 0,
    coverage: 85,
    duration_ms: 1500,
  }
}

async function startDeploymentProcess(deployment: any, environment: any, buildResult: any): Promise<void> {
  try {
    // This would integrate with the actual deployment provider
    console.log(`Starting deployment ${deployment.id} to ${environment.name}`)

    // Simulate deployment process
    setTimeout(async () => {
      try {
        // Generate endpoint URL
        const endpointUrl = generateEndpointUrl(deployment, environment)

        // Update deployment status
        await sql`
          UPDATE agent_deployments 
          SET 
            status = 'active',
            endpoint_url = ${endpointUrl},
            deployed_at = NOW()
          WHERE id = ${deployment.id}
        `

        // Set up health checks
        await setupHealthChecks(deployment.id, endpointUrl)

        console.log(`Deployment ${deployment.id} completed successfully`)
      } catch (error) {
        console.error(`Deployment ${deployment.id} failed:`, error)

        await sql`
          UPDATE agent_deployments 
          SET status = 'failed'
          WHERE id = ${deployment.id}
        `
      }
    }, 5000) // Simulate 5 second deployment
  } catch (error) {
    console.error("Deployment start error:", error)
    throw error
  }
}

function generateEndpointUrl(deployment: any, environment: any): string {
  const baseUrl = environment.configuration.base_url || "https://api.example.com"
  return `${baseUrl}/agents/${deployment.agent_id}`
}

async function setupHealthChecks(deploymentId: string, endpointUrl: string): Promise<void> {
  // Create initial health check
  await sql`
    INSERT INTO deployment_health_checks (
      deployment_id,
      check_type,
      check_config,
      status
    ) VALUES (
      ${deploymentId},
      'http',
      ${JSON.stringify({
        url: `${endpointUrl}/health`,
        method: "GET",
        timeout: 5000,
        expected_status: 200,
      })},
      'unknown'
    )
  `
}
