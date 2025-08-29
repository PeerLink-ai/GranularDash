import { NextResponse } from "next/server"
import { buildDataLineage } from "@/lib/data-lineage-builder"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Starting lineage API call")

    const [lineage, lineageMapping] = await Promise.all([
      buildDataLineage(),
      sql`
        SELECT 
          id,
          agent_id,
          user_id,
          session_id,
          interaction_type,
          prompt,
          response,
          response_time,
          token_usage,
          tool_calls,
          decisions,
          evaluation_scores,
          db_queries,
          parent_interaction_id,
          created_at,
          updated_at
        FROM lineage_mapping 
        ORDER BY created_at DESC 
        LIMIT 100
      `,
    ])

    console.log("[v0] Lineage built successfully:", {
      nodeCount: lineage.nodes.length,
      edgeCount: lineage.edges.length,
      nodeTypes: lineage.nodes.map((n) => n.type),
      lineageMappingCount: lineageMapping.length,
    })

    return NextResponse.json({
      ...lineage,
      lineageMapping,
    })
  } catch (e: any) {
    console.error("[v0] Lineage API error:", e)
    return NextResponse.json({ nodes: [], edges: [], lineageMapping: [] })
  }
}
