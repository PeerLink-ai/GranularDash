"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts"
import { AlertTriangle, Brain, Target, Zap, Activity, DollarSign, Clock, CheckCircle } from "lucide-react"

// Mock data for forecasting
const forecastingData = [
  { date: "2024-01", actual: 45000, predicted: 44800, confidence_lower: 42000, confidence_upper: 47600 },
  { date: "2024-02", actual: 48000, predicted: 47900, confidence_lower: 45100, confidence_upper: 50700 },
  { date: "2024-03", actual: 52000, predicted: 51200, confidence_lower: 48400, confidence_upper: 54000 },
  { date: "2024-04", actual: null, predicted: 54800, confidence_lower: 51900, confidence_upper: 57700 },
  { date: "2024-05", actual: null, predicted: 58200, confidence_lower: 55200, confidence_upper: 61200 },
  { date: "2024-06", actual: null, predicted: 61800, confidence_lower: 58700, confidence_upper: 64900 },
]

const anomalyData = [
  { time: "00:00", cpu: 45, memory: 62, network: 23, anomaly_score: 0.12 },
  { time: "04:00", cpu: 52, memory: 68, network: 28, anomaly_score: 0.18 },
  { time: "08:00", cpu: 78, memory: 85, network: 45, anomaly_score: 0.34 },
  { time: "12:00", cpu: 92, memory: 94, network: 67, anomaly_score: 0.89 }, // Anomaly
  { time: "16:00", cpu: 68, memory: 72, network: 38, anomaly_score: 0.23 },
  { time: "20:00", cpu: 55, memory: 65, network: 31, anomaly_score: 0.16 },
]

const capacityData = [
  { resource: "Compute", current: 75, predicted: 89, threshold: 80, cost_impact: 2400 },
  { resource: "Storage", current: 68, predicted: 72, threshold: 75, cost_impact: 800 },
  { resource: "Network", current: 45, predicted: 58, threshold: 70, cost_impact: 1200 },
  { resource: "AI Inference", current: 82, predicted: 95, threshold: 85, cost_impact: 3600 },
]

const insightsData = [
  {
    id: 1,
    type: "Cost Optimization",
    title: "Underutilized GPU Resources",
    description: "AI inference GPUs are running at 45% utilization during off-peak hours",
    severity: "medium",
    confidence: 0.89,
    impact: "$8,400/month savings potential",
    status: "active",
  },
  {
    id: 2,
    type: "Performance Risk",
    title: "Memory Pressure Increasing",
    description: "System memory usage trending upward, may hit capacity limits within 2 weeks",
    severity: "high",
    confidence: 0.92,
    impact: "Service degradation risk",
    status: "active",
  },
  {
    id: 3,
    type: "Security Alert",
    title: "Anomalous Access Pattern",
    description: "Unusual data access patterns detected from multiple accounts",
    severity: "critical",
    confidence: 0.78,
    impact: "Potential security breach",
    status: "investigating",
  },
]

const rootCauseData = [
  {
    id: 1,
    incident: "Performance Degradation #2024-001",
    status: "completed",
    confidence: 0.94,
    root_cause: "Database connection pool exhaustion",
    resolution: "Increased connection pool size and implemented connection recycling",
    impact: "High",
    duration: "2.5 hours",
  },
  {
    id: 2,
    incident: "Cost Spike #2024-002",
    status: "in_progress",
    confidence: 0.67,
    root_cause: "Runaway batch processing job",
    resolution: "Investigation ongoing",
    impact: "Medium",
    duration: "45 minutes",
  },
]

export default function PredictiveAnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d")
  const [activeModel, setActiveModel] = useState("cost")

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "in_progress":
        return "secondary"
      case "investigating":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-muted-foreground">Advanced forecasting, anomaly detection, and intelligent insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Brain className="mr-2 h-4 w-4" />
            Train Models
          </Button>
          <Button size="sm">
            <Target className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="forecasting" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="root-cause">Root Cause Analysis</TabsTrigger>
          <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Forecast</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$61,800</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-500">+18.9%</span> vs last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+2.1%</span> improvement
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89.4%</div>
                <p className="text-xs text-muted-foreground">Confidence interval: ±5.2%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forecast Horizon</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">90 days</div>
                <p className="text-xs text-muted-foreground">Next update in 6 hours</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Forecasting Model</CardTitle>
              <CardDescription>Predicted AI infrastructure costs with confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`$${value?.toLocaleString()}`, name]} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="confidence_upper"
                    stackId="1"
                    stroke="none"
                    fill="#e2e8f0"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="confidence_lower"
                    stackId="1"
                    stroke="none"
                    fill="#ffffff"
                    fillOpacity={1}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "#dc2626", strokeWidth: 2, r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Forecasting Models</CardTitle>
                <CardDescription>Active prediction models and their performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Cost Prediction", accuracy: 89.4, type: "Prophet", status: "active" },
                  { name: "Performance Forecast", accuracy: 91.2, type: "LSTM", status: "active" },
                  { name: "Usage Prediction", accuracy: 87.6, type: "Random Forest", status: "training" },
                  { name: "Capacity Forecast", accuracy: 86.3, type: "ARIMA", status: "active" },
                ].map((model, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{model.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {model.type} • {model.accuracy}% accuracy
                      </p>
                    </div>
                    <Badge variant={model.status === "active" ? "default" : "secondary"}>{model.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scenario Analysis</CardTitle>
                <CardDescription>What-if scenarios and their predicted outcomes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { scenario: "20% Usage Increase", impact: "+$12,400", probability: "High" },
                  { scenario: "New Model Deployment", impact: "+$8,900", probability: "Medium" },
                  { scenario: "Optimization Implementation", impact: "-$5,600", probability: "High" },
                  { scenario: "Peak Season Load", impact: "+$18,200", probability: "Medium" },
                ].map((scenario, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{scenario.scenario}</p>
                      <p className="text-sm text-muted-foreground">Probability: {scenario.probability}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${scenario.impact.startsWith("+") ? "text-red-500" : "text-green-500"}`}
                      >
                        {scenario.impact}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Anomalies</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-500">+1</span> since last hour
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">97.8%</div>
                <p className="text-xs text-muted-foreground">False positive rate: 2.1%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3 min</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">-15%</span> improvement
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Models Active</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">All models operational</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Anomaly Detection</CardTitle>
              <CardDescription>System metrics with anomaly scores and detection thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={anomalyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="cpu" stroke="#2563eb" strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="memory" stroke="#16a34a" strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="network" stroke="#ca8a04" strokeWidth={2} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="anomaly_score"
                    stroke="#dc2626"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Anomalies</CardTitle>
                <CardDescription>Latest detected anomalies and their status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    type: "Performance Spike",
                    severity: "high",
                    time: "2 minutes ago",
                    score: 0.89,
                    status: "investigating",
                  },
                  {
                    type: "Unusual Access Pattern",
                    severity: "critical",
                    time: "15 minutes ago",
                    score: 0.94,
                    status: "escalated",
                  },
                  {
                    type: "Memory Usage Anomaly",
                    severity: "medium",
                    time: "1 hour ago",
                    score: 0.67,
                    status: "resolved",
                  },
                  {
                    type: "Network Traffic Spike",
                    severity: "low",
                    time: "3 hours ago",
                    score: 0.45,
                    status: "false_positive",
                  },
                ].map((anomaly, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{anomaly.type}</p>
                        <Badge variant={getSeverityColor(anomaly.severity)}>{anomaly.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Score: {anomaly.score} • {anomaly.time}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(anomaly.status)}>{anomaly.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detection Models</CardTitle>
                <CardDescription>Anomaly detection models and their performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "System Performance", type: "Isolation Forest", accuracy: 97.8, sensitivity: 0.05 },
                  { name: "User Behavior", type: "One-Class SVM", accuracy: 94.2, sensitivity: 0.03 },
                  { name: "Model Drift", type: "Statistical", accuracy: 91.5, sensitivity: 0.02 },
                  { name: "Cost Anomalies", type: "Autoencoder", accuracy: 89.7, sensitivity: 0.04 },
                ].map((model, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-sm text-muted-foreground">{model.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{model.accuracy}%</p>
                        <p className="text-sm text-muted-foreground">Sensitivity: {model.sensitivity}</p>
                      </div>
                    </div>
                    <Progress value={model.accuracy} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="root-cause" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Investigations</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">1 high priority</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.8 hrs</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">-22%</span> vs last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">Root cause identified</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Automated Actions</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">67%</div>
                <p className="text-xs text-muted-foreground">Issues auto-resolved</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Root Cause Analysis Dashboard</CardTitle>
              <CardDescription>Automated investigation results and resolution tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {rootCauseData.map((investigation) => (
                <div key={investigation.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{investigation.incident}</h4>
                      <p className="text-sm text-muted-foreground">
                        Impact: {investigation.impact} • Duration: {investigation.duration}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(investigation.status)}>
                        {investigation.status.replace("_", " ")}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium">Confidence: {Math.round(investigation.confidence * 100)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Root Cause:</p>
                      <p className="text-sm text-muted-foreground">{investigation.root_cause}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Resolution:</p>
                      <p className="text-sm text-muted-foreground">{investigation.resolution}</p>
                    </div>
                  </div>

                  <Progress value={investigation.confidence * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Investigation Timeline</CardTitle>
                <CardDescription>Recent investigation activities and milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { time: "2 min ago", event: "Evidence collected from system logs", type: "info" },
                  { time: "5 min ago", event: "Correlation analysis completed", type: "success" },
                  { time: "12 min ago", event: "Anomaly detected in database connections", type: "warning" },
                  { time: "15 min ago", event: "Investigation initiated", type: "info" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        item.type === "success"
                          ? "bg-green-500"
                          : item.type === "warning"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.event}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Root Causes</CardTitle>
                <CardDescription>Most frequent root causes and their patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Database Issues", value: 35, fill: "#2563eb" },
                        { name: "Memory Leaks", value: 25, fill: "#16a34a" },
                        { name: "Network Problems", value: 20, fill: "#ca8a04" },
                        { name: "Configuration Errors", value: 15, fill: "#dc2626" },
                        { name: "Other", value: 5, fill: "#6b7280" },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="capacity" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resources at Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Approaching capacity limits</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Impact</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$8,000</div>
                <p className="text-xs text-muted-foreground">Monthly scaling cost</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Planning Horizon</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">90 days</div>
                <p className="text-xs text-muted-foreground">Forecast accuracy: 87%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+5%</span> this month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Capacity Planning Dashboard</CardTitle>
              <CardDescription>Resource utilization forecasts and scaling recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={capacityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="resource" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  <Legend />
                  <Bar dataKey="current" fill="#2563eb" name="Current Usage" />
                  <Bar dataKey="predicted" fill="#dc2626" name="Predicted Usage" />
                  <Bar dataKey="threshold" fill="#16a34a" name="Threshold" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scaling Recommendations</CardTitle>
                <CardDescription>Intelligent resource allocation suggestions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {capacityData.map((resource, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{resource.resource}</h4>
                      <Badge variant={resource.predicted > resource.threshold ? "destructive" : "default"}>
                        {resource.predicted > resource.threshold ? "Action Required" : "Healthy"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current: {resource.current}%</span>
                        <span>Predicted: {resource.predicted}%</span>
                      </div>
                      <Progress value={resource.predicted} className="h-2" />
                    </div>

                    {resource.predicted > resource.threshold && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Scaling Required</AlertTitle>
                        <AlertDescription>
                          Estimated cost impact: ${resource.cost_impact.toLocaleString()}/month
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Optimization</CardTitle>
                <CardDescription>Cost-saving opportunities and efficiency gains</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    opportunity: "Right-size GPU Instances",
                    savings: "$3,200/month",
                    effort: "Low",
                    impact: "High",
                  },
                  {
                    opportunity: "Implement Auto-scaling",
                    savings: "$1,800/month",
                    effort: "Medium",
                    impact: "Medium",
                  },
                  {
                    opportunity: "Storage Tier Optimization",
                    savings: "$900/month",
                    effort: "Low",
                    impact: "Low",
                  },
                  {
                    opportunity: "Workload Consolidation",
                    savings: "$2,400/month",
                    effort: "High",
                    impact: "High",
                  },
                ].map((opportunity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{opportunity.opportunity}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {opportunity.effort} effort
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {opportunity.impact} impact
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-500">{opportunity.savings}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Insights</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">3 high priority</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">86.4%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+3.2%</span> improvement
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions Taken</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$14,200</div>
                <p className="text-xs text-muted-foreground">From AI recommendations</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>Intelligent analysis and actionable recommendations from your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {insightsData.map((insight) => (
                <div key={insight.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{insight.type}</Badge>
                        <Badge variant={getSeverityColor(insight.severity)}>{insight.severity}</Badge>
                        <Badge variant={getStatusColor(insight.status)}>{insight.status}</Badge>
                      </div>
                      <h4 className="font-semibold">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Confidence: {Math.round(insight.confidence * 100)}%</p>
                      <p className="text-sm text-muted-foreground">{insight.impact}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Progress value={insight.confidence * 100} className="flex-1 mr-4 h-2" />
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">Take Action</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Insight Categories</CardTitle>
                <CardDescription>Distribution of insights by category and severity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Cost Optimization", value: 35, fill: "#2563eb" },
                        { name: "Performance", value: 28, fill: "#16a34a" },
                        { name: "Security", value: 20, fill: "#dc2626" },
                        { name: "Capacity", value: 12, fill: "#ca8a04" },
                        { name: "Other", value: 5, fill: "#6b7280" },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictive Alerts</CardTitle>
                <CardDescription>Proactive alerts based on predictive models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    alert: "Memory pressure expected in 6 hours",
                    severity: "high",
                    confidence: 0.92,
                    action: "Scale memory resources",
                  },
                  {
                    alert: "Cost spike predicted for next week",
                    severity: "medium",
                    confidence: 0.78,
                    action: "Review usage patterns",
                  },
                  {
                    alert: "Performance degradation likely",
                    severity: "medium",
                    confidence: 0.84,
                    action: "Optimize queries",
                  },
                  {
                    alert: "Storage capacity limit in 2 weeks",
                    severity: "low",
                    confidence: 0.67,
                    action: "Plan storage expansion",
                  },
                ].map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{alert.alert}</p>
                        <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {Math.round(alert.confidence * 100)}% • {alert.action}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Act Now
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
