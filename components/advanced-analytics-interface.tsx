"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Brush,
  ComposedChart,
} from "recharts"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart3,
  TrendingUp,
  Download,
  Target,
  Brain,
  Plus,
  Maximize2,
  Share,
  Users,
  DollarSign,
  Activity,
} from "lucide-react"

interface AnalyticsData {
  performance: Array<{
    date: string
    requests: number
    latency: number
    errors: number
    cpu: number
    memory: number
    throughput: number
  }>
  userEngagement: Array<{
    date: string
    activeUsers: number
    newUsers: number
    sessions: number
    bounceRate: number
    conversionRate: number
  }>
  revenue: Array<{
    date: string
    revenue: number
    transactions: number
    averageOrderValue: number
  }>
  agentMetrics: Array<{
    name: string
    requests: number
    successRate: number
    uptime: number
    errors: number
  }>
}

interface KPI {
  id: string
  name: string
  value: number
  target: number
  unit: string
  trend: "up" | "down" | "stable"
  category: string
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"]

export function AdvancedAnalyticsInterface() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [kpis, setKpis] = useState<KPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d")
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["requests", "latency", "errors"])
  const [showCustomDashboard, setShowCustomDashboard] = useState(false)
  const [dashboardWidgets, setDashboardWidgets] = useState<string[]>([])
  const { toast } = useToast()

  const generateMockData = (): AnalyticsData => {
    const days = selectedTimeRange === "7d" ? 7 : selectedTimeRange === "30d" ? 30 : 90
    const performance = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      requests: Math.floor(Math.random() * 5000) + 1000,
      latency: Math.floor(Math.random() * 200) + 50,
      errors: Math.floor(Math.random() * 100),
      cpu: Math.floor(Math.random() * 80) + 20,
      memory: Math.floor(Math.random() * 70) + 30,
      throughput: Math.floor(Math.random() * 2000) + 500,
    }))

    const userEngagement = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      activeUsers: Math.floor(Math.random() * 1000) + 200,
      newUsers: Math.floor(Math.random() * 200) + 50,
      sessions: Math.floor(Math.random() * 1500) + 300,
      bounceRate: Math.floor(Math.random() * 40) + 20,
      conversionRate: Math.floor(Math.random() * 10) + 2,
    }))

    const revenue = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      revenue: Math.floor(Math.random() * 50000) + 10000,
      transactions: Math.floor(Math.random() * 500) + 100,
      averageOrderValue: Math.floor(Math.random() * 200) + 50,
    }))

    const agentMetrics = [
      { name: "Agent Alpha", requests: 15420, successRate: 98.5, uptime: 99.2, errors: 23 },
      { name: "Agent Beta", requests: 12350, successRate: 97.8, uptime: 98.9, errors: 45 },
      { name: "Agent Gamma", requests: 18900, successRate: 99.1, uptime: 99.7, errors: 12 },
      { name: "Agent Delta", requests: 9800, successRate: 96.5, uptime: 97.8, errors: 67 },
      { name: "Agent Epsilon", requests: 21500, successRate: 99.3, uptime: 99.5, errors: 8 },
    ]

    return { performance, userEngagement, revenue, agentMetrics }
  }

  const generateKPIs = (): KPI[] => [
    {
      id: "revenue",
      name: "Monthly Revenue",
      value: 125000,
      target: 150000,
      unit: "$",
      trend: "up",
      category: "Financial",
    },
    { id: "users", name: "Active Users", value: 8500, target: 10000, unit: "", trend: "up", category: "Engagement" },
    {
      id: "conversion",
      name: "Conversion Rate",
      value: 3.2,
      target: 4.0,
      unit: "%",
      trend: "stable",
      category: "Performance",
    },
    { id: "uptime", name: "System Uptime", value: 99.8, target: 99.9, unit: "%", trend: "up", category: "Reliability" },
    {
      id: "satisfaction",
      name: "Customer Satisfaction",
      value: 4.6,
      target: 4.8,
      unit: "/5",
      trend: "up",
      category: "Quality",
    },
    {
      id: "response",
      name: "Avg Response Time",
      value: 145,
      target: 100,
      unit: "ms",
      trend: "down",
      category: "Performance",
    },
  ]

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setData(generateMockData())
        setKpis(generateKPIs())
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedTimeRange])

  const exportData = async (format: "csv" | "pdf" | "excel") => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&range=${selectedTimeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `analytics-${selectedTimeRange}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Success",
          description: `Analytics data exported as ${format.toUpperCase()}`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      default:
        return <Activity className="h-4 w-4 text-slate-500" />
    }
  }

  const KPICard = ({ kpi }: { kpi: KPI }) => {
    const progress = (kpi.value / kpi.target) * 100
    const isOnTrack = progress >= 80

    return (
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">
                  {kpi.unit === "$" ? "$" : ""}
                  {kpi.value.toLocaleString()}
                  {kpi.unit !== "$" ? kpi.unit : ""}
                </span>
                {getTrendIcon(kpi.trend)}
              </div>
            </div>
            <Badge variant={isOnTrack ? "default" : "secondary"}>{kpi.category}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Target: {kpi.unit === "$" ? "$" : ""}
                {kpi.target.toLocaleString()}
                {kpi.unit !== "$" ? kpi.unit : ""}
              </span>
              <span className={isOnTrack ? "text-emerald-600" : "text-amber-600"}>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading advanced analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics with predictive analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => exportData("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button variant="outline" size="sm" onClick={() => exportData("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>

          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>

          <Button onClick={() => setShowCustomDashboard(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Custom Dashboard
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>System Performance Trends</CardTitle>
                    <p className="text-sm text-muted-foreground">Multi-metric performance analysis</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    requests: { label: "Requests", color: "#3B82F6" },
                    latency: { label: "Latency", color: "#EF4444" },
                    errors: { label: "Errors", color: "#F59E0B" },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data?.performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="requests" fill="#3B82F6" name="Requests" />
                      <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#EF4444" name="Latency (ms)" />
                      <Area yAxisId="left" dataKey="errors" fill="#F59E0B" fillOpacity={0.3} name="Errors" />
                      <Brush dataKey="date" height={30} stroke="#8884d8" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <p className="text-sm text-muted-foreground">CPU and memory usage patterns</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    cpu: { label: "CPU", color: "#10B981" },
                    memory: { label: "Memory", color: "#8B5CF6" },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="cpu"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="memory"
                        stackId="1"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.6}
                      />
                      <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="5 5" label="Critical Threshold" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>User Engagement Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">Active users and session metrics</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    activeUsers: { label: "Active Users", color: "#3B82F6" },
                    newUsers: { label: "New Users", color: "#10B981" },
                    sessions: { label: "Sessions", color: "#F59E0B" },
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.userEngagement}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="activeUsers" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="newUsers" stroke="#10B981" strokeWidth={2} />
                      <Line type="monotone" dataKey="sessions" stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <p className="text-sm text-muted-foreground">User journey and conversion rates</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    bounceRate: { label: "Bounce Rate", color: "#EF4444" },
                    conversionRate: { label: "Conversion Rate", color: "#10B981" },
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data?.userEngagement}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="bounceRate" fill="#EF4444" name="Bounce Rate %" />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="conversionRate"
                        stroke="#10B981"
                        strokeWidth={3}
                        name="Conversion Rate %"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">Financial performance and trends</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: { label: "Revenue", color: "#10B981" },
                    transactions: { label: "Transactions", color: "#3B82F6" },
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data?.revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        fill="#10B981"
                        fillOpacity={0.3}
                        stroke="#10B981"
                      />
                      <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#3B82F6" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Agent Performance Comparison</CardTitle>
                <p className="text-sm text-muted-foreground">Success rates and request volumes</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    requests: { label: "Requests", color: "#3B82F6" },
                    successRate: { label: "Success Rate", color: "#10B981" },
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={data?.agentMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="requests" name="Requests" />
                      <YAxis dataKey="successRate" name="Success Rate" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Scatter dataKey="successRate" fill="#3B82F6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Agent Performance Matrix</CardTitle>
                <p className="text-sm text-muted-foreground">Comprehensive agent metrics and comparisons</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  {data?.agentMetrics.map((agent, index) => (
                    <Card key={agent.name} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{agent.name}</h4>
                          <Badge variant={agent.successRate > 98 ? "default" : "secondary"}>
                            {agent.successRate > 98 ? "Excellent" : "Good"}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Requests</span>
                            <span className="font-medium">{agent.requests.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Success Rate</span>
                            <span className="font-medium">{agent.successRate}%</span>
                          </div>
                          <Progress value={agent.successRate} className="h-2" />

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Uptime</span>
                            <span className="font-medium">{agent.uptime}%</span>
                          </div>
                          <Progress value={agent.uptime} className="h-2" />

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Errors</span>
                            <span
                              className={`font-medium ${agent.errors < 20 ? "text-emerald-600" : agent.errors < 50 ? "text-amber-600" : "text-red-600"}`}
                            >
                              {agent.errors}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Predictive Analytics</h3>
            <p className="text-muted-foreground">AI-powered forecasting and trend prediction</p>
            <p className="text-sm text-muted-foreground mt-2">Machine learning models for future insights</p>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <div className="text-center py-12">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Custom Dashboard Builder</h3>
            <p className="text-muted-foreground">Create personalized analytics dashboards</p>
            <p className="text-sm text-muted-foreground mt-2">Drag-and-drop widgets and custom metrics</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
