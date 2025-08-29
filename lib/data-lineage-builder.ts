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
    console.log("[v0] Starting to build data lineage...")
    const nodes: DataLineageNode[] = []
    const edges: DataLineageEdge[] = []

    // 1. Get Connected Agents
    const agents = await sql`
      SELECT 
        id, name, type, endpoint, status, 
        created_at, last_activity, user_id
      FROM connected_agents 
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 50
    `

    console.log("[v0] Found agents:", agents.length)

    for (const agent of agents) {
      nodes.push({
        id: `agent-${agent.id}`,
        name: agent.name || `Agent ${agent.id.toString().slice(0, 8)}`,
        type: "agent",
        path: ["Agents", agent.type || "Unknown", agent.name || agent.id],
        metadata: {
          provider: agent.type,
          status: agent.status,
          creationDate: agent.created_at?.toISOString().split("T")[0],
          endpoint: agent.endpoint,
          description: `${agent.type} agent`,
        },
      })
    }

    const playgroundInteractions = await sql`
      SELECT 
        lm.id, lm.agent_id, lm.prompt, lm.response, lm.token_usage,
        lm.response_time, lm.evaluation_scores, lm.tool_calls, 
        lm.db_queries, lm.decisions, lm.created_at,
        ca.name as agent_name, ca.type as agent_type
      FROM lineage_mapping lm
      LEFT JOIN connected_agents ca ON lm.agent_id = ca.id::text
      ORDER BY lm.created_at DESC
      LIMIT 100
    `

    console.log("[v0] Found playground interactions:", playgroundInteractions.length)

    for (const interaction of playgroundInteractions) {
      // Create playground interaction node
      nodes.push({
        id: `playground-${interaction.id}`,
        name: `Playground Test: ${interaction.prompt.substring(0, 50)}...`,
        type: "evaluation",
        path: ["Playground", "Tests", interaction.agent_name || interaction.agent_id],
        metadata: {
          status: "completed",
          creationDate: interaction.created_at?.toISOString().split("T")[0],
          description: `Playground test interaction`,
          performance: interaction.response_time ? `${interaction.response_time}ms` : undefined,
          accuracy: interaction.evaluation_scores?.overall ? `${interaction.evaluation_scores.overall}%` : undefined,
          version: interaction.token_usage?.total ? `${interaction.token_usage.total} tokens` : undefined,
        },
      })

      // Create edge from agent to playground interaction
      edges.push({
        source: `agent-${interaction.agent_id}`,
        target: `playground-${interaction.id}`,
        relationship: "tested_by",
        metadata: {
          type: "playground_test",
          tokenUsage: interaction.token_usage,
          responseTime: interaction.response_time,
          evaluationScores: interaction.evaluation_scores,
        },
      })

      if (interaction.tool_calls && Array.isArray(interaction.tool_calls) && interaction.tool_calls.length > 0) {
        for (let i = 0; i < interaction.tool_calls.length; i++) {
          const toolCall = interaction.tool_calls[i]
          const toolNodeId = `tool-${interaction.id}-${i}`

          nodes.push({
            id: toolNodeId,
            name: `Tool: ${toolCall.name || "Unknown Tool"}`,
            type: "transformation",
            path: ["Tools", "Agent Tools", toolCall.name || "Unknown"],
            metadata: {
              status: "executed",
              creationDate: interaction.created_at?.toISOString().split("T")[0],
              description: `Tool call: ${toolCall.description || toolCall.name}`,
              schema: JSON.stringify(toolCall.parameters || {}),
            },
          })

          edges.push({
            source: `playground-${interaction.id}`,
            target: toolNodeId,
            relationship: "uses_tool",
            metadata: { toolCall: toolCall },
          })
        }
      }

      if (interaction.db_queries && Array.isArray(interaction.db_queries) && interaction.db_queries.length > 0) {
        for (let i = 0; i < interaction.db_queries.length; i++) {
          const dbQuery = interaction.db_queries[i]
          const queryNodeId = `query-${interaction.id}-${i}`

          nodes.push({
            id: queryNodeId,
            name: `DB Query: ${dbQuery.table || "Database"}`,
            type: "dataset",
            path: ["Database", "Queries", dbQuery.table || "Unknown"],
            metadata: {
              status: "executed",
              creationDate: interaction.created_at?.toISOString().split("T")[0],
              description: `Database query: ${dbQuery.operation || "SELECT"}`,
              schema: dbQuery.query?.substring(0, 100),
            },
          })

          edges.push({
            source: `playground-${interaction.id}`,
            target: queryNodeId,
            relationship: "queries_data",
            metadata: { dbQuery: dbQuery },
          })
        }
      }

      if (interaction.decisions && Array.isArray(interaction.decisions) && interaction.decisions.length > 0) {
        for (let i = 0; i < interaction.decisions.length; i++) {
          const decision = interaction.decisions[i]
          const decisionNodeId = `decision-${interaction.id}-${i}`

          nodes.push({
            id: decisionNodeId,
            name: `Decision: ${decision.type || "AI Decision"}`,
            type: "evaluation",
            path: ["Decisions", "AI Reasoning", decision.type || "Unknown"],
            metadata: {
              status: "completed",
              creationDate: interaction.created_at?.toISOString().split("T")[0],
              description: `AI decision point: ${decision.reasoning?.substring(0, 100)}`,
              accuracy: decision.confidence ? `${Math.round(decision.confidence * 100)}%` : undefined,
            },
          })

          edges.push({
            source: `playground-${interaction.id}`,
            target: decisionNodeId,
            relationship: "makes_decision",
            metadata: { decision: decision },
          })
        }
      }
    }

    const agentAuditLogs = await sql`
      SELECT 
        al.id, al.user_id, al.action, al.resource_type, al.resource_id,
        al.details, al.timestamp, al.organization
      FROM audit_logs al
      WHERE al.resource_type IN ('AI_AGENT', 'PLAYGROUND', 'AGENT_TEST') 
        OR al.action LIKE '%AGENT%'
        OR al.action LIKE '%PLAYGROUND%'
      ORDER BY al.timestamp DESC
      LIMIT 50
    `

    console.log("[v0] Found audit logs:", agentAuditLogs.length)

    for (const auditLog of agentAuditLogs) {
      const auditNodeId = `audit-${auditLog.id}`

      nodes.push({
        id: auditNodeId,
        name: `${auditLog.action.replace(/_/g, " ")}: ${auditLog.resource_id || "System"}`,
        type: "evaluation",
        path: ["Audit", "Agent Actions", auditLog.action],
        metadata: {
          status: "logged",
          creationDate: auditLog.timestamp?.toISOString().split("T")[0],
          description: `Audit log: ${auditLog.action}`,
          owner: auditLog.user_id,
          schema: auditLog.organization,
        },
      })

      if (auditLog.resource_id) {
        // Check if resource_id matches any agent
        const matchingAgent = agents.find(
          (a) => a.id.toString() === auditLog.resource_id || a.name === auditLog.resource_id,
        )
        if (matchingAgent) {
          edges.push({
            source: `agent-${matchingAgent.id}`,
            target: auditNodeId,
            relationship: "generates_audit",
            metadata: {
              action: auditLog.action,
              details: auditLog.details,
              timestamp: auditLog.timestamp,
            },
          })
        }
      }
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

    console.log("[v0] Built lineage with", nodes.length, "nodes and", edges.length, "edges")
    return { nodes, edges }
  } catch (error) {
    console.error("[v0] Failed to build data lineage:", error)
    return { nodes: [], edges: [] }
  }
}
