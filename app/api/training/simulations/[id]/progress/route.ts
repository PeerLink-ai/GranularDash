import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    const simulationId = params.id

    // Get simulation progress and real-time metrics
    const [simulation, sessions, recentActivity] = await Promise.all([
      sql`
        SELECT 
          id, name, type, status, last_run, completed_at, score, 
          duration_minutes, participants_count, results, configuration
        FROM training_simulations 
        WHERE id = ${simulationId} AND organization_id = ${user.organization}
      `,
      sql`
        SELECT 
          id, user_id, started_at, completed_at, score, status, 
          time_spent_minutes, feedback, answers
        FROM training_sessions 
        WHERE simulation_id = ${simulationId} AND organization_id = ${user.organization}
        ORDER BY started_at DESC
        LIMIT 10
      `,
      sql`
        SELECT 
          COUNT(*) as total_sessions,
          AVG(score) as avg_score,
          AVG(time_spent_minutes) as avg_duration,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_sessions
        FROM training_sessions 
        WHERE simulation_id = ${simulationId} AND organization_id = ${user.organization}
      `,
    ])

    if (simulation.length === 0) {
      return NextResponse.json({ error: "Simulation not found" }, { status: 404 })
    }

    const progressData = {
      simulation: simulation[0],
      sessions: sessions,
      metrics: recentActivity[0],
      realTimeStatus: {
        isActive: simulation[0].status === "in_progress",
        participantsOnline: recentActivity[0].active_sessions || 0,
        completionRate:
          recentActivity[0].total_sessions > 0
            ? Math.round((recentActivity[0].completed_sessions / recentActivity[0].total_sessions) * 100)
            : 0,
        averagePerformance: Math.round(recentActivity[0].avg_score || 0),
        estimatedTimeRemaining:
          simulation[0].status === "in_progress"
            ? Math.max(0, (simulation[0].duration_minutes || 60) - (recentActivity[0].avg_duration || 0))
            : 0,
      },
    }

    return NextResponse.json({
      success: true,
      progress: progressData,
    })
  } catch (error) {
    console.error("Simulation progress error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch simulation progress",
      },
      { status: 500 },
    )
  }
}
