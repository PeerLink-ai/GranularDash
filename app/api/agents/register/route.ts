import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { randomBytes } from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type, environment, framework, language } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    // Generate unique identifiers
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const apiKey = `ak_${randomBytes(32).toString("hex")}`
    const webhookSecret = `ws_${randomBytes(24).toString("hex")}`

    // Create the agent record
    const [newAgent] = await sql`
      INSERT INTO connected_agents (
        id,
        agent_id,
        name,
        provider,
        model,
        status,
        endpoint,
        connected_at,
        last_active,
        usage_requests,
        usage_tokens_used,
        usage_estimated_cost,
        api_key_encrypted,
        configuration,
        health_status,
        last_health_check,
        metadata
      ) VALUES (
        ${randomBytes(16).toString("hex")},
        ${agentId},
        ${name},
        'custom',
        ${type},
        'active',
        'custom',
        NOW(),
        NULL,
        0,
        0,
        0.0,
        ${apiKey},
        ${JSON.stringify({
          description,
          environment,
          framework,
          language,
          webhook_secret: webhookSecret,
        })},
        'healthy',
        NOW(),
        ${JSON.stringify({
          type,
          environment,
          framework,
          language,
          created_via: "dashboard",
        })}
      )
      RETURNING *
    `

    // Create webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/${agentId}`

    return NextResponse.json({
      success: true,
      agent: {
        id: newAgent.id,
        agent_id: agentId,
        name,
        type,
        environment,
        status: "active",
      },
      credentials: {
        apiKey,
        webhookUrl,
        webhookSecret,
      },
      integrationExamples: {
        python: `
import requests

# Log an interaction
response = requests.post(
    '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/monitoring/ingest',
    headers={'Authorization': 'Bearer ${apiKey}'},
    json={
        'agent_id': '${agentId}',
        'interaction_type': 'completion',
        'input': 'User query here',
        'output': 'Agent response here',
        'metadata': {
            'tokens_used': 150,
            'response_time_ms': 1200,
            'model': 'gpt-4'
        }
    }
)
        `,
        javascript: `
// Log an interaction
fetch('${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/monitoring/ingest', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ${apiKey}',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        agent_id: '${agentId}',
        interaction_type: 'completion',
        input: 'User query here',
        output: 'Agent response here',
        metadata: {
            tokens_used: 150,
            response_time_ms: 1200,
            model: 'gpt-4'
        }
    })
})
        `,
        webhook: `
# Configure your agent to send events to:
# URL: ${webhookUrl}
# Secret: ${webhookSecret}
        `,
      },
    })
  } catch (error) {
    console.error("Error registering agent:", error)
    return NextResponse.json({ error: "Failed to register agent" }, { status: 500 })
  }
}
