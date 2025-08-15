import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserBySession } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Starting simulation with ID:", params.id)

    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      console.log("[v0] No session token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      console.log("[v0] User not found for session token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User found:", { id: user.id, organization: user.organization })

    const simulationId = params.id

    const simulationResult = await sql`
      SELECT id, name, type, difficulty_level, duration_minutes, configuration, pass_threshold, organization_id
      FROM training_simulations 
      WHERE id = ${simulationId}
    `

    if (simulationResult.length === 0) {
      console.log("[v0] Simulation not found:", simulationId)
      return NextResponse.json({ error: "Simulation not found" }, { status: 404 })
    }

    const simulation = simulationResult[0]
    console.log("[v0] Simulation found:", simulation.name)

    const userId = typeof user.id === "string" ? Number.parseInt(user.id, 10) : user.id
    const organizationId = user.organization || simulation.organization_id || "Hive"

    console.log("[v0] Creating training session for user:", userId, "org:", organizationId)

    const sessionResult = await sql`
      INSERT INTO training_sessions (
        simulation_id,
        user_id,
        organization_id,
        started_at,
        status
      ) VALUES (
        ${simulationId},
        ${userId},
        ${organizationId},
        NOW(),
        'in_progress'
      )
      RETURNING id, started_at
    `

    const session = sessionResult[0]
    console.log("[v0] Training session created:", session.id)

    const result = await sql`
      UPDATE training_simulations 
      SET 
        status = 'in_progress',
        last_run = NOW(),
        participants_count = COALESCE(participants_count, 0) + 1,
        updated_at = NOW()
      WHERE id = ${simulationId}
      RETURNING id, name, status, last_run, difficulty_level, duration_minutes
    `

    const scenarios = generateSimulationScenarios(simulation.type, simulation.difficulty_level)
    console.log("[v0] Generated scenarios:", scenarios.length)

    setTimeout(
      async () => {
        try {
          console.log("[v0] Starting simulation completion for session:", session.id)
          const completionData = await simulateAdvancedCompletion(simulation, session.id, userId)

          await sql`
          UPDATE training_simulations 
          SET 
            status = 'completed',
            score = ${completionData.score},
            completed_at = NOW(),
            results = ${JSON.stringify(completionData.results)},
            updated_at = NOW()
          WHERE id = ${simulationId}
        `

          await sql`
          UPDATE training_sessions
          SET
            completed_at = NOW(),
            score = ${completionData.score},
            status = 'completed',
            time_spent_minutes = ${completionData.duration},
            feedback = ${completionData.feedback},
            answers = ${JSON.stringify(completionData.answers)}
          WHERE id = ${session.id}
        `

          console.log("[v0] Simulation completed successfully:", session.id)
        } catch (error) {
          console.error("[v0] Failed to complete simulation:", error)
          await sql`
          UPDATE training_simulations 
          SET status = 'failed', updated_at = NOW()
          WHERE id = ${simulationId}
        `
        }
      },
      (simulation.duration_minutes || 60) * 100,
    )

    console.log("[v0] Simulation started successfully")
    return NextResponse.json({
      success: true,
      simulation: result[0],
      session: session,
      scenarios: scenarios,
      estimatedDuration: simulation.duration_minutes || 60,
    })
  } catch (error) {
    console.error("[v0] Start simulation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to start simulation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generateSimulationScenarios(type: string, difficulty: string) {
  const scenarioTemplates = {
    "Security Awareness": {
      beginner: [
        { id: 1, title: "Basic Phishing Email", description: "Identify obvious phishing attempts", weight: 0.3 },
        { id: 2, title: "Password Security", description: "Evaluate password strength", weight: 0.4 },
        { id: 3, title: "Safe Browsing", description: "Recognize suspicious websites", weight: 0.3 },
      ],
      intermediate: [
        { id: 1, title: "Spear Phishing Campaign", description: "Detect targeted phishing attacks", weight: 0.25 },
        { id: 2, title: "Social Engineering Call", description: "Handle suspicious phone calls", weight: 0.25 },
        { id: 3, title: "USB Drop Attack", description: "Respond to found USB devices", weight: 0.25 },
        { id: 4, title: "Email Spoofing", description: "Identify spoofed sender addresses", weight: 0.25 },
      ],
      advanced: [
        { id: 1, title: "Advanced Persistent Threat", description: "Detect sophisticated APT indicators", weight: 0.2 },
        { id: 2, title: "Business Email Compromise", description: "Identify BEC attack patterns", weight: 0.2 },
        { id: 3, title: "Watering Hole Attack", description: "Recognize compromised websites", weight: 0.2 },
        { id: 4, title: "Supply Chain Attack", description: "Assess third-party risks", weight: 0.2 },
        { id: 5, title: "Zero-Day Exploitation", description: "Respond to unknown threats", weight: 0.2 },
      ],
    },
    "Incident Response": {
      beginner: [
        { id: 1, title: "Incident Classification", description: "Categorize security incidents", weight: 0.4 },
        { id: 2, title: "Initial Response", description: "Execute first response steps", weight: 0.6 },
      ],
      intermediate: [
        { id: 1, title: "Containment Strategy", description: "Implement containment measures", weight: 0.3 },
        { id: 2, title: "Evidence Collection", description: "Preserve digital evidence", weight: 0.3 },
        { id: 3, title: "Communication Plan", description: "Coordinate incident communications", weight: 0.4 },
      ],
      advanced: [
        { id: 1, title: "Multi-Vector Attack", description: "Coordinate response to complex attack", weight: 0.25 },
        { id: 2, title: "Forensic Analysis", description: "Conduct detailed forensic investigation", weight: 0.25 },
        { id: 3, title: "Recovery Planning", description: "Develop comprehensive recovery strategy", weight: 0.25 },
        { id: 4, title: "Lessons Learned", description: "Document and improve processes", weight: 0.25 },
      ],
    },
    "AI Ethics & Safety": {
      beginner: [
        { id: 1, title: "Bias Recognition", description: "Identify basic algorithmic bias", weight: 0.5 },
        { id: 2, title: "Fairness Principles", description: "Apply fairness guidelines", weight: 0.5 },
      ],
      intermediate: [
        { id: 1, title: "Bias Measurement", description: "Calculate fairness metrics", weight: 0.3 },
        { id: 2, title: "Explainability Assessment", description: "Evaluate model interpretability", weight: 0.4 },
        { id: 3, title: "Privacy Protection", description: "Implement privacy-preserving techniques", weight: 0.3 },
      ],
      advanced: [
        { id: 1, title: "Adversarial Robustness", description: "Test model against adversarial attacks", weight: 0.25 },
        { id: 2, title: "Differential Privacy", description: "Implement advanced privacy techniques", weight: 0.25 },
        { id: 3, title: "Algorithmic Auditing", description: "Conduct comprehensive AI audits", weight: 0.25 },
        { id: 4, title: "Ethical Framework", description: "Develop organizational AI ethics policy", weight: 0.25 },
      ],
    },
  }

  return scenarioTemplates[type]?.[difficulty] || scenarioTemplates["Security Awareness"]["intermediate"]
}

async function simulateAdvancedCompletion(simulation: any, sessionId: string, userId: number) {
  const scenarios = generateSimulationScenarios(simulation.type, simulation.difficulty_level)
  const baseScore =
    simulation.difficulty_level === "advanced" ? 75 : simulation.difficulty_level === "intermediate" ? 80 : 85

  const performanceVariation = Math.random() * 20 - 10
  const finalScore = Math.max(0, Math.min(100, Math.round(baseScore + performanceVariation)))

  const answers = scenarios.map((scenario) => ({
    scenarioId: scenario.id,
    response: generateRealisticResponse(scenario, simulation.difficulty_level),
    timeSpent: Math.round(Math.random() * 300 + 60),
    correct: Math.random() > (simulation.difficulty_level === "advanced" ? 0.3 : 0.2),
  }))

  const totalTime = Math.round((simulation.duration_minutes || 60) * (0.8 + Math.random() * 0.4))

  const feedback = generatePersonalizedFeedback(finalScore, simulation.difficulty_level, answers)

  const results = {
    scenarios_completed: scenarios.length,
    correct_responses: answers.filter((a) => a.correct).length,
    average_response_time: Math.round(answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length),
    strengths: identifyStrengths(answers, scenarios),
    improvement_areas: identifyImprovementAreas(answers, scenarios),
    recommendations: generateRecommendations(simulation.type, finalScore),
  }

  return {
    score: finalScore,
    duration: totalTime,
    feedback,
    answers,
    results,
  }
}

function generateRealisticResponse(scenario: any, difficulty: string) {
  const responses = {
    "Basic Phishing Email": ["Reported to IT security", "Deleted immediately", "Clicked suspicious link"],
    "Password Security": ["Used strong password", "Enabled 2FA", "Reused old password"],
    "Spear Phishing Campaign": ["Verified sender identity", "Reported to security team", "Responded with information"],
    "Incident Classification": ["Classified as high severity", "Escalated to management", "Handled independently"],
  }

  const scenarioResponses = responses[scenario.title] || [
    "Appropriate response",
    "Partial response",
    "Incorrect response",
  ]
  return scenarioResponses[Math.floor(Math.random() * scenarioResponses.length)]
}

function generatePersonalizedFeedback(score: number, difficulty: string, answers: any[]) {
  if (score >= 90) {
    return `Excellent performance! You demonstrated strong understanding of ${difficulty}-level concepts. Your response accuracy was outstanding.`
  } else if (score >= 80) {
    return `Good performance overall. You showed solid grasp of key concepts with room for improvement in advanced scenarios.`
  } else if (score >= 70) {
    return `Satisfactory performance. Consider reviewing the areas where you struggled and practicing similar scenarios.`
  } else {
    return `This simulation highlighted several areas for improvement. We recommend additional training before attempting advanced scenarios.`
  }
}

function identifyStrengths(answers: any[], scenarios: any[]) {
  const correctAnswers = answers.filter((a) => a.correct)
  const strongAreas = correctAnswers.map((a) => {
    const scenario = scenarios.find((s) => s.id === a.scenarioId)
    return scenario?.title || "Unknown"
  })
  return strongAreas.slice(0, 3)
}

function identifyImprovementAreas(answers: any[], scenarios: any[]) {
  const incorrectAnswers = answers.filter((a) => !a.correct)
  const weakAreas = incorrectAnswers.map((a) => {
    const scenario = scenarios.find((s) => s.id === a.scenarioId)
    return scenario?.title || "Unknown"
  })
  return weakAreas.slice(0, 3)
}

function generateRecommendations(type: string, score: number) {
  const recommendations = {
    "Security Awareness": [
      "Complete advanced phishing detection training",
      "Practice with real-world security scenarios",
      "Review latest threat intelligence reports",
    ],
    "Incident Response": [
      "Study incident response frameworks (NIST, SANS)",
      "Practice tabletop exercises",
      "Review recent incident case studies",
    ],
    "AI Ethics & Safety": [
      "Study fairness metrics and bias detection techniques",
      "Practice with diverse datasets",
      "Review AI ethics guidelines and frameworks",
    ],
  }

  return recommendations[type] || recommendations["Security Awareness"]
}
