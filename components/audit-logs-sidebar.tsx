"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

import { ChevronDown, ChevronUp, Download, Filter, RefreshCcw, X, AlertCircle } from "lucide-react"

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

interface AuditLogsSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AuditLogsSidebar({ isOpen, onClose }: AuditLogsSidebarProps) {
  // Data and load controls
  const [logs, setLogs] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")
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

  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/sdk/log?limit=500", { cache: "no-store" })

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

  useEffect(() => {
    if (isOpen) {
      loadLogs()
    }
  }, [isOpen])

  const agents = useMemo(() => {
    const ids = new Set<string>()
    logs.forEach((l) => ids.add(l.agentId))
    return Array.from(ids).sort()
  }, [logs])

  const filtered = useMemo(() => {
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
      .filter((l) => levelFilter[l.level])
      .filter((l) => (agentFilter === "all" ? true : l.agentId === agentFilter))
      .filter(qMatch)
  }, [logs, levelFilter, agentFilter, search])

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
    const success = filtered.filter((l) => l.level === "success").length
    return { total, errors, warnings, success }
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[500px] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Audit Logs</SheetTitle>
                <SheetDescription>Recent system activity and events</SheetDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Error Alert */}
          {error && (
            <div className="px-6 py-2">
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="px-6 py-4 border-b">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-semibold">{kpis.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-destructive">{kpis.errors}</div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button variant="outline" size="icon" onClick={loadLogs} disabled={loading}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs bg-transparent">
                    <Filter className="mr-1 h-3 w-3" />
                    Levels
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-48">
                  <div className="space-y-2">
                    {(["error", "warning", "info", "success"] as const).map((lvl) => (
                      <label key={lvl} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={levelFilter[lvl]} onCheckedChange={() => toggleLevel(lvl)} />
                        <span className="capitalize">{lvl}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={agentFilter} onValueChange={(v) => setAgentFilter(v)}>
                <SelectTrigger className="w-32 text-xs">
                  <SelectValue placeholder="Agent" />
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

              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={sorted.length === 0}
                className="text-xs bg-transparent"
              >
                <Download className="mr-1 h-3 w-3" />
                CSV
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground px-6">
                <div className="text-sm font-medium">No logs found</div>
                <div className="text-xs mt-1">Adjust filters or check back later</div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-20 cursor-pointer text-xs" onClick={() => toggleSort("timestamp")}>
                        <div className="inline-flex items-center gap-1">
                          Time
                          {sortKey === "timestamp" &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-xs" onClick={() => toggleSort("level")}>
                        <div className="inline-flex items-center gap-1">
                          Level
                          {sortKey === "level" &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-xs" onClick={() => toggleSort("type")}>
                        <div className="inline-flex items-center gap-1">
                          Type
                          {sortKey === "type" &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((l) => (
                      <TableRow key={l.id} className="hover:bg-muted/50">
                        <TableCell className="text-xs whitespace-nowrap">{formatDate(l.timestamp)}</TableCell>
                        <TableCell className="text-xs">
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
                            className="text-xs px-1 py-0"
                          >
                            {l.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium truncate max-w-32" title={l.type}>
                          {l.type}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
