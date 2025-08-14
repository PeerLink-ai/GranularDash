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

    // Advanced analytics queries
    const [performanceTrends, categoryBreakdown, difficultyAnalysis, timeAnalysis, topPerformers, improvementAreas] =
      await Promise.all([
        // Performance trends over time
        sql`
        SELECT 
          DATE_TRUNC('week', completed_at) as week,
          AVG(score) as avg_score,
          COUNT(*) as simulations_count
        FROM training_simulations 
        WHERE organization_id = ${user.organization} 
          AND status = 'completed' 
          AND completed_at >= NOW() - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', completed_at)
        ORDER BY week
      `,

        // Performance by category
        sql`
        SELECT 
          type,
          COUNT(*) as total_simulations,
          AVG(score) as avg_score,
          AVG(participants_count) as avg_participants
        FROM training_simulations 
        WHERE organization_id = ${user.organization} 
          AND status = 'completed'
        GROUP BY type
        ORDER BY avg_score DESC
      `,

        // Difficulty level analysis
        sql`
        SELECT 
          difficulty_level,
          COUNT(*) as total_simulations,
          AVG(score) as avg_score,
          AVG(duration_minutes) as avg_duration
        FROM training_simulations 
        WHERE organization_id = ${user.organization} 
          AND status = 'completed'
          AND difficulty_level IS NOT NULL
        GROUP BY difficulty_level
        ORDER BY 
          CASE difficulty_level 
            WHEN 'beginner' THEN 1 
            WHEN 'intermediate' THEN 2 
            WHEN 'advanced' THEN 3 
          END
      `,

        // Time-based analysis
        sql`
        SELECT 
          EXTRACT(hour FROM started_at) as hour,
          COUNT(*) as sessions_count,
          AVG(score) as avg_score
        FROM training_sessions 
        WHERE organization_id = ${user.organization}
          AND status = 'completed'
          AND started_at >= NOW() - INTERVAL '30 days'
        GROUP BY EXTRACT(hour FROM started_at)
        ORDER BY hour
      `,

        // Top performers (anonymized)
        sql`
        SELECT 
          'User ' || ROW_NUMBER() OVER (ORDER BY AVG(score) DESC) as user_label,
          AVG(score) as avg_score,
          COUNT(*) as completed_sessions,
          AVG(time_spent_minutes) as avg_time
        FROM training_sessions 
        WHERE organization_id = ${user.organization}
          AND status = 'completed'
          AND started_at >= NOW() - INTERVAL '30 days'
        GROUP BY user_id
        HAVING COUNT(*) >= 3
        ORDER BY AVG(score) DESC
        LIMIT 10
      `,

        // Common improvement areas
        sql`
        SELECT 
          sim.type,
          COUNT(CASE WHEN ts.score < sim.pass_threshold THEN 1 END) as below_threshold,
          COUNT(*) as total_attempts,
          ROUND(
            (COUNT(CASE WHEN ts.score < sim.pass_threshold THEN 1 END)::float / COUNT(*)) * 100, 
            1
          ) as failure_rate
        FROM training_sessions ts
        JOIN training_simulations sim ON ts.simulation_id = sim.id
        WHERE ts.organization_id = ${user.organization}
          AND ts.status = 'completed'
          AND ts.started_at >= NOW() - INTERVAL '30 days'
        GROUP BY sim.type
        HAVING COUNT(*) >= 5
        ORDER BY failure_rate DESC
      `,
      ])

    const analytics = {
      performanceTrends: performanceTrends.map((row) => ({
        week: row.week,
        averageScore: Math.round(row.avg_score || 0),
        simulationsCount: Number(row.simulations_count),
      })),

      categoryBreakdown: categoryBreakdown.map((row) => ({
        category: row.type,
        totalSimulations: Number(row.total_simulations),
        averageScore: Math.round(row.avg_score || 0),
        averageParticipants: Math.round(row.avg_participants || 0),
      })),

      difficultyAnalysis: difficultyAnalysis.map((row) => ({
        difficulty: row.difficulty_level,
        totalSimulations: Number(row.total_simulations),
        averageScore: Math.round(row.avg_score || 0),
        averageDuration: Math.round(row.avg_duration || 0),
      })),

      timeAnalysis: timeAnalysis.map((row) => ({
        hour: Number(row.hour),
        sessionsCount: Number(row.sessions_count),
        averageScore: Math.round(row.avg_score || 0),
      })),

      topPerformers: topPerformers.map((row) => ({
        userLabel: row.user_label,
        averageScore: Math.round(row.avg_score || 0),
        completedSessions: Number(row.completed_sessions),
        averageTime: Math.round(row.avg_time || 0),
      })),

      improvementAreas: improvementAreas.map((row) => ({
        category: row.type,
        belowThreshold: Number(row.below_threshold),
        totalAttempts: Number(row.total_attempts),
        failureRate: Number(row.failure_rate),
      })),
    }

    return NextResponse.json({
      success: true,
      analytics,
    })
  } catch (error) {
    console.error("Training analytics error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch training analytics",
      },
      { status: 500 },
    )
  }
}
