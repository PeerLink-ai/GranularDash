import { type NextRequest, NextResponse } from "next/server"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get audit logs for the user's organization
    const auditLogs = await sql`
      SELECT * FROM audit_logs 
      WHERE organization = ${user.organization}
      ORDER BY timestamp DESC
      LIMIT 100
    `

    return NextResponse.json({ auditLogs })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, resource_type, resource_id, details } = await request.json()

    const auditLog = await sql`
      INSERT INTO audit_logs (user_id, organization, action, resource_type, resource_id, details)
      VALUES (${user.id}, ${user.organization}, ${action}, ${resource_type}, ${resource_id || null}, ${JSON.stringify(details || {})})
      RETURNING *
    `

    return NextResponse.json({ auditLog: auditLog[0] })
  } catch (error) {
    console.error("Error creating audit log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
