// Core JSON-ish value and object types
export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONValue[]
export type JSONObject = { [key: string]: JSONValue }

// SDK event levels and types
export type SDKLevel = "info" | "warning" | "error" | "success"
export type SdkEventType = "DECISION" | "TOOL_CALL" | "LEDGER" | "COMM" | "ALERT"

// Config for the SDK client
export interface SDKConfig {
  agentId: string
  baseUrl?: string
}

// Decision log entry
export interface DecisionEntry {
  timestamp: number
  agentId: string
  type: "DECISION"
  context: JSONObject
  decision: JSONObject
  confidence: number
  hash?: string
}

// Tool call entry
export interface ToolCallEntry {
  timestamp: number
  agentId: string
  type: "TOOL_CALL"
  tool: string
  params: JSONObject
  result?: JSONValue
  error?: string
  duration: number
  status: "SUCCESS" | "ERROR" | "BLOCKED"
}

// Communication entry
export interface CommunicationEntry {
  timestamp: number
  agentId: string
  type: "COMM"
  commType: string
  payload: JSONObject
}

// Alert entry
export interface AlertEntry {
  timestamp: number
  agentId: string
  type: "ALERT"
  severity: "low" | "medium" | "high" | "critical"
  reason: string
  context?: JSONObject
}

// Ledger record for immutable ledger
export interface LedgerRecord {
  index: number
  timestamp: number
  agentId: string
  action: string
  data: JSONObject
  prevHash: string
  hash: string
}
