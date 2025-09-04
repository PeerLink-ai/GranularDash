import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const sdkLogs = await sql`
      SELECT 
        id,
        agent_id,
        prompt,
        response,
        model,
        tokens_used,
        response_time_ms,
        created_at,
        metadata
      FROM sdk_logs 
      ORDER BY created_at DESC 
      LIMIT 50
    `

    console.log("[v0] Raw SDK logs fetched:", sdkLogs.length)

    const nodes = []
    const edges = []

    sdkLogs.forEach((log, index) => {
      // Create agent action node for each log entry
      const actionId = `sdk_action_${log.id}`
      nodes.push({
        id: actionId,
        name: `Agent ${log.agent_id} - Action ${index + 1}`,
        type: "agent_action",
        path: ["sdk_logs", "actions", log.agent_id || "unknown"],
        metadata: {
          agentId: log.agent_id,
          prompt: log.prompt,
          response: log.response,
          model: log.model,
          tokenUsage: log.tokens_used,
          responseTime: log.response_time_ms,
          timestamp: log.created_at,
          rawMetadata: log.metadata,
          actionType: "sdk_interaction",
          interactionType: "sdk_call",
        },
        nextNodes: [],
      })

      // Create response node if response exists
      if (log.response) {
        const responseId = `sdk_response_${log.id}`
        nodes.push({
          id: responseId,
          name: `Response ${index + 1}`,
          type: "agent_response",
          path: ["sdk_logs", "responses", log.agent_id || "unknown"],
          metadata: {
            agentId: log.agent_id,
            response: log.response,
            tokenUsage: log.tokens_used,
            responseTime: log.response_time_ms,
            timestamp: log.created_at,
            parentActionId: actionId,
            model: log.model,
          },
          nextNodes: [],
        })

        // Create edge from action to response
        edges.push({
          source: actionId,
          target: responseId,
        })
      }
    })

    console.log("[v0] SDK logs processed:", {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      logCount: sdkLogs.length,
    })

    return NextResponse.json({
      nodes,
      edges,
      lineageMapping: sdkLogs,
    })
  } catch (e: any) {
    console.error("[v0] Lineage API error:", e)
    return NextResponse.json({ nodes: [], edges: [], lineageMapping: [] })
  }
}
