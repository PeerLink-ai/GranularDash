import { NextResponse } from "next/server"
import { getSDKLogs } from "@/lib/sdk-log-store"

export async function GET(request: Request) {
  try {
    console.log("[v0] SDK logs API called")

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const level = searchParams.get("level") || undefined
    const agentId = searchParams.get("agentId") || undefined
    const type = searchParams.get("type") || undefined

    const result = await getSDKLogs({
      limit,
      offset,
      level,
      agentId,
      type,
    })

    console.log("[v0] Returning", result.logs.length, "logs")
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] SDK logs API error:", error)
    return NextResponse.json({ error: "Failed to fetch SDK logs", logs: [], total: 0 }, { status: 500 })
  }
}
