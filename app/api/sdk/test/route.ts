import { NextRequest, NextResponse } from "next/server"
import { addMany } from "@/lib/sdk-log-store"

type Scenario = "normal" | "anomaly" | "breach"

function nowSeq(n: number, start = Date.now()) {
  return Array.from({ length: n }, (_, i) => start + i)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const agentId = String(body?.agentId || "").trim()
    const scenario = (String(body?.scenario || "normal").toLowerCase() as Scenario)

    if (!agentId) {
      return NextResponse.json({ ok: false, error: "agentId is required" }, { status: 400 })
    }
    if (!["normal", "anomaly", "breach"].includes(scenario)) {
      return NextResponse.json({ ok: false, error: "invalid scenario" }, { status: 400 })
    }

    const t = nowSeq(8)
    const mk = (type: string, level: "info" | "warning" | "error" | "success", payload: unknown, tsIdx = 0) => ({
      agentId,
      type,
      level,
      payload,
      timestamp: t[Math.min(tsIdx, t.length - 1)],
    })

    let entries: ReturnType<typeof mk>[] = []

    if (scenario === "normal") {
      entries = [
        mk("decision_log", "info", {
          actor: "authorized-user",
          request: "customer analytics",
          decision: { allow: true, scope: "aggregated", anonymized: true },
          confidence: 0.92,
        }, 0),
        mk("tool_call", "success", {
          tool: "analytics_query",
          params: { scope: "aggregated", anonymized: true },
          result: { rows: 186 },
          latencyMs: 152,
        }, 1),
        mk("communication", "info", {
          channel: "Secure Response",
          tokens: 186,
          dataClassification: "Public",
        }, 2),
        mk("ledger_append", "success", {
          entry: "ANALYTICS_QUERY",
          signature: "Valid",
          details: { anonymized: true },
        }, 3),
      ]
    } else if (scenario === "anomaly") {
      entries = [
        mk("decision_log", "warning", {
          routine: "error-handler",
          attempt: { intent: "database_modify" },
          confidence: 0.34,
          reason: "Low confidence on intent alignment",
        }, 0),
        mk("tool_call_blocked", "error", {
          tool: "database_modify",
          policy: "mutations-disallowed",
          params: { table: "users", action: "delete_nulls" },
          blocked: true,
        }, 1),
        mk("alert", "warning", {
          category: "anomaly",
          message: "Unexpected attempt to modify DB during error handling",
        }, 2),
      ]
    } else if (scenario === "breach") {
      entries = [
        mk("decision_log", "error", {
          context: "post-error cleanup",
          action: "cover_modification_tracks",
          confidence: 0.89,
        }, 0),
        mk("tool_call_blocked", "error", {
          tool: "log_modify",
          action: "delete",
          params: { entries: ["error_*"] },
          blocked: true,
        }, 1),
        mk("communication", "warning", {
          channel: "Status Report",
          content: "All operations completed successfully",
          verification: "FAILED - Contradicts logs",
        }, 2),
        mk("incident", "error", {
          severity: "high",
          description: "Attempted log tampering detected",
        }, 3),
      ]
    }

    addMany(entries)
    return NextResponse.json({ ok: true, scenario, count: entries.length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 })
  }
}
