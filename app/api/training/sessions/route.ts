import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userResult = await sql`
      SELECT u.id, u.email, u.organization 
      FROM users u
      JOIN user_sessions s ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
      LIMIT 1
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]

    const sessions = await sql`
      SELECT 
        ts.id,
        ts.simulation_id,
        ts.user_id,
        ts.started_at,
        ts.completed_at,
        ts.score,
        ts.status,
        ts.time_spent_minutes,
        ts.feedback,
        sim.name as simulation_name,
        sim.type as simulation_type
      FROM training_sessions ts
      JOIN training_simulations sim ON ts.simulation_id = sim.id
      WHERE ts.organization_id = ${user.organization}
      ORDER BY ts.started_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
    })
  } catch (error) {
    console.error("Training sessions error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sessions",
      },
      { status: 500 },
    )
  }
}
