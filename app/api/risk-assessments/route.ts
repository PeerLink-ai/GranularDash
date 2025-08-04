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

    // Get risk assessments for the user's organization
    const assessments = await sql`
      SELECT * FROM risk_assessments 
      WHERE organization = ${user.organization}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ assessments })
  } catch (error) {
    console.error("Error fetching risk assessments:", error)
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

    const { name, category, severity, description, mitigation_strategy } = await request.json()

    const assessment = await sql`
      INSERT INTO risk_assessments (user_id, organization, name, category, severity, status, description, mitigation_strategy)
      VALUES (${user.id}, ${user.organization}, ${name}, ${category}, ${severity}, 'open', ${description || null}, ${mitigation_strategy || null})
      RETURNING *
    `

    return NextResponse.json({ assessment: assessment[0] })
  } catch (error) {
    console.error("Error creating risk assessment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
