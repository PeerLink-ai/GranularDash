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

    console.log("[v0] Fetching playground interactions...")
    const playgroundInteractions = await sql`
      SELECT 
        lm.id, lm.agent_id, lm.prompt, lm.response, lm.token_usage,
        lm.response_time, lm.evaluation_scores, lm.tool_calls, 
        lm.db_queries, lm.decisions, lm.created_at
      FROM lineage_mapping lm
      ORDER BY lm.created_at DESC
      LIMIT 100
    `

    console.log("[v0] Found playground interactions:", playgroundInteractions.length)
    console.log("[v0] Sample playground data:", playgroundInteractions.slice(0, 2))

    const playgroundAgents = new Set<string>()
    for (const interaction of playgroundInteractions) {
      if (interaction.agent_id && !playgroundAgents.has(interaction.agent_id)) {
        playgroundAgents.add(interaction.agent_id)

        nodes.push({
          id: `agent-${interaction.agent_id}`,
          name: `Playground Agent ${interaction.agent_id.slice(-8)}`,
          type: "agent",
          path: ["Playground", "Agents", interaction.agent_id],
          metadata: {
            provider: "playground",
            status: "active",
            creationDate: interaction.created_at?.toISOString().split("T")[0],
            description: `Playground test agent`,
            version: "playground",
          },
        })
      }
    }

    for (const interaction of playgroundInteractions) {
      const truncatedPrompt = interaction.prompt?.substring(0, 60) || "Test Interaction"

      nodes.push({
        id: `playground-${interaction.id}`,
        name: `🧪 ${truncatedPrompt}${interaction.prompt?.length > 60 ? "..." : ""}`,
        type: "evaluation",
        path: ["Playground", "Tests", interaction.agent_id || "Unknown"],
        metadata: {
          status: "completed",
          creationDate: interaction.created_at?.toISOString().split("T")[0],
          description: `Playground test: ${interaction.prompt}`,
          performance: interaction.response_time ? `${interaction.response_time}ms` : undefined,
          accuracy: interaction.evaluation_scores?.overall
            ? `${Math.round(interaction.evaluation_scores.overall)}%`
            : undefined,
          version: interaction.token_usage?.total ? `${interaction.token_usage.total} tokens` : undefined,
          schema: interaction.response?.substring(0, 200),
        },
      })

      // Create edge from agent to playground interaction
      if (interaction.agent_id) {
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
      }

      if (interaction.tool_calls && Array.isArray(interaction.tool_calls) && interaction.tool_calls.length > 0) {
        for (let i = 0; i < interaction.tool_calls.length; i++) {
          const toolCall = interaction.tool_calls[i]
          const toolNodeId = `tool-${interaction.id}-${i}`

          nodes.push({
            id: toolNodeId,
            name: `🔧 ${toolCall.name || "Tool Call"}`,
            type: "transformation",
            path: ["Tools", "Agent Tools", toolCall.name || "Unknown"],
            metadata: {
              status: "executed",
              creationDate: interaction.created_at?.toISOString().split("T")[0],
              description: `Tool: ${toolCall.description || toolCall.name}`,
              schema: JSON.stringify(toolCall.parameters || {}, null, 2),
              performance: toolCall.execution_time ? `${toolCall.execution_time}ms` : undefined,
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
            name: `🗄️ ${dbQuery.table || "Database Query"}`,
            type: "dataset",
            path: ["Database", "Queries", dbQuery.table || "Unknown"],
            metadata: {
              status: "executed",
              creationDate: interaction.created_at?.toISOString().split("T")[0],
              description: `Query: ${dbQuery.operation || "SELECT"} on ${dbQuery.table}`,
              schema: dbQuery.query?.substring(0, 200),
              performance: dbQuery.execution_time ? `${dbQuery.execution_time}ms` : undefined,
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
            name: `🧠 ${decision.type || "AI Decision"}`,
            type: "evaluation",
            path: ["Decisions", "AI Reasoning", decision.type || "Unknown"],
            metadata: {
              status: "completed",
              creationDate: interaction.created_at?.toISOString().split("T")[0],
              description: `Decision: ${decision.reasoning?.substring(0, 150)}`,
              accuracy: decision.confidence ? `${Math.round(decision.confidence * 100)}%` : undefined,
              schema: decision.context ? JSON.stringify(decision.context, null, 2) : undefined,
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

    console.log("[v0] Fetching agent audit logs...")
    const agentAuditLogs = await sql`
      SELECT 
        al.id, al.user_id, al.action, al.resource_type, al.resource_id,
        al.details, al.timestamp, al.organization, al.ip_address
      FROM audit_logs al
      WHERE al.resource_type IN ('AI_AGENT', 'PLAYGROUND', 'AGENT_TEST', 'MODEL', 'DEPLOYMENT') 
        OR al.action LIKE '%AGENT%'
        OR al.action LIKE '%PLAYGROUND%'
        OR al.action LIKE '%MODEL%'
      ORDER BY al.timestamp DESC
      LIMIT 50
    `

    console.log("[v0] Found audit logs:", agentAuditLogs.length)
    console.log("[v0] Sample audit data:", agentAuditLogs.slice(0, 2))

    const auditGroups = new Map<string, any[]>()
    for (const auditLog of agentAuditLogs) {
      const actionGroup = auditLog.action.split("_")[0] // GROUP by first part of action
      if (!auditGroups.has(actionGroup)) {
        auditGroups.set(actionGroup, [])
      }
      auditGroups.get(actionGroup)!.push(auditLog)
    }

    for (const [actionGroup, logs] of auditGroups) {
      const groupNodeId = `audit-group-${actionGroup}`

      nodes.push({
        id: groupNodeId,
        name: `📋 ${actionGroup.replace(/_/g, " ")} Activities (${logs.length})`,
        type: "evaluation",
        path: ["Audit", "Activity Groups", actionGroup],
        metadata: {
          status: "logged",
          creationDate: logs[0]?.timestamp?.toISOString().split("T")[0],
          description: `${logs.length} ${actionGroup.toLowerCase()} activities logged`,
          owner: logs
            .map((l) => l.user_id)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(", "),
          schema: `Recent activities: ${logs
            .slice(0, 3)
            .map((l) => l.action)
            .join(", ")}`,
          version: `${logs.length} events`,
        },
      })

      for (const auditLog of logs.slice(0, 5)) {
        // Show top 5 recent activities
        const auditNodeId = `audit-${auditLog.id}`

        nodes.push({
          id: auditNodeId,
          name: `📝 ${auditLog.action.replace(/_/g, " ")}`,
          type: "evaluation",
          path: ["Audit", "Individual Actions", auditLog.action],
          metadata: {
            status: "logged",
            creationDate: auditLog.timestamp?.toISOString().split("T")[0],
            description: `${auditLog.action}: ${auditLog.resource_type} ${auditLog.resource_id || ""}`,
            owner: auditLog.user_id,
            schema: auditLog.organization,
            endpoint: auditLog.ip_address,
            version: auditLog.details ? JSON.stringify(auditLog.details).substring(0, 100) : undefined,
          },
        })

        edges.push({
          source: groupNodeId,
          target: auditNodeId,
          relationship: "contains_activity",
          metadata: {
            action: auditLog.action,
            details: auditLog.details,
            timestamp: auditLog.timestamp,
          },
        })

        if (auditLog.resource_type === "PLAYGROUND" && auditLog.resource_id) {
          const relatedPlayground = playgroundInteractions.find((p) => p.id.toString() === auditLog.resource_id)
          if (relatedPlayground) {
            edges.push({
              source: `playground-${relatedPlayground.id}`,
              target: auditNodeId,
              relationship: "generates_audit",
              metadata: {
                action: auditLog.action,
                timestamp: auditLog.timestamp,
              },
            })
          }
        }
      }
    }

    console.log("[v0] Fetching connected agents...")
    const agents = await sql`
      SELECT 
        id, name, type, endpoint, status, 
        created_at, last_activity, user_id
      FROM connected_agents 
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 50
    `

    console.log("[v0] Found connected agents:", agents.length)
    console.log("[v0] Sample agent data:", agents.slice(0, 2))

    for (const agent of agents) {
      nodes.push({
        id: `connected-agent-${agent.id}`,
        name: `🤖 ${agent.name || `Agent ${agent.id.toString().slice(0, 8)}`}`,
        type: "agent",
        path: ["Connected Agents", agent.type || "Unknown", agent.name || agent.id],
        metadata: {
          provider: agent.type,
          status: agent.status,
          creationDate: agent.created_at?.toISOString().split("T")[0],
          endpoint: agent.endpoint,
          description: `Connected ${agent.type} agent`,
          owner: agent.user_id,
        },
      })
    }

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

    const agentModelConfigs = await sql`
      SELECT agent_id, model_id, is_primary, is_active
      FROM agent_model_configs
      WHERE is_active = true
    `

    for (const config of agentModelConfigs) {
      edges.push({
        source: `connected-agent-${config.agent_id}`,
        target: `model-${config.model_id}`,
        relationship: "uses_model",
        metadata: { is_primary: config.is_primary },
      })
    }

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

    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    for (const edge of edges) {
      const sourceNode = nodeMap.get(edge.source)
      if (sourceNode) {
        if (!sourceNode.nextNodes) sourceNode.nextNodes = []
        sourceNode.nextNodes.push(edge.target)
      }
    }

    console.log("[v0] Final lineage summary:")
    console.log("[v0] - Total nodes:", nodes.length)
    console.log("[v0] - Total edges:", edges.length)
    console.log("[v0] - Node types:", [...new Set(nodes.map((n) => n.type))])
    console.log(
      "[v0] - Sample nodes:",
      nodes.slice(0, 3).map((n) => ({ id: n.id, name: n.name, type: n.type })),
    )

    return { nodes, edges }
  } catch (error) {
    console.error("[v0] Failed to build data lineage:", error)
    console.error("[v0] Error details:", error.message, error.stack)
    return { nodes: [], edges: [] }
  }
}
