import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    const sessionId = params.id
    const body = await request.json()
    const { responses, totalTime } = body

    const results = await calculateTrainingResults(responses, totalTime)

    await sql`
      UPDATE training_sessions
      SET
        completed_at = NOW(),
        score = ${results.finalScore},
        status = 'completed',
        time_spent_minutes = ${Math.floor(totalTime / 60)},
        feedback = ${results.feedback},
        answers = ${JSON.stringify(responses)},
        results = ${JSON.stringify(results)}
      WHERE id = ${sessionId}
      AND organization_id = ${user.organization}
    `

    await sql`
      UPDATE training_simulations
      SET
        status = 'completed',
        score = ${results.finalScore},
        completed_at = NOW(),
        results = ${JSON.stringify(results)},
        updated_at = NOW()
      WHERE id = (
        SELECT simulation_id FROM training_sessions WHERE id = ${sessionId}
      )
    `

    return NextResponse.json({
      success: true,
      results: results,
    })
  } catch (error) {
    console.error("Complete training session error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete session",
      },
      { status: 500 },
    )
  }
}

async function calculateTrainingResults(responses: any[], totalTime: number) {
  let totalScore = 0
  let maxScore = 0
  const scenarioResults = []

  for (const response of responses) {
    const scenarioScore = evaluateResponse(response)
    totalScore += scenarioScore.points
    maxScore += scenarioScore.maxPoints
    scenarioResults.push(scenarioScore)
  }

  const finalScore = Math.round((totalScore / maxScore) * 100)

  const feedback = generateDetailedFeedback(finalScore, scenarioResults, totalTime)

  const analysis = analyzePerformance(scenarioResults)

  return {
    finalScore,
    totalTime: Math.floor(totalTime / 60),
    scenarioResults,
    feedback,
    strengths: analysis.strengths,
    improvementAreas: analysis.weaknesses,
    recommendations: analysis.recommendations,
    performanceMetrics: {
      accuracy: analysis.accuracy,
      responseTime: analysis.avgResponseTime,
      confidence: analysis.avgConfidence,
    },
  }
}

function evaluateResponse(response: any) {
  const basePoints = 10
  let points = 0
  let feedback = ""

  if (response.response && response.response.trim().length > 0) {
    points += 5 // Base points for providing a response

    if (response.response.length > 100) {
      points += 2
    }

    const confidenceBonus = (response.confidence || 3) * 0.5
    points += confidenceBonus

    const timeSpent = response.timeSpent || 60
    if (timeSpent >= 30 && timeSpent <= 300) {
      points += 1 // Good time management
    }

    feedback = "Good response with appropriate detail and consideration."
  } else {
    feedback = "Response was incomplete or missing."
  }

  return {
    scenarioId: response.scenarioId,
    points: Math.min(points, basePoints),
    maxPoints: basePoints,
    timeSpent: response.timeSpent,
    confidence: response.confidence,
    feedback,
  }
}

function generateDetailedFeedback(score: number, scenarioResults: any[], totalTime: number) {
  let feedback = ""

  if (score >= 90) {
    feedback =
      "Excellent performance! You demonstrated exceptional understanding and provided thoughtful, comprehensive responses. "
  } else if (score >= 80) {
    feedback = "Very good performance! You showed strong grasp of key concepts with well-reasoned responses. "
  } else if (score >= 70) {
    feedback =
      "Good performance overall. You understood most concepts but could benefit from more detailed analysis in some areas. "
  } else if (score >= 60) {
    feedback =
      "Satisfactory performance. You grasped basic concepts but need to develop deeper understanding and more comprehensive responses. "
  } else {
    feedback =
      "This training highlighted several areas needing improvement. Consider reviewing the material and practicing similar scenarios. "
  }

  const avgTimePerScenario = totalTime / scenarioResults.length
  if (avgTimePerScenario < 30) {
    feedback += "Consider taking more time to thoroughly analyze each scenario. "
  } else if (avgTimePerScenario > 300) {
    feedback += "Try to be more decisive in your responses while maintaining thoroughness. "
  }

  return feedback
}

function analyzePerformance(scenarioResults: any[]) {
  const totalScenarios = scenarioResults.length
  const correctResponses = scenarioResults.filter((r) => r.points >= r.maxPoints * 0.7).length
  const accuracy = (correctResponses / totalScenarios) * 100

  const avgResponseTime = scenarioResults.reduce((sum, r) => sum + (r.timeSpent || 60), 0) / totalScenarios
  const avgConfidence = scenarioResults.reduce((sum, r) => sum + (r.confidence || 3), 0) / totalScenarios

  const strengths = []
  const weaknesses = []
  const recommendations = []

  if (accuracy >= 80) {
    strengths.push("Strong analytical skills and decision-making")
  }
  if (avgConfidence >= 4) {
    strengths.push("High confidence in responses")
  }
  if (avgResponseTime >= 60 && avgResponseTime <= 180) {
    strengths.push("Good time management and thoroughness")
  }

  if (accuracy < 70) {
    weaknesses.push("Need to improve analytical accuracy")
    recommendations.push("Review core concepts and practice similar scenarios")
  }
  if (avgConfidence < 3) {
    weaknesses.push("Low confidence in responses")
    recommendations.push("Build confidence through additional training and practice")
  }
  if (avgResponseTime < 30) {
    weaknesses.push("Responses may be too hasty")
    recommendations.push("Take more time to thoroughly analyze scenarios")
  }

  return {
    accuracy,
    avgResponseTime,
    avgConfidence,
    strengths,
    weaknesses,
    recommendations,
  }
}
