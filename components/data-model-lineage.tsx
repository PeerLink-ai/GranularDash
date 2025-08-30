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
  Clock,
  User,
  Building,
} from "lucide-react"

import "reactflow/dist/style.css"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
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
    tokenUsage?: number | { total?: number; prompt?: number; completion?: number }
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
    confidenceScore?: string
    modelUsed?: string
    reasoningSteps?: any
    decisionFactors?: any
    alternativesConsidered?: any
    outcomePrediction?: string
    actualOutcome?: string
    groupedNodes?: LineageNode[]
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

  const colGap = opts.colGap ?? 400
  const rowGap = opts.rowGap ?? 120

  // Group nodes by agent and conversation chains
  const agentGroups = new Map<string, LineageNode[]>()

  for (const n of data) {
    const agentId = n.metadata?.agentId || "unknown"
    if (!agentGroups.has(agentId)) agentGroups.set(agentId, [])
    agentGroups.get(agentId)!.push(n)
  }

  const nodes: Node[] = []
  let xOffset = 0

  for (const [agentId, agentNodes] of agentGroups) {
    // Create agent summary node
    const agentSummary = {
      id: `agent_${agentId}`,
      type: "default",
      position: { x: xOffset, y: 0 },
      data: {
        label: `Agent: ${agentId}`,
        node: {
          id: `agent_${agentId}`,
          name: `Agent ${agentId}`,
          type: "agent" as const,
          path: ["agents", agentId],
          metadata: {
            agentId,
            totalActions: agentNodes.length,
            avgResponseTime:
              agentNodes.reduce((acc, n) => acc + (n.metadata?.responseTime || 0), 0) / agentNodes.length,
            totalTokens: agentNodes.reduce(
              (acc, n) =>
                acc +
                (typeof n.metadata?.tokenUsage === "object"
                  ? n.metadata.tokenUsage.total || 0
                  : n.metadata?.tokenUsage || 0),
              0,
            ),
          },
          nextNodes: [],
        },
      },
      style: {
        width: 300,
        height: 120,
        borderRadius: 16,
        borderWidth: 3,
        padding: 20,
        background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
        color: "white",
        fontWeight: "bold",
        boxShadow: "0 8px 32px rgba(30, 64, 175, 0.3)",
        border: "2px solid rgba(255,255,255,0.2)",
      },
    }
    nodes.push(agentSummary)

    // Group agent's nodes by conversation chains
    const agentConversations = new Map<string, LineageNode[]>()
    for (const node of agentNodes) {
      const sessionId = node.metadata?.sessionId || node.metadata?.parentInteractionId || "default"
      if (!agentConversations.has(sessionId)) agentConversations.set(sessionId, [])
      agentConversations.get(sessionId)!.push(node)
    }

    let yOffset = 200
    for (const [sessionId, sessionNodes] of agentConversations) {
      // Sort by timestamp to show thought progression
      sessionNodes.sort((a, b) => {
        const aTime = new Date(a.metadata?.timestamp || 0).getTime()
        const bTime = new Date(b.metadata?.timestamp || 0).getTime()
        return aTime - bTime
      })

      // Limit to max 4 nodes per conversation to prevent overcrowding
      const displayNodes = sessionNodes.slice(0, 4)

      displayNodes.forEach((node, index) => {
        const nodeId = node.id
        const nodeX = xOffset + 100 + index * 250
        const nodeY = yOffset

        nodes.push({
          id: nodeId,
          type: "default",
          position: { x: nodeX, y: nodeY },
          data: { label: node.name, node },
          style: {
            width: 220,
            height: 100,
            borderRadius: 12,
            borderWidth: 2,
            padding: 12,
            background:
              node.type === "agent_action"
                ? "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)"
                : node.type === "agent_evaluation"
                  ? "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                  : "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
            color: "white",
            fontWeight: "600",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            border: "2px solid rgba(255,255,255,0.2)",
          },
        })
      })

      yOffset += 180
    }

    xOffset += 1000
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
    console.log("[v0] Creating styled nodes:", nodes.length)
    const styled = nodes.map((n): Node => {
      const isSelected = n.id === selectedId
      const isHighlighted = highlightSet?.has(n.id) || false

      const isDimmed = dimNonMatches && !isHighlighted && !isSelected

      // Enhanced styling for different node types
      const getNodeStyle = (nodeType: string) => {
        const baseStyle = {
          borderRadius: 16,
          borderWidth: isSelected ? 4 : 2,
          padding: 16,
          minHeight: 100,
          boxShadow: isSelected ? "0 12px 40px rgba(0,0,0,0.25)" : "0 6px 20px rgba(0,0,0,0.15)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: isDimmed ? 0.4 : 1,
          transform: isSelected ? "scale(1.05)" : "scale(1)",
          border: "2px solid rgba(255,255,255,0.2)",
        }

        switch (nodeType) {
          case "agent":
            return {
              ...baseStyle,
              backgroundColor: "#1e40af",
              color: "white",
              borderColor: "#3b82f6",
              background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            }
          case "agent_action":
            return {
              ...baseStyle,
              backgroundColor: "#3b82f6",
              color: "white",
              borderColor: "#60a5fa",
              background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
            }
          case "agent_response":
            return {
              ...baseStyle,
              backgroundColor: "#10b981",
              color: "white",
              borderColor: "#34d399",
              background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
            }
          case "agent_evaluation":
            return {
              ...baseStyle,
              backgroundColor: "#f59e0b",
              color: "white",
              borderColor: "#fbbf24",
              background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
            }
          case "summary":
            return {
              ...baseStyle,
              backgroundColor: "#8b5cf6",
              color: "white",
              borderColor: "#a78bfa",
              background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
            }
          default:
            return {
              ...baseStyle,
              backgroundColor: "#6b7280",
              color: "white",
              borderColor: "#9ca3af",
            }
        }
      }

      return {
        ...n,
        style: getNodeStyle(n.data.node.type),
        data: {
          ...n.data,
          label: (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm truncate">{n.data.node.name}</h4>
                {n.data.node.metadata?.groupedNodes && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    +{n.data.node.metadata.groupedNodes.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs opacity-90">
                <span className="capitalize">{n.data.node.type.replace("_", " ")}</span>
                {n.data.node.metadata.timestamp && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(n.data.node.metadata.timestamp).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Enhanced metadata display for different node types */}
              {n.data.node.type === "agent" && (
                <div className="flex flex-wrap gap-1 text-xs">
                  <Badge variant="outline" className="text-[10px] bg-white/20">
                    {n.data.node.metadata.totalTokens} tokens
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-white/20">
                    {Math.round(n.data.node.metadata.avgResponseTime)}ms avg
                  </Badge>
                </div>
              )}

              {(n.data.node.type === "agent_action" || n.data.node.type === "agent_response") && (
                <div className="flex items-center gap-2 text-xs">
                  {n.data.node.metadata.tokenUsage && (
                    <Badge variant="outline" className="text-[10px] bg-white/20">
                      {typeof n.data.node.metadata.tokenUsage === "object"
                        ? `${n.data.node.metadata.tokenUsage.total || n.data.node.metadata.tokenUsage.prompt + n.data.node.metadata.tokenUsage.completion || "N/A"} tokens`
                        : `${n.data.node.metadata.tokenUsage} tokens`}
                    </Badge>
                  )}
                  {n.data.node.metadata.evaluationScore && (
                    <Badge variant="outline" className="text-[10px] bg-white/20">
                      Score: {String(n.data.node.metadata.evaluationScore)}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ),
        },
      } satisfies Node
    })

    console.log("[v0] Styled nodes created:", styled.length)
    return styled
  }, [nodes, selectedId, highlightSet, dimNonMatches])

  React.useEffect(() => {
    console.log("[v0] ReactFlow nodes updated:", nodes.length)
    if (nodes.length > 0) {
      // Force ReactFlow to re-render with new nodes
      setTimeout(() => {
        rf.fitView({ duration: 350, padding: 0.2 })
      }, 100)
    }
  }, [nodes, rf])

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
        fitViewOptions={{ duration: 350, padding: 0.2 }}
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

  const edgesRaw = React.useMemo(() => {
    if (!serverData?.edges) return []

    const enhancedEdges: Edge[] = []

    // Add server edges
    serverData.edges.forEach((edge, index) => {
      enhancedEdges.push({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: true,
        style: {
          stroke: `hsl(${220 + ((index * 30) % 120)}, 70%, 60%)`,
          strokeWidth: 3,
          strokeDasharray: "8,4",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
        },
        markerEnd: {
          type: "arrowclosed",
          color: `hsl(${220 + ((index * 30) % 120)}, 70%, 60%)`,
          width: 20,
          height: 20,
        },
      })
    })

    return enhancedEdges
  }, [serverData?.edges])

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

  const agentConnectionEdges = React.useMemo(() => {
    const connectionEdges: Edge[] = []
    const safeFilteredData = Array.isArray(filteredData) ? filteredData : []

    if (safeFilteredData.length > 0) {
      const agentGroups = new Map<string, LineageNode[]>()

      for (const node of safeFilteredData) {
        const agentId = node.metadata?.agentId || "unknown"
        if (!agentGroups.has(agentId)) agentGroups.set(agentId, [])
        agentGroups.get(agentId)!.push(node)
      }

      for (const [agentId, agentNodes] of agentGroups) {
        const sortedNodes = agentNodes.sort((a, b) => {
          const aTime = new Date(a.metadata?.timestamp || 0).getTime()
          const bTime = new Date(b.metadata?.timestamp || 0).getTime()
          return aTime - bTime
        })

        // Connect agent summary to first action
        if (sortedNodes.length > 0) {
          connectionEdges.push({
            id: `agent_${agentId}-${sortedNodes[0].id}`,
            source: `agent_${agentId}`,
            target: sortedNodes[0].id,
            type: "smoothstep",
            animated: true,
            style: {
              stroke: "#60a5fa",
              strokeWidth: 4,
              strokeDasharray: "10,5",
            },
            markerEnd: {
              type: "arrowclosed",
              color: "#60a5fa",
              width: 24,
              height: 24,
            },
          })
        }

        // Connect sequential actions in thought chain
        for (let i = 0; i < Math.min(sortedNodes.length - 1, 3); i++) {
          const currentNode = sortedNodes[i]
          const nextNode = sortedNodes[i + 1]

          connectionEdges.push({
            id: `${currentNode.id}-${nextNode.id}`,
            source: currentNode.id,
            target: nextNode.id,
            type: "smoothstep",
            animated: true,
            style: {
              stroke: nextNode.type === "agent_evaluation" ? "#fbbf24" : "#34d399",
              strokeWidth: 3,
              strokeDasharray: "6,3",
            },
            markerEnd: {
              type: "arrowclosed",
              color: nextNode.type === "agent_evaluation" ? "#fbbf24" : "#34d399",
              width: 20,
              height: 20,
            },
          })
        }
      }
    }

    return connectionEdges
  }, [filteredData])

  const rfNodesBase = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return []

    // Use the layoutNodes function directly to get positioned ReactFlow nodes
    return layoutNodes(filteredData, { colGap: 400, rowGap: 150 })
  }, [filteredData])

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodesBase)
  const [edges, , onEdgesChange] = useEdgesState(
    [...edgesRaw, ...agentConnectionEdges].filter(
      (e) => rfNodesBase.find((n) => n.id === e.source) && rfNodesBase.find((n) => n.id === e.target),
    ),
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

  const loadLineage = async () => {
    console.log("[v0] Starting to load lineage and agent actions from APIs...")
    setLoading(true)
    setError(null)
    try {
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
      const agentNodes: LineageNode[] = []
      const agentEdges: { source: string; target: string }[] = []

      // Process governance logs
      if (Array.isArray(governanceData)) {
        governanceData.forEach((log: any, index: number) => {
          const actionId = `gov_${log.id}`
          agentNodes.push({
            id: actionId,
            name: `${log.interaction_type || "Interaction"} ${index + 1}`,
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
            const responseId = `gov_resp_${log.id}`
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
      if (Array.isArray(activityData)) {
        activityData.forEach((activity: any, index: number) => {
          const activityId = `activity_${activity.id}`
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
      if (Array.isArray(thoughtData)) {
        thoughtData.forEach((thought: any, index: number) => {
          const thoughtId = `thought_${thought.id}`
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
      if (Array.isArray(lineageData?.lineageMapping)) {
        lineageData.lineageMapping.forEach((mapping: any, index: number) => {
          const mappingId = `lineage_${mapping.id}`
          agentNodes.push({
            id: mappingId,
            name: `${mapping.interaction_type || "Interaction"} ${index + 1}`,
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

      console.log("[v0] Combined nodes:", allNodes.length, "edges:", allEdges.length)
      console.log("[v0] Sample agent nodes:", agentNodes.slice(0, 3))

      setServerData({
        nodes: allNodes,
        edges: allEdges,
        lineageMapping: lineageData?.lineageMapping || [],
      })
    } catch (error) {
      console.error("[v0] Error loading lineage data:", error)
      setError(error instanceof Error ? error.message : "Failed to load lineage data")
    } finally {
      setLoading(false)
    }
  }

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
