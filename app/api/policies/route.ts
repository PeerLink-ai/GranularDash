import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, email, organization 
      FROM users 
      WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]

    // Get policies for the user's organization
    const policies = await sql`
      SELECT 
        id,
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
      WHERE organization_id = ${user.organization}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ 
      success: true, 
      policies: policies || [] 
    })
  } catch (error) {
    console.error("Failed to fetch policies:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch policies",
      policies: [] 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, email, organization 
      FROM users 
      WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]
    const body = await request.json()
    const { 
      name, 
      description, 
      type, 
      severity, 
      applies_to_agents = false, 
      agent_enforcement = 'warn',
      agent_ids = []
    } = body

    // Insert new policy
    const result = await sql`
      INSERT INTO governance_policies (
        organization_id, 
        name, 
        description, 
        type, 
        severity,
        status,
        applies_to_agents,
        agent_enforcement,
        created_at,
        updated_at
      ) VALUES (
        ${user.organization},
        ${name},
        ${description},
        ${type},
        ${severity},
        'active',
        ${applies_to_agents},
        ${agent_enforcement},
        NOW(),
        NOW()
      )
      RETURNING id, name, description, type, severity, status, applies_to_agents, agent_enforcement, created_at, updated_at
    `

    const policy = result[0]

    // If policy applies to agents, create assignments
    if (applies_to_agents && agent_ids.length > 0) {
      for (const agentId of agent_ids) {
        await sql`
          INSERT INTO policy_agent_assignments (policy_id, agent_id, assigned_at, status)
          VALUES (${policy.id}, ${agentId}, NOW(), 'active')
        `
      }
    }

    return NextResponse.json({ 
      success: true, 
      policy 
    })
  } catch (error) {
    console.error("Failed to create policy:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create policy" 
    }, { status: 500 })
  }
}
