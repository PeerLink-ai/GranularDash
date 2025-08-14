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

    // Predefined simulation templates
    const templates = [
      {
        id: "phishing-basic",
        name: "Basic Phishing Awareness",
        type: "Security Awareness",
        difficulty: "beginner",
        duration: 30,
        description: "Introduction to phishing detection with common attack patterns",
        scenarios: [
          { title: "Suspicious Email Links", weight: 0.4 },
          { title: "Fake Login Pages", weight: 0.3 },
          { title: "Urgent Action Requests", weight: 0.3 },
        ],
        passThreshold: 75,
        tags: ["phishing", "email", "beginner"],
      },
      {
        id: "incident-response-advanced",
        name: "Advanced Incident Response",
        type: "Incident Response",
        difficulty: "advanced",
        duration: 180,
        description: "Complex multi-stage incident response simulation",
        scenarios: [
          { title: "Initial Detection", weight: 0.2 },
          { title: "Threat Analysis", weight: 0.25 },
          { title: "Containment Strategy", weight: 0.25 },
          { title: "Recovery Planning", weight: 0.3 },
        ],
        passThreshold: 85,
        tags: ["incident", "response", "advanced", "forensics"],
      },
      {
        id: "ai-bias-intermediate",
        name: "AI Bias Detection Workshop",
        type: "AI Ethics & Safety",
        difficulty: "intermediate",
        duration: 90,
        description: "Hands-on training for identifying and mitigating AI bias",
        scenarios: [
          { title: "Dataset Analysis", weight: 0.3 },
          { title: "Fairness Metrics", weight: 0.3 },
          { title: "Mitigation Strategies", weight: 0.4 },
        ],
        passThreshold: 80,
        tags: ["ai", "bias", "fairness", "ethics"],
      },
      {
        id: "social-engineering-intermediate",
        name: "Social Engineering Defense",
        type: "Security Awareness",
        difficulty: "intermediate",
        duration: 45,
        description: "Advanced social engineering attack recognition and response",
        scenarios: [
          { title: "Phone-based Attacks", weight: 0.25 },
          { title: "Physical Security", weight: 0.25 },
          { title: "Pretexting Scenarios", weight: 0.25 },
          { title: "Authority Impersonation", weight: 0.25 },
        ],
        passThreshold: 80,
        tags: ["social", "engineering", "psychology", "manipulation"],
      },
      {
        id: "compliance-audit-basic",
        name: "Compliance Audit Preparation",
        type: "Compliance & Governance",
        difficulty: "beginner",
        duration: 60,
        description: "Prepare for regulatory compliance audits",
        scenarios: [
          { title: "Documentation Review", weight: 0.4 },
          { title: "Process Verification", weight: 0.3 },
          { title: "Gap Analysis", weight: 0.3 },
        ],
        passThreshold: 75,
        tags: ["compliance", "audit", "governance", "documentation"],
      },
      {
        id: "zero-trust-advanced",
        name: "Zero Trust Implementation",
        type: "Technical Skills",
        difficulty: "advanced",
        duration: 120,
        description: "Comprehensive zero trust architecture implementation",
        scenarios: [
          { title: "Identity Verification", weight: 0.25 },
          { title: "Network Segmentation", weight: 0.25 },
          { title: "Access Controls", weight: 0.25 },
          { title: "Monitoring & Analytics", weight: 0.25 },
        ],
        passThreshold: 85,
        tags: ["zero-trust", "architecture", "security", "implementation"],
      },
    ]

    return NextResponse.json({
      success: true,
      templates,
    })
  } catch (error) {
    console.error("Training templates error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch training templates",
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
    const { templateId, customizations = {} } = body

    // Create simulation from template
    const result = await sql`
      INSERT INTO training_simulations (
        organization_id,
        name,
        type,
        description,
        duration_minutes,
        pass_threshold,
        difficulty_level,
        configuration,
        status,
        created_at
      ) VALUES (
        ${user.organization},
        ${customizations.name || `Simulation from Template ${templateId}`},
        ${customizations.type || "Security Awareness"},
        ${customizations.description || "Generated from template"},
        ${customizations.duration || 60},
        ${customizations.passThreshold || 80},
        ${customizations.difficulty || "intermediate"},
        ${JSON.stringify({ templateId, customizations })},
        'scheduled',
        NOW()
      )
      RETURNING id, name, type, status, created_at
    `

    return NextResponse.json({
      success: true,
      simulation: result[0],
    })
  } catch (error) {
    console.error("Create from template error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create simulation from template",
      },
      { status: 500 },
    )
  }
}
