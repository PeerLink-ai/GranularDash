import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organization = searchParams.get("organization") || user.organization

    // Get recent activities for the organization
    const activities = await sql`
      SELECT 
        al.*,
        u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.organization = ${organization}
      ORDER BY al.timestamp DESC
      LIMIT 50
    `

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("Failed to fetch activities:", error)
    return NextResponse.json({ activities: [] })
  }
}
