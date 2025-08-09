import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

async function exists(table: string) {
  try {
    const rows: any[] = await sql`SELECT to_regclass(${"public." + table}) AS exists`
    return rows?.[0]?.exists !== null
  } catch {
    return false
  }
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const pid = params.id
    if (!(await exists("projects"))) return NextResponse.json({ error: "projects table missing" }, { status: 400 })

    let linkedPolicies = 0
    let agentAssignments = 0

    // Choose some active policies (this can be smarter based on repo metadata)
    if (await exists("governance_policies")) {
      const policies: any[] = await sql`
        SELECT id FROM governance_policies WHERE status = 'active' ORDER BY severity DESC NULLS LAST LIMIT 5
      `
      if (policies.length && (await exists("project_policies"))) {
        for (const p of policies) {
          await sql`
            INSERT INTO project_policies (project_id, policy_id, linked_at)
            VALUES (${pid}, ${p.id}, NOW())
            ON CONFLICT DO NOTHING
          `
          linkedPolicies++
        }
      }

      // Assign to agents of this project
      if ((await exists("connected_agents")) && (await exists("policy_agent_assignments"))) {
        const agents: any[] = await sql`SELECT id FROM connected_agents WHERE project_id = ${pid}`
        for (const p of policies) {
          for (const a of agents) {
            await sql`
              INSERT INTO policy_agent_assignments (policy_id, agent_id, assigned_at, status)
              VALUES (${p.id}, ${a.id}, NOW(), 'active')
              ON CONFLICT DO NOTHING
            `
            agentAssignments++
          }
        }
      }
    }

    return NextResponse.json({ success: true, linkedPolicies, agentAssignments })
  } catch (e) {
    console.error("apply-policies error:", e)
    return NextResponse.json({ error: "Failed to apply policies" }, { status: 500 })
  }
}
