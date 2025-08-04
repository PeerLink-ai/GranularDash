import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Get logs for the agent
    const logs = await sql`
      SELECT 
        al.*,
        ca.name as agent_name
      FROM agent_logs al
      JOIN connected_agents ca ON al.agent_id = ca.agent_id
      WHERE al.agent_id = ${id}
      AND ca.user_id = ${user.id}
      ORDER BY al.timestamp DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    // Get total count
    const [{ count }] = await sql`
      SELECT COUNT(*) as count
      FROM agent_logs al
      JOIN connected_agents ca ON al.agent_id = ca.agent_id
      WHERE al.agent_id = ${id}
      AND ca.user_id = ${user.id}
    `

    return NextResponse.json({
      logs,
      total: Number.parseInt(count),
      limit,
      offset,
    })
  } catch (error) {
    console.error("Failed to fetch agent logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
