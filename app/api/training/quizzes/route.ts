import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getQuizzesByCategory } from "@/lib/assessment-system"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    let quizzes
    if (category) {
      quizzes = getQuizzesByCategory(category)
    } else {
      // Return all quizzes from all categories
      const securityQuizzes = getQuizzesByCategory("Security Awareness")
      const incidentQuizzes = getQuizzesByCategory("Incident Response")
      quizzes = [...securityQuizzes, ...incidentQuizzes]
    }

    return NextResponse.json({
      success: true,
      quizzes,
    })
  } catch (error) {
    console.error("Get quizzes error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get quizzes",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { quizId, responses, score, passed, totalTime, certificateEligible } = body

    // Store quiz attempt in database
    const result = await sql`
      INSERT INTO quiz_attempts (
        quiz_id,
        user_id,
        organization_id,
        score,
        passed,
        total_time,
        responses,
        certificate_eligible,
        completed_at
      ) VALUES (
        ${quizId},
        ${user.id},
        ${user.organization},
        ${score},
        ${passed},
        ${totalTime},
        ${JSON.stringify(responses)},
        ${certificateEligible || false},
        NOW()
      )
      RETURNING id, completed_at
    `

    return NextResponse.json({
      success: true,
      attemptId: result[0].id,
      completedAt: result[0].completed_at,
    })
  } catch (error) {
    console.error("Submit quiz error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit quiz",
      },
      { status: 500 },
    )
  }
}
