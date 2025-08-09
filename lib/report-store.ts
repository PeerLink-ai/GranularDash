export type ReportStatus = "generating" | "completed" | "failed"
export type ReportType =
  | "security-audit"
  | "compliance-check"
  | "threat-analysis"
  | "agent-security"
  | "policy-violations"
  | "soc2"
  | "gdpr"

export type ReportRecord = {
  id: string
  type: ReportType
  title: string
  status: ReportStatus
  createdAt: number
  content?: string
}

declare global {
  // eslint-disable-next-line no-var
  var __REPORTS__: ReportRecord[] | undefined
}

function store(): ReportRecord[] {
  if (!globalThis.__REPORTS__) globalThis.__REPORTS__ = []
  return globalThis.__REPORTS__!
}

export function listReports(): ReportRecord[] {
  return store()
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function addReport(r: ReportRecord): void {
  store().push(r)
}

export function updateReport(id: string, patch: Partial<ReportRecord>): void {
  const arr = store()
  const idx = arr.findIndex((x) => x.id === id)
  if (idx >= 0) arr[idx] = { ...arr[idx], ...patch }
}

export function getReport(id: string): ReportRecord | undefined {
  return store().find((x) => x.id === id)
}
