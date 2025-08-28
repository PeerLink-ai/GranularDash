"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  FileJson,
  Filter,
  Focus,
  GitBranch,
  ImageIcon,
  Info,
  RotateCcw,
  Search,
  ZoomIn,
  ZoomOut,
  BadgeCheck,
  RefreshCw,
  Activity,
} from "lucide-react"

import "reactflow/dist/style.css"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  Position,
  type Edge,
  type Node,
  useReactFlow,
} from "reactflow"

export interface DataModelLineageProps {
  onOpenDatasetVersioning?: () => void
  onOpenTransformationSteps?: () => void
  onOpenModelVersionTracking?: () => void
  highlightedNode?: string | null
}

export interface LineageNode {
  id: string
  name: string
  type:
    | "agent"
    | "model"
    | "deployment"
    | "evaluation"
    | "dataset"
    | "transformation"
    | "integration"
    | "user"
    | "organization"
  path: string[]
  metadata: {
    sourceFile?: string
    schema?: string
    creationDate?: string
    owner?: string
    status?: string
    accuracy?: string
    version?: string
    description?: string
    provider?: string
    endpoint?: string
    cost?: string
    performance?: string
  }
  nextNodes?: string[]
}

const TYPE_THEME: Record<LineageNode["type"], { bg: string; border: string; text: string; accent: string }> = {
  agent: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900",
    text: "text-blue-800 dark:text-blue-200",
    accent: "text-blue-500",
  },
  model: {
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    border: "border-fuchsia-200 dark:border-fuchsia-900",
    text: "text-fuchsia-800 dark:text-fuchsia-200",
    accent: "text-fuchsia-500",
  },
  deployment: {
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-200 dark:border-green-900",
    text: "text-green-800 dark:text-green-200",
    accent: "text-green-500",
  },
  evaluation: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-900",
    text: "text-orange-800 dark:text-orange-200",
    accent: "text-orange-500",
  },
  dataset: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900",
    text: "text-emerald-800 dark:text-emerald-200",
    accent: "text-emerald-500",
  },
  transformation: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900",
    text: "text-amber-800 dark:text-amber-200",
    accent: "text-amber-500",
  },
  integration: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-900",
    text: "text-purple-800 dark:text-purple-200",
    accent: "text-purple-500",
  },
  user: {
    bg: "bg-slate-50 dark:bg-slate-900/60",
    border: "border-slate-200 dark:border-slate-800",
    text: "text-slate-800 dark:text-slate-200",
    accent: "text-slate-500",
  },
  organization: {
    bg: "bg-gray-50 dark:bg-gray-900/60",
    border: "border-gray-200 dark:border-gray-800",
    text: "text-gray-800 dark:text-gray-200",
    accent: "text-gray-500",
  },
}

type FocusMode = "all" | "upstream" | "downstream"

function buildEdges(data: LineageNode[]): Edge[] {
  if (!Array.isArray(data)) return []

  const ids = new Set(data.map((n) => n.id))
  const edges: Edge[] = []
  for (const n of data) {
    for (const nxt of n.nextNodes ?? []) {
      if (!ids.has(nxt)) continue
      edges.push({
        id: `${n.id}->${nxt}`,
        source: n.id,
        target: nxt,
        type: "smoothstep",
      })
    }
  }
  return edges
}

function layoutNodes(data: LineageNode[], opts: { colGap?: number; rowGap?: number } = {}): Node[] {
  if (!Array.isArray(data)) return []

  const colGap = opts.colGap ?? 360
  const rowGap = opts.rowGap ?? 140
  const byDepth = new Map<number, LineageNode[]>()
  for (const n of data) {
    const depth = Math.max(0, (n.path || []).length - 1)
    if (!byDepth.has(depth)) byDepth.set(depth, [])
    byDepth.get(depth)!.push(n)
  }
  for (const [, arr] of byDepth) arr.sort((a, b) => a.name.localeCompare(b.name))

  const maxRows = Math.max(...Array.from(byDepth.values()).map((v) => v.length))
  const nodes: Node[] = []
  for (const [depth, arr] of byDepth) {
    arr.forEach((n, i) => {
      const yCenterPad = ((maxRows - arr.length) * rowGap) / 2
      nodes.push({
        id: n.id,
        type: "default",
        position: { x: depth * colGap, y: i * rowGap + yCenterPad },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: n.name, node: n },
        style: { width: 240, borderRadius: 10, borderWidth: 1, padding: 12 },
      })
    })
  }
  return nodes
}

function buildAdjacency(edges: Edge[]) {
  if (!Array.isArray(edges)) return { out: new Map(), incoming: new Map() }

  const out = new Map<string, Set<string>>()
  const incoming = new Map<string, Set<string>>()
  for (const e of edges) {
    if (!out.has(e.source)) out.set(e.source, new Set())
    if (!incoming.has(e.target)) incoming.set(e.target, new Set())
    out.get(e.source)!.add(e.target)
    incoming.get(e.target)!.add(e.source)
    if (!out.has(e.target)) out.set(e.target, new Set())
    if (!incoming.has(e.source)) incoming.set(e.source, new Set())
  }
  return { out, incoming }
}

function traverseUpstream(id: string, incoming: Map<string, Set<string>>) {
  const seen = new Set<string>()
  const stack = [id]
  while (stack.length) {
    const cur = stack.pop()!
    for (const p of incoming.get(cur) ?? []) {
      if (!seen.has(p)) {
        seen.add(p)
        stack.push(p)
      }
    }
  }
  return seen
}

function traverseDownstream(id: string, out: Map<string, Set<string>>) {
  const seen = new Set<string>()
  const stack = [id]
  while (stack.length) {
    const cur = stack.pop()!
    for (const c of out.get(cur) ?? []) {
      if (!seen.has(c)) {
        seen.add(c)
        stack.push(c)
      }
    }
  }
  return seen
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadPNG(filename: string, element: HTMLElement) {
  const htmlToImage = await import("html-to-image")
  const dataUrl = await htmlToImage.toPng(element, { pixelRatio: 2, cacheBust: true })
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  a.click()
}

function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function MetricsBar({ data }: { data: LineageNode[] }) {
  const counts = React.useMemo(() => {
    const safeData = Array.isArray(data) ? data : []
    const c: Record<LineageNode["type"], number> = {
      agent: 0,
      model: 0,
      deployment: 0,
      evaluation: 0,
      dataset: 0,
      transformation: 0,
      integration: 0,
      user: 0,
      organization: 0,
    }
    safeData.forEach((n) => (c[n.type] += 1))
    return c
  }, [data])

  const items: { label: string; key: LineageNode["type"]; value: number }[] = [
    { label: "Agents", key: "agent", value: counts.agent },
    { label: "Models", key: "model", value: counts.model },
    { label: "Deployments", key: "deployment", value: counts.deployment },
    { label: "Evaluations", key: "evaluation", value: counts.evaluation },
    { label: "Datasets", key: "dataset", value: counts.dataset },
    { label: "Transformations", key: "transformation", value: counts.transformation },
    { label: "Integrations", key: "integration", value: counts.integration },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
      {items.map((it) => (
        <Card key={it.key} className={`${TYPE_THEME[it.key].bg} ${TYPE_THEME[it.key].border}`}>
          <CardHeader className="py-3">
            <CardTitle className={`text-sm ${TYPE_THEME[it.key].text}`}>{it.label}</CardTitle>
            <CardDescription className="text-xl font-semibold text-foreground">{it.value}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

function Toolbar({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  onFit,
  onReset,
  onExportJSON,
  onExportPNG,
}: {
  search: string
  setSearch: (s: string) => void
  typeFilter: Record<LineageNode["type"], boolean>
  setTypeFilter: (f: Record<LineageNode["type"], boolean>) => void
  onFit: () => void
  onReset: () => void
  onExportJSON: () => void
  onExportPNG: () => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 w-full sm:w-[520px]">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, type, provider, status, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(
              [
                "agent",
                "model",
                "deployment",
                "evaluation",
                "dataset",
                "transformation",
                "integration",
              ] as LineageNode["type"][]
            ).map((t) => (
              <DropdownMenuItem key={t} onSelect={(e) => e.preventDefault()} className="cursor-default">
                <div className="flex items-center gap-2 w-full">
                  <Checkbox
                    checked={typeFilter[t]}
                    onCheckedChange={(v) => setTypeFilter({ ...typeFilter, [t]: Boolean(v) })}
                    id={`type-${t}`}
                  />
                  <label htmlFor={`type-${t}`} className="text-sm capitalize cursor-pointer">
                    {t}
                  </label>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onFit} className="gap-2 bg-transparent">
          <Focus className="h-4 w-4" />
          Fit
        </Button>
        <Button variant="outline" onClick={onReset} className="gap-2 bg-transparent">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportJSON} className="gap-2">
              <FileJson className="h-4 w-4" />
              JSON (visible)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPNG} className="gap-2">
              <ImageIcon className="h-4 w-4" />
              PNG (graph)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

type GraphApi = {
  fit: () => void
  zoomIn: () => void
  zoomOut: () => void
}

function GraphCanvas({
  nodes,
  edges,
  selectedId,
  onNodeClick,
  highlightSet,
  dimNonMatches,
  onApiReady,
  graphRef,
}: {
  nodes: Node[]
  edges: Edge[]
  selectedId?: string
  onNodeClick: (id: string) => void
  highlightSet: Set<string> | null
  dimNonMatches: boolean
  onApiReady?: (api: GraphApi) => void
  graphRef: React.RefObject<HTMLDivElement>
}) {
  const rf = useReactFlow()

  React.useEffect(() => {
    onApiReady?.({
      fit: () => rf.fitView({ duration: 350, padding: 0.2 }),
      zoomIn: () => rf.zoomIn({ duration: 150 }),
      zoomOut: () => rf.zoomOut({ duration: 150 }),
    })
  }, [onApiReady, rf])

  const styledNodes = React.useMemo(() => {
    return nodes.map((n) => {
      const data = n.data as { label: string; node: LineageNode }
      const theme = TYPE_THEME[data.node.type]
      const isSelected = selectedId === n.id
      return {
        ...n,
        style: {
          ...n.style,
          borderColor: isSelected ? "hsl(var(--foreground))" : undefined,
          boxShadow: isSelected ? "0 0 0 2px hsl(var(--foreground)/.15)" : "none",
          opacity: dimNonMatches && highlightSet && !highlightSet.has(n.id) ? 0.25 : 1,
        },
        data: {
          ...n.data,
          label: (
            <div className={`flex flex-col gap-1 rounded-md border ${theme.border} ${theme.bg}`}>
              <div className="px-3 pt-2 font-medium leading-none text-sm">{data.node.name}</div>
              <div className="px-3 pb-2 text-xs text-muted-foreground flex items-center gap-2">
                <GitBranch className={`h-3.5 w-3.5 ${theme.accent}`} />
                <span className="capitalize">{data.node.type}</span>
                {data.node.metadata.version && (
                  <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">
                    v{data.node.metadata.version}
                  </span>
                )}
              </div>
            </div>
          ),
        },
      } satisfies Node
    })
  }, [nodes, selectedId, highlightSet, dimNonMatches])

  return (
    <div ref={graphRef} className="relative h-[520px] rounded-lg border">
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        onNodeClick={(_, n) => onNodeClick(n.id)}
        nodesConnectable={false}
        nodesDraggable
        elementsSelectable
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.4)"
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            width: 200,
            height: 140,
          }}
        />
        <Background />
        <Controls
          position="bottom-right"
          className="!bg-background/95 !border !border-border !rounded-lg !shadow-lg !backdrop-blur-sm"
          showFitView={false}
          showZoom={false}
          showInteractive={false}
        >
          <button
            className="react-flow__controls-button !text-foreground hover:!bg-muted hover:!text-foreground transition-colors border-0 bg-transparent"
            onClick={() => rf.zoomIn({ duration: 150 })}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            className="react-flow__controls-button !text-foreground hover:!bg-muted hover:!text-foreground transition-colors border-0 bg-transparent"
            onClick={() => rf.zoomOut({ duration: 150 })}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            className="react-flow__controls-button !text-foreground hover:!bg-muted hover:!text-foreground transition-colors border-0 bg-transparent"
            onClick={() => rf.fitView({ duration: 350, padding: 0.2 })}
            title="Fit view"
            aria-label="Fit view"
          >
            <Focus className="h-4 w-4" />
          </button>
        </Controls>
      </ReactFlow>
    </div>
  )
}

export function DataModelLineage({
  onOpenDatasetVersioning,
  onOpenTransformationSteps,
  onOpenModelVersionTracking,
  highlightedNode,
}: DataModelLineageProps) {
  const [serverData, setServerData] = React.useState<{
    nodes: LineageNode[]
    edges: { source: string; target: string }[]
  } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [raw, setRaw] = React.useState<LineageNode[]>([])
  const [focusMode, setFocusMode] = React.useState<FocusMode>("all")
  const [selected, setSelected] = React.useState<LineageNode | null>(null)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounced(search)
  const [typeFilter, setTypeFilter] = React.useState<Record<LineageNode["type"], boolean>>({
    agent: true,
    model: true,
    deployment: true,
    evaluation: true,
    dataset: true,
    transformation: true,
    integration: true,
    user: false,
    organization: false,
  })

  React.useEffect(() => {
    loadLineage()
  }, [])

  React.useEffect(() => {
    if (serverData?.nodes && Array.isArray(serverData.nodes) && serverData.nodes.length > 0) {
      const ids = new Set(serverData.nodes.map((n) => n.id))
      const nextMap = new Map<string, string[]>()

      const safeEdges = Array.isArray(serverData.edges) ? serverData.edges : []
      for (const e of safeEdges) {
        if (!ids.has(e.source) || !ids.has(e.target)) continue
        const arr = nextMap.get(e.source) || []
        arr.push(e.target)
        nextMap.set(e.source, arr)
      }

      const normalized = serverData.nodes.map((n) => ({
        ...n,
        nextNodes: nextMap.get(n.id) || [],
        path: Array.isArray(n.path) ? n.path : [],
        metadata: n.metadata || {},
      }))
      setRaw(normalized as LineageNode[])
      setSelected(normalized[0] || null)
    } else {
      setRaw([])
      setSelected(null)
    }
  }, [serverData])

  const edgesRaw = React.useMemo(() => buildEdges(raw), [raw])

  const activeTypes = React.useMemo(
    () => new Set((Object.keys(typeFilter) as LineageNode["type"][]).filter((k) => typeFilter[k])),
    [typeFilter],
  )

  const filteredData = React.useMemo(() => {
    const safeRaw = Array.isArray(raw) ? raw : []
    const q = debouncedSearch.trim().toLowerCase()
    return safeRaw.filter((n) => {
      if (!activeTypes.has(n.type)) return false
      if (!q) return true
      const hay = [
        n.name,
        n.type,
        n.metadata?.owner,
        n.metadata?.version,
        n.metadata?.schema,
        n.metadata?.sourceFile,
        n.metadata?.status,
        n.metadata?.description,
        n.metadata?.provider,
        n.metadata?.endpoint,
        n.metadata?.cost,
        n.metadata?.performance,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [raw, activeTypes, debouncedSearch])

  const rfNodesBase = React.useMemo(() => layoutNodes(filteredData), [filteredData])
  const [nodes, , onNodesChange] = useNodesState(rfNodesBase)
  const [edges, , onEdgesChange] = useEdgesState(
    edgesRaw.filter((e) => rfNodesBase.find((n) => n.id === e.source) && rfNodesBase.find((n) => n.id === e.target)),
  )

  const { out, incoming } = React.useMemo(() => buildAdjacency(edges), [edges])

  const highlightSet = React.useMemo(() => {
    if (!selected) return null
    if (focusMode === "all") return null
    const base = new Set<string>([selected.id])
    if (focusMode === "upstream") for (const id of traverseUpstream(selected.id, incoming)) base.add(id)
    if (focusMode === "downstream") for (const id of traverseDownstream(selected.id, out)) base.add(id)
    return base
  }, [focusMode, selected, out, incoming])

  const graphRef = React.useRef<HTMLDivElement>(null)
  const apiRef = React.useRef<GraphApi | null>(null)

  const handleExportJSON = React.useCallback(() => {
    const safeNodes = Array.isArray(nodes) ? nodes : []
    const safeEdges = Array.isArray(edges) ? edges : []

    const visibleNodes = safeNodes.map((n) => (n.data as any).node as LineageNode)
    const visibleIds = new Set(visibleNodes.map((n) => n.id))
    const visibleEdges = safeEdges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
    downloadJSON("lineage-visible.json", {
      nodes: visibleNodes,
      edges: visibleEdges,
      generatedAt: new Date().toISOString(),
    })
  }, [nodes, edges])

  const handleExportPNG = React.useCallback(async () => {
    if (!graphRef.current) return
    await downloadPNG("lineage-graph.png", graphRef.current)
  }, [])

  const breadcrumbSegments = Array.isArray(selected?.path) ? selected.path : []

  const loadLineage = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/lineage", { cache: "no-store" })
      const data = await res.json()
      if (data && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
        setServerData(data)
      } else {
        setServerData({ nodes: [], edges: [] })
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load lineage")
      setServerData({ nodes: [], edges: [] })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (highlightedNode && raw.length > 0) {
      const nodeToHighlight = raw.find((n) => n.id === highlightedNode || n.id.includes(highlightedNode))
      if (nodeToHighlight) {
        setSelected(nodeToHighlight)
        setTimeout(() => {
          apiRef.current?.fit()
        }, 100)
      }
    }
  }, [highlightedNode, raw])

  return (
    <ReactFlowProvider>
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                Real-Time Data & Model Lineage
                {highlightedNode && (
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Audit Context
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Visualize your complete AI pipeline: agents, models, deployments, evaluations, and data flows from your
                live system.
                {highlightedNode && " Highlighted node shows audit trail context."}
              </CardDescription>
            </div>
            <Button variant="outline" className="gap-2 bg-transparent" onClick={loadLineage} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing" : "Refresh"}
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExportJSON}>
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
          <div className="mt-4">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbSegments.map((segment, idx) => (
                  <React.Fragment key={`${segment}-${idx}`}>
                    <BreadcrumbItem>
                      {idx === breadcrumbSegments.length - 1 ? (
                        <BreadcrumbPage className="font-semibold">{segment}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            const node = raw.find((n) => n.path[idx] === segment && n.path.length === idx + 1)
                            if (node) setSelected(node)
                          }}
                        >
                          {segment}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {idx < breadcrumbSegments.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <MetricsBar data={raw} />
          <Separator className="bg-gray-200 dark:bg-gray-800" />

          <Toolbar
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onFit={() => apiRef.current?.fit()}
            onReset={() => {
              setSearch("")
              setTypeFilter({
                agent: true,
                model: true,
                deployment: true,
                evaluation: true,
                dataset: true,
                transformation: true,
                integration: true,
                user: false,
                organization: false,
              })
              setFocusMode("all")
              apiRef.current?.fit()
            }}
            onExportJSON={handleExportJSON}
            onExportPNG={handleExportPNG}
          />
          {error && (
            <div className="text-sm text-destructive">
              {"Failed to load live lineage: "}
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Focus</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant={focusMode === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFocusMode("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={focusMode === "upstream" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFocusMode("upstream")}
                  >
                    Upstream
                  </Button>
                  <Button
                    variant={focusMode === "downstream" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFocusMode("downstream")}
                  >
                    Downstream
                  </Button>
                </div>
              </div>

              <GraphCanvas
                nodes={nodes}
                edges={edges}
                selectedId={selected?.id}
                onNodeClick={(id) => {
                  const n = raw.find((x) => x.id === id)
                  if (n) setSelected(n)
                }}
                highlightSet={highlightSet}
                dimNonMatches={focusMode !== "all"}
                onApiReady={(api) => (apiRef.current = api)}
                graphRef={graphRef}
              />

              <p className="text-xs text-muted-foreground">
                Tip: Drag to pan, scroll to zoom, and drag nodes to adjust layout.
              </p>
            </div>

            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Node Details
                    {selected &&
                      highlightedNode &&
                      (selected.id === highlightedNode || selected.id.includes(highlightedNode)) && (
                        <Badge variant="secondary" className="text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          From Audit
                        </Badge>
                      )}
                  </CardTitle>
                  <CardDescription>Inspect metadata and take actions on the selected node.</CardDescription>
                </CardHeader>
                <CardContent>
                  {selected ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Name</div>
                        <div className="font-medium">{selected.name}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Type</div>
                        <div className="capitalize">{selected.type}</div>
                      </div>

                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid grid-cols-2">
                          <TabsTrigger value="details" className="gap-2">
                            <Info className="h-4 w-4" />
                            Details
                          </TabsTrigger>
                          <TabsTrigger value="path" className="gap-2">
                            <GitBranch className="h-4 w-4" />
                            Path
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="details" className="mt-3">
                          <div className="space-y-2 text-sm">
                            {Object.entries(selected.metadata).map(([key, value]) =>
                              value ? (
                                <div key={key}>
                                  <div className="text-muted-foreground">
                                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                                  </div>
                                  <div className="font-medium break-words">{value}</div>
                                </div>
                              ) : null,
                            )}
                          </div>
                        </TabsContent>
                        <TabsContent value="path" className="mt-3">
                          <ol className="list-decimal ml-4 space-y-1 text-sm">
                            {selected.path.map((p, i) => (
                              <li key={`${p}-${i}`} className="break-words">
                                {p}
                              </li>
                            ))}
                          </ol>
                        </TabsContent>
                      </Tabs>

                      <Separator />

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setFocusMode("upstream")}>
                          View Upstream
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setFocusMode("downstream")}>
                          View Downstream
                        </Button>
                        {(selected.type === "dataset" ||
                          selected.type === "transformation" ||
                          selected.type === "model") && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              if (selected.type === "dataset") onOpenDatasetVersioning?.()
                              else if (selected.type === "transformation") onOpenTransformationSteps?.()
                              else if (selected.type === "model") onOpenModelVersionTracking?.()
                            }}
                            className="gap-2"
                          >
                            <BadgeCheck className="h-4 w-4" />
                            View More Details
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      Select a node from the graph to view its details.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </ReactFlowProvider>
  )
}
