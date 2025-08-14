import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
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
    const targetUserId = Number.parseInt(params.userId)

    // Check if user can access this data (same organization or own data)
    if (user.id !== targetUserId) {
      const targetUserResult = await sql`
        SELECT organization FROM users WHERE id = ${targetUserId}
      `
      if (targetUserResult.length === 0 || targetUserResult[0].organization !== user.organization) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Get user progress data
    const progressData = await sql`
      SELECT 
        'security-fundamentals' as path_id,
        'in_progress' as status,
        75 as overall_progress,
        ARRAY['phishing-basics', 'password-security'] as completed_modules,
        'phishing-quiz' as current_module_id,
        NOW() - INTERVAL '7 days' as started_at,
        NOW() - INTERVAL '1 day' as last_activity,
        180 as time_spent,
        85 as average_score
      UNION ALL
      SELECT 
        'incident-response-professional' as path_id,
        'not_started' as status,
        0 as overall_progress,
        ARRAY[]::text[] as completed_modules,
        null as current_module_id,
        null as started_at,
        null as last_activity,
        0 as time_spent,
        0 as average_score
    `

    const progress = progressData.map((row) => ({
      userId: targetUserId,
      pathId: row.path_id,
      status: row.status,
      overallProgress: row.overall_progress,
      completedModules: row.completed_modules || [],
      currentModuleId: row.current_module_id,
      startedAt: row.started_at,
      lastActivity: row.last_activity,
      timeSpent: row.time_spent,
      averageScore: row.average_score,
    }))

    return NextResponse.json({
      success: true,
      progress,
    })
  } catch (error) {
    console.error("Get progress error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get progress",
      },
      { status: 500 },
    )
  }
}
