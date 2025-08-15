import { type NextRequest, NextResponse } from "next/server"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get compliance reports for the user's organization
    const reports = await sql`
      SELECT * FROM compliance_reports 
      WHERE organization = ${user.organization}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Error fetching compliance reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, type, content } = await request.json()

    const report = await sql`
      INSERT INTO compliance_reports (user_id, organization, name, type, status, content)
      VALUES (${user.id}, ${user.organization}, ${name}, ${type}, 'draft', ${JSON.stringify(content || {})})
      RETURNING *
    `

    return NextResponse.json({ report: report[0] })
  } catch (error) {
    console.error("Error creating compliance report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
