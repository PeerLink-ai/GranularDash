import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { createHmac } from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params

    // Get agent and webhook secret
    const [agent] = await sql`
      SELECT * FROM connected_agents WHERE agent_id = ${agentId}
    `

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const configuration = JSON.parse(agent.configuration || "{}")
    const webhookSecret = configuration.webhook_secret

    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 400 })
    }

    // Verify webhook signature
    const signature = request.headers.get("x-webhook-signature")
    const body = await request.text()

    if (signature) {
      const expectedSignature = createHmac("sha256", webhookSecret).update(body).digest("hex")

      if (signature !== `sha256=${expectedSignature}`) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const data = JSON.parse(body)
    const { event_type, interaction_type, input, output, metadata = {}, timestamp = new Date().toISOString() } = data

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
        ${agentId},
        ${interaction_type || event_type},
        ${input},
        ${output},
        ${JSON.stringify(metadata)},
        ${timestamp},
        NOW()
      )
    `

    // Update agent last_active
    await sql`
      UPDATE connected_agents 
      SET last_active = NOW(),
          usage_requests = usage_requests + 1
      WHERE agent_id = ${agentId}
    `

    return NextResponse.json({
      success: true,
      log_id: logId,
    })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
