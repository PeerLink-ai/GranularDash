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
  Bot,
  Brain,
  Database,
  Zap,
  Activity,
  User,
  Building,
  AlertTriangle,
  Copy,
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
import { useEffect } from "react"

function formatTimestamp(timestamp: string | number | undefined | null) {
  try {
    if (!timestamp) return "Invalid Date"

    // Handle Unix timestamps (seconds or milliseconds)
    let date: Date
    if (typeof timestamp === "number" || /^\d+$/.test(timestamp.toString())) {
      const num = Number(timestamp)
      // If timestamp is in seconds (less than year 2100), convert to milliseconds
      date = new Date(num < 4000000000 ? num * 1000 : num)
    } else {
      date = new Date(timestamp)
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }

    return date.toLocaleString()
  } catch (error) {
    console.error("[v0] Error formatting timestamp:", error, timestamp)
    return "Invalid Date"
  }
}

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
    tokenUsage?: number | { total?: number; prompt?: number; completion?: number }
    evaluationScore?: number
    parentActionId?: string
    timestamp?: string
    duration?: number
    model?: string
    temperature?: number
    maxTokens?: number
    interactionType?: number
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
    rawLog?: any
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

function layoutNodes(data: LineageNode[], opts: { colGap?: number; rowGap?: number } = {}): Node[] {
  if (!Array.isArray(data)) return []

  const colGap = opts.colGap ?? 400
  const rowGap = opts.rowGap ?? 150

  // Group nodes by agent for better organization
  const agentGroups = new Map<string, LineageNode[]>()

  for (const n of data) {
    const agentId = n.metadata?.agentId || "unknown"
    if (!agentGroups.has(agentId)) agentGroups.set(agentId, [])
    agentGroups.get(agentId)!.push(n)
  }

  const nodes: Node[] = []
  let xOffset = 100

  for (const [agentId, agentNodes] of agentGroups) {
    // Sort nodes by timestamp
    agentNodes.sort((a, b) => {
      const aTime = formatTimestamp(a.metadata?.timestamp || 0)
      const bTime = formatTimestamp(b.metadata?.timestamp || 0)
      const aDate = aTime === "Invalid Date" ? 0 : new Date(aTime).getTime()
      const bDate = bTime === "Invalid Date" ? 0 : new Date(bTime).getTime()
      return aDate - bDate
    })

    // Create agent summary node
    const errorCount = agentNodes.filter((n) => n.metadata?.level === "error").length
    const warningCount = agentNodes.filter((n) => n.metadata?.level === "warning").length

    const agentSummary = {
      id: `agent_${agentId}`,
      type: "default",
      position: { x: xOffset, y: 50 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        label: (
          <div className="p-3 text-center">
            <div className="text-sm font-bold text-white mb-1">Agent {agentId}</div>
            <div className="text-xs text-blue-100 space-y-1">
              <div>{agentNodes.length} Actions</div>
              {errorCount > 0 && <div className="text-red-200">{errorCount} Errors</div>}
              {warningCount > 0 && <div className="text-yellow-200">{warningCount} Warnings</div>}
            </div>
          </div>
        ),
        node: {
          id: `agent_${agentId}`,
          name: `Agent ${agentId}`,
          type: "agent" as const,
          path: ["agents", agentId],
          metadata: {
            agentId,
            totalActions: agentNodes.length,
            errorCount,
            warningCount,
            logs: agentNodes,
          },
          nextNodes: [],
        },
      },
      style: {
        width: 160,
        height: 80,
        borderRadius: 12,
        border: errorCount > 0 ? "3px solid #dc2626" : "3px solid #1e40af",
        background:
          errorCount > 0
            ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
            : "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
        boxShadow: "0 6px 20px rgba(30, 64, 175, 0.3)",
        color: "white",
      },
      draggable: true,
    }
    nodes.push(agentSummary)

    // Create individual action nodes in a vertical flow
    agentNodes.forEach((node, index) => {
      const yPos = 200 + index * 120

      const nodeStyle = {
        background:
          node.metadata?.level === "error"
            ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
            : node.metadata?.level === "warning"
              ? "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
              : node.type === "agent_response"
                ? "linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                : "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
        border: "2px solid rgba(255,255,255,0.2)",
        color: "white",
      }

      nodes.push({
        id: node.id,
        type: "default",
        position: { x: xOffset, y: yPos },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="p-3 rounded-lg min-w-[140px]" style={nodeStyle}>
              <div className="font-semibold text-xs mb-1">{node.type.replace("agent_", "").toUpperCase()}</div>
              <div className="text-xs opacity-90 mb-1">{formatTimestamp(node.metadata?.timestamp)}</div>
              <div className="text-xs">{node.name}</div>
              {node.metadata?.level && (
                <div className="text-xs mt-1 px-1 py-0.5 bg-black/20 rounded text-center">{node.metadata.level}</div>
              )}
            </div>
          ),
          node,
        },
        style: {
          width: 140,
          height: 70,
          borderRadius: 8,
          ...nodeStyle,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        draggable: true,
      })
    })

    xOffset += colGap
  }

  return nodes
}

function buildEdges(data: LineageNode[]): Edge[] {
  if (!Array.isArray(data)) return []

  const edges: Edge[] = []
  const nodeIds = new Set(data.map((n) => n.id))

  // Create edges from nextNodes relationships
  for (const node of data) {
    for (const nextId of node.nextNodes ?? []) {
      if (!nodeIds.has(nextId)) continue

      edges.push({
        id: `edge-${node.id}-${nextId}`,
        source: node.id,
        target: nextId,
        type: "smoothstep",
        animated: true,
        style: {
          stroke: "#3b82f6",
          strokeWidth: 3,
          strokeDasharray: "8,4",
        },
        markerEnd: {
          type: "arrowclosed",
          color: "#3b82f6",
          width: 20,
          height: 20,
        },
      })
    }
  }

  return edges
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
  URL.revokeObjectURL(dataUrl)
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
  onNodeClick,
}: {
  nodes: Node[]
  edges: Edge[]
  onNodeClick: (id: string) => void
}) {
  console.log("[v0] GraphCanvas received nodes:", nodes.length, "edges:", edges.length)

  const rf = useReactFlow()
  const [styledNodes, setStyledNodes] = React.useState(nodes)

  React.useEffect(() => {
    setStyledNodes(nodes)
  }, [nodes])

  React.useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        rf.fitView({ duration: 500, padding: 0.1 })
      }, 200)
    }
  }, [nodes, rf])

  return (
    <div className="relative h-[600px] rounded-xl border-2 border-gray-200 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        onNodeClick={(_, n) => onNodeClick(n.id)}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        fitViewOptions={{ duration: 500, padding: 0.1 }}
        proOptions={{ hideAttribution: true }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            if (node.id.startsWith("agent_")) return "#1e40af"
            if (node.id.startsWith("conversation_")) return "#6b7280"
            return "#3b82f6"
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            border: "2px solid #e5e7eb",
            borderRadius: "12px",
            width: 220,
            height: 160,
            backdropFilter: "blur(8px)",
          }}
        />
        <Background variant="dots" gap={20} size={1.5} color="#cbd5e1" style={{ opacity: 0.4 }} />
        <Controls
          position="bottom-right"
          className="!bg-white/90 !border-2 !border-gray-200 !rounded-xl !shadow-xl !backdrop-blur-sm"
          showFitView={true}
          showZoom={true}
          showInteractive={true}
        >
          <button
            className="react-flow__controls-button !text-gray-700 hover:!bg-blue-50 hover:!text-blue-700 transition-all duration-200 border-0 bg-transparent"
            onClick={() => rf.zoomIn({ duration: 200 })}
            title="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            className="react-flow__controls-button !text-gray-700 hover:!bg-blue-50 hover:!text-blue-700 transition-all duration-200 border-0 bg-transparent"
            onClick={() => rf.zoomOut({ duration: 200 })}
            title="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            className="react-flow__controls-button !text-gray-700 hover:!bg-blue-50 hover:!text-blue-700 transition-all duration-200 border-0 bg-transparent"
            onClick={() => rf.fitView({ duration: 500, padding: 0.1 })}
            title="Fit view"
          >
            <Focus className="h-5 w-5" />
          </button>
        </Controls>
      </ReactFlow>
    </div>
  )
}

function NodeDetailsPanel({ node }: { node: LineageNode | null }) {
  if (!node) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-muted-foreground">
          <div className="mb-2">Select a node to view details</div>
          <div className="text-sm">Click on any agent or action node to explore its data</div>
        </CardContent>
      </Card>
    )
  }

  const rawLog = node.metadata?.rawLog
  const hasDetailedPayload = rawLog?.payload && typeof rawLog.payload === "object"
  const isAgent = node.type === "agent"
  const isError = node.metadata?.level === "error"
  const isWarning = node.metadata?.level === "warning"

  const exportNodeData = () => {
    const exportData = {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      timestamp: node.metadata?.timestamp,
      agentId: node.metadata?.agentId,
      payload: rawLog?.payload,
      metadata: node.metadata,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lineage-${node.id}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {React.createElement(TYPE_THEME[node.type].icon, { className: "h-5 w-5" })}
            {node.name}
            {(isError || isWarning) && (
              <Badge variant={isError ? "destructive" : "secondary"}>{node.metadata?.level}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportNodeData}>
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(JSON.stringify(node, null, 2))}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAgent && node.metadata?.logs && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Agent Performance Summary</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">Total Actions</div>
                <div className="text-2xl font-bold text-blue-600">{node.metadata.totalActions}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">Error Rate</div>
                <div className="text-2xl font-bold text-red-600">
                  {node.metadata.errorCount || 0}/{node.metadata.totalActions}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Recent Activity</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {(node.metadata.logs as LineageNode[]).slice(-5).map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 bg-muted rounded">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        log.metadata?.level === "error"
                          ? "bg-red-500"
                          : log.metadata?.level === "warning"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                    />
                    <div className="flex-1">{log.name}</div>
                    <div className="text-muted-foreground">{formatTimestamp(log.metadata?.timestamp)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isAgent && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Type:</span>
              <div className="text-muted-foreground">{node.type}</div>
            </div>
            <div>
              <span className="font-medium">Agent ID:</span>
              <div className="text-muted-foreground font-mono">{node.metadata?.agentId || "N/A"}</div>
            </div>
            {node.metadata?.timestamp && (
              <div>
                <span className="font-medium">Timestamp:</span>
                <div className="text-muted-foreground">{formatTimestamp(node.metadata.timestamp)}</div>
              </div>
            )}
            {node.metadata?.duration && (
              <div>
                <span className="font-medium">Duration:</span>
                <div
                  className={`font-mono ${node.metadata.duration > 5000 ? "text-red-600" : "text-muted-foreground"}`}
                >
                  {node.metadata.duration}ms
                </div>
              </div>
            )}
            {node.metadata?.tokenUsage && (
              <div>
                <span className="font-medium">Tokens:</span>
                <div className="text-muted-foreground font-mono">
                  {typeof node.metadata.tokenUsage === "object"
                    ? node.metadata.tokenUsage.total || "N/A"
                    : node.metadata.tokenUsage}
                </div>
              </div>
            )}
            {node.metadata?.model && (
              <div>
                <span className="font-medium">Model:</span>
                <div className="text-muted-foreground">{node.metadata.model}</div>
              </div>
            )}
          </div>
        )}

        {(isError || isWarning) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-sm">Issue Analysis</span>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
              <div className="font-medium text-red-800 mb-1">{isError ? "Error Detected" : "Warning Detected"}</div>
              <div className="text-red-700">
                {rawLog?.payload?.error || rawLog?.payload?.message || "No specific error message available"}
              </div>
              {rawLog?.payload?.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-600 hover:text-red-800">Stack Trace</summary>
                  <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-x-auto">{rawLog.payload.stack}</pre>
                </details>
              )}
            </div>
          </div>
        )}

        {hasDetailedPayload && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Payload Explorer</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(JSON.stringify(rawLog.payload, null, 2))}
              >
                Copy JSON
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono">{JSON.stringify(rawLog.payload, null, 2)}</pre>
            </div>
          </div>
        )}

        {node.metadata?.prompt && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Input Prompt</span>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(node.metadata?.prompt || "")}>
                Copy
              </Button>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm max-h-32 overflow-y-auto">
              {node.metadata.prompt}
            </div>
          </div>
        )}

        {node.metadata?.response && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Response Output</span>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(node.metadata?.response || "")}>
                Copy
              </Button>
            </div>
            <div className="bg-green-50 border border-green-200 p-3 rounded-md text-sm max-h-32 overflow-y-auto">
              {node.metadata.response}
            </div>
          </div>
        )}

        {node.metadata?.evaluationScore && (
          <div className="space-y-2">
            <span className="font-medium text-sm">Performance Score</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(node.metadata.evaluationScore / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-mono">{node.metadata.evaluationScore}/10</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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

  const loadLineage = React.useCallback(() => {
    // This function will be defined later to fetch and process lineage data
  }, [])

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

  const edgesRaw = React.useMemo(() => {
    if (!serverData?.edges && !Array.isArray(raw)) return []

    // Use buildEdges function for proper connections
    const builtEdges = buildEdges(raw)

    // Add server edges if available
    const serverEdges = (serverData?.edges || []).map((edge) => ({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: true,
      style: {
        stroke: "#10b981",
        strokeWidth: 2,
        strokeDasharray: "5,5",
      },
      markerEnd: {
        type: "arrowclosed",
        color: "#10b981",
      },
    }))

    return [...builtEdges, ...serverEdges]
  }, [serverData?.edges, raw])

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

  const rfNodesBase = React.useMemo(() => {
    console.log("[v0] Creating ReactFlow nodes from filtered data:", filteredData.length)
    const layoutResult = layoutNodes(filteredData)
    console.log("[v0] Layout result:", layoutResult.length)
    return layoutResult
  }, [filteredData])

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodesBase)
  const [edges, , onEdgesChange] = useEdgesState(
    edgesRaw.filter((e) => rfNodesBase.find((n) => n.id === e.source) && rfNodesBase.find((n) => n.id === e.target)),
  )

  React.useEffect(() => {
    console.log("[v0] Updating ReactFlow nodes:", rfNodesBase.length)
    setNodes(rfNodesBase)
  }, [rfNodesBase, setNodes])

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("[v0] Fetching SDK logs...")

        const response = await fetch("/api/sdk/log")
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        console.log("[v0] SDK logs response:", data)

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const nodes: LineageNode[] = []
          const edges: Edge[] = []

          // Group logs by agent
          const agentGroups = new Map<string, any[]>()
          data.data.forEach((log: any) => {
            const agentId = log.agentId || log.agent_id || "unknown-agent"
            if (!agentGroups.has(agentId)) {
              agentGroups.set(agentId, [])
            }
            agentGroups.get(agentId)!.push(log)
          })

          console.log("[v0] Found", agentGroups.size, "unique agents")

          // Create nodes for each agent and their logs
          agentGroups.forEach((logs, agentId) => {
            // Sort logs by timestamp
            const sortedLogs = logs.sort((a, b) => {
              const aTime = typeof a.timestamp === "number" ? a.timestamp : 0
              const bTime = typeof b.timestamp === "number" ? b.timestamp : 0
              return aTime - bTime
            })

            // Create individual log nodes (no agent summary duplication)
            sortedLogs.forEach((log, index) => {
              const logNodeId = `log-${log.id}`
              const logType = log.type || "unknown"
              const level = log.level || "info"

              nodes.push({
                id: logNodeId,
                name: `${logType}`,
                type:
                  logType.includes("request") || logType.includes("action")
                    ? "agent_action"
                    : logType.includes("response") || logType.includes("completion")
                      ? "agent_response"
                      : "agent_evaluation",
                path: ["agents", agentId, logType],
                metadata: {
                  agentId: agentId,
                  logType: logType,
                  level: level,
                  timestamp: log.timestamp,
                  payload: log.payload,
                  duration: log.payload?.duration_ms,
                  tokenUsage: log.payload?.tokens || log.payload?.token_usage,
                  model: log.payload?.model,
                  prompt: log.payload?.prompt,
                  response: log.payload?.response,
                  evaluationScore: log.payload?.score,
                  rawLog: log,
                },
                nextNodes: [],
              })

              // Create sequential edges between logs of the same agent
              if (index > 0) {
                const prevLogId = `log-${sortedLogs[index - 1].id}`
                edges.push({
                  id: `edge-${prevLogId}-${logNodeId}`,
                  source: prevLogId,
                  target: logNodeId,
                  type: "smoothstep",
                  animated: level === "error",
                  style: {
                    stroke: level === "error" ? "#dc2626" : level === "warning" ? "#f59e0b" : "#10b981",
                    strokeWidth: 2,
                  },
                  markerEnd: {
                    type: "arrowclosed",
                    color: level === "error" ? "#dc2626" : level === "warning" ? "#f59e0b" : "#10b981",
                  },
                })
              }
            })
          })

          console.log("[v0] Created", nodes.length, "nodes and", edges.length)
          setServerData({ nodes, edges })
        } else {
          console.log("[v0] No SDK logs found")
          setError("No SDK logs found. Generate some test data or run agent activities.")
        }
      } catch (err) {
        console.error("[v0] Error loading SDK logs:", err)
        setError(`Failed to load SDK logs: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [loadLineage])

  const debugInfo = React.useMemo(() => {
    return {
      serverDataNodes: serverData?.nodes?.length || 0,
      serverDataEdges: serverData?.edges?.length || 0,
      rawNodes: raw.length,
      filteredNodes: filteredData.length,
      rfNodes: nodes.length,
      rfEdges: edges.length,
    }
  }, [serverData, raw, filteredData, nodes, edges])

  return (
    <ReactFlowProvider>
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Agent Actions & Data Lineage</CardTitle>
              <CardDescription className="text-muted-foreground">
                Visualize your complete AI pipeline: live agent actions, models, deployments, evaluations, and data
                flows with real-time audit tracking.
              </CardDescription>
              <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Debug: Server({debugInfo.serverDataNodes}n, {debugInfo.serverDataEdges}e) → Raw({debugInfo.rawNodes}) →
                Filtered({debugInfo.filteredNodes}) → Display({debugInfo.rfNodes}n, {debugInfo.rfEdges}e)
                {loading && " | Loading..."}
                {error && ` | Error: ${error}`}
              </div>
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

          {!loading && raw.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-lg font-medium">No lineage data found</div>
              <div className="text-sm mt-2">
                Try running some playground tests or check if your database contains lineage data.
                <br />
                Check the browser console for detailed debugging information.
              </div>
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
                onNodeClick={(id) => {
                  const n = raw.find((x) => x.id === id)
                  if (n) setSelected(n)
                }}
              />

              <p className="text-xs text-muted-foreground">
                Tip: Drag to pan, scroll to zoom, and drag nodes to adjust layout. Agent actions show real-time audit
                data.
              </p>
            </div>

            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Node Details</CardTitle>
                  <CardDescription>Inspect metadata and agent action details.</CardDescription>
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
                        <TabsList className="grid grid-cols-3">
                          <TabsTrigger value="details" className="gap-2">
                            <Info className="h-4 w-4" />
                            Details
                          </TabsTrigger>
                          <TabsTrigger value="path" className="gap-2">
                            <GitBranch className="h-4 w-4" />
                            Path
                          </TabsTrigger>
                          {selected.type.startsWith("agent") && selected.metadata.agentId && (
                            <TabsTrigger value="agent" className="gap-2">
                              <Bot className="h-4 w-4" />
                              Agent
                            </TabsTrigger>
                          )}
                        </TabsList>
                        <TabsContent value="details" className="mt-3">
                          <div className="space-y-2 text-sm">
                            {Object.entries(selected.metadata).map(([key, value]) =>
                              value ? (
                                <div key={key}>
                                  <div className="text-muted-foreground">
                                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                                  </div>
                                  <div className="font-medium break-words">
                                    {key === "prompt" || key === "response"
                                      ? String(value).length > 100
                                        ? `${String(value).substring(0, 100)}...`
                                        : String(value)
                                      : String(value)}
                                  </div>
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
                        {selected.type.startsWith("agent") && selected.metadata.agentId && (
                          <TabsContent value="agent" className="mt-3">
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Agent ID:</span>
                                <code className="text-xs bg-muted px-1 rounded">{selected.metadata.agentId}</code>
                              </div>

                              {selected.metadata.prompt && (
                                <div>
                                  <div className="text-muted-foreground mb-1">Prompt:</div>
                                  <div className="bg-muted/50 p-2 rounded text-xs max-h-32 overflow-y-auto">
                                    {selected.metadata.prompt}
                                  </div>
                                </div>
                              )}

                              {selected.metadata.response && (
                                <div>
                                  <div className="text-muted-foreground mb-1">Response:</div>
                                  <div className="bg-muted/50 p-2 rounded text-xs max-h-32 overflow-y-auto">
                                    {selected.metadata.response}
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {selected.metadata.tokenUsage && (
                                  <Badge variant="outline">
                                    {typeof selected.metadata.tokenUsage === "object"
                                      ? `${selected.metadata.tokenUsage.total || selected.metadata.tokenUsage.prompt + selected.metadata.tokenUsage.completion || "N/A"} tokens`
                                      : `${selected.metadata.tokenUsage} tokens`}
                                  </Badge>
                                )}
                                {selected.metadata.evaluationScore && (
                                  <Badge variant="outline">Score: {String(selected.metadata.evaluationScore)}</Badge>
                                )}
                                {selected.metadata.duration && (
                                  <Badge variant="outline">{String(selected.metadata.duration)}ms</Badge>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                        )}
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
                              if (selected.type === "dataset") onOpenDatasetVersioning()
                              else if (selected.type === "transformation") onOpenTransformationSteps()
                              else if (selected.type === "model") onOpenModelVersionTracking()
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
                      Select a node from the graph to view its details and agent actions.
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
