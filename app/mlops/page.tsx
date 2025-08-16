"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  Zap,
  Database,
  TrendingUp,
  Settings,
  Play,
  Pause,
  BarChart3,
} from "lucide-react"

export default function MLOpsPage() {
  const [models, setModels] = useState([])
  const [experiments, setExperiments] = useState([])
  const [driftAlerts, setDriftAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setModels([
        {
          id: "1",
          name: "Customer Churn Predictor",
          version: "v2.1.0",
          type: "classification",
          status: "production",
          accuracy: 0.94,
          lastUpdated: "2024-01-15",
          deployments: 3,
          framework: "scikit-learn",
        },
        {
          id: "2",
          name: "Revenue Forecasting Model",
          version: "v1.3.2",
          type: "regression",
          status: "staging",
          accuracy: 0.87,
          lastUpdated: "2024-01-14",
          deployments: 1,
          framework: "pytorch",
        },
        {
          id: "3",
          name: "Fraud Detection Engine",
          version: "v3.0.1",
          type: "classification",
          status: "production",
          accuracy: 0.98,
          lastUpdated: "2024-01-13",
          deployments: 5,
          framework: "tensorflow",
        },
      ])

      setExperiments([
        {
          id: "1",
          name: "Churn Model A/B Test",
          status: "running",
          progress: 67,
          controlModel: "Customer Churn v2.0",
          treatmentModel: "Customer Churn v2.1",
          trafficSplit: "50/50",
          significance: 0.89,
          winner: null,
        },
        {
          id: "2",
          name: "Revenue Model Comparison",
          status: "completed",
          progress: 100,
          controlModel: "Revenue Forecast v1.2",
          treatmentModel: "Revenue Forecast v1.3",
          trafficSplit: "70/30",
          significance: 0.95,
          winner: "treatment",
        },
      ])

      setDriftAlerts([
        {
          id: "1",
          modelName: "Customer Churn Predictor",
          driftType: "data_drift",
          severity: "medium",
          detectedAt: "2024-01-15T10:30:00Z",
          affectedFeatures: ["income", "age_group"],
          driftScore: 0.73,
        },
        {
          id: "2",
          modelName: "Fraud Detection Engine",
          driftType: "concept_drift",
          severity: "high",
          detectedAt: "2024-01-14T15:45:00Z",
          affectedFeatures: ["transaction_pattern", "merchant_category"],
          driftScore: 0.91,
        },
      ])

      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "production":
        return "bg-green-500"
      case "staging":
        return "bg-yellow-500"
      case "draft":
        return "bg-gray-500"
      case "archived":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MLOps Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive AI model lifecycle management and monitoring</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <GitBranch className="mr-2 h-4 w-4" />
          Deploy New Model
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Experiments</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 completing soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drift Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-red-600">2 high priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Model Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-green-600">+1.3% from last week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="models">Model Registry</TabsTrigger>
          <TabsTrigger value="experiments">A/B Testing</TabsTrigger>
          <TabsTrigger value="drift">Drift Detection</TabsTrigger>
          <TabsTrigger value="features">Feature Store</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Registry</CardTitle>
              <CardDescription>
                Centralized repository for all AI models with version control and lifecycle management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model: any) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(model.status)}`}></div>
                      <div>
                        <h3 className="font-semibold">{model.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {model.version} • {model.framework} • {model.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Accuracy: {(model.accuracy * 100).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">{model.deployments} deployments</p>
                      </div>
                      <Badge variant="outline">{model.status}</Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing Framework</CardTitle>
              <CardDescription>Compare model performance with statistical significance testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {experiments.map((experiment: any) => (
                  <div key={experiment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{experiment.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {experiment.controlModel} vs {experiment.treatmentModel}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={experiment.status === "running" ? "default" : "secondary"}>
                          {experiment.status}
                        </Badge>
                        {experiment.status === "running" ? (
                          <Button variant="outline" size="sm">
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Progress</Label>
                        <Progress value={experiment.progress} className="mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">{experiment.progress}% complete</p>
                      </div>
                      <div>
                        <Label className="text-xs">Traffic Split</Label>
                        <p className="text-sm font-medium">{experiment.trafficSplit}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Statistical Significance</Label>
                        <p className="text-sm font-medium">{(experiment.significance * 100).toFixed(1)}%</p>
                        {experiment.winner && (
                          <Badge variant="outline" className="mt-1">
                            Winner: {experiment.winner}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drift" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Drift Detection</CardTitle>
              <CardDescription>
                Automated monitoring for data drift, concept drift, and prediction drift
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {driftAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <AlertTriangle className={`h-5 w-5 ${getSeverityColor(alert.severity)}`} />
                      <div>
                        <h3 className="font-semibold">{alert.modelName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {alert.driftType.replace("_", " ")} detected • Score: {alert.driftScore.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Affected features: {alert.affectedFeatures.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Store</CardTitle>
              <CardDescription>Centralized feature management with lineage tracking and reusability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Customer Demographics</CardTitle>
                    <CardDescription className="text-xs">12 features • Updated daily</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span>Usage: 8 models</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Transaction Patterns</CardTitle>
                    <CardDescription className="text-xs">25 features • Updated hourly</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span>Usage: 5 models</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Market Indicators</CardTitle>
                    <CardDescription className="text-xs">18 features • Updated real-time</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span>Usage: 3 models</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Deployments</CardTitle>
              <CardDescription>Production deployments with health monitoring and auto-scaling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Production</CardTitle>
                      <CardDescription className="text-xs">8 active deployments</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">All healthy</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Staging</CardTitle>
                      <CardDescription className="text-xs">3 active deployments</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">1 pending</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Canary</CardTitle>
                      <CardDescription className="text-xs">1 active deployment</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Monitoring</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
