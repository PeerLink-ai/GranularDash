import { type NextRequest, NextResponse } from "next/server"
import { sql as neonSql, query } from "@/lib/db"

async function tableExists(name: string) {
  const rows = await neonSql`SELECT to_regclass(${`public.${name}`}) AS exists`
  return rows?.[0]?.exists !== null
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await tableExists("policy_agent_assignments"))) {
      return NextResponse.json({ agent_ids: [] })
    }
    const rows = await neonSql`
      SELECT agent_id::text AS id
      FROM policy_agent_assignments
      WHERE policy_id = ${params.id}::uuid
      ORDER BY assigned_at DESC
    `
    return NextResponse.json({ agent_ids: rows.map((r: any) => r.id) })
  } catch (e) {
    console.error("Get assignments error:", e)
    return NextResponse.json({ agent_ids: [] })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const policyId = params.id
    if (!(await tableExists("policy_agent_assignments"))) {
      return NextResponse.json({ success: false, error: "assignments table missing" }, { status: 400 })
    }
    const body = await req.json()
    const incoming: string[] = Array.isArray(body.agent_ids) ? body.agent_ids.map(String) : []

    // Get current set
    const currentRows = await neonSql`
      SELECT agent_id::text AS id
      FROM policy_agent_assignments
      WHERE policy_id = ${policyId}::uuid
    `
    const current = new Set<string>(currentRows.map((r: any) => r.id))
    const next = new Set<string>(incoming)

    // Compute adds and deletes
    const toAdd = [...next].filter((id) => !current.has(id))
    const toDel = [...current].filter((id) => !next.has(id))

    await neonSql`BEGIN`
    try {
      for (const id of toAdd) {
        await query(
          `INSERT INTO policy_agent_assignments (policy_id, agent_id, assigned_at, status)
           VALUES ($1::uuid, $2::uuid, NOW(), 'active')
           ON CONFLICT (policy_id, agent_id) DO NOTHING`,
          [policyId, id],
        )
      }
      for (const id of toDel) {
        await query(`DELETE FROM policy_agent_assignments WHERE policy_id = $1::uuid AND agent_id = $2::uuid`, [
          policyId,
          id,
        ])
      }
      await neonSql`COMMIT`
    } catch (e) {
      await neonSql`ROLLBACK`
      throw e
    }

    return NextResponse.json({ success: true, added: toAdd, removed: toDel })
  } catch (e) {
    console.error("Update assignments error:", e)
    return NextResponse.json({ success: false, error: "Failed to update assignments" }, { status: 500 })
  }
}
