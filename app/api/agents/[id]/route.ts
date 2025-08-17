import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get auth token from cookies
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    // Get agent
    const agents = await sql`
      SELECT ca.*, u.name as owner_name
      FROM connected_agents ca
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE ca.id = ${params.id}
    `

    if (agents.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agent = agents[0]

    return NextResponse.json({ agent })
  } catch (error) {
    console.error("Agent fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, status, endpoint, type, api_key } = body

    // Update agent
    const [updatedAgent] = await sql`
      UPDATE connected_agents 
      SET 
        name = COALESCE(${name}, name),
        status = COALESCE(${status}, status),
        endpoint = COALESCE(${endpoint}, endpoint),
        provider = COALESCE(${type}, provider),
        api_key = COALESCE(${api_key}, api_key),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `

    if (!updatedAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Log the activity
    await logActivity({
      userId: user.id,
      organization: user.organization,
      action: "Agent updated",
      resourceType: "agent",
      resourceId: updatedAgent.id,
      description: `Updated agent: ${updatedAgent.name}`,
      status: "success",
    })

    return NextResponse.json({ agent: updatedAgent })
  } catch (error) {
    console.error("Agent update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get agent details before deletion
    const [agent] = await sql`
      SELECT * FROM connected_agents 
      WHERE id = ${id} AND user_id = ${user.id}
    `

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Delete the agent
    await sql`
      DELETE FROM connected_agents 
      WHERE id = ${id} AND user_id = ${user.id}
    `

    // Log the activity
    await logActivity({
      userId: user.id,
      organization: user.organization,
      action: `Disconnected ${agent.name} agent`,
      resourceType: "agent",
      resourceId: id,
      description: `Removed ${agent.provider} ${agent.model} agent connection`,
      status: "warning",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete agent:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
