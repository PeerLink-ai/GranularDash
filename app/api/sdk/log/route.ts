import { NextRequest, NextResponse } from "next/server"
import { addLog, addMany, clearLogs, listLogs, size } from "@/lib/sdk-log-store"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get("limit") || 100), 2000)
  const offset = Number(searchParams.get("offset") || 0)

  const data = listLogs({ limit, offset })
  return NextResponse.json({ data, total: size() })
}

// Optional: allow pushing custom events if needed
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (Array.isArray(body)) {
      const records = addMany(body)
      return NextResponse.json({ ok: true, count: records.length })
    }
    if (body && typeof body === "object") {
      const record = addLog(body)
      return NextResponse.json({ ok: true, id: record.id })
    }
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 })
  }
}

export async function DELETE() {
  clearLogs()
  return NextResponse.json({ ok: true })
}
