import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params
    const body = await request.text()
    const signature = request.headers.get("x-webhook-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 })
    }

    // Get agent and verify signature
    const [agent] = await sql`
      SELECT webhook_secret FROM connected_agents WHERE id = ${agentId}
    `

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const expectedSignature = crypto.createHmac("sha256", agent.webhook_secret).update(body).digest("hex")

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
    }

    const data = JSON.parse(body)

    // Process webhook data similar to API ingestion
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await sql`
      INSERT INTO agent_logs (
        id, agent_id, interaction_type, input_data, output_data, 
        metadata, timestamp, created_at
      ) VALUES (
        ${logId}, ${agentId}, ${data.interaction_type}, ${data.input}, ${data.output},
        ${JSON.stringify(data.metadata || {})}, ${data.timestamp || new Date().toISOString()}, NOW()
      )
    `

    return NextResponse.json({ success: true, log_id: logId })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
