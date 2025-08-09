import { neon } from "@neondatabase/serverless"

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING

if (!url) {
  throw new Error("DATABASE_URL (or POSTGRES_URL) is not set")
}

// Neon client – use tagged template: sql`... ${value} ...`
// For dynamic SQL strings, use sql.query("...", [params])
export const sql = neon(url)

// Singleton Neon client for server routes.
let _client: ReturnType<typeof neon> | null = null

function getConnectionString(): string {
  const c =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    ""
  if (!c) throw new Error("DATABASE_URL (or POSTGRES_*) is not set")
  return c
}

export function db() {
  if (_client) return _client
  _client = neon(getConnectionString())
  return _client
}

// Simple query helper with $1, $2 params.
export async function query<T = any>(text: string, params: any[] = []) {
  const rows = (await sql.query(text, params)) as T[]
  return { rows }
}

// Re-export a convenient tag.
export const sqlTag = sql

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: "admin" | "developer" | "analyst" | "viewer"
  organization: string
  created_at: string
  updated_at: string
  last_login?: string
  onboarding_completed: boolean
}

export interface UserPermission {
  id: string
  user_id: string
  permission: string
}

export interface ConnectedAgent {
  id: string
  user_id: string
  agent_id: string
  name: string
  provider: string
  model: string
  status: "active" | "inactive" | "testing"
  endpoint: string
  connected_at: string
  last_active?: string
  usage_requests: number
  usage_tokens_used: number
  usage_estimated_cost: number
  api_key_encrypted?: string
  configuration?: Record<string, any>
  health_status?: string
  last_health_check?: string
  error_count?: number
  last_error?: string
  metadata?: Record<string, any>
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  created_at: string
}

export interface AgentMetric {
  id: string
  agent_id: string
  user_id: string
  metric_type: "request" | "token_usage" | "cost" | "error"
  value: number
  timestamp: string
  metadata?: Record<string, any>
}

export interface AgentLog {
  id: string
  agent_id: string
  user_id: string
  log_level: "info" | "warn" | "error" | "debug"
  message: string
  details?: Record<string, any>
  timestamp: string
}

export interface AuditLog {
  id: string
  user_id: string
  organization: string
  action: string
  resource_type: string
  resource_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp: string
}

export interface ComplianceReport {
  id: string
  user_id: string
  organization: string
  name: string
  type: "quarterly" | "annual" | "ad-hoc" | "monthly" | "internal"
  status: "draft" | "in_progress" | "completed" | "failed"
  content: Record<string, any>
  file_path?: string
  created_at: string
  completed_at?: string
}

export interface RiskAssessment {
  id: string
  user_id: string
  organization: string
  name: string
  category: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "in_review" | "mitigated" | "acknowledged" | "closed"
  description?: string
  mitigation_strategy?: string
  last_assessed: string
  created_at: string
}

export interface PolicyViolation {
  id: string
  user_id: string
  organization: string
  agent_id?: string
  policy_name: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  status: "open" | "investigating" | "resolved" | "dismissed"
  detected_at: string
  resolved_at?: string
}

export interface ScheduledAudit {
  id: string
  user_id: string
  organization: string
  name: string
  audit_date: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  lead_auditor?: string
  scope?: string
  created_at: string
}

export interface FinancialGoal {
  id: string
  user_id: string
  title: string
  category: string
  target_amount: number
  current_amount: number
  due_date?: string
  status: "pending" | "in_progress" | "completed" | "delayed"
  notes?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  name: string
  amount: number
  transaction_date: string
  type: "income" | "expense"
  category?: string
  description?: string
  created_at: string
}

/** New: Projects table model */
export interface Project {
  id: string
  name: string
  description?: string | null
  type: "native" | "github" | "external"
  repo_url?: string | null
  metadata?: Record<string, any>
  pinned?: boolean
  created_at: string
  updated_at: string
}
