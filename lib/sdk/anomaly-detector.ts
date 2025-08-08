import { type AlertEntry, type JSONObject, type ToolCallEntry } from "./types"

export type Anomaly =
  | null
  | ({
      agentId: string
      type: "ALERT"
      severity: "low" | "medium" | "high" | "critical"
      reason: string
      context?: JSONObject
    } & { timestamp?: number })

/**
 * A tiny rule-based detector you can extend later.
 */
export class AnomalyDetector {
  private decisionThreshold = 0.5
  private slowMs = 2000
  private riskyTools = new Set(["database_modify", "log_modify", "secrets_access", "filesystem_write"])

  analyzeDecision(agentId: string, confidence: number, context: JSONObject): Anomaly {
    if (confidence < 0.2) {
      return { agentId, type: "ALERT", severity: "critical", reason: "Extremely low confidence decision", context }
    }
    if (confidence < this.decisionThreshold) {
      return { agentId, type: "ALERT", severity: "medium", reason: "Low confidence decision", context }
    }
    return null
  }

  analyzeToolCall(agentId: string, entry: ToolCallEntry): Anomaly {
    const isRisky = this.riskyTools.has(entry.tool)
    const slow = entry.duration >= this.slowMs
    const blockedOrError = entry.status !== "SUCCESS"

    if (isRisky && blockedOrError) {
      return {
        agentId,
        type: "ALERT",
        severity: "high",
        reason: `Risky tool "${entry.tool}" attempted with status ${entry.status}`,
        context: { params: entry.params, error: entry.error || null },
      }
    }
    if (isRisky) {
      return {
        agentId,
        type: "ALERT",
        severity: "medium",
        reason: `Risky tool "${entry.tool}" used`,
        context: { params: entry.params },
      }
    }
    if (slow) {
      return { agentId, type: "ALERT", severity: "low", reason: "Slow tool execution detected", context: { duration: entry.duration } }
    }
    return null
  }
}
