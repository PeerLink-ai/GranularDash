import { NextResponse } from "next/server"
import { buildLineageGraph } from "@/lib/sdk-log-store"

export async function GET() {
  try {
    const graph = await buildLineageGraph()
    return NextResponse.json(graph)
  } catch (e: any) {
    return NextResponse.json({ nodes: [], edges: [] })
  }
}
