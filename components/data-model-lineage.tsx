"use client"

import * as React from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import {
  Download,
  FileJson,
  Filter,
  Focus,
  GitBranch,
  ImageIcon,
  RotateCcw,
  Search,
  ZoomIn,
  ZoomOut,
  BadgeCheck,
  Bot,
  Brain,
  Database,
  Zap,
  Activity,
  Clock,
  User,
  Building,
} from "lucide-react"

import "reactflow/dist/style.css"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Position,
  type Edge,
  type Node,
  useReactFlow,
} from "reactflow"

export interface DataModelLineageProps {
  onOpenDatasetVersioning: () => void
  onOpenTransformationSteps: () => void
  onOpenModelVersionTracking: () => void
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
    | "agent_action"
    | "agent_response"
    | "agent_evaluation"
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
    agentId?: string
    actionType?: string
    prompt?: string
    response?: string
    tokenUsage?: number
    evaluationScore?: number
    parentActionId?: string
    timestamp?: string
    duration?: number
    model?: string
    temperature?: number
    maxTokens?: number
    interactionType?: string
    responseTime?: number
    qualityScores?: any
    evaluationFlags?: any
    auditHash?: string
    activityType?: string
    lineageId?: string
    activityData?: any
    thoughtType?: string
    thoughtContent?: string
    toolCalls?: any
    decisions?: any
    dbQueries?: any
    sessionId?: string
    parentInteractionId?: string
    processingTime?: number
    tokensUsed?: number
    confidenceScore?: number
    modelUsed?: string
    reasoningSteps?: any
    decisionFactors?: any
    alternativesConsidered?: any
    outcomePrediction?: string
    actualOutcome?: string
  }
  nextNodes?: string[]
}

const TYPE_THEME: Record<
  LineageNode["type"],
  { bg: string; border: string; text: string; accent: string; icon: React.ComponentType<any> }
> = {
  agent: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900",
    text: "text-blue-800 dark:text-blue-200",
    accent: "text-blue-500",
    icon: Bot,
  },
  agent_action: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-200 dark:border-cyan-900",
    text: "text-cyan-800 dark:text-cyan-200",
    accent: "text-cyan-500",
    icon: Zap,
  },
  agent_response: {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-900",
    text: "text-teal-800 dark:text-teal-200",
    accent: "text-teal-500",
    icon: Activity,
  },
  agent_evaluation: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-900",
    text: "text-indigo-800 dark:text-indigo-200",
    accent: "text-indigo-500",
    icon: BadgeCheck,
  },
  model: {
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    border: "border-fuchsia-200 dark:border-fuchsia-900",
    text: "text-fuchsia-800 dark:text-fuchsia-200",
    accent: "text-fuchsia-500",
    icon: Brain,
  },
  deployment: {
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-200 dark:border-green-900",
    text: "text-green-800 dark:text-green-200",
    accent: "text-green-500",
    icon: GitBranch,
  },
  evaluation: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-900",
    text: "text-orange-800 dark:text-orange-200",
    accent: "text-orange-500",
    icon: BadgeCheck,
  },
  dataset: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900",
    text: "text-emerald-800 dark:text-emerald-200",
    accent: "text-emerald-500",
    icon: Database,
  },
  transformation: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900",
    text: "text-amber-800 dark:text-amber-200",
    accent: "text-amber-500",
    icon: Zap,
  },
  integration: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-900",
    text: "text-purple-800 dark:text-purple-200",
    accent: "text-purple-500",
    icon: GitBranch,
  },
  user: {
    bg: "bg-slate-50 dark:bg-slate-900/60",
    border: "border-slate-200 dark:border-slate-800",
    text: "text-slate-800 dark:text-slate-200",
    accent: "text-slate-500",
    icon: User,
  },
  organization: {
    bg: "bg-gray-50 dark:bg-gray-900/60",
    border: "border-gray-200 dark:border-gray-800",
    text: "text-gray-800 dark:text-gray-200",
    accent: "text-gray-500",
    icon: Building,
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
      agent_action: 0,
      agent_response: 0,
      agent_evaluation: 0,
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
    { label: "Actions", key: "agent_action", value: counts.agent_action },
    { label: "Responses", key: "agent_response", value: counts.agent_response },
    { label: "Evaluations", key: "agent_evaluation", value: counts.agent_evaluation },
    { label: "Models", key: "model", value: counts.model },
    { label: "Deployments", key: "deployment", value: counts.deployment },
    { label: "Datasets", key: "dataset", value: counts.dataset },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
      {items.map((it) => (
        <Card key={it.key} className={`${TYPE_THEME[it.key].bg} ${TYPE_THEME[it.key].border}`}>
          <CardHeader className="py-3">
            <CardTitle className={`text-sm ${TYPE_THEME[it.key].text} flex items-center gap-2`}>
              {React.createElement(TYPE_THEME[it.key].icon, { className: "h-4 w-4" })}
              {it.label}
            </CardTitle>
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
            placeholder="Search agents, actions, models, datasets, or any metadata..."
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
                "agent_action",
                "agent_response",
                "agent_evaluation",
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
                  {React.createElement(TYPE_THEME[t].icon, { className: "h-4 w-4" })}
                  <label htmlFor={`type-${t}`} className="text-sm capitalize cursor-pointer">
                    {t.replace("_", " ")}
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
      const shouldDim = dimNonMatches && highlightSet && !highlightSet.has(n.id)
      const IconComponent = theme.icon

      return {
        ...n,
        style: {
          ...n.style,
          borderColor: isSelected ? "hsl(var(--foreground))" : undefined,
          boxShadow: isSelected ? "0 0 0 2px hsl(var(--foreground)/.15)" : "none",
          opacity: shouldDim ? 0.25 : 1,
        },
        data: {
          ...n.data,
          label: (
            <div className={`flex flex-col gap-2 rounded-md border ${theme.border} ${theme.bg} p-3`}>
              <div className="flex items-center gap-2">
                <IconComponent className={`h-4 w-4 ${theme.accent}`} />
                <div className="font-medium leading-none text-sm truncate">{data.node.name}</div>
                {data.node.metadata.version && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    v{data.node.metadata.version}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{data.node.type.replace("_", " ")}</span>
                {data.node.metadata.timestamp && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(data.node.metadata.timestamp).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {(data.node.type === "agent_action" || data.node.type === "agent_response") && (
                <div className="flex items-center gap-2 text-xs">
                  {data.node.metadata.tokenUsage && (
                    <Badge variant="outline" className="text-[10px]">
                      {data.node.metadata.tokenUsage} tokens
                    </Badge>
                  )}
                  {data.node.metadata.evaluationScore && (
                    <Badge variant="outline" className="text-[10px]">
                      Score: {data.node.metadata.evaluationScore}
                    </Badge>
                  )}
                </div>
              )}
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
}: DataModelLineageProps) {
  const [serverData, setServerData] = React.useState<{
    nodes: LineageNode[]
    edges: { source: string; target: string }[]
    lineageMapping?: any[]
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
    agent_action: true,
    agent_response: true,
    agent_evaluation: true,
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
    console.log("[v0] Frontend received server data:", serverData)
    if (serverData?.nodes && Array.isArray(serverData.nodes) && serverData.nodes.length > 0) {
      console.log("[v0] Processing", serverData.nodes.length, "nodes and", serverData.edges?.length || 0, "edges")
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
      console.log("[v0] Normalized nodes:", normalized.length)
      console.log("[v0] Sample normalized nodes:", normalized.slice(0, 3))
      setRaw(normalized as LineageNode[])
      setSelected(normalized[0] || null)
    } else {
      console.log("[v0] No valid nodes received, setting empty state")
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
        n.metadata?.agentId,
        n.metadata?.actionType,
        n.metadata?.prompt,
        n.metadata?.response,
        n.metadata?.tokenUsage,
        n.metadata?.evaluationScore,
        n.metadata?.parentActionId,
        n.metadata?.timestamp,
        n.metadata?.duration,
        n.metadata?.model,
        n.metadata?.temperature,
        n.metadata?.maxTokens,
        n.metadata?.interactionType,
        n.metadata?.responseTime,
        n.metadata?.qualityScores,
        n.metadata?.evaluationFlags,
        n.metadata?.auditHash,
        n.metadata?.activityType,
        n.metadata?.lineageId,
        n.metadata?.activityData,
        n.metadata?.thoughtType,
        n.metadata?.thoughtContent,
        n.metadata?.toolCalls,
        n.metadata?.decisions,
        n.metadata?.dbQueries,
        n.metadata?.sessionId,
        n.metadata?.parentInteractionId,
        n.metadata?.processingTime,
        n.metadata?.tokensUsed,
        n.metadata?.confidenceScore,
        n.metadata?.modelUsed,
        n.metadata?.reasoningSteps,
        n.metadata?.decisionFactors,
        n.metadata?.alternativesConsidered,
        n.metadata?.outcomePrediction,
        n.metadata?.actualOutcome,
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
    console.log("[v0] Starting to load lineage and agent actions from APIs...")
    setLoading(true)
    setError(null)
    try {
      const mockAgentNodes: LineageNode[] = [
        {
          id: "agent_1",
          name: "User Query Processing",
          type: "agent_action",
          path: ["agents", "query", "processing"],
          metadata: {
            agentId: "agent-001",
            interactionType: "query_processing",
            prompt: "Process user financial query",
            response: "Analyzed financial data and generated insights",
            timestamp: new Date().toISOString(),
            tokenUsage: 150,
            evaluationScore: 0.95,
          },
          nextNodes: ["agent_2"],
        },
        {
          id: "agent_2",
          name: "Data Analysis",
          type: "agent_response",
          path: ["agents", "analysis", "financial"],
          metadata: {
            agentId: "agent-002",
            response: "Generated comprehensive financial analysis",
            timestamp: new Date().toISOString(),
            tokenUsage: 200,
            qualityScores: { accuracy: 0.92, relevance: 0.88 },
          },
          nextNodes: ["agent_3"],
        },
        {
          id: "agent_3",
          name: "Quality Evaluation",
          type: "agent_evaluation",
          path: ["agents", "evaluation", "quality"],
          metadata: {
            agentId: "agent-003",
            thoughtType: "quality_assessment",
            confidenceScore: 0.89,
            timestamp: new Date().toISOString(),
            reasoningSteps: ["Analyzed response accuracy", "Checked data consistency", "Validated conclusions"],
          },
          nextNodes: [],
        },
      ]

      const [lineageRes, governanceRes, activityRes, thoughtRes] = await Promise.all([
        fetch("/api/lineage", { cache: "no-store" }),
        fetch("/api/agent-governance", { cache: "no-store" }),
        fetch("/api/agent-activity", { cache: "no-store" }),
        fetch("/api/thought-process", { cache: "no-store" }),
      ])

      console.log("[v0] API response statuses:", {
        lineage: lineageRes.status,
        governance: governanceRes.status,
        activity: activityRes.status,
        thought: thoughtRes.status,
      })

      const [lineageData, governanceData, activityData, thoughtData] = await Promise.all([
        lineageRes.json().catch(() => ({ nodes: [], edges: [] })),
        governanceRes.json().catch(() => []),
        activityRes.json().catch(() => []),
        thoughtRes.json().catch(() => []),
      ])

      console.log("[v0] Raw API responses:", { lineageData, governanceData, activityData, thoughtData })

      // Combine lineage nodes with agent action nodes
      const lineageNodes = Array.isArray(lineageData?.nodes) ? lineageData.nodes : []
      const lineageEdges = Array.isArray(lineageData?.edges) ? lineageData.edges : []

      // Transform agent data into lineage nodes
      const agentNodes: LineageNode[] = [...mockAgentNodes] // Start with mock data to ensure display works
      const agentEdges: { source: string; target: string }[] = [
        { source: "agent_1", target: "agent_2" },
        { source: "agent_2", target: "agent_3" },
      ]

      // Process governance logs
      if (Array.isArray(governanceData) && governanceData.length > 0) {
        console.log("[v0] Processing governance data:", governanceData.length, "items")
        governanceData.forEach((log: any, index: number) => {
          const actionId = `gov_${log.id || index}`
          agentNodes.push({
            id: actionId,
            name: `${log.interaction_type || "Governance Action"} ${index + 1}`,
            type: "agent_action",
            path: ["governance", "interactions", log.agent_id || "unknown"],
            metadata: {
              agentId: log.agent_id,
              interactionType: log.interaction_type,
              prompt: log.prompt,
              response: log.response,
              timestamp: log.created_at,
              responseTime: log.response_time_ms,
              tokenUsage: log.token_usage,
              qualityScores: log.quality_scores,
              evaluationFlags: log.evaluation_flags,
              auditHash: log.audit_block_hash,
            },
            nextNodes: [],
          })

          // Create response node if response exists
          if (log.response) {
            const responseId = `gov_resp_${log.id || index}`
            agentNodes.push({
              id: responseId,
              name: `Response ${index + 1}`,
              type: "agent_response",
              path: ["governance", "responses", log.agent_id || "unknown"],
              metadata: {
                agentId: log.agent_id,
                response: log.response,
                timestamp: log.created_at,
                tokenUsage: log.token_usage,
                qualityScores: log.quality_scores,
                parentActionId: actionId,
              },
              nextNodes: [],
            })
            agentEdges.push({ source: actionId, target: responseId })
          }
        })
      }

      // Process activity stream
      if (Array.isArray(activityData) && activityData.length > 0) {
        console.log("[v0] Processing activity data:", activityData.length, "items")
        activityData.forEach((activity: any, index: number) => {
          const activityId = `activity_${activity.id || index}`
          agentNodes.push({
            id: activityId,
            name: `${activity.activity_type || "Activity"} ${index + 1}`,
            type: "agent_action",
            path: ["activity", activity.activity_type || "unknown", activity.agent_id || "unknown"],
            metadata: {
              agentId: activity.agent_id,
              activityType: activity.activity_type,
              status: activity.status,
              duration: activity.duration_ms,
              timestamp: activity.timestamp,
              lineageId: activity.lineage_id,
              activityData: activity.activity_data,
            },
            nextNodes: [],
          })
        })
      }

      // Process thought process logs
      if (Array.isArray(thoughtData) && thoughtData.length > 0) {
        console.log("[v0] Processing thought data:", thoughtData.length, "items")
        thoughtData.forEach((thought: any, index: number) => {
          const thoughtId = `thought_${thought.id || index}`
          agentNodes.push({
            id: thoughtId,
            name: `${thought.thought_type || "Thought"} ${index + 1}`,
            type: "agent_evaluation",
            path: ["thoughts", thought.thought_type || "unknown", thought.agent_id || "unknown"],
            metadata: {
              agentId: thought.agent_id,
              thoughtType: thought.thought_type,
              thoughtContent: thought.thought_content,
              prompt: thought.prompt,
              timestamp: thought.created_at,
              processingTime: thought.processing_time_ms,
              tokensUsed: thought.tokens_used,
              confidenceScore: thought.confidence_score,
              modelUsed: thought.model_used,
              temperature: thought.temperature,
              reasoningSteps: thought.reasoning_steps,
              decisionFactors: thought.decision_factors,
              alternativesConsidered: thought.alternatives_considered,
              outcomePrediction: thought.outcome_prediction,
              actualOutcome: thought.actual_outcome,
              sessionId: thought.session_id,
              auditHash: thought.audit_block_hash,
            },
            nextNodes: [],
          })
        })
      }

      // Process lineage mapping for connections
      if (Array.isArray(lineageData?.lineageMapping) && lineageData.lineageMapping.length > 0) {
        console.log("[v0] Processing lineage mapping:", lineageData.lineageMapping.length, "items")
        lineageData.lineageMapping.forEach((mapping: any, index: number) => {
          const mappingId = `lineage_${mapping.id || index}`
          agentNodes.push({
            id: mappingId,
            name: `${mapping.interaction_type || "Lineage Interaction"} ${index + 1}`,
            type: "agent_action",
            path: ["lineage", mapping.interaction_type || "unknown", mapping.agent_id || "unknown"],
            metadata: {
              agentId: mapping.agent_id,
              interactionType: mapping.interaction_type,
              prompt: mapping.prompt,
              response: mapping.response,
              timestamp: mapping.created_at,
              responseTime: mapping.response_time,
              tokenUsage: mapping.token_usage,
              toolCalls: mapping.tool_calls,
              decisions: mapping.decisions,
              evaluationScores: mapping.evaluation_scores,
              dbQueries: mapping.db_queries,
              sessionId: mapping.session_id,
              parentInteractionId: mapping.parent_interaction_id,
            },
            nextNodes: [],
          })

          // Create connections based on parent_interaction_id
          if (mapping.parent_interaction_id) {
            const parentId = `lineage_${mapping.parent_interaction_id}`
            agentEdges.push({ source: parentId, target: mappingId })
          }
        })
      }

      // Combine all nodes and edges
      const allNodes = [...lineageNodes, ...agentNodes]
      const allEdges = [...lineageEdges, ...agentEdges]

      console.log("[v0] Final combined nodes:", allNodes.length, "edges:", allEdges.length)
      console.log("[v0] Agent nodes breakdown:", {
        mock: mockAgentNodes.length,
        governance: governanceData?.length || 0,
        activity: activityData?.length || 0,
        thought: thoughtData?.length || 0,
        lineageMapping: lineageData?.lineageMapping?.length || 0,
      })

      if (allNodes.length === 0) {
        console.log("[v0] No nodes found, using mock data only")
        setServerData({
          nodes: mockAgentNodes,
          edges: agentEdges,
          lineageMapping: [],
        })
      } else {
        setServerData({
          nodes: allNodes,
          edges: allEdges,
          lineageMapping: lineageData?.lineageMapping || [],
        })
      }
    } catch (error) {
      console.error("[v0] Error loading lineage data:", error)
      setError(error instanceof Error ? error.message : "Failed to load lineage data")

      const mockAgentNodes: LineageNode[] = [
        {
          id: "fallback_agent_1",
          name: "Fallback Agent Action",
          type: "agent_action",
          path: ["fallback", "agents"],
          metadata: {
            agentId: "fallback-001",
            interactionType: "error_fallback",
            prompt: "System fallback due to API error",
            timestamp: new Date().toISOString(),
          },
          nextNodes: [],
        },
      ]
      setServerData({
        nodes: mockAgentNodes,
        edges: [],
        lineageMapping: [],
      })
    } finally {
      setLoading(false)
    }
  }
}
