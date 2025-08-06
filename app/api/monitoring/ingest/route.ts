import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.substring(7)

    // Verify API key and get agent
    const [agent] = await sql`
      SELECT * FROM connected_agents WHERE api_key_encrypted = ${apiKey}
    `

    if (!agent) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { interaction_type, input, output, metadata = {}, timestamp = new Date().toISOString() } = body

    // Store the interaction log
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await sql`
      INSERT INTO agent_logs (
        id,
        agent_id,
        interaction_type,
        input_data,
        output_data,
        metadata,
        timestamp,
        created_at
      ) VALUES (
        ${logId},
        ${agent.agent_id},
        ${interaction_type},
        ${input},
        ${output},
        ${JSON.stringify(metadata)},
        ${timestamp},
        NOW()
      )
    `

    // Check for policy violations
    const violations = await checkPolicyViolations(input, output, metadata)

    // Store violations if any
    for (const violation of violations) {
      await sql`
        INSERT INTO policy_violations (
          id,
          agent_id,
          log_id,
          violation_type,
          severity,
          description,
          detected_at,
          status
        ) VALUES (
          ${`violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`},
          ${agent.agent_id},
          ${logId},
          ${violation.type},
          ${violation.severity},
          ${violation.description},
          NOW(),
          'open'
        )
      `
    }

    // Update agent last_active
    await sql`
      UPDATE connected_agents 
      SET last_active = NOW(),
          usage_requests = usage_requests + 1,
          usage_tokens_used = usage_tokens_used + ${metadata.tokens_used || 0}
      WHERE agent_id = ${agent.agent_id}
    `

    return NextResponse.json({
      success: true,
      log_id: logId,
      violations_detected: violations.length,
      violations: violations,
    })
  } catch (error) {
    console.error("Error ingesting monitoring data:", error)
    return NextResponse.json({ error: "Failed to ingest data" }, { status: 500 })
  }
}

async function checkPolicyViolations(input: string, output: string, metadata: any) {
  const violations = []

  // Check for sensitive data in output
  const sensitivePatterns = [
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: "ssn", description: "Social Security Number detected" },
    {
      pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      type: "credit_card",
      description: "Credit card number detected",
    },
    {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      type: "email",
      description: "Email address detected",
    },
    { pattern: /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g, type: "phone", description: "Phone number detected" },
  ]

  for (const { pattern, type, description } of sensitivePatterns) {
    if (pattern.test(output)) {
      violations.push({
        type: "sensitive_data",
        severity: "high",
        description: `${description} in agent output`,
      })
    }
  }

  // Check response time
  if (metadata.response_time_ms && metadata.response_time_ms > 10000) {
    violations.push({
      type: "performance",
      severity: "medium",
      description: `Slow response time: ${metadata.response_time_ms}ms`,
    })
  }

  // Check token usage
  if (metadata.tokens_used && metadata.tokens_used > 4000) {
    violations.push({
      type: "resource_usage",
      severity: "medium",
      description: `High token usage: ${metadata.tokens_used} tokens`,
    })
  }

  return violations
}
