import { NextResponse } from "next/server"
import { buildDataLineage } from "@/lib/data-lineage-builder"

export async function GET() {
  try {
    console.log("[v0] Starting lineage API call")
    const lineage = await buildDataLineage()
    console.log("[v0] Lineage built successfully:", {
      nodeCount: lineage.nodes.length,
      edgeCount: lineage.edges.length,
      nodeTypes: lineage.nodes.map((n) => n.type),
    })
    return NextResponse.json(lineage)
  } catch (e: any) {
    console.error("[v0] Lineage API error:", e)
    return NextResponse.json({ nodes: [], edges: [] })
  }
}
