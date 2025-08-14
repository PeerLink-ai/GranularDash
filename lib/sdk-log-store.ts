import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface SDKLog {
  id: string
  timestamp: bigint
  level: string
  type: string
  agent_id: string
  created_at: Date
  payload?: Record<string, any>
}

// Generate a unique ID
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${randomStr}`
}

export async function ensureSDKLogTable() {
  // Table already exists in the database, no need to create
  return
}

export async function addSDKLog(log: Omit<SDKLog, "id" | "created_at">): Promise<SDKLog> {
  try {
    const id = generateId()
    const created_at = new Date()

    const result = await sql`
      INSERT INTO sdk_logs (
        id, timestamp, level, type, agent_id, created_at, payload
      ) VALUES (
        ${id}, ${log.timestamp}, ${log.level}, ${log.type}, 
        ${log.agent_id}, ${created_at.toISOString()}, ${JSON.stringify(log.payload || {})}
      ) RETURNING *
    `

    const savedLog = result[0]
    return {
      ...savedLog,
      created_at: new Date(savedLog.created_at),
      payload: savedLog.payload || {},
    }
  } catch (error) {
    console.error("Failed to add SDK log:", error)
    throw error
  }
}

export async function getSDKLogs(
  options: {
    limit?: number
    offset?: number
    level?: string
    agentId?: string
    type?: string
  } = {},
): Promise<{ logs: SDKLog[]; total: number }> {
  try {
    const { limit = 50, offset = 0, level, agentId, type } = options

    // Build WHERE conditions dynamically
    let whereClause = ""
    const conditions = []

    if (level) {
      conditions.push(`level = '${level}'`)
    }

    if (agentId) {
      conditions.push(`agent_id = '${agentId}'`)
    }

    if (type) {
      conditions.push(`type = '${type}'`)
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(" AND ")}`
    }

    // Get total count using template literal
    const countResult = await sql`
      SELECT COUNT(*) as count FROM sdk_logs ${sql.unsafe(whereClause)}
    `

    // Handle case where no results are returned
    const total = countResult && countResult[0] ? Number(countResult[0].count) : 0

    // Get logs with pagination
    const logs = await sql`
      SELECT * FROM sdk_logs 
      ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `

    return {
      logs: logs.map((log) => ({
        ...log,
        created_at: new Date(log.created_at),
        payload: log.payload || {},
      })),
      total,
    }
  } catch (error) {
    console.error("Failed to get SDK logs:", error)
    // Return empty result instead of throwing to prevent crashes
    return { logs: [], total: 0 }
  }
}

export async function clearSDKLogs(): Promise<void> {
  try {
    await sql`DELETE FROM sdk_logs`
  } catch (error) {
    console.error("Failed to clear SDK logs:", error)
    throw error
  }
}

export async function generateDemoLogs(scenario: "normal" | "anomaly" | "breach" = "normal"): Promise<void> {
  const scenarios = {
    normal: [
      {
        timestamp: BigInt(Date.now()),
        level: "info",
        type: "request",
        agent_id: "agent-gpt4",
        payload: { action: "process_request", status: "success", duration_ms: 245 },
      },
      {
        timestamp: BigInt(Date.now()),
        level: "info",
        type: "inference",
        agent_id: "agent-claude",
        payload: { action: "model_inference", status: "success", duration_ms: 1200 },
      },
    ],
    anomaly: [
      {
        timestamp: BigInt(Date.now()),
        level: "warn",
        type: "performance",
        agent_id: "agent-claude",
        payload: { action: "model_inference", status: "success", duration_ms: 8500, anomaly: true },
      },
    ],
    breach: [
      {
        timestamp: BigInt(Date.now()),
        level: "error",
        type: "security",
        agent_id: "agent-unknown",
        payload: { action: "data_access", status: "failure", security_violation: true },
      },
    ],
  }

  const logsToCreate = scenarios[scenario]

  for (const logData of logsToCreate) {
    await addSDKLog(logData)
  }
}

export interface LineageNode {
  id: string
  label: string
  type: "agent" | "resource" | "action" | "log_type"
  metadata?: Record<string, any>
}

export interface LineageEdge {
  id: string
  source: string
  target: string
  label?: string
  type?: string
  metadata?: Record<string, any>
}

export interface LineageGraph {
  nodes: LineageNode[]
  edges: LineageEdge[]
}

export async function buildLineageGraph(): Promise<LineageGraph> {
  try {
    // Get recent logs to build lineage from
    const { logs } = await getSDKLogs({ limit: 100 })

    const nodes: LineageNode[] = []
    const edges: LineageEdge[] = []
    const nodeIds = new Set<string>()

    // Build nodes and edges from logs
    for (const log of logs) {
      // Add agent node
      if (log.agent_id && !nodeIds.has(log.agent_id)) {
        nodes.push({
          id: log.agent_id,
          label: log.agent_id,
          type: "agent",
          metadata: { type: "agent" },
        })
        nodeIds.add(log.agent_id)
      }

      // Add log type node
      if (log.type && !nodeIds.has(`type-${log.type}`)) {
        nodes.push({
          id: `type-${log.type}`,
          label: log.type,
          type: "log_type",
          metadata: { type: "log_type" },
        })
        nodeIds.add(`type-${log.type}`)
      }

      // Add resource/action nodes from payload
      if (log.payload?.action && !nodeIds.has(`action-${log.payload.action}`)) {
        nodes.push({
          id: `action-${log.payload.action}`,
          label: log.payload.action,
          type: "action",
          metadata: { type: "action" },
        })
        nodeIds.add(`action-${log.payload.action}`)
      }

      // Create edges based on relationships
      if (log.agent_id && log.type) {
        edges.push({
          id: `${log.agent_id}-${log.type}-${log.id}`,
          source: log.agent_id,
          target: `type-${log.type}`,
          label: "generates",
          type: "log_generation",
          metadata: { timestamp: log.created_at, level: log.level },
        })
      }

      if (log.agent_id && log.payload?.action) {
        edges.push({
          id: `${log.agent_id}-action-${log.payload.action}-${log.id}`,
          source: log.agent_id,
          target: `action-${log.payload.action}`,
          label: "performs",
          type: "action",
          metadata: { timestamp: log.created_at, status: log.payload.status },
        })
      }
    }

    return { nodes, edges }
  } catch (error) {
    console.error("Failed to build lineage graph:", error)
    return { nodes: [], edges: [] }
  }
}
