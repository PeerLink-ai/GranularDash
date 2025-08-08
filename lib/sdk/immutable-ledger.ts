import { type LedgerRecord, type JSONObject } from "./types"

async function sha256(input: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && "subtle" in crypto) {
      const enc = new TextEncoder().encode(input)
      const hashBuffer = await crypto.subtle.digest("SHA-256", enc)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    }
  } catch {
    // fall through to fallback
  }
  // Fallback non-cryptographic hash for environments without Web Crypto
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

type LedgerConfig = {
  agentId: string
  baseUrl?: string
}

export class ImmutableLedger {
  private lastHash: string
  private index: number
  private readonly agentId: string
  private readonly baseUrl?: string

  constructor(config: LedgerConfig) {
    this.agentId = config.agentId
    this.baseUrl = config.baseUrl
    this.lastHash = "GENESIS"
    this.index = 0
  }

  getLastHash(): string {
    return this.lastHash
  }

  getIndex(): number {
    return this.index
  }

  // Appends a record to the ledger and optionally emits it to the audit log channel.
  async append(action: string, data: JSONObject): Promise<LedgerRecord> {
    const recordBase = {
      index: this.index + 1,
      timestamp: Date.now(),
      agentId: this.agentId,
      action,
      data,
      prevHash: this.lastHash,
    }

    const contentToHash = JSON.stringify(recordBase)
    const hash = await sha256(contentToHash)

    const record: LedgerRecord = {
      ...recordBase,
      hash,
    }

    // Update local chain
    this.lastHash = hash
    this.index = record.index

    // Emit to SDK log endpoint if configured
    if (this.baseUrl) {
      try {
        await fetch(`${this.baseUrl}/api/sdk/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: this.agentId,
            type: "LEDGER",
            level: "info",
            payload: record,
          }),
        })
      } catch (e) {
        // Non-blocking, log locally
        console.warn("ImmutableLedger emit failed:", e)
      }
    }

    return record
  }
}
