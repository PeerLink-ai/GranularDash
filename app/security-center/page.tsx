"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Lock, FileCheck, Clock, Scale, Search } from "lucide-react"

export default function SecurityCenterPage() {
  const [securityMetrics, setSecurityMetrics] = useState({
    overallScore: 87,
    threatsDetected: 12,
    complianceScore: 94,
    ethicsScore: 91,
    activeIncidents: 3,
    resolvedIncidents: 47,
  })

  const [ethicsAssessments, setEthicsAssessments] = useState([])
  const [complianceScans, setComplianceScans] = useState([])
  const [threatIntelligence, setThreatIntelligence] = useState([])
  const [privacyAssessments, setPrivacyAssessments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setEthicsAssessments([
        {
          id: "1",
          modelName: "Customer Churn Predictor",
          assessmentType: "bias_detection",
          biasDetected: true,
          severity: "medium",
          protectedAttributes: ["age", "gender"],
          fairnessScore: 0.73,
          status: "completed",
          conductedAt: "2024-01-15",
        },
        {
          id: "2",
          modelName: "Credit Risk Model",
          assessmentType: "fairness_audit",
          biasDetected: false,
          severity: "low",
          protectedAttributes: ["race", "income"],
          fairnessScore: 0.91,
          status: "completed",
          conductedAt: "2024-01-14",
        },
      ])

      setComplianceScans([
        {
          id: "1",
          framework: "GDPR",
          targetType: "dataset",
          targetName: "Customer Data Lake",
          complianceScore: 94,
          violationsFound: 2,
          criticalIssues: 0,
          status: "completed",
          lastScan: "2024-01-15",
          nextScan: "2024-02-15",
        },
        {
          id: "2",
          framework: "CCPA",
          targetType: "model",
          targetName: "Recommendation Engine",
          complianceScore: 87,
          violationsFound: 5,
          criticalIssues: 1,
          status: "completed",
          lastScan: "2024-01-14",
          nextScan: "2024-02-14",
        },
      ])

      setThreatIntelligence([
        {
          id: "1",
          threatName: "Adversarial Input Attack",
          threatType: "model_poisoning",
          severity: "high",
          confidenceLevel: 89,
          affectedSystems: ["Fraud Detection Model"],
          status: "active",
          firstDetected: "2024-01-15T08:30:00Z",
          mitigationStatus: "in_progress",
        },
        {
          id: "2",
          threatName: "Data Exfiltration Attempt",
          threatType: "data_breach",
          severity: "critical",
          confidenceLevel: 95,
          affectedSystems: ["Customer Database", "Analytics Pipeline"],
          status: "contained",
          firstDetected: "2024-01-14T14:22:00Z",
          mitigationStatus: "completed",
        },
      ])

      setPrivacyAssessments([
        {
          id: "1",
          assessmentName: "Customer PII Audit",
          dataSource: "CRM Database",
          privacyScore: 92,
          piiDetected: true,
          encryptionStatus: "encrypted",
          consentCompliance: true,
          retentionCompliance: false,
          status: "completed",
        },
        {
          id: "2",
          assessmentName: "ML Training Data Review",
          dataSource: "Training Dataset",
          privacyScore: 78,
          piiDetected: true,
          encryptionStatus: "partial",
          consentCompliance: false,
          retentionCompliance: true,
          status: "in_progress",
        },
      ])

      setLoading(false)
    }, 1000)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200"
      case "high":
        return "text-red-500 bg-red-50 border-red-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "resolved":
      case "contained":
        return "bg-green-500"
      case "in_progress":
      case "active":
        return "bg-yellow-500"
      case "failed":
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-500"
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
          <h1 className="text-3xl font-bold tracking-tight">Security & Governance Center</h1>
          <p className="text-muted-foreground">
            Comprehensive AI ethics, compliance monitoring, and threat intelligence
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Shield className="mr-2 h-4 w-4" />
          Run Security Scan
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.overallScore}%</div>
            <Progress value={securityMetrics.overallScore} className="mt-2" />
            <p className="text-xs text-green-600 mt-1">+3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.threatsDetected}</div>
            <p className="text-xs text-red-600">2 high priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.complianceScore}%</div>
            <Progress value={securityMetrics.complianceScore} className="mt-2" />
            <p className="text-xs text-green-600 mt-1">GDPR & CCPA compliant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ethics Score</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.ethicsScore}%</div>
            <Progress value={securityMetrics.ethicsScore} className="mt-2" />
            <p className="text-xs text-yellow-600 mt-1">1 bias detected</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ethics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ethics">AI Ethics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="privacy">Data Privacy</TabsTrigger>
          <TabsTrigger value="threats">Threat Intel</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="ethics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Ethics Dashboard</CardTitle>
              <CardDescription>
                Bias detection, fairness metrics, and ethical AI assessment across all models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ethicsAssessments.map((assessment: any) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(assessment.status)}`}></div>
                      <div>
                        <h3 className="font-semibold">{assessment.modelName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {assessment.assessmentType.replace("_", " ")} • Fairness Score:{" "}
                          {(assessment.fairnessScore * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Protected attributes: {assessment.protectedAttributes.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        {assessment.biasDetected ? (
                          <Badge variant="outline" className={getSeverityColor(assessment.severity)}>
                            Bias Detected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                            No Bias
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Compliance Scanning</CardTitle>
              <CardDescription>
                Real-time policy violation detection and regulatory compliance monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceScans.map((scan: any) => (
                  <div key={scan.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{scan.framework} Compliance</h3>
                        <p className="text-sm text-muted-foreground">
                          {scan.targetType}: {scan.targetName}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{scan.status}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Compliance Score</p>
                        <div className="text-lg font-semibold">{scan.complianceScore}%</div>
                        <Progress value={scan.complianceScore} className="mt-1" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Violations Found</p>
                        <div className="text-lg font-semibold">{scan.violationsFound}</div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Critical Issues</p>
                        <div className="text-lg font-semibold text-red-600">{scan.criticalIssues}</div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Next Scan</p>
                        <div className="text-sm">{scan.nextScan}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Privacy Center</CardTitle>
              <CardDescription>
                GDPR/CCPA compliance tracking, data lineage, and privacy risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {privacyAssessments.map((assessment: any) => (
                  <div key={assessment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{assessment.assessmentName}</h3>
                        <p className="text-sm text-muted-foreground">Source: {assessment.dataSource}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{assessment.status}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Privacy Score</p>
                        <div className="text-lg font-semibold">{assessment.privacyScore}%</div>
                        <Progress value={assessment.privacyScore} className="mt-1" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">PII Detected</p>
                        <div className="flex items-center space-x-1">
                          {assessment.piiDetected ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm">{assessment.piiDetected ? "Yes" : "No"}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Encryption</p>
                        <div className="flex items-center space-x-1">
                          <Lock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{assessment.encryptionStatus}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Consent</p>
                        <div className="flex items-center space-x-1">
                          {assessment.consentCompliance ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {assessment.consentCompliance ? "Compliant" : "Non-compliant"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Retention</p>
                        <div className="flex items-center space-x-1">
                          {assessment.retentionCompliance ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {assessment.retentionCompliance ? "Compliant" : "Non-compliant"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Threat Intelligence</CardTitle>
              <CardDescription>
                AI-powered security threat detection and response with real-time monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threatIntelligence.map((threat: any) => (
                  <div key={threat.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <AlertTriangle
                        className={`h-5 w-5 ${threat.severity === "critical" ? "text-red-600" : threat.severity === "high" ? "text-red-500" : "text-yellow-500"}`}
                      />
                      <div>
                        <h3 className="font-semibold">{threat.threatName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {threat.threatType.replace("_", " ")} • Confidence: {threat.confidenceLevel}%
                        </p>
                        <p className="text-xs text-muted-foreground">Affected: {threat.affectedSystems.join(", ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge variant="outline" className={getSeverityColor(threat.severity)}>
                          {threat.severity}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Status: {threat.mitigationStatus}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>Incident response tracking and forensic analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Active Incidents</CardTitle>
                    <CardDescription className="text-xs">
                      {securityMetrics.activeIncidents} requiring attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">2 critical, 1 high</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Resolved This Month</CardTitle>
                    <CardDescription className="text-xs">
                      {securityMetrics.resolvedIncidents} incidents closed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Avg resolution: 4.2 hours</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Response Time</CardTitle>
                    <CardDescription className="text-xs">Average time to containment</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">1.8 hours</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
