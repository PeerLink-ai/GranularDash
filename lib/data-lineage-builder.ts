import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface DataLineageNode {
  id: string
  name: string
  type:
    | "agent"
    | "model"
    | "deployment"
    | "evaluation"
    | "dataset"
    | "transformation"
    | "integration"
    | "user"
    | "organization"
  path: string[]
  metadata: {
    sourceFile?: string
    schema?: string
    creationDate?: string
    owner?: string
    status?: string
    accuracy?: string
    version?: string
    description?: string
    provider?: string
    endpoint?: string
    cost?: string
    performance?: string
  }
  nextNodes?: string[]
}

export interface DataLineageEdge {
  source: string
  target: string
  relationship: string
  metadata?: Record<string, any>
}

export async function buildDataLineage(): Promise<{ nodes: DataLineageNode[]; edges: DataLineageEdge[] }> {
  try {
    const nodes: DataLineageNode[] = []
    const edges: DataLineageEdge[] = []

    // 1. Get Connected Agents
    const agents = await sql`
      SELECT 
        id, name, provider, model, endpoint, status, 
        created_at, last_active, usage_requests, usage_tokens_used,
        usage_estimated_cost, organization_id
      FROM connected_agents 
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 50
    `

    for (const agent of agents) {
      nodes.push({
        id: `agent-${agent.id}`,
        name: agent.name || `Agent ${agent.id.slice(0, 8)}`,
        type: "agent",
        path: ["Agents", agent.provider || "Unknown", agent.name || agent.id],
        metadata: {
          provider: agent.provider,
          status: agent.status,
          creationDate: agent.created_at?.toISOString().split("T")[0],
          endpoint: agent.endpoint,
          cost: agent.usage_estimated_cost ? `$${agent.usage_estimated_cost}` : undefined,
          performance: agent.usage_requests ? `${agent.usage_requests} requests` : undefined,
          version: agent.model,
          description: `${agent.provider} agent using ${agent.model}`,
        },
      })
    }

    // 2. Get AI Models from Registry
    const models = await sql`
      SELECT 
        id, model_name, model_version, model_type, framework,
        status, created_at, created_by, performance_metrics,
        model_size_mb, description
      FROM model_registry 
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 30
    `

    for (const model of models) {
      nodes.push({
        id: `model-${model.id}`,
        name: model.model_name,
        type: "model",
        path: ["Models", model.framework || "Unknown", model.model_name],
        metadata: {
          version: model.model_version,
          status: model.status,
          creationDate: model.created_at?.toISOString().split("T")[0],
          description: model.description,
          performance: model.model_size_mb ? `${model.model_size_mb}MB` : undefined,
          schema: model.framework,
        },
      })
    }

    // 3. Get Model Deployments
    const deployments = await sql`
      SELECT 
        d.id, d.deployment_name, d.status, d.environment,
        d.deployed_at, d.endpoint_url, d.model_id,
        m.model_name
      FROM model_deployments d
      LEFT JOIN model_registry m ON d.model_id = m.id
      WHERE d.status IN ('running', 'deployed')
      ORDER BY d.deployed_at DESC
      LIMIT 20
    `

    for (const deployment of deployments) {
      nodes.push({
        id: `deployment-${deployment.id}`,
        name: deployment.deployment_name,
        type: "deployment",
        path: ["Deployments", deployment.environment, deployment.deployment_name],
        metadata: {
          status: deployment.status,
          creationDate: deployment.deployed_at?.toISOString().split("T")[0],
          endpoint: deployment.endpoint_url,
          description: `${deployment.environment} deployment of ${deployment.model_name || "model"}`,
        },
      })

      // Create edge from model to deployment
      if (deployment.model_id) {
        edges.push({
          source: `model-${deployment.model_id}`,
          target: `deployment-${deployment.id}`,
          relationship: "deployed_as",
          metadata: { environment: deployment.environment },
        })
      }
    }

    // 4. Get Model Evaluations
    const evaluations = await sql`
      SELECT 
        e.id, e.evaluation_name, e.evaluation_type, e.status,
        e.overall_score, e.evaluated_at, e.model_config_id,
        m.model_name
      FROM model_evaluations e
      LEFT JOIN model_registry m ON e.model_config_id = m.id
      ORDER BY e.evaluated_at DESC
      LIMIT 20
    `

    for (const evaluation of evaluations) {
      nodes.push({
        id: `evaluation-${evaluation.id}`,
        name: evaluation.evaluation_name,
        type: "evaluation",
        path: ["Evaluations", evaluation.evaluation_type, evaluation.evaluation_name],
        metadata: {
          status: evaluation.status,
          creationDate: evaluation.evaluated_at?.toISOString().split("T")[0],
          accuracy: evaluation.overall_score ? `${evaluation.overall_score}%` : undefined,
          description: `${evaluation.evaluation_type} evaluation`,
        },
      })

      // Create edge from model to evaluation
      if (evaluation.model_config_id) {
        edges.push({
          source: `model-${evaluation.model_config_id}`,
          target: `evaluation-${evaluation.id}`,
          relationship: "evaluated_by",
          metadata: { score: evaluation.overall_score },
        })
      }
    }

    // 5. Get Integration Instances (Data Sources)
    const integrations = await sql`
      SELECT 
        i.id, i.instance_name, i.status, i.created_at,
        r.integration_name, r.provider, r.integration_type
      FROM integration_instances i
      LEFT JOIN integration_registry r ON i.registry_id = r.id
      WHERE i.status = 'active'
      ORDER BY i.created_at DESC
      LIMIT 15
    `

    for (const integration of integrations) {
      nodes.push({
        id: `integration-${integration.id}`,
        name: integration.instance_name || integration.integration_name,
        type: "integration",
        path: [
          "Integrations",
          integration.provider || "Unknown",
          integration.instance_name || integration.integration_name,
        ],
        metadata: {
          provider: integration.provider,
          status: integration.status,
          creationDate: integration.created_at?.toISOString().split("T")[0],
          description: `${integration.integration_type} integration`,
          schema: integration.integration_type,
        },
      })
    }

    // 6. Get Feature Groups (Datasets)
    const featureGroups = await sql`
      SELECT 
        id, group_name, status, created_at, last_updated,
        description, version, data_source
      FROM feature_groups
      WHERE status = 'active'
      ORDER BY last_updated DESC
      LIMIT 15
    `

    for (const fg of featureGroups) {
      nodes.push({
        id: `dataset-${fg.id}`,
        name: fg.group_name,
        type: "dataset",
        path: ["Datasets", "Feature Groups", fg.group_name],
        metadata: {
          status: fg.status,
          creationDate: fg.created_at?.toISOString().split("T")[0],
          version: fg.version?.toString(),
          description: fg.description,
          schema: JSON.stringify(fg.data_source),
        },
      })
    }

    // 7. Get Data Transformations
    const transformations = await sql`
      SELECT 
        id, transformation_name, transformation_type, is_active,
        created_at, version, integration_instance_id
      FROM data_transformations
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 10
    `

    for (const transform of transformations) {
      nodes.push({
        id: `transformation-${transform.id}`,
        name: transform.transformation_name,
        type: "transformation",
        path: ["Transformations", transform.transformation_type, transform.transformation_name],
        metadata: {
          status: transform.is_active ? "active" : "inactive",
          creationDate: transform.created_at?.toISOString().split("T")[0],
          version: transform.version?.toString(),
          description: `${transform.transformation_type} transformation`,
        },
      })

      // Create edge from integration to transformation
      if (transform.integration_instance_id) {
        edges.push({
          source: `integration-${transform.integration_instance_id}`,
          target: `transformation-${transform.id}`,
          relationship: "transforms_data",
          metadata: { type: transform.transformation_type },
        })
      }
    }

    // 8. Create relationships between agents and models
    const agentModelConfigs = await sql`
      SELECT agent_id, model_id, is_primary, is_active
      FROM agent_model_configs
      WHERE is_active = true
    `

    for (const config of agentModelConfigs) {
      edges.push({
        source: `agent-${config.agent_id}`,
        target: `model-${config.model_id}`,
        relationship: "uses_model",
        metadata: { is_primary: config.is_primary },
      })
    }

    // 9. Create model lineage relationships
    const modelLineage = await sql`
      SELECT model_id, parent_model_id, relationship_type
      FROM model_lineage
    `

    for (const lineage of modelLineage) {
      edges.push({
        source: `model-${lineage.parent_model_id}`,
        target: `model-${lineage.model_id}`,
        relationship: lineage.relationship_type || "derived_from",
        metadata: {},
      })
    }

    // 10. Add nextNodes to each node based on edges
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    for (const edge of edges) {
      const sourceNode = nodeMap.get(edge.source)
      if (sourceNode) {
        if (!sourceNode.nextNodes) sourceNode.nextNodes = []
        sourceNode.nextNodes.push(edge.target)
      }
    }

    return { nodes, edges }
  } catch (error) {
    console.error("Failed to build data lineage:", error)
    return { nodes: [], edges: [] }
  }
}
