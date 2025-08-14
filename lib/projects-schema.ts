import { sql } from "@/lib/db"

async function tableExists(name: string) {
  const rows = await sql`SELECT to_regclass(${`public.${name}`}) AS exists`
  return rows?.[0]?.exists !== null
}

export async function ensureProjectsSchema() {
  if (!(await tableExists("projects"))) {
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        description text,
        type text NOT NULL CHECK (type IN ('native','github','external')),
        repo_url text,
        metadata jsonb DEFAULT '{}'::jsonb,
        pinned boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_pinned ON projects(pinned)`
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type)`
  }
}

export async function ensurePoliciesSchema() {
  if (!(await tableExists("policies"))) {
    await sql`
      CREATE TABLE IF NOT EXISTS policies (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        description text,
        category text,
        severity text,
        created_at timestamptz DEFAULT now()
      )
    `
  }
}

export async function ensureProjectRelationsSchema() {
  if (!(await tableExists("project_policies"))) {
    await sql`
      CREATE TABLE IF NOT EXISTS project_policies (
        project_id uuid NOT NULL,
        policy_id uuid NOT NULL,
        PRIMARY KEY (project_id, policy_id)
      )
    `
  }
  if (!(await tableExists("policy_agent_assignments"))) {
    await sql`
      CREATE TABLE IF NOT EXISTS policy_agent_assignments (
        policy_id uuid NOT NULL,
        agent_id text NOT NULL,
        status text DEFAULT 'active',
        PRIMARY KEY (policy_id, agent_id)
      )
    `
  }
}

export async function ensureAuditLogsSchema() {
  if (!(await tableExists("audit_logs"))) {
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id text NOT NULL,
        organization text NOT NULL,
        action text NOT NULL,
        resource_type text NOT NULL,
        resource_id text,
        description text,
        status text,
        ip_address text,
        user_agent text,
        metadata jsonb,
        timestamp timestamptz DEFAULT now()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_ts ON audit_logs(timestamp DESC)`
  }
}

export async function ensureSDKLogsSchema() {
  if (!(await tableExists("sdk_logs"))) {
    await sql`
      CREATE TABLE IF NOT EXISTS sdk_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id text NOT NULL,
        user_id text,
        type text NOT NULL,
        level text NOT NULL,
        payload jsonb NOT NULL,
        timestamp timestamptz DEFAULT now()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_sdk_logs_agent_ts ON sdk_logs(agent_id, timestamp DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sdk_logs_type_ts ON sdk_logs(type, timestamp DESC)`
  }
}
