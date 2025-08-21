import { sql } from "@/lib/db"

export type AuditLogLevel = "info" | "warn" | "error" | "debug" | "success"
export interface CreateAuditLogInput {
  userId: string
  organization: string
  action: string
  resourceType: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export interface AuditLog {
  id: string
  user_id: string
  organization: string
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  timestamp: string
}

let ensured = false

async function ensureAuditTable() {
  if (ensured) return
  // Create table if not exists; use JS-side UUIDs to avoid pg crypto extensions.
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      organization TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      ip_address TEXT,
      user_agent TEXT,
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs (user_id, timestamp DESC);
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON audit_logs (organization, timestamp DESC);
  `
  ensured = true
}

export async function addAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
  await ensureAuditTable()
  const id = crypto.randomUUID()
  const {
    userId,
    organization,
    action,
    resourceType,
    resourceId = null,
    details = {},
    ipAddress = null,
    userAgent = null,
  } = input

  const rows = await sql<AuditLog[]>`
    INSERT INTO audit_logs (
      id, user_id, organization, action, resource_type, resource_id, details, ip_address, user_agent
    ) VALUES (
      ${id}, ${userId}, ${organization}, ${action}, ${resourceType}, ${resourceId}, ${sql.json(details)}, ${ipAddress}, ${userAgent}
    )
    RETURNING *
  `
  return rows[0]
}

export async function listAuditLogs(params: {
  userId?: string
  organization?: string
  limit?: number
  offset?: number
}) {
  await ensureAuditTable()
  const { userId, organization, limit = 50, offset = 0 } = params

  if (userId) {
    const rows = await sql<AuditLog[]>`
      SELECT * FROM audit_logs
      WHERE user_id = ${userId}
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return rows
  }

  if (organization) {
    const rows = await sql<AuditLog[]>`
      SELECT * FROM audit_logs
      WHERE organization = ${organization}
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return rows
  }

  const rows = await sql<AuditLog[]>`
    SELECT * FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return rows
}

export async function clearOldAuditLogs(days: number) {
  await ensureAuditTable()
  await sql`
    DELETE FROM audit_logs
    WHERE timestamp < NOW() - (${days} || ' days')::interval
  `
}
