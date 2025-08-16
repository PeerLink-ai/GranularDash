"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RealTimeChart } from "@/components/real-time-chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"
import { BarChart3, TrendingUp, Users, Shield, Brain, Gauge, Server } from "lucide-react"

const generatePerformanceData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    requests: Math.floor(Math.random() * 1000) + 500,
    latency: Math.floor(Math.random() * 100) + 50,
    errors: Math.floor(Math.random() * 20),
    cpu: Math.floor(Math.random() * 80) + 20,
  }))
}

const generateUserEngagementData = () => {
  return Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    activeUsers: Math.floor(Math.random() * 500) + 200,
    newUsers: Math.floor(Math.random() * 100) + 20,
    sessions: Math.floor(Math.random() * 800) + 300,
    bounceRate: Math.floor(Math.random() * 30) + 20,
  }))
}

const generateSystemHealthData = () => {
  return [
    { name: "API Gateway", value: 98.5, status: "healthy" },
    { name: "Database", value: 99.2, status: "healthy" },
    { name: "Cache Layer", value: 97.8, status: "warning" },
    { name: "Message Queue", value: 99.9, status: "healthy" },
    { name: "File Storage", value: 96.5, status: "warning" },
    { name: "CDN", value: 99.7, status: "healthy" },
  ]
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

export function AdvancedAnalyticsDashboard() {
  const [performanceData, setPerformanceData] = useState(generatePerformanceData())
  const [engagementData, setEngagementData] = useState(generateUserEngagementData())
  const [systemHealth, setSystemHealth] = useState(generateSystemHealthData())
  const [selectedMetric, setSelectedMetric] = useState("requests")

  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceData(generatePerformanceData())
      setEngagementData(generateUserEngagementData())
      setSystemHealth(generateSystemHealthData())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const radarData = [
    { subject: "Performance", A: 85, B: 90, fullMark: 100 },
    { subject: "Security", A: 92, B: 88, fullMark: 100 },
    { subject: "Reliability", A: 88, B: 95, fullMark: 100 },
    { subject: "Scalability", A: 78, B: 85, fullMark: 100 },
    { subject: "Efficiency", A: 90, B: 82, fullMark: 100 },
    { subject: "Usability", A: 85, B: 88, fullMark: 100 },
  ]

  return (
    <div className="space-y-6">
      {/* Real-time Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RealTimeChart
          title="System Load"
          subtitle="CPU utilization percentage"
          dataKey="cpu"
          color="#3B82F6"
          type="area"
          unit="%"
          threshold={{ value: 80, label: "High Load", color: "#EF4444" }}
        />
        <RealTimeChart
          title="Memory Usage"
          subtitle="RAM consumption"
          dataKey="memory"
          color="#10B981"
          type="line"
          unit="GB"
          threshold={{ value: 7.5, label: "Critical", color: "#F59E0B" }}
        />
        <RealTimeChart
          title="Network I/O"
          subtitle="Data transfer rate"
          dataKey="network"
          color="#8B5CF6"
          type="bar"
          unit="MB/s"
        />
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/20">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle>Request Analytics</CardTitle>
                      <p className="text-sm text-muted-foreground">24-hour performance overview</p>
                    </div>
                  </div>
                  <Badge variant="outline">Live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="requests" fill="#3B82F6" name="Requests" />
                    <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#EF4444" name="Latency (ms)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/20">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle>Error Rate Trends</CardTitle>
                    <p className="text-sm text-muted-foreground">Error tracking and patterns</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="errors" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <p className="text-sm text-muted-foreground">Weekly user activity patterns</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="activeUsers" fill="#3B82F6" name="Active Users" />
                    <Bar dataKey="newUsers" fill="#10B981" name="New Users" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Session Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">User session metrics</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="sessions" stroke="#8B5CF6" name="Sessions" />
                    <Line yAxisId="right" type="monotone" dataKey="bounceRate" stroke="#F59E0B" name="Bounce Rate %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>System Health Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Component status and uptime</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemHealth.map((component, index) => (
                    <div key={component.name} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            component.status === "healthy"
                              ? "bg-emerald-500"
                              : component.status === "warning"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span className="font-medium">{component.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{component.value}%</span>
                        <Badge variant={component.status === "healthy" ? "default" : "secondary"}>
                          {component.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Performance Radar</CardTitle>
                <p className="text-sm text-muted-foreground">Multi-dimensional system analysis</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Radar name="Target" dataKey="B" stroke="#10B981" fill="transparent" strokeDasharray="5 5" />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="text-center py-12">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Security Analytics</h3>
            <p className="text-muted-foreground">Advanced security monitoring and threat detection</p>
            <p className="text-sm text-muted-foreground mt-2">Real-time security dashboards coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
            <p className="text-muted-foreground">Machine learning analytics and predictive insights</p>
            <p className="text-sm text-muted-foreground mt-2">Intelligent recommendations and anomaly detection</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
