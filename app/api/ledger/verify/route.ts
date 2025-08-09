import { NextResponse } from "next/server"

type JSONObject = Record<string, any>
type LedgerRecord = {
  index: number
  timestamp: number
  agentId: string
  action: string
  data: JSONObject
  prevHash: string
  hash: string
}

async function sha256(input: string): Promise<string> {
  try {
    // Prefer Web Crypto if available
    const enc = new TextEncoder().encode(input)
    const hashBuffer = await crypto.subtle.digest("SHA-256", enc)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  } catch {
    // Fallback non-cryptographic
    let h = 0
    for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
    return (h >>> 0).toString(16).padStart(8, "0")
  }
}

export async function POST(req: Request) {
  try {
    const { records } = (await req.json()) as { records: LedgerRecord[] }
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ valid: false, errors: ["No records supplied"], length: 0 }, { status: 400 })
    }

    const errors: string[] = []
    let lastHash = "GENESIS"

    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      const base = {
        index: r.index,
        timestamp: r.timestamp,
        agentId: r.agentId,
        action: r.action,
        data: r.data,
        prevHash: r.prevHash,
      }
      if (r.prevHash !== lastHash) {
        errors.push(`Record ${r.index} prevHash mismatch (expected ${lastHash}, got ${r.prevHash})`)
      }
      const expected = await sha256(JSON.stringify(base))
      if (expected !== r.hash) {
        errors.push(`Record ${r.index} hash mismatch`)
      }
      lastHash = r.hash
    }

    return NextResponse.json({ valid: errors.length === 0, errors, length: records.length })
  } catch (e: any) {
    return NextResponse.json({ valid: false, errors: ["Server error verifying records"], length: 0 }, { status: 500 })
  }
}
