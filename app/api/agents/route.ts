import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const agents = await sql`
      SELECT * FROM connected_agents 
      WHERE user_id = ${user.id}
      ORDER BY connected_at DESC
    `

    return NextResponse.json({ agents })
  } catch (error) {
    console.error("Failed to fetch agents:", error)
    return NextResponse.json({ agents: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, provider, model, endpoint, apiKey, configuration = {} } = body

    if (!name || !provider || !model || !endpoint) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const agentId = `${provider.toLowerCase()}-${model.toLowerCase()}-${Date.now()}`

    // In a real implementation, encrypt the API key
    const encryptedApiKey = apiKey ? btoa(apiKey) : null

    const [newAgent] = await sql`
      INSERT INTO connected_agents (
        user_id, agent_id, name, provider, model, status, endpoint, 
        connected_at, usage_requests, usage_tokens_used, usage_estimated_cost,
        api_key_encrypted, configuration, health_status
      ) VALUES (
        ${user.id}, ${agentId}, ${name}, ${provider}, ${model}, 'active', ${endpoint},
        NOW(), 0, 0, 0, ${encryptedApiKey}, ${JSON.stringify(configuration)}, 'unknown'
      )
      RETURNING *
    `

    // Log the activity
    await logActivity({
      userId: user.id,
      organization: user.organization,
      action: `Connected ${name} agent`,
      resourceType: "agent",
      resourceId: agentId,
      description: `Successfully connected ${provider} ${model} agent`,
      status: "success",
    })

    return NextResponse.json({ agent: newAgent })
  } catch (error) {
    console.error("Failed to create agent:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
