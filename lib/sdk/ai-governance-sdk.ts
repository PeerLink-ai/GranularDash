import { ImmutableLedger } from "./immutable-ledger"
import { AnomalyDetector } from "./anomaly-detector"
import {
  type SDKConfig,
  type SDKLevel,
  type JSONObject,
  type DecisionEntry,
  type ToolCallEntry,
  type CommunicationEntry,
  type AlertEntry,
} from "./types"

export class AIGovernanceSDK {
  readonly agentId: string
  readonly baseUrl?: string
  readonly ledger: ImmutableLedger
  readonly anomalyDetector: AnomalyDetector

  constructor(config: SDKConfig) {
    this.agentId = config.agentId
    this.baseUrl = config.baseUrl?.replace(/\/$/, "")
    this.ledger = new ImmutableLedger({ agentId: this.agentId, baseUrl: this.baseUrl })
    this.anomalyDetector = new AnomalyDetector()
  }

  private async post(type: string, payload: unknown, level: SDKLevel = "info") {
    if (!this.baseUrl) return
    await fetch(`${this.baseUrl}/api/sdk/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: this.agentId, type, level, payload }),
    })
  }

  private isHighRiskOperation(toolName: string, params: JSONObject): boolean {
    const risky = ["database_modify", "log_modify", "secrets_access", "filesystem_write"]
    if (risky.includes(toolName)) return true
    // Heuristic: mutations or deletions
    const p = JSON.stringify(params).toLowerCase()
    return p.includes('"delete"') || p.includes('"drop"') || p.includes('"truncate"') || p.includes('"write"')
  }

  // Simulate approval check for high-risk operations
  private async requestApproval(): Promise<boolean> {
    // In production, wire to your approval workflow. For now, auto-deny.
    await new Promise((r) => setTimeout(r, 25))
    return false
  }

  private generateHash(): string {
    // Lightweight pseudo-hash for decision entry
    return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)
  }

  async logDecision(context: JSONObject, decision: JSONObject, confidence: number) {
    const entry: DecisionEntry = {
      timestamp: Date.now(),
      agentId: this.agentId,
      type: "DECISION",
      context,
      decision,
      confidence,
      hash: this.generateHash(),
    }

    await this.ledger.append("DECISION", entry as unknown as JSONObject)
    await this.post("DECISION", entry, "info")

    const anomaly = this.anomalyDetector.analyzeDecision(this.agentId, confidence, context)
    if (anomaly) {
      const alert: AlertEntry = {
        timestamp: Date.now(),
        agentId: anomaly.agentId,
        type: anomaly.type,
        severity: anomaly.severity,
        reason: anomaly.reason,
        context: anomaly.context,
      }
      await this.post("ALERT", alert, anomaly.severity === "critical" ? "error" : "warning")
    }
  }

  async recordCommunication(commType: string, payload: JSONObject) {
    const entry: CommunicationEntry = {
      timestamp: Date.now(),
      agentId: this.agentId,
      type: "COMM",
      commType,
      payload,
    }
    await this.ledger.append("COMM", entry as unknown as JSONObject)
    await this.post("COMM", entry, "info")
  }

  /**
   * Intercepts a tool call, performs pre-exec validation, executes the tool, and logs the result.
   * executor: a function that actually performs the tool operation.
   */
  async interceptToolCall<T>(
    toolName: string,
    params: JSONObject,
    executor: (params: JSONObject) => Promise<T>
  ): Promise<T> {
    // Pre-exec validation
    if (this.isHighRiskOperation(toolName, params)) {
      const approval = await this.requestApproval()
      if (!approval) {
        const blockedEntry: ToolCallEntry = {
          timestamp: Date.now(),
          agentId: this.agentId,
          type: "TOOL_CALL",
          tool: toolName,
          params,
          duration: 0,
          status: "BLOCKED",
        }
        await this.ledger.append("TOOL_CALL", blockedEntry as unknown as JSONObject)
        await this.post("TOOL_CALL", blockedEntry, "warning")

        const anomaly = this.anomalyDetector.analyzeToolCall(this.agentId, blockedEntry)
        if (anomaly) {
          const alert: AlertEntry = {
            timestamp: Date.now(),
            agentId: anomaly.agentId,
            type: anomaly.type,
            severity: anomaly.severity,
            reason: anomaly.reason,
            context: anomaly.context,
          }
          await this.post("ALERT", alert, "warning")
        }
        throw new Error("Operation blocked")
      }
    }

    // Execute and log
    const start = Date.now()
    try {
      const result = await executor(params)
      const entry: ToolCallEntry = {
        timestamp: Date.now(),
        agentId: this.agentId,
        type: "TOOL_CALL",
        tool: toolName,
        params,
        result: result as any,
        duration: Date.now() - start,
        status: "SUCCESS",
      }
      await this.ledger.append("TOOL_CALL", entry as unknown as JSONObject)
      await this.post("TOOL_CALL", entry, "success")

      const anomaly = this.anomalyDetector.analyzeToolCall(this.agentId, entry)
      if (anomaly) {
        const alert: AlertEntry = {
          timestamp: Date.now(),
          agentId: anomaly.agentId,
          type: anomaly.type,
          severity: anomaly.severity,
          reason: anomaly.reason,
          context: anomaly.context,
        }
        await this.post("ALERT", alert, "warning")
      }

      return result
    } catch (error: any) {
      const entry: ToolCallEntry = {
        timestamp: Date.now(),
        agentId: this.agentId,
        type: "TOOL_CALL",
        tool: toolName,
        params,
        error: error?.message || "Unknown error",
        duration: Date.now() - start,
        status: "ERROR",
      }
      await this.ledger.append("TOOL_CALL", entry as unknown as JSONObject)
      await this.post("TOOL_CALL", entry, "error")

      const anomaly = this.anomalyDetector.analyzeToolCall(this.agentId, entry)
      if (anomaly) {
        const alert: AlertEntry = {
          timestamp: Date.now(),
          agentId: anomaly.agentId,
          type: anomaly.type,
          severity: anomaly.severity,
          reason: anomaly.reason,
          context: anomaly.context,
        }
        await this.post("ALERT", alert, "error")
      }
      throw error
    }
  }
}
