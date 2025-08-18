import { type NextRequest, NextResponse } from "next/server"
import { CryptoAuditChain } from "@/lib/crypto-audit-chain"
import { AIResponseEvaluator } from "@/lib/ai-response-evaluator"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { testPrompt, expectedContext } = await request.json()
    const agentId = params.id

    // Get agent details from database
    const agent = await sql`
      SELECT * FROM connected_agents 
      WHERE id = ${agentId}
    `

    if (agent.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agentData = agent[0]
    const auditChain = CryptoAuditChain.getInstance()

    // Log test initiation
    auditChain.addInteractionBlock(agentId, "test", {
      action: "governance_test_initiated",
      prompt: testPrompt,
      timestamp: Date.now(),
      agentEndpoint: agentData.endpoint,
    })

    // Perform actual API call to the agent
    const startTime = Date.now()
    let response: string
    let tokenUsage = { prompt: 0, completion: 0, total: 0 }

    try {
      if (agentData.type === "openai") {
        // Make actual OpenAI API call
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${agentData.api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: agentData.model || "gpt-3.5-turbo",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 500,
            temperature: 0.7,
          }),
        })

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`)
        }

        const openaiData = await openaiResponse.json()
        response = openaiData.choices[0].message.content
        tokenUsage = {
          prompt: openaiData.usage.prompt_tokens,
          completion: openaiData.usage.completion_tokens,
          total: openaiData.usage.total_tokens,
        }
      } else {
        // For other agent types, make generic API call
        const agentResponse = await fetch(agentData.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(agentData.api_key && { Authorization: `Bearer ${agentData.api_key}` }),
          },
          body: JSON.stringify({
            prompt: testPrompt,
            max_tokens: 500,
          }),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })

        if (!agentResponse.ok) {
          throw new Error(`Agent API error: ${agentResponse.status}`)
        }

        const responseData = await agentResponse.json()
        response = responseData.response || responseData.text || responseData.content || "No response content"
      }
    } catch (error) {
      response = `Error: ${error.message}`
    }

    const responseTime = Date.now() - startTime

    // Evaluate response quality
    const evaluation = AIResponseEvaluator.evaluateResponse(testPrompt, response, expectedContext)

    // Create comprehensive interaction log
    const interactionLog = {
      id: `test_${Date.now()}`,
      agentId,
      prompt: testPrompt,
      response,
      responseTime,
      tokenUsage,
      quality: {
        relevance: evaluation.relevance,
        accuracy: evaluation.accuracy,
        safety: evaluation.safety,
        overall: evaluation.overall,
      },
      metadata: {
        model: agentData.model || "unknown",
        temperature: 0.7,
        maxTokens: 500,
        provider: agentData.type,
      },
      evaluation: {
        flags: evaluation.flags,
        reasoning: evaluation.reasoning,
        coherence: evaluation.coherence,
      },
    }

    // Add to cryptographic audit chain
    const auditBlock = auditChain.addInteractionBlock(agentId, "response", interactionLog)

    // Store in database for persistence
    await sql`
      INSERT INTO agent_governance_logs (
        agent_id, interaction_type, prompt, response, response_time_ms,
        token_usage, quality_scores, evaluation_flags, audit_block_hash,
        created_at
      ) VALUES (
        ${agentId}, 'governance_test', ${testPrompt}, ${response}, ${responseTime},
        ${JSON.stringify(tokenUsage)}, ${JSON.stringify(evaluation)}, 
        ${JSON.stringify(evaluation.flags)}, ${auditBlock.hash}, NOW()
      )
    `

    // Validate chain integrity
    const chainValid = auditChain.validateChain()

    return NextResponse.json({
      success: true,
      testResults: {
        response,
        responseTime,
        tokenUsage,
        evaluation,
        interactionLog,
      },
      cryptographicProof: {
        blockHash: auditBlock.hash,
        blockId: auditBlock.id,
        signature: auditBlock.signature,
        chainValid,
        timestamp: auditBlock.timestamp,
      },
      auditTrail: {
        totalBlocks: auditChain.getChain().length,
        agentBlocks: auditChain.getBlocksByAgent(agentId).length,
        chainIntegrity: chainValid ? "VERIFIED" : "COMPROMISED",
      },
    })
  } catch (error) {
    console.error("[v0] Governance test error:", error)
    return NextResponse.json(
      {
        error: "Governance test failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id
    const auditChain = CryptoAuditChain.getInstance()

    // Get agent's audit history
    const agentBlocks = auditChain.getBlocksByAgent(agentId)

    // Get database logs
    const dbLogs = await sql`
      SELECT * FROM agent_governance_logs 
      WHERE agent_id = ${agentId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      auditHistory: agentBlocks,
      databaseLogs: dbLogs,
      chainIntegrity: auditChain.validateChain(),
      totalInteractions: agentBlocks.length,
      cryptographicProof: auditChain.exportChainProof(),
    })
  } catch (error) {
    console.error("[v0] Audit history error:", error)
    return NextResponse.json(
      {
        error: "Failed to retrieve audit history",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
