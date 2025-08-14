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

    // Mock competency data - in real implementation, this would come from database
    const competencies = [
      {
        skill: "Email Security",
        category: "Security Awareness",
        currentLevel: "intermediate",
        targetLevel: "advanced",
        progress: 75,
        lastAssessed: new Date(),
        assessmentScore: 85,
        evidenceCount: 3,
        nextMilestone: "Complete advanced phishing simulation",
      },
      {
        skill: "Incident Response",
        category: "Security Operations",
        currentLevel: "beginner",
        targetLevel: "intermediate",
        progress: 40,
        lastAssessed: new Date(),
        assessmentScore: 72,
        evidenceCount: 1,
        nextMilestone: "Complete NIST framework training",
      },
      {
        skill: "Threat Analysis",
        category: "Security Operations",
        currentLevel: "novice",
        targetLevel: "beginner",
        progress: 25,
        lastAssessed: new Date(),
        assessmentScore: 60,
        evidenceCount: 0,
        nextMilestone: "Complete threat detection basics",
      },
      {
        skill: "AI Bias Detection",
        category: "AI Ethics",
        currentLevel: "intermediate",
        targetLevel: "advanced",
        progress: 80,
        lastAssessed: new Date(),
        assessmentScore: 88,
        evidenceCount: 2,
        nextMilestone: "Complete fairness metrics assessment",
      },
    ]

    return NextResponse.json({
      success: true,
      competencies,
    })
  } catch (error) {
    console.error("Get competencies error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get competencies",
      },
      { status: 500 },
    )
  }
}
