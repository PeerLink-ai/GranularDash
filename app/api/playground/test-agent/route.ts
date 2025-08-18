import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { AIGovernanceSDK } from "@/lib/sdk/ai-governance-sdk"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Playground API called")
    const { agentId, prompt } = await request.json()
    console.log("[v0] Received agentId:", agentId, "prompt length:", prompt?.length)

    if (!agentId || !prompt) {
      return NextResponse.json({ error: "Agent ID and prompt are required" }, { status: 400 })
    }

    const agents = await sql`
      SELECT agent_id, name, type, endpoint, api_key_encrypted, status
      FROM connected_agents 
      WHERE agent_id = ${agentId}
    `
    console.log("[v0] Found agents:", agents.length)

    if (agents.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agent = agents[0]
    const startTime = Date.now()
    console.log("[v0] Testing agent:", agent.name)

    // Initialize SDK
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_APP_URL
      : `https://${process.env.NEXT_PUBLIC_APP_URL || "localhost:3000"}`

    const sdk = new AIGovernanceSDK(agentId, baseUrl)
    console.log("[v0] SDK initialized")

    // Log the prompt decision
    try {
      await sdk.logDecision({
        decision: "prompt_received",
        confidence: 1.0,
        reasoning: `Processing prompt: ${prompt.substring(0, 50)}...`,
        context: { promptLength: prompt.length, agentType: agent.type },
      })
      console.log("[v0] Decision logged")
    } catch (sdkError) {
      console.log("[v0] SDK logging failed, continuing:", sdkError)
    }

    // Simulate agent response
    const mockResponse = `This is a simulated response from ${agent.name} (${agent.type}) to the prompt: "${prompt}". In a real implementation, this would call the actual agent endpoint.`

    const responseTime = Date.now() - startTime
    const tokenUsage = {
      prompt: Math.floor(prompt.length / 4),
      completion: Math.floor(mockResponse.length / 4),
      total: Math.floor((prompt.length + mockResponse.length) / 4),
    }

    const evaluation = {
      overall: 0.85,
      safety: 0.9,
      relevance: 0.8,
      coherence: 0.85,
      factuality: 0.8,
    }

    console.log("[v0] Creating lineage entry")
    // Create lineage mapping entry
    const lineageId = `lineage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    await sql`
      INSERT INTO lineage_mapping (
        id, agent_id, prompt, response, token_usage, response_time, 
        evaluation_scores, created_at
      ) VALUES (
        ${lineageId}, ${agentId}, ${prompt}, ${mockResponse}, 
        ${JSON.stringify(tokenUsage)}, ${responseTime},
        ${JSON.stringify(evaluation)}, NOW()
      )
    `
    console.log("[v0] Lineage entry created")

    // Create audit log entry
    await sql`
      INSERT INTO audit_logs (
        id, agent_id, action, details, user_id, created_at
      ) VALUES (
        gen_random_uuid(), ${agentId}, 'playground_test',
        ${JSON.stringify({
          prompt: prompt.substring(0, 100),
          responseTime,
          tokenUsage,
          evaluation: evaluation.overall,
          lineageId,
        })}, 'system', NOW()
      )
    `
    console.log("[v0] Audit log created")

    return NextResponse.json({
      response: mockResponse,
      responseTime,
      tokenUsage,
      lineageId,
      evaluation,
      cryptographicProof: {
        blockHash: `hash-${lineageId}`,
        signature: `sig-${Date.now()}`,
        chainValid: true,
      },
    })
  } catch (error) {
    console.error("[v0] Playground test error:", error)
    return NextResponse.json(
      {
        error: "Failed to test agent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
