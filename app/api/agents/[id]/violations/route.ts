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

    // Get policy violations for the agent
    const violations = await sql`
      SELECT 
        pv.*,
        ca.name as agent_name
      FROM policy_violations pv
      LEFT JOIN connected_agents ca ON pv.agent_id = ca.agent_id
      WHERE pv.agent_id = ${id}
      AND pv.user_id = ${user.id}
      ORDER BY pv.detected_at DESC
      LIMIT 100
    `

    return NextResponse.json({ violations })
  } catch (error) {
    console.error("Failed to fetch policy violations:", error)
    return NextResponse.json({ violations: [] })
  }
}
