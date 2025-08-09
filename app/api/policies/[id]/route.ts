import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// All routes below scope by user's organization and use governance_policies (consistent with /api/policies)

async function getUserFromSession(request: NextRequest) {
  const sessionToken = request.cookies.get("session")?.value
  if (!sessionToken) return null

  const userResult = await sql`
    SELECT id, email, organization 
    FROM users
    WHERE session_token = ${sessionToken}
    LIMIT 1
  `
  return userResult[0] || null
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const policyResult = await sql`
      SELECT 
        id,
        organization_id,
        name,
        description,
        type,
        status,
        severity,
        applies_to_agents,
        agent_enforcement,
        created_at,
        updated_at
      FROM governance_policies
      WHERE id = ${params.id} AND organization_id = ${user.organization}
      LIMIT 1
    `

    if (policyResult.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({ policy: policyResult[0] })
  } catch (error) {
    console.error("Failed to fetch policy:", error)
    return NextResponse.json({ error: "Failed to fetch policy" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { name, description, type, severity, status, applies_to_agents, agent_enforcement, agent_ids } = body

    // Ensure policy exists and belongs to org
    const existing = await sql`
      SELECT id FROM governance_policies
      WHERE id = ${params.id} AND organization_id = ${user.organization}
      LIMIT 1
    `
    if (existing.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    const updated = await sql`
      UPDATE governance_policies
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        type = COALESCE(${type}, type),
        severity = COALESCE(${severity}, severity),
        status = COALESCE(${status}, status),
        applies_to_agents = COALESCE(${applies_to_agents}, applies_to_agents),
        agent_enforcement = COALESCE(${agent_enforcement}, agent_enforcement),
        updated_at = NOW()
      WHERE id = ${params.id} AND organization_id = ${user.organization}
      RETURNING 
        id,
        organization_id,
        name,
        description,
        type,
        status,
        severity,
        applies_to_agents,
        agent_enforcement,
        created_at,
        updated_at
    `

    // Optional: handle assignments update when agent_ids is sent as part of PUT
    if (Array.isArray(agent_ids)) {
      // Fetch current assignments
      const rows = await sql`
        SELECT agent_id FROM policy_agent_assignments
        WHERE policy_id = ${params.id}
      `
      const current = new Set(rows.map((r: any) => r.agent_id as string))
      const next = new Set(agent_ids as string[])

      const toAdd: string[] = []
      const toRemove: string[] = []
      // determine additions
      for (const id of next) if (!current.has(id)) toAdd.push(id)
      // determine removals
      for (const id of current) if (!next.has(id)) toRemove.push(id)

      for (const agentId of toAdd) {
        await sql`
          INSERT INTO policy_agent_assignments (policy_id, agent_id, assigned_at, status)
          VALUES (${params.id}, ${agentId}, NOW(), 'active')
          ON CONFLICT (policy_id, agent_id) DO UPDATE SET status = 'active', assigned_at = EXCLUDED.assigned_at
        `
      }
      if (toRemove.length > 0) {
        // remove assignments for policy+agent
        for (const agentId of toRemove) {
          await sql`
            DELETE FROM policy_agent_assignments
            WHERE policy_id = ${params.id} AND agent_id = ${agentId}
          `
        }
      }
    }

    return NextResponse.json({ policy: updated[0] })
  } catch (error) {
    console.error("Failed to update policy:", error)
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Ensure policy exists
    const existing = await sql`
      SELECT id FROM governance_policies
      WHERE id = ${params.id} AND organization_id = ${user.organization}
      LIMIT 1
    `
    if (existing.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    // Remove assignments first to keep referential integrity
    await sql`
      DELETE FROM policy_agent_assignments
      WHERE policy_id = ${params.id}
    `
    // Delete policy
    await sql`
      DELETE FROM governance_policies
      WHERE id = ${params.id} AND organization_id = ${user.organization}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete policy:", error)
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 })
  }
}
