import { NextResponse } from "next/server"
import { buildDataLineage } from "@/lib/data-lineage-builder"

export async function GET() {
  try {
    const lineage = await buildDataLineage()
    return NextResponse.json(lineage)
  } catch (e: any) {
    console.error("Lineage API error:", e)
    return NextResponse.json({ nodes: [], edges: [] })
  }
}
