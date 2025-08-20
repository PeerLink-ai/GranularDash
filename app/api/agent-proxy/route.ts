import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { decryptSecret } from "@/lib/crypto"
import { addSDKLog } from "@/lib/sdk-log-store"
import { CryptoAuditChain } from "@/lib/crypto-audit-chain"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Agent proxy API called")

    const { agentId, prompt } = await request.json()

    if (!agentId || !prompt) {
      return NextResponse.json({ error: "Agent ID and prompt are required" }, { status: 400 })
    }

    // Get agent details from database
    const agents = await sql`
      SELECT agent_id, name, endpoint, api_key_encrypted, provider, model
      FROM connected_agents 
      WHERE agent_id = ${agentId}
    `

    if (agents.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agent = agents[0]
    console.log("[v0] Found agent:", agent.name)

    // Decrypt API key
    const apiKey = await decryptSecret(agent.api_key_encrypted)

    // Hidden system instruction to force structured JSON output
    const systemInstruction = `You must respond with valid JSON in exactly this format:
{
  "reasoning": "Brief explanation of your thinking process and approach to answering this question",
  "response": "Your actual response to the user's question"
}

The reasoning should be 1-2 sentences explaining your thought process. The response should be your complete answer to the user. Always return valid JSON with these exact field names.`

    // Prepare API request based on provider
    let apiResponse
    const startTime = Date.now()

    if (agent.provider === "OpenAI") {
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: agent.model || "gpt-4",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      })

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
      }

      apiResponse = await openaiResponse.json()
    } else {
      // Handle other providers with generic format
      const response = await fetch(agent.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      apiResponse = await response.json()
    }

    const responseTime = Date.now() - startTime

    // Extract the structured response
    let structuredResponse
    let reasoning = ""
    let finalResponse = ""

    try {
      const content = apiResponse.choices?.[0]?.message?.content || apiResponse.content || ""
      structuredResponse = JSON.parse(content)
      reasoning = structuredResponse.reasoning || "No reasoning provided"
      finalResponse = structuredResponse.response || content
    } catch (parseError) {
      console.log("[v0] Failed to parse structured JSON, using raw response")
      finalResponse = apiResponse.choices?.[0]?.message?.content || apiResponse.content || "No response"
      reasoning = "Unable to extract reasoning - response was not in expected JSON format"
    }

    // Calculate token usage
    const tokenUsage = {
      prompt: apiResponse.usage?.prompt_tokens || prompt.length / 4,
      completion: apiResponse.usage?.completion_tokens || finalResponse.length / 4,
      total: apiResponse.usage?.total_tokens || (prompt.length + finalResponse.length) / 4,
    }

    // Generate cryptographic proof
    const auditChain = new CryptoAuditChain()
    const cryptoProof = await auditChain.addEntry({
      agentId,
      action: "agent_proxy_call",
      prompt,
      response: finalResponse,
      reasoning, // Include reasoning in crypto proof
      tokenUsage,
      responseTime,
      timestamp: new Date().toISOString(),
    })

    // Log to SDK audit system with reasoning
    await addSDKLog({
      timestamp: BigInt(Date.now()),
      level: "info",
      type: "agent_proxy",
      agent_id: agentId,
      payload: {
        prompt,
        response: finalResponse,
        reasoning, // Include reasoning in audit log
        tokenUsage,
        responseTime,
        model: agent.model,
        provider: agent.provider,
        cryptographicProof: cryptoProof.hash,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      },
    })

    // Log to lineage mapping with reasoning
    const lineageId = `proxy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    await sql`
      INSERT INTO lineage_mapping (
        id, agent_id, prompt, response, token_usage, response_time, 
        evaluation_scores, tool_calls, db_queries, decisions
      ) VALUES (
        ${lineageId},
        ${agentId},
        ${prompt},
        ${finalResponse},
        ${JSON.stringify(tokenUsage)},
        ${responseTime},
        ${JSON.stringify({ reasoning_captured: true })}, -- Mark that reasoning was captured
        ${JSON.stringify([])},
        ${JSON.stringify([])},
        ${JSON.stringify([{ reasoning, timestamp: new Date().toISOString() }])} -- Store reasoning in decisions
      )
    `

    console.log("[v0] Successfully logged agent proxy interaction with reasoning")

    // Return only the response to frontend (reasoning stays hidden)
    return NextResponse.json({
      response: finalResponse,
      tokenUsage,
      responseTime,
      cryptographicProof: cryptoProof.hash,
    })
  } catch (error) {
    console.error("[v0] Agent proxy error:", error)

    // Log error to audit system
    try {
      await addSDKLog({
        timestamp: BigInt(Date.now()),
        level: "error",
        type: "agent_proxy_error",
        agent_id: "unknown",
        payload: {
          error: error instanceof Error ? error.message : "Unknown error",
          ip: request.headers.get("x-forwarded-for") || "unknown",
        },
      })
    } catch (logError) {
      console.error("[v0] Failed to log error:", logError)
    }

    return NextResponse.json(
      { error: "Agent proxy failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
