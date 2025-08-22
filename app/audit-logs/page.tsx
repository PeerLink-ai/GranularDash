"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  LineChart,
  PlayCircle,
  RefreshCcw,
  Trash2,
  Settings2,
  AlertCircle,
  Shield,
  Eye,
  Hash,
  CheckCircle2,
  XCircle,
  Clock,
  Network,
} from "lucide-react"

// Demo SDK audit log record type (from existing SDK endpoint)
type AuditRecord = {
  id: string
  timestamp: number
  agentId: string
  type: string
  level: "info" | "warning" | "error" | "success"
  payload: unknown
}

type SortKey = "timestamp" | "type" | "level" | "agentId"

type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

type IntegrityStatus = {
  isValid: boolean
  totalBlocks: number
  verifiedBlocks: number
  lastVerified: Date | null
  errors: string[]
}

function lastNDays(n: number): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - (n - 1))
  return { from, to }
}

export default function AuditLogsPage() {
  // Data and load controls
  const [logs, setLogs] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [integrityStatus, setIntegrityStatus] = useState<IntegrityStatus>({
    isValid: true,
    totalBlocks: 0,
    verifiedBlocks: 0,
    lastVerified: null,
    errors: [],
  })
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false)

  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [cryptographicProof, setCryptographicProof] = useState<any>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<DateRange>(lastNDays(7))
  const [levelFilter, setLevelFilter] = useState<Record<AuditRecord["level"], boolean>>({
    error: true,
    warning: true,
    info: true,
    success: true,
  })
  const [agentFilter, setAgentFilter] = useState<string>("all")

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("timestamp")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Scenario agent input for generating logs
  const [scenarioAgent, setScenarioAgent] = useState<string>("demo-agent-001")

  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/sdk/log?limit=1000", { cache: "no-store" })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || `HTTP ${res.status}: ${res.statusText}`)
      }

      const contentType = res.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API did not return JSON")
      }

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response")
      }

      setLogs(Array.isArray(data.data) ? data.data : [])
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      console.error("Failed to load logs", errorMessage)
      setError(errorMessage)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const verifyChainIntegrity = async () => {
    setVerifyingIntegrity(true)
    try {
      // Call the governance test endpoint to get chain validation
      const res = await fetch("/api/agents/demo-agent-001/governance-test", {
        method: "GET",
      })

      if (res.ok) {
        const data = await res.json()
        setIntegrityStatus({
          isValid: data.chainIntegrity,
          totalBlocks: data.totalInteractions || 0,
          verifiedBlocks: data.chainIntegrity ? data.totalInteractions || 0 : 0,
          lastVerified: new Date(),
          errors: data.chainIntegrity ? [] : ["Chain integrity compromised"],
        })
      } else {
        setIntegrityStatus((prev) => ({
          ...prev,
          isValid: false,
          lastVerified: new Date(),
          errors: ["Failed to verify chain integrity"],
        }))
      }
    } catch (e) {
      setIntegrityStatus((prev) => ({
        ...prev,
        isValid: false,
        lastVerified: new Date(),
        errors: [e instanceof Error ? e.message : "Verification failed"],
      }))
    } finally {
      setVerifyingIntegrity(false)
    }
  }

  const showLogDetails = async (log: AuditRecord) => {
    setSelectedLog(log)

    // Fetch cryptographic proof for this log if available
    try {
      const res = await fetch(`/api/agents/${log.agentId}/governance-test`)
      if (res.ok) {
        const data = await res.json()
        setCryptographicProof(data.cryptographicProof)
      }
    } catch (e) {
      console.error("Failed to fetch cryptographic proof:", e)
    }

    setShowDetailsModal(true)
  }

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => loadLogs(), 10000) // Increased to 10 seconds
    return () => clearInterval(id)
  }, [autoRefresh])

  const runScenario = async (scenario: "normal" | "anomaly" | "breach") => {
    if (!scenarioAgent) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/sdk/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: scenarioAgent, scenario }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || `HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to generate test logs")
      }

      // Wait a moment then reload logs
      setTimeout(() => loadLogs(), 1000)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      console.error("Failed to run scenario", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const clearAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/sdk/log", { method: "DELETE" })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || `HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to clear logs")
      }

      await loadLogs()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      console.error("Failed to clear logs", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const agents = useMemo(() => {
    const ids = new Set<string>()
    logs.forEach((l) => ids.add(l.agentId))
    const list = Array.from(ids).sort()
    // Ensure current scenarioAgent is in dropdown if not loaded yet
    if (scenarioAgent && !list.includes(scenarioAgent)) list.unshift(scenarioAgent)
    return list
  }, [logs, scenarioAgent])

  const filtered = useMemo(() => {
    const from = dateRange.from ? dateRange.from.getTime() : Number.NEGATIVE_INFINITY
    const to = dateRange.to
      ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999).getTime()
      : Number.POSITIVE_INFINITY

    const q = search.trim().toLowerCase()
    const qMatch = (l: AuditRecord) => {
      if (!q) return true
      if (l.type.toLowerCase().includes(q)) return true
      if (l.agentId.toLowerCase().includes(q)) return true
      try {
        const text = JSON.stringify(l.payload).toLowerCase()
        if (text.includes(q)) return true
      } catch {}
      return false
    }

    return logs
      .filter((l) => l.timestamp >= from && l.timestamp <= to)
      .filter((l) => levelFilter[l.level])
      .filter((l) => (agentFilter === "all" ? true : l.agentId === agentFilter))
      .filter(qMatch)
  }, [logs, dateRange, levelFilter, agentFilter, search])

  const sorted = useMemo(() => {
    const s = [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === "timestamp") cmp = a.timestamp - b.timestamp
      else if (sortKey === "type") cmp = a.type.localeCompare(b.type)
      else if (sortKey === "level") cmp = a.level.localeCompare(b.level)
      else if (sortKey === "agentId") cmp = a.agentId.localeCompare(b.agentId)
      return sortDir === "asc" ? cmp : -cmp
    })
    return s
  }, [filtered, sortKey, sortDir])

  // KPIs (based on filtered range)
  const kpis = useMemo(() => {
    const total = filtered.length
    const errors = filtered.filter((l) => l.level === "error").length
    const warnings = filtered.filter((l) => l.level === "warning").length
    const info = filtered.filter((l) => l.level === "info").length
    const success = filtered.filter((l) => l.level === "success").length
    return { total, errors, warnings, info, success }
  }, [filtered])

  const toggleLevel = (key: AuditRecord["level"]) => {
    setLevelFilter((p) => ({ ...p, [key]: !p[key] }))
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("asc")
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    }
  }

  const exportCSV = () => {
    const headers = ["id", "timestamp", "agentId", "type", "level", "payload"]
    const rows = sorted.map((l) => [
      l.id,
      new Date(l.timestamp).toISOString(),
      l.agentId,
      l.type,
      l.level,
      JSON.stringify(l.payload ?? {}),
    ])
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "audit-logs.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <LineChart className="h-12 w-12 mb-4 opacity-70" />
      <div className="text-lg font-medium">No logs found</div>
      <div className="text-sm mt-1 mb-4">Adjust filters or generate demo events to get started.</div>
      <Button onClick={() => runScenario("normal")} disabled={loading}>
        <PlayCircle className="mr-2 h-4 w-4" />
        Generate demo events
      </Button>
    </div>
  )

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with title and top-right controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Inspect, filter, and export events across agents.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start bg-transparent">
                <CalendarRange className="mr-2 h-4 w-4" />
                {dateRange.from
                  ? dateRange.to
                    ? `${formatDateShort(dateRange.from)} - ${formatDateShort(dateRange.to)}`
                    : `${formatDateShort(dateRange.from)}`
                  : "Pick a date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <div className="space-y-3">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(r) => setDateRange({ from: r?.from, to: r?.to })}
                  numberOfMonths={2}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDateRange(lastNDays(1))}>
                    24h
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDateRange(lastNDays(7))}>
                    7d
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDateRange(lastNDays(30))}>
                    30d
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })}>
                    Clear
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Agent selector (acts like "project" in the reference) */}
          <Select value={agentFilter} onValueChange={(v) => setAgentFilter(v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-2 bg-transparent" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Chain Integrity Status
            </CardTitle>
            <Button variant="outline" size="sm" onClick={verifyChainIntegrity} disabled={verifyingIntegrity}>
              {verifyingIntegrity ? (
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Hash className="mr-2 h-4 w-4" />
              )}
              Verify Integrity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {integrityStatus.isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${integrityStatus.isValid ? "text-green-600" : "text-red-600"}`}>
                {integrityStatus.isValid ? "VERIFIED" : "COMPROMISED"}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {integrityStatus.verifiedBlocks}/{integrityStatus.totalBlocks} blocks verified
            </div>
            {integrityStatus.lastVerified && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last verified: {integrityStatus.lastVerified.toLocaleTimeString()}
              </div>
            )}
          </div>
          {integrityStatus.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-600">Errors: {integrityStatus.errors.join(", ")}</div>
          )}
        </CardContent>
      </Card>

      {/* Overall metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{kpis.total.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive tabular-nums">
            {kpis.errors.toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{kpis.warnings.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{kpis.success.toLocaleString()}</CardContent>
        </Card>
      </div>

      {/* Toolbar: filters, search, actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex-1 flex flex-col sm:flex-row gap-2 items-stretch">
              {/* Filter popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="sm:w-auto justify-start bg-transparent">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Levels</div>
                    {(["error", "warning", "info", "success"] as const).map((lvl) => (
                      <label key={lvl} className="flex items-center gap-2">
                        <Checkbox checked={levelFilter[lvl]} onCheckedChange={() => toggleLevel(lvl)} />
                        <span className="capitalize">{lvl}</span>
                      </label>
                    ))}
                    <Separator />
                    <div className="text-xs text-muted-foreground">Only events matching selected levels are shown.</div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Search */}
              <div className="relative flex-1">
                <Input
                  placeholder="Filter by type, agent, or payload text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                  aria-label="Search logs"
                />
              </div>

              {/* Quick All toggle */}
              <Button
                variant="ghost"
                onClick={() => setLevelFilter({ error: true, warning: true, info: true, success: true })}
                className="sm:w-auto"
              >
                Select all
              </Button>
            </div>

            {/* Right aligned actions: moved buttons here */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
              </Button>
              <Button variant="outline" onClick={exportCSV} disabled={sorted.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="destructive" onClick={clearAll} disabled={loading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button disabled={loading}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    Run Scenario
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Generate demo events</div>
                    <Input
                      placeholder="Agent ID, e.g. demo-agent-001"
                      value={scenarioAgent}
                      onChange={(e) => setScenarioAgent(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => runScenario("normal")} disabled={loading}>
                        Normal
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => runScenario("anomaly")}
                        disabled={loading}
                      >
                        Anomaly
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => runScenario("breach")}
                        disabled={loading}
                      >
                        Breach
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Events {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <EmptyState />
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[220px] cursor-pointer select-none" onClick={() => toggleSort("timestamp")}>
                      <div className="inline-flex items-center gap-1">
                        Timestamp{" "}
                        {sortKey === "timestamp" ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : null}
                      </div>
                    </TableHead>
                    <TableHead className="w-[140px] cursor-pointer select-none" onClick={() => toggleSort("level")}>
                      <div className="inline-flex items-center gap-1">
                        Level{" "}
                        {sortKey === "level" ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : null}
                      </div>
                    </TableHead>
                    <TableHead className="w-[220px] cursor-pointer select-none" onClick={() => toggleSort("type")}>
                      <div className="inline-flex items-center gap-1">
                        Type{" "}
                        {sortKey === "type" ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : null}
                      </div>
                    </TableHead>
                    <TableHead className="w-[220px] cursor-pointer select-none" onClick={() => toggleSort("agentId")}>
                      <div className="inline-flex items-center gap-1">
                        Agent{" "}
                        {sortKey === "agentId" ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : null}
                      </div>
                    </TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(l.timestamp)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={
                            l.level === "error"
                              ? "destructive"
                              : l.level === "warning"
                                ? "secondary"
                                : l.level === "success"
                                  ? "default"
                                  : "outline"
                          }
                          className="uppercase"
                        >
                          {l.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{l.type}</TableCell>
                      <TableCell className="text-muted-foreground">{l.agentId}</TableCell>
                      <TableCell>
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-40">
                          {JSON.stringify(l.payload, null, 2)}
                        </pre>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showLogDetails(l)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Investigate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Forensic Investigation: Event Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive analysis and cryptographic verification of audit log event
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="payload">Payload Analysis</TabsTrigger>
                <TabsTrigger value="cryptographic">Cryptographic Proof</TabsTrigger>
                <TabsTrigger value="lineage">Event Lineage</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Event Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Event ID:</span>
                        <div className="font-mono text-xs bg-muted p-1 rounded mt-1">{selectedLog.id}</div>
                      </div>
                      <div>
                        <span className="font-medium">Timestamp:</span>
                        <div className="mt-1">{formatDate(selectedLog.timestamp)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Agent ID:</span>
                        <div className="mt-1">{selectedLog.agentId}</div>
                      </div>
                      <div>
                        <span className="font-medium">Event Type:</span>
                        <div className="mt-1">{selectedLog.type}</div>
                      </div>
                      <div>
                        <span className="font-medium">Severity Level:</span>
                        <div className="mt-1">
                          <Badge
                            variant={
                              selectedLog.level === "error"
                                ? "destructive"
                                : selectedLog.level === "warning"
                                  ? "secondary"
                                  : selectedLog.level === "success"
                                    ? "default"
                                    : "outline"
                            }
                          >
                            {selectedLog.level.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payload" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payload Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-md">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.payload, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cryptographic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Cryptographic Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cryptographicProof ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Block Hash:</span>
                            <div className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                              {cryptographicProof.blockHash}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Block ID:</span>
                            <div className="font-mono text-xs bg-muted p-2 rounded mt-1">
                              {cryptographicProof.blockId}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Digital Signature:</span>
                            <div className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                              {cryptographicProof.signature?.substring(0, 100)}...
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Chain Validity:</span>
                            <div className="mt-1">
                              {cryptographicProof.chainValid ? (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  VERIFIED
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  COMPROMISED
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <div>No cryptographic proof available for this event</div>
                        <div className="text-sm mt-1">This may be a legacy event or from an unverified source</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lineage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Event Lineage & Chain of Custody
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <div>Lineage visualization coming soon</div>
                      <div className="text-sm mt-1">This will show the complete chain of events and relationships</div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
