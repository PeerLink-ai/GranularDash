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
import { cn } from "@/lib/utils"

import { CalendarRange, ChevronDown, ChevronUp, Download, Filter, LineChart, PlayCircle, RefreshCcw, Trash2, Settings2 } from 'lucide-react'

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
    try {
      const res = await fetch("/api/sdk/log?limit=1000", { cache: "no-store" })
      const data = await res.json()
      setLogs(Array.isArray(data.data) ? data.data : [])
    } catch (e) {
      console.error("Failed to load logs", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => loadLogs(), 4000)
    return () => clearInterval(id)
  }, [autoRefresh])

  const runScenario = async (scenario: "normal" | "anomaly" | "breach") => {
    if (!scenarioAgent) return
    setLoading(true)
    try {
      await fetch("/api/sdk/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: scenarioAgent, scenario }),
      })
      await loadLogs()
    } finally {
      setLoading(false)
    }
  }

  const clearAll = async () => {
    setLoading(true)
    try {
      await fetch("/api/sdk/log", { method: "DELETE" })
      await loadLogs()
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
    const from = dateRange.from ? dateRange.from.getTime() : -Infinity
    const to = dateRange.to ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999).getTime() : Infinity

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
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n")
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
      <Button onClick={() => runScenario("normal")}>
        <PlayCircle className="mr-2 h-4 w-4" />
        Generate demo events
      </Button>
    </div>
  )

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
              <Button variant="outline" className="justify-start">
                <CalendarRange className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                  ) : (
                    `${dateRange.from.toLocaleDateString()}`
                  )
                ) : (
                  "Pick a date range"
                )}
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
                  <Button variant="outline" size="sm" onClick={() => setDateRange(lastNDays(1))}>24h</Button>
                  <Button variant="outline" size="sm" onClick={() => setDateRange(lastNDays(7))}>7d</Button>
                  <Button variant="outline" size="sm" onClick={() => setDateRange(lastNDays(30))}>30d</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })}>Clear</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Agent selector (acts like "project" in the reference) */}
          <Select
            value={agentFilter}
            onValueChange={(v) => setAgentFilter(v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                  <Button variant="outline" className="sm:w-auto justify-start">
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
                onClick={() =>
                  setLevelFilter({ error: true, warning: true, info: true, success: true })
                }
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
              <Button variant="outline" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="destructive" onClick={clearAll}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button>
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
                      <Button className="flex-1" onClick={() => runScenario("normal")}>Normal</Button>
                      <Button variant="secondary" className="flex-1" onClick={() => runScenario("anomaly")}>Anomaly</Button>
                      <Button variant="destructive" className="flex-1" onClick={() => runScenario("breach")}>Breach</Button>
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
          <CardTitle>Events</CardTitle>
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
                        Timestamp {sortKey === "timestamp" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                      </div>
                    </TableHead>
                    <TableHead className="w-[140px] cursor-pointer select-none" onClick={() => toggleSort("level")}>
                      <div className="inline-flex items-center gap-1">
                        Level {sortKey === "level" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                      </div>
                    </TableHead>
                    <TableHead className="w-[220px] cursor-pointer select-none" onClick={() => toggleSort("type")}>
                      <div className="inline-flex items-center gap-1">
                        Type {sortKey === "type" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                      </div>
                    </TableHead>
                    <TableHead className="w-[220px] cursor-pointer select-none" onClick={() => toggleSort("agentId")}>
                      <div className="inline-flex items-center gap-1">
                        Agent {sortKey === "agentId" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                      </div>
                    </TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={
                            l.level === "error" ? "destructive" :
                            l.level === "warning" ? "secondary" :
                            l.level === "success" ? "default" : "outline"
                          }
                          className="uppercase"
                        >
                          {l.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{l.type}</TableCell>
                      <TableCell className="text-muted-foreground">{l.agentId}</TableCell>
                      <TableCell>
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-40">{JSON.stringify(l.payload, null, 2)}</pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
