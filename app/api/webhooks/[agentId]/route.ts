import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createHmac } from "crypto"

export async function POST(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params

    // Get agent and webhook secret
    const [agent] = await sql`
      SELECT * FROM connected_agents 
      WHERE agent_id = ${agentId}
      AND status != 'inactive'
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
    const { event_type, timestamp, data: eventData } = data

    if (!event_type || !eventData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Store the webhook event
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
        ${agentId},
        ${agent.user_id},
        'info',
        ${`Webhook ${event_type}: ${eventData.prompt ? eventData.prompt.substring(0, 100) : "Event received"}`},
        ${JSON.stringify({
          event_type,
          data: eventData,
          timestamp: timestamp || new Date().toISOString(),
          source: "webhook",
        })},
        ${timestamp ? new Date(timestamp) : new Date()}
      )
    `

    // Update metrics
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
        ${agentId},
        ${agent.user_id},
        'request',
        1,
        NOW(),
        ${JSON.stringify({ event_type, source: "webhook" })}
      )
    `

    // Update agent status
    await sql`
      UPDATE connected_agents 
      SET 
        last_active = NOW(),
        usage_requests = usage_requests + 1,
        health_status = 'healthy',
        last_health_check = NOW()
      WHERE agent_id = ${agentId}
    `

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
