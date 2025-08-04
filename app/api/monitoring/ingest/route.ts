import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.substring(7)

    // Verify API key and get agent
    const [agent] = await sql`
      SELECT * FROM connected_agents 
      WHERE api_key_encrypted = ${apiKey}
      AND status != 'inactive'
    `

    if (!agent) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { event_type, data, timestamp } = body

    if (!event_type || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Store the log entry
    await sql`
      INSERT INTO agent_logs (
        id,
        agent_id,
        user_id,
        log_level,
        message,
        details,
        timestamp
      ) VALUES (
        ${crypto.randomUUID()},
        ${agent.agent_id},
        ${agent.user_id},
        'info',
        ${`${event_type}: ${data.prompt ? data.prompt.substring(0, 100) : "Event logged"}`},
        ${JSON.stringify({
          event_type,
          data,
          timestamp: timestamp || new Date().toISOString(),
          source: "api_ingest",
        })},
        ${timestamp ? new Date(timestamp) : new Date()}
      )
    `

    // Update agent metrics
    await sql`
      INSERT INTO agent_metrics (
        id,
        agent_id,
        user_id,
        metric_type,
        value,
        timestamp,
        metadata
      ) VALUES (
        ${crypto.randomUUID()},
        ${agent.agent_id},
        ${agent.user_id},
        'request',
        1,
        NOW(),
        ${JSON.stringify({ event_type, source: "api_ingest" })}
      )
    `

    // Update agent last_active and request count
    await sql`
      UPDATE connected_agents 
      SET 
        last_active = NOW(),
        usage_requests = usage_requests + 1,
        health_status = 'healthy',
        last_health_check = NOW()
      WHERE agent_id = ${agent.agent_id}
    `

    // Check for policy violations
    await checkPolicyViolations(agent, event_type, data)

    return NextResponse.json({
      success: true,
      message: "Event logged successfully",
      agent_id: agent.agent_id,
    })
  } catch (error) {
    console.error("Monitoring ingest error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function checkPolicyViolations(agent: any, eventType: string, data: any) {
  try {
    // Example policy checks
    const violations = []

    // Check for sensitive data in prompts
    if (data.prompt && containsSensitiveData(data.prompt)) {
      violations.push({
        policy: "Sensitive Data Protection",
        severity: "high",
        description: "Potential sensitive data detected in prompt",
      })
    }

    // Check response time policy
    if (data.metadata?.response_time_ms > 10000) {
      violations.push({
        policy: "Response Time SLA",
        severity: "medium",
        description: `Response time ${data.metadata.response_time_ms}ms exceeds 10s limit`,
      })
    }

    // Check token usage policy
    if (data.metadata?.tokens_used > 4000) {
      violations.push({
        policy: "Token Usage Limit",
        severity: "medium",
        description: `Token usage ${data.metadata.tokens_used} exceeds recommended limit`,
      })
    }

    // Store violations
    for (const violation of violations) {
      await sql`
        INSERT INTO policy_violations (
          id,
          user_id,
          organization,
          agent_id,
          policy_name,
          severity,
          description,
          status,
          detected_at
        ) VALUES (
          ${crypto.randomUUID()},
          ${agent.user_id},
          'default',
          ${agent.agent_id},
          ${violation.policy},
          ${violation.severity},
          ${violation.description},
          'open',
          NOW()
        )
      `
    }
  } catch (error) {
    console.error("Policy violation check failed:", error)
  }
}

function containsSensitiveData(text: string): boolean {
  const sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, // Phone number
  ]

  return sensitivePatterns.some((pattern) => pattern.test(text))
}
