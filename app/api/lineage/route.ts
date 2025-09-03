import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const sdkLogs = await sql`
      SELECT 
        id,
        agent_id,
        type,
        level,
        payload,
        created_at,
        organization
      FROM sdk_logs 
      WHERE type IN ('prompt', 'response', 'completion')
      ORDER BY created_at DESC 
      LIMIT 50
    `

    console.log("[v0] Raw SDK logs fetched:", sdkLogs.length)

    const nodes = []
    const edges = []

    sdkLogs.forEach((log, index) => {
      const payload = log.payload || {}

      if (log.type === "prompt" || payload.prompt) {
        nodes.push({
          id: `prompt-${log.id}`,
          type: "prompt",
          data: {
            label: "Prompt",
            agentId: log.agent_id,
            prompt: payload.prompt || payload.message || "No prompt data",
            timestamp: log.created_at,
            model: payload.model || "Unknown",
          },
          position: { x: index * 300, y: 100 },
        })
      }

      if (log.type === "response" || log.type === "completion" || payload.response) {
        nodes.push({
          id: `response-${log.id}`,
          type: "response",
          data: {
            label: "Response",
            agentId: log.agent_id,
            response: payload.response || payload.content || payload.message || "No response data",
            tokensUsed: payload.tokens_used || payload.usage?.total_tokens || 0,
            responseTime: payload.response_time_ms || payload.duration || 0,
            metadata: payload,
          },
          position: { x: index * 300, y: 300 },
        })

        if (nodes.find((n) => n.id === `prompt-${log.id}`)) {
          edges.push({
            id: `edge-${log.id}`,
            source: `prompt-${log.id}`,
            target: `response-${log.id}`,
            type: "smoothstep",
          })
        }
      }
    })

    console.log("[v0] SDK logs processed:", {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      logCount: sdkLogs.length,
      samplePayload: sdkLogs[0]?.payload,
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
