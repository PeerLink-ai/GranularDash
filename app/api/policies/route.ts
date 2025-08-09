import { type NextRequest, NextResponse } from "next/server"
import { sql as neonSql, query } from "@/lib/db"
import { randomUUID } from "crypto"

async function tableExists(name: string) {
  const rows = await neonSql`SELECT to_regclass(${`public.${name}`}) AS exists`
  return rows?.[0]?.exists !== null
}

async function columnExists(table: string, column: string) {
  const rows = await neonSql`
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = ${table} 
      AND column_name = ${column}
    LIMIT 1
  `
  return rows.length > 0
}

export async function GET(_req: NextRequest) {
  try {
    const hasGovernance = await tableExists("governance_policies")
    const hasPolicies = await tableExists("policies")
    if (!hasGovernance && !hasPolicies) {
      return NextResponse.json({ items: [] })
    }
    const table = hasGovernance ? "governance_policies" : "policies"
    const hasOrgId = await columnExists(table, "organization_id")
    const orgCol = hasOrgId ? "organization_id" : (await columnExists(table, "organization")) ? "organization" : null

    const text = `
      SELECT
        id::text AS id,
        name,
        COALESCE(description, '') AS description,
        COALESCE(type, 'policy') AS type,
        COALESCE(status, 'active') AS status,
        COALESCE(severity, 'medium') AS severity,
        ${orgCol ? orgCol : `'unknown'`} AS organization,
        COALESCE(updated_at, created_at, NOW()) AS updated_at,
        COALESCE(created_at, NOW()) AS created_at
      FROM ${table}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 200
    `
    const { rows } = await query(text)
    return NextResponse.json({ items: rows })
  } catch (e) {
    console.error("Policies list error:", e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      description = "",
      type = "policy",
      severity = "medium",
      applies_to_agents = false,
      agent_enforcement = "warn",
      agent_ids = [] as string[],
      project_id,
      repo_url,
    } = body

    if (!name || !type) {
      return NextResponse.json({ success: false, error: "name and type are required" }, { status: 400 })
    }

    const hasGovernance = await tableExists("governance_policies")
    if (!hasGovernance) {
      // Fallback: echo in environments without governance_policies
      return NextResponse.json({ success: true, echo: body })
    }

    const id = randomUUID()
    const org = "Acme Corp" // TODO: derive from session/tenant

    // Explicitly provide id to avoid NOT NULL violations.
    const insert = await query(
      `INSERT INTO governance_policies (
        id, name, description, type, severity, status, organization_id, applies_to_agents, agent_enforcement, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8,NOW(),NOW())
      RETURNING id, name`,
      [id, name, description, type, severity, org, applies_to_agents, agent_enforcement],
    )

    // Optional project linking
    let linkedProjectId: string | null = null
    if (await tableExists("projects")) {
      if (project_id) {
        const { rows } = await query(`SELECT id::text AS id FROM projects WHERE id = $1 LIMIT 1`, [project_id])
        if (rows.length) linkedProjectId = rows[0].id
      } else if (repo_url) {
        const { rows } = await query(`SELECT id::text AS id FROM projects WHERE repo_url = $1 LIMIT 1`, [repo_url])
        if (rows.length) linkedProjectId = rows[0].id
      }
      if (linkedProjectId && (await tableExists("project_policies"))) {
        await query(
          `INSERT INTO project_policies (project_id, policy_id, linked_at)
           VALUES ($1,$2,NOW())
           ON CONFLICT (project_id, policy_id) DO NOTHING`,
          [linkedProjectId, id],
        )
      }
    }

    // Build final agent set: provided agent_ids plus project agents (if schema supports it)
    const finalAgents = new Set<string>(agent_ids ?? [])
    if (
      linkedProjectId &&
      (await tableExists("connected_agents")) &&
      (await columnExists("connected_agents", "project_id"))
    ) {
      const { rows } = await query(`SELECT id::text AS id FROM connected_agents WHERE project_id = $1`, [
        linkedProjectId,
      ])
      for (const r of rows) finalAgents.add(String(r.id))
    }

    if (applies_to_agents && finalAgents.size > 0 && (await tableExists("policy_agent_assignments"))) {
      // Insert one-by-one to keep compatibility; in production batch with UNNEST.
      for (const agentId of finalAgents) {
        await query(
          `INSERT INTO policy_agent_assignments (policy_id, agent_id, assigned_at, status)
           VALUES ($1, $2, NOW(), 'active')
           ON CONFLICT (policy_id, agent_id) DO NOTHING`,
          [id, agentId],
        )
      }
    }

    return NextResponse.json({
      success: true,
      policy: insert.rows?.[0] ?? { id, name },
      linkedProjectId,
      assignedAgents: Array.from(finalAgents),
    })
  } catch (e) {
    console.error("Create policy error:", e)
    return NextResponse.json({ success: false, error: "Failed to create policy" }, { status: 500 })
  }
}
