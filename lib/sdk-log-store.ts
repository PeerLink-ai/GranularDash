import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface SDKLog {
  id: string
  timestamp: number
  level: string
  type: string
  agent_id: string
  created_at: Date
  payload?: Record<string, any>
  organization?: string
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

export async function addSDKLog(log: Omit<SDKLog, "id" | "created_at"> & { organization?: string }): Promise<SDKLog> {
  try {
    const id = generateId()
    const created_at = new Date()
    const timestamp = log.timestamp || Date.now()

    const result = await sql`
      INSERT INTO sdk_logs (
        id, timestamp, level, type, agent_id, created_at, payload, organization
      ) VALUES (
        ${id}, ${timestamp}, ${log.level}, ${log.type}, 
        ${log.agent_id}, ${created_at.toISOString()}, ${JSON.stringify(log.payload || {})}, ${log.organization || "default"}
      ) RETURNING *
    `

    const savedLog = result[0]
    return {
      ...savedLog,
      timestamp: Number(savedLog.timestamp),
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
    organization?: string
  } = {},
): Promise<{ logs: SDKLog[]; total: number }> {
  try {
    const { limit = 50, offset = 0, level, agentId, type, organization } = options

    const whereConditions = []
    const params: any[] = []

    if (organization) {
      whereConditions.push(`organization = $${params.length + 1}`)
      params.push(organization)
    }

    if (level) {
      whereConditions.push(`level = $${params.length + 1}`)
      params.push(level)
    }

    if (agentId) {
      whereConditions.push(`agent_id = $${params.length + 1}`)
      params.push(agentId)
    }

    if (type) {
      whereConditions.push(`type = $${params.length + 1}`)
      params.push(type)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    const countQuery = `SELECT COUNT(*) as count FROM sdk_logs ${whereClause}`
    const countResult = await sql.unsafe(countQuery, params)
    const total = countResult && countResult[0] ? Number(countResult[0].count) : 0

    const logsQuery = `
      SELECT * FROM sdk_logs 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    const logs = await sql.unsafe(logsQuery, [...params, limit, offset])

    return {
      logs: logs.map((log) => ({
        ...log,
        timestamp: Number(log.timestamp),
        created_at: new Date(log.created_at),
        payload: log.payload || {},
      })),
      total,
    }
  } catch (error) {
    console.error("Failed to get SDK logs:", error)
    return { logs: [], total: 0 }
  }
}

export async function clearSDKLogs(organization?: string): Promise<void> {
  try {
    if (organization) {
      await sql`DELETE FROM sdk_logs WHERE organization = ${organization}`
    } else {
      await sql`DELETE FROM sdk_logs`
    }
  } catch (error) {
    console.error("Failed to clear SDK logs:", error)
    throw error
  }
}

export async function generateDemoLogs(
  scenario: "normal" | "anomaly" | "breach" = "normal",
  organization?: string,
): Promise<void> {
  const scenarios = {
    normal: [
      {
        timestamp: Date.now(),
        level: "info",
        type: "request",
        agent_id: "agent-gpt4",
        payload: { action: "process_request", status: "success", duration_ms: 245 },
        organization,
      },
      {
        timestamp: Date.now(),
        level: "info",
        type: "inference",
        agent_id: "agent-claude",
        payload: { action: "model_inference", status: "success", duration_ms: 1200 },
        organization,
      },
    ],
    anomaly: [
      {
        timestamp: Date.now(),
        level: "warn",
        type: "performance",
        agent_id: "agent-claude",
        payload: { action: "model_inference", status: "success", duration_ms: 8500, anomaly: true },
        organization,
      },
    ],
    breach: [
      {
        timestamp: Date.now(),
        level: "error",
        type: "security",
        agent_id: "agent-unknown",
        payload: { action: "data_access", status: "failure", security_violation: true },
        organization,
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
    const { logs } = await getSDKLogs({ limit: 100 })

    const nodes: LineageNode[] = []
    const edges: LineageEdge[] = []
    const nodeIds = new Set<string>()

    for (const log of logs) {
      if (log.agent_id && !nodeIds.has(log.agent_id)) {
        nodes.push({
          id: log.agent_id,
          label: log.agent_id,
          type: "agent",
          metadata: { type: "agent" },
        })
        nodeIds.add(log.agent_id)
      }

      if (log.type && !nodeIds.has(`type-${log.type}`)) {
        nodes.push({
          id: `type-${log.type}`,
          label: log.type,
          type: "log_type",
          metadata: { type: "log_type" },
        })
        nodeIds.add(`type-${log.type}`)
      }

      if (log.payload?.action && !nodeIds.has(`action-${log.payload.action}`)) {
        nodes.push({
          id: `action-${log.payload.action}`,
          label: log.payload.action,
          type: "action",
          metadata: { type: "action" },
        })
        nodeIds.add(`action-${log.payload.action}`)
      }

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
