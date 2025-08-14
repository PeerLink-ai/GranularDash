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

    // Mock analytics data - in real implementation, this would be calculated from database
    const analytics = {
      totalTimeSpent: 420, // minutes
      modulesCompleted: 8,
      averageScore: 84,
      streakDays: 5,
      competenciesImproved: 3,
      certificationsEarned: 1,
      weeklyActivity: [
        { week: "Week 1", minutes: 60, modules: 2 },
        { week: "Week 2", minutes: 90, modules: 3 },
        { week: "Week 3", minutes: 45, modules: 1 },
        { week: "Week 4", minutes: 120, modules: 4 },
        { week: "Week 5", minutes: 75, modules: 2 },
      ],
      skillRadar: [
        { skill: "Email Security", level: 4, target: 5 },
        { skill: "Incident Response", level: 2, target: 3 },
        { skill: "Threat Analysis", level: 1, target: 2 },
        { skill: "AI Ethics", level: 3, target: 4 },
        { skill: "Compliance", level: 2, target: 3 },
        { skill: "Risk Management", level: 3, target: 4 },
      ],
      performanceTrend: [
        { date: "2024-01-01", score: 75, category: "Security" },
        { date: "2024-01-08", score: 82, category: "Security" },
        { date: "2024-01-15", score: 78, category: "Incident Response" },
        { date: "2024-01-22", score: 85, category: "Security" },
        { date: "2024-01-29", score: 88, category: "AI Ethics" },
        { date: "2024-02-05", score: 84, category: "Security" },
      ],
    }

    return NextResponse.json({
      success: true,
      analytics,
    })
  } catch (error) {
    console.error("Get analytics error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get analytics",
      },
      { status: 500 },
    )
  }
}
