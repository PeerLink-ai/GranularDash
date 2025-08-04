import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { generateApiKey, generateWebhookSecret } from "@/lib/crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type, environment } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    // Generate unique identifiers
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const apiKey = generateApiKey()
    const webhookSecret = generateWebhookSecret()

    // Create the agent record
    await sql`
      INSERT INTO connected_agents (
        id,
        name,
        description,
        type,
        environment,
        status,
        api_key,
        webhook_secret,
        created_at,
        updated_at
      ) VALUES (
        ${agentId},
        ${name},
        ${description},
        ${type},
        ${environment},
        'active',
        ${apiKey},
        ${webhookSecret},
        NOW(),
        NOW()
      )
    `

    // Create webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/${agentId}`

    return NextResponse.json({
      success: true,
      agent: {
        id: agentId,
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
    })
  } catch (error) {
    console.error("Error registering agent:", error)
    return NextResponse.json({ error: "Failed to register agent" }, { status: 500 })
  }
}
</merged_code>
