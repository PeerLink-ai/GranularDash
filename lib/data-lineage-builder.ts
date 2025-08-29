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
      SELECT * FROM lineage_mapping ORDER BY created_at DESC LIMIT 50
    `.catch((err) => {
      console.log("[v0] lineage_mapping table error:", err.message)
      return []
    })

    console.log("[v0] Found playground interactions:", playgroundInteractions.length)

    for (const interaction of playgroundInteractions) {
      nodes.push({
        id: `playground-${interaction.id}`,
        name: `🧪 ${interaction.prompt?.substring(0, 50) || "Test"}...`,
        type: "evaluation",
        path: ["Playground", "Tests"],
        metadata: {
          status: "completed",
          creationDate:
            interaction.created_at?.toISOString?.()?.split("T")[0] || new Date().toISOString().split("T")[0],
          description: interaction.prompt || "Playground test",
          performance: interaction.response_time ? `${interaction.response_time}ms` : undefined,
        },
      })

      if (interaction.agent_id) {
        const agentNodeId = `agent-${interaction.agent_id}`
        if (!nodes.find((n) => n.id === agentNodeId)) {
          nodes.push({
            id: agentNodeId,
            name: `🤖 Agent ${interaction.agent_id.slice(-8)}`,
            type: "agent",
            path: ["Agents", "Playground"],
            metadata: {
              status: "active",
              provider: "playground",
              description: "Playground test agent",
            },
          })
        }

        edges.push({
          source: agentNodeId,
          target: `playground-${interaction.id}`,
          relationship: "executed",
          metadata: { type: "playground_test" },
        })
      }
    }

    console.log("[v0] Fetching audit logs...")
    const auditLogs = await sql`
      SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 30
    `.catch((err) => {
      console.log("[v0] audit_logs table error:", err.message)
      return []
    })

    console.log("[v0] Found audit logs:", auditLogs.length)

    const auditGroups = new Map<string, any[]>()
    for (const log of auditLogs) {
      const action = log.action || "UNKNOWN"
      if (!auditGroups.has(action)) {
        auditGroups.set(action, [])
      }
      auditGroups.get(action)!.push(log)
    }

    for (const [action, logs] of auditGroups) {
      nodes.push({
        id: `audit-${action}`,
        name: `📋 ${action.replace(/_/g, " ")} (${logs.length})`,
        type: "evaluation",
        path: ["Audit", "Actions"],
        metadata: {
          status: "logged",
          description: `${logs.length} ${action} events`,
          creationDate: logs[0]?.timestamp?.toISOString?.()?.split("T")[0] || new Date().toISOString().split("T")[0],
        },
      })
    }

    console.log("[v0] Final lineage summary:")
    console.log("[v0] - Total nodes:", nodes.length)
    console.log("[v0] - Total edges:", edges.length)

    return { nodes, edges }
  } catch (error) {
    console.error("[v0] Failed to build data lineage:", error)
    return { nodes: [], edges: [] }
  }
}
