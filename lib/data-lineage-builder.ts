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

    console.log("[v0] Fetching playground interactions with agent details...")
    const playgroundInteractions = await sql`
      SELECT 
        lm.*,
        ca.name as agent_name,
        ca.provider as agent_provider,
        ca.status as agent_status
      FROM lineage_mapping lm
      LEFT JOIN connected_agents ca ON lm.agent_id = ca.agent_id
      ORDER BY lm.created_at DESC 
      LIMIT 50
    `.catch((err) => {
      console.log("[v0] lineage_mapping table error:", err.message)
      return []
    })

    console.log("[v0] Found playground interactions:", playgroundInteractions.length)

    const agentNodes = new Set<string>()

    for (const interaction of playgroundInteractions) {
      // Create agent node if not already created
      if (interaction.agent_id && !agentNodes.has(interaction.agent_id)) {
        agentNodes.add(interaction.agent_id)
        nodes.push({
          id: `agent-${interaction.agent_id}`,
          name: `🤖 ${interaction.agent_name || `Agent ${interaction.agent_id.slice(-8)}`}`,
          type: "agent",
          path: ["Agents", "Connected"],
          metadata: {
            status: interaction.agent_status || "active",
            provider: interaction.agent_provider || "unknown",
            description: `Connected agent: ${interaction.agent_name || interaction.agent_id}`,
            endpoint: interaction.agent_provider ? `${interaction.agent_provider} API` : undefined,
          },
        })
      }

      // Create playground test node
      const testNodeId = `test-${interaction.id}`
      nodes.push({
        id: testNodeId,
        name: `🧪 ${interaction.prompt?.substring(0, 40) || "Playground Test"}...`,
        type: "evaluation",
        path: ["Playground", "Tests"],
        metadata: {
          status: "completed",
          creationDate:
            interaction.created_at?.toISOString?.()?.split("T")[0] || new Date().toISOString().split("T")[0],
          description: `Test: "${interaction.prompt?.substring(0, 100) || "No prompt"}..."`,
          performance: interaction.response_time ? `${interaction.response_time}ms` : undefined,
          accuracy: interaction.evaluation_scores
            ? `${Math.round((interaction.evaluation_scores.overall || 0) * 100)}%`
            : undefined,
          cost: interaction.token_usage ? `${interaction.token_usage.total || 0} tokens` : undefined,
        },
      })

      // Create response node
      const responseNodeId = `response-${interaction.id}`
      nodes.push({
        id: responseNodeId,
        name: `💬 ${interaction.response?.substring(0, 40) || "Response"}...`,
        type: "dataset",
        path: ["Playground", "Responses"],
        metadata: {
          status: "generated",
          description: `Response: "${interaction.response?.substring(0, 100) || "No response"}..."`,
          version: "1.0",
          creationDate:
            interaction.created_at?.toISOString?.()?.split("T")[0] || new Date().toISOString().split("T")[0],
        },
      })

      // Create edges: Agent -> Test -> Response
      if (interaction.agent_id) {
        edges.push({
          source: `agent-${interaction.agent_id}`,
          target: testNodeId,
          relationship: "executed",
          metadata: { type: "playground_test", timestamp: interaction.created_at },
        })
      }

      edges.push({
        source: testNodeId,
        target: responseNodeId,
        relationship: "generated",
        metadata: {
          type: "ai_response",
          tokens: interaction.token_usage?.total || 0,
          response_time: interaction.response_time || 0,
        },
      })
    }

    console.log("[v0] Fetching audit logs...")
    const auditLogs = await sql`
      SELECT * FROM audit_logs 
      WHERE action LIKE '%PLAYGROUND%' OR action LIKE '%AGENT%'
      ORDER BY timestamp DESC 
      LIMIT 30
    `.catch((err) => {
      console.log("[v0] audit_logs table error:", err.message)
      return []
    })

    console.log("[v0] Found relevant audit logs:", auditLogs.length)

    // Group audit logs by action and create summary nodes
    const auditGroups = new Map<string, any[]>()
    for (const log of auditLogs) {
      const action = log.action || "UNKNOWN"
      if (!auditGroups.has(action)) {
        auditGroups.set(action, [])
      }
      auditGroups.get(action)!.push(log)
    }

    for (const [action, logs] of auditGroups) {
      const auditNodeId = `audit-${action}`
      nodes.push({
        id: auditNodeId,
        name: `📋 ${action.replace(/_/g, " ")} (${logs.length})`,
        type: "integration",
        path: ["Audit", "Logs"],
        metadata: {
          status: "logged",
          description: `${logs.length} ${action.replace(/_/g, " ").toLowerCase()} events`,
          creationDate: logs[0]?.timestamp?.toISOString?.()?.split("T")[0] || new Date().toISOString().split("T")[0],
          version: "audit-v1",
        },
      })

      // Connect audit logs to related playground tests
      for (const log of logs) {
        if (log.details?.lineageId) {
          const relatedTestNode = nodes.find((n) => n.id === `test-${log.details.lineageId.replace("lineage-", "")}`)
          if (relatedTestNode) {
            edges.push({
              source: relatedTestNode.id,
              target: auditNodeId,
              relationship: "audited",
              metadata: { type: "compliance_tracking", timestamp: log.timestamp },
            })
          }
        }
      }
    }

    console.log("[v0] Final lineage summary:")
    console.log("[v0] - Total nodes:", nodes.length)
    console.log("[v0] - Total edges:", edges.length)
    console.log("[v0] - Node types:", [...new Set(nodes.map((n) => n.type))])

    return { nodes, edges }
  } catch (error) {
    console.error("[v0] Failed to build data lineage:", error)
    return { nodes: [], edges: [] }
  }
}
