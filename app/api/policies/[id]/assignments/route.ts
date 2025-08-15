import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserBySession } from "@/lib/auth"

async function getUserFromSession(request: NextRequest) {
  const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value
  if (!sessionToken) return null
  return await getUserBySession(sessionToken)
}

// GET: list current agent assignments for this policy
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Confirm policy belongs to user's org
    const policy = await sql`
      SELECT id FROM governance_policies
      WHERE id = ${params.id} AND organization_id = ${user.organization}
      LIMIT 1
    `
    if (policy.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    const rows = await sql`
      SELECT agent_id 
      FROM policy_agent_assignments
      WHERE policy_id = ${params.id}
    `
    const agent_ids = rows.map((r: any) => r.agent_id as string)
    return NextResponse.json({ agent_ids })
  } catch (error) {
    console.error("Assignments GET error:", error)
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
  }
}

// PUT: replace agent assignments for this policy
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { agent_ids } = await request.json()
    if (!Array.isArray(agent_ids)) {
      return NextResponse.json({ error: "agent_ids must be an array" }, { status: 400 })
    }

    // Confirm policy belongs to user's org
    const policy = await sql`
      SELECT id FROM governance_policies
      WHERE id = ${params.id} AND organization_id = ${user.organization}
      LIMIT 1
    `
    if (policy.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    // Fetch current assignments
    const rows = await sql`
      SELECT agent_id FROM policy_agent_assignments
      WHERE policy_id = ${params.id}
    `
    const current = new Set(rows.map((r: any) => r.agent_id as string))
    const next = new Set(agent_ids as string[])

    const toAdd: string[] = []
    const toRemove: string[] = []
    for (const id of next) if (!current.has(id)) toAdd.push(id)
    for (const id of current) if (!next.has(id)) toRemove.push(id)

    for (const agentId of toAdd) {
      await sql`
        INSERT INTO policy_agent_assignments (policy_id, agent_id, assigned_at, status)
        VALUES (${params.id}, ${agentId}, NOW(), 'active')
        ON CONFLICT (policy_id, agent_id) DO UPDATE SET status = 'active', assigned_at = EXCLUDED.assigned_at
      `
    }
    for (const agentId of toRemove) {
      await sql`
        DELETE FROM policy_agent_assignments
        WHERE policy_id = ${params.id} AND agent_id = ${agentId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Assignments PUT error:", error)
    return NextResponse.json({ error: "Failed to update assignments" }, { status: 500 })
  }
}
