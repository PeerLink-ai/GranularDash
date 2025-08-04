import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyApiKey } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.substring(7)
    const agent = await verifyApiKey(apiKey)

    if (!agent) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { interaction_type, input, output, metadata = {}, timestamp = new Date().toISOString() } = body

    // Log the interaction
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await sql`
      INSERT INTO agent_logs (
        id, agent_id, interaction_type, input_data, output_data, 
        metadata, timestamp, created_at
      ) VALUES (
        ${logId}, ${agent.id}, ${interaction_type}, ${input}, ${output},
        ${JSON.stringify(metadata)}, ${timestamp}, NOW()
      )
    `

    // Check for policy violations
    const violations = await checkPolicyViolations(agent.id, input, output, metadata)

    if (violations.length > 0) {
      for (const violation of violations) {
        await sql`
          INSERT INTO policy_violations (
            id, agent_id, log_id, violation_type, severity, description, 
            detected_at, created_at
          ) VALUES (
            ${`violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`},
            ${agent.id}, ${logId}, ${violation.type}, ${violation.severity},
            ${violation.description}, NOW(), NOW()
          )
        `
      }
    }

    // Update agent metrics
    await updateAgentMetrics(agent.id, metadata)

    return NextResponse.json({
      success: true,
      log_id: logId,
      violations: violations.length,
    })
  } catch (error) {
    console.error("Error ingesting monitoring data:", error)
    return NextResponse.json({ error: "Failed to ingest monitoring data" }, { status: 500 })
  }
}

async function checkPolicyViolations(agentId: string, input: string, output: string, metadata: any) {
  const violations = []

  // Check for sensitive data exposure
  const sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{16}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}-\d{3}-\d{4}\b/, // Phone
  ]

  for (const pattern of sensitivePatterns) {
    if (pattern.test(input) || pattern.test(output)) {
      violations.push({
        type: "sensitive_data_exposure",
        severity: "high",
        description: "Potential sensitive data detected in agent interaction",
      })
      break
    }
  }

  // Check response time
  if (metadata.response_time_ms && metadata.response_time_ms > 10000) {
    violations.push({
      type: "performance_violation",
      severity: "medium",
      description: `Response time exceeded threshold: ${metadata.response_time_ms}ms`,
    })
  }

  // Check token usage
  if (metadata.tokens_used && metadata.tokens_used > 4000) {
    violations.push({
      type: "resource_violation",
      severity: "low",
      description: `High token usage detected: ${metadata.tokens_used} tokens`,
    })
  }

  return violations
}

async function updateAgentMetrics(agentId: string, metadata: any) {
  const today = new Date().toISOString().split("T")[0]

  await sql`
    INSERT INTO agent_metrics (
      agent_id, date, total_interactions, total_tokens, avg_response_time,
      created_at, updated_at
    ) VALUES (
      ${agentId}, ${today}, 1, ${metadata.tokens_used || 0}, ${metadata.response_time_ms || 0},
      NOW(), NOW()
    )
    ON CONFLICT (agent_id, date) 
    DO UPDATE SET
      total_interactions = agent_metrics.total_interactions + 1,
      total_tokens = agent_metrics.total_tokens + ${metadata.tokens_used || 0},
      avg_response_time = (agent_metrics.avg_response_time + ${metadata.response_time_ms || 0}) / 2,
      updated_at = NOW()
  `
}
