import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type, environment, framework, language, organization } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate unique identifiers
    const agentId = `agent_${randomBytes(16).toString("hex")}`
    const apiKey = `ak_${randomBytes(32).toString("hex")}`
    const webhookSecret = `ws_${randomBytes(24).toString("hex")}`

    // Create the agent record
    const [newAgent] = await sql`
      INSERT INTO connected_agents (
        id,
        user_id,
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
        ${user.id},
        ${agentId},
        ${name},
        'custom',
        ${type},
        'pending',
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
        'unknown',
        NULL,
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

    // Log the activity
    await logActivity({
      userId: user.id,
      organization: user.organization,
      action: `Registered new agent: ${name}`,
      resourceType: "agent",
      resourceId: agentId,
      description: `Successfully registered ${type} agent for ${environment} environment`,
      status: "success",
    })

    // Return agent details with credentials
    return NextResponse.json({
      id: newAgent.id,
      agent_id: agentId,
      name,
      type,
      status: "pending",
      api_key: apiKey,
      webhook_secret: webhookSecret,
      environment,
      framework,
      language,
      created_at: newAgent.connected_at,
    })
  } catch (error) {
    console.error("Failed to register agent:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
