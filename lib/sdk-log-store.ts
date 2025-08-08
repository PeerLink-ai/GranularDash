export type AuditRecord = {
  id: string
  timestamp: number
  agentId: string
  type: string
  level: "info" | "warning" | "error" | "success"
  payload: unknown
}

type ListParams = { limit?: number; offset?: number }

const MAX_LOGS = 5000

// Simple in-memory store. Newest at the end.
const logs: AuditRecord[] = []

function safeId() {
  try {
    return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  } catch {
    return Math.random().toString(36).slice(2)
  }
}

export function addLog(entry: Omit<AuditRecord, "id" | "timestamp"> & Partial<Pick<AuditRecord, "id" | "timestamp">>) {
  const record: AuditRecord = {
    id: entry.id ?? safeId(),
    timestamp: entry.timestamp ?? Date.now(),
    agentId: entry.agentId,
    type: entry.type,
    level: entry.level,
    payload: entry.payload,
  }
  logs.push(record)
  // Trim if exceeded capacity (drop oldest)
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS)
  }
  return record
}

export function addMany(entries: Array<Omit<AuditRecord, "id" | "timestamp"> & Partial<Pick<AuditRecord, "id" | "timestamp">>>) {
  return entries.map(addLog)
}

export function listLogs({ limit = 100, offset = 0 }: ListParams = {}) {
  // Return in descending timestamp order
  const sorted = [...logs].sort((a, b) => b.timestamp - a.timestamp)
  return sorted.slice(offset, offset + limit)
}

export function clearLogs() {
  logs.splice(0, logs.length)
}

export function size() {
  return logs.length
}
