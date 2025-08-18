import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { AIGovernanceSDK } from "@/lib/sdk/ai-governance-sdk"
import { CryptoAuditChain } from "@/lib/crypto-audit-chain"
import { AIResponseEvaluator } from "@/lib/ai-response-evaluator"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { agentId, prompt } = await request.json()

    if (!agentId || !prompt) {
      return NextResponse.json({ error: "Agent ID and prompt are required" }, { status: 400 })
    }

    // Get agent details
    const agents = await sql`
      SELECT id, name, type, endpoint, api_key_encrypted, status
      FROM connected_agents 
      WHERE id = ${agentId}
    `

    if (agents.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agent = agents[0]
    const startTime = Date.now()

    // Initialize SDK and crypto chain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_APP_URL
      : `https://${process.env.NEXT_PUBLIC_APP_URL || "localhost:3000"}`

    const sdk = new AIGovernanceSDK(agentId, baseUrl)
    const cryptoChain = new CryptoAuditChain()
    const evaluator = new AIResponseEvaluator()

    // Log the prompt decision
    await sdk.logDecision({
      decision: "prompt_received",
      confidence: 1.0,
      reasoning: `Processing prompt: ${prompt.substring(0, 50)}...`,
      context: { promptLength: prompt.length, agentType: agent.type },
    })

    // Simulate agent response (in real implementation, call actual agent API)
    const mockResponse = `This is a simulated response from ${agent.name} (${agent.type}) to the prompt: "${prompt}". In a real implementation, this would call the actual agent endpoint at ${agent.endpoint}.`

    const responseTime = Date.now() - startTime
    const tokenUsage = {
      prompt: Math.floor(prompt.length / 4), // Rough token estimation
      completion: Math.floor(mockResponse.length / 4),
      total: Math.floor((prompt.length + mockResponse.length) / 4),
    }

    // Log the communication
    await sdk.recordCommunication({
      direction: "outbound",
      endpoint: agent.endpoint,
      payload: { prompt },
      response: { text: mockResponse },
      tokenUsage,
      dataClassification: "internal",
    })

    // Evaluate response quality
    const evaluation = await evaluator.evaluateResponse(prompt, mockResponse)

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

    // Generate cryptographic proof
    const interactionData = {
      agentId,
      prompt,
      response: mockResponse,
      timestamp: new Date().toISOString(),
      tokenUsage,
      evaluation,
    }

    const cryptographicProof = await cryptoChain.addBlock(interactionData, agentId)

    // Log to ledger
    await sdk.appendToLedger({
      action: "playground_test_complete",
      agentId,
      metadata: {
        lineageId,
        responseTime,
        tokenUsage,
        evaluation: evaluation.overall,
        cryptographicProof: cryptographicProof.blockHash,
      },
    })

    return NextResponse.json({
      response: mockResponse,
      responseTime,
      tokenUsage,
      lineageId,
      evaluation,
      cryptographicProof: {
        blockHash: cryptographicProof.blockHash,
        signature: cryptographicProof.signature,
        chainValid: cryptographicProof.chainValid,
      },
    })
  } catch (error) {
    console.error("Playground test error:", error)
    return NextResponse.json({ error: "Failed to test agent" }, { status: 500 })
  }
}
