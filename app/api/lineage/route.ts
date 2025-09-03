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

    const nodes = []
    const edges = []

    sdkLogs.forEach((log, index) => {
      // Create prompt node
      nodes.push({
        id: `prompt-${log.id}`,
        type: "prompt",
        data: {
          label: "Prompt",
          agentId: log.agent_id,
          prompt: log.prompt,
          timestamp: log.created_at,
          model: log.model,
        },
        position: { x: index * 300, y: 100 },
      })

      // Create response node
      nodes.push({
        id: `response-${log.id}`,
        type: "response",
        data: {
          label: "Response",
          agentId: log.agent_id,
          response: log.response,
          tokensUsed: log.tokens_used,
          responseTime: log.response_time_ms,
          metadata: log.metadata,
        },
        position: { x: index * 300, y: 300 },
      })

      // Create edge connecting prompt to response
      edges.push({
        id: `edge-${log.id}`,
        source: `prompt-${log.id}`,
        target: `response-${log.id}`,
        type: "smoothstep",
      })
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
