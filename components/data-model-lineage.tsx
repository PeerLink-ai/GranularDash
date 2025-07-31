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
import { ArrowRight, Search, Download } from "lucide-react"
import { Input } from "@/components/ui/input"

interface DataModelLineageProps {
  onOpenDatasetVersioning: () => void
  onOpenTransformationSteps: () => void
  onOpenModelVersionTracking: () => void
}

interface LineageNode {
  id: string
  name: string
  type: "dataset" | "transformation" | "model" | "prediction" | "audit"
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
  }
  nextNodes?: string[]
}

const initialNodes: LineageNode[] = [
  {
    id: "raw_csv",
    name: "Raw Customer Data",
    type: "dataset",
    path: ["Raw Customer Data"],
    metadata: {
      sourceFile: "s3://data-lake/raw/customer_data.csv",
      schema: "id,name,email,dob,country",
      creationDate: "2023-01-01",
      owner: "Data Engineering",
      status: "Active",
      version: "1.0.0",
      description: "Initial raw customer data from CRM system.",
    },
    nextNodes: ["cleaned_table"],
  },
  {
    id: "cleaned_table",
    name: "Cleaned Customer Table",
    type: "transformation",
    path: ["Raw Customer Data", "Cleaned Customer Table"],
    metadata: {
      sourceFile: "data_warehouse/customer_cleaned",
      schema: "id,name,email,age_group,country_encoded",
      creationDate: "2023-01-05",
      owner: "Data Engineering",
      status: "Processed",
      description: "Data cleaned, anonymized, and transformed for analysis.",
    },
    nextNodes: ["v1_2_model"],
  },
  {
    id: "v1_2_model",
    name: "Fraud Detection v1.2",
    type: "model",
    path: ["Raw Customer Data", "Cleaned Customer Table", "Fraud Detection v1.2"],
    metadata: {
      sourceFile: "mlflow/models/fraud_detection/v1.2",
      schema: "features: [...], prediction: fraud_score",
      creationDate: "2023-01-10",
      owner: "ML Team",
      status: "Deployed",
      accuracy: "94%",
      version: "1.2",
      description: "Machine learning model for detecting fraudulent transactions.",
    },
    nextNodes: ["prediction_output"],
  },
  {
    id: "prediction_output",
    name: "Fraud Prediction Output",
    type: "prediction",
    path: ["Raw Customer Data", "Cleaned Customer Table", "Fraud Detection v1.2", "Fraud Prediction Output"],
    metadata: {
      sourceFile: "s3://data-lake/predictions/fraud_scores.csv",
      schema: "transaction_id,fraud_score,model_version",
      creationDate: "2023-01-11",
      owner: "ML Ops",
      status: "Archived",
      description: "Output of the fraud detection model, containing scores for transactions.",
    },
    nextNodes: ["audit_report"],
  },
  {
    id: "audit_report",
    name: "Q1 2023 Audit Report",
    type: "audit",
    path: [
      "Raw Customer Data",
      "Cleaned Customer Table",
      "Fraud Detection v1.2",
      "Fraud Prediction Output",
      "Q1 2023 Audit Report",
    ],
    metadata: {
      sourceFile: "internal/reports/fraud_audit_2023_Q1.pdf",
      schema: "compliance_status,findings,recommendations",
      creationDate: "2023-01-15",
      owner: "Compliance Team",
      status: "Completed",
      description: "Comprehensive audit report for Q1 2023 fraud detection activities.",
    },
    nextNodes: [],
  },
]

export function DataModelLineage({
  onOpenDatasetVersioning,
  onOpenTransformationSteps,
  onOpenModelVersionTracking,
}: DataModelLineageProps) {
  const [selectedNode, setSelectedNode] = React.useState<LineageNode | null>(initialNodes[0])
  const [searchTerm, setSearchTerm] = React.useState("")

  const handleNodeClick = (node: LineageNode) => {
    setSelectedNode(node)
  }

  const handleViewDetails = () => {
    if (!selectedNode) return
    switch (selectedNode.type) {
      case "dataset":
        onOpenDatasetVersioning()
        break
      case "transformation":
        onOpenTransformationSteps()
        break
      case "model":
        onOpenModelVersionTracking()
        break
      default:
        console.log(`No specific modal for ${selectedNode.type} type.`)
    }
  }

  const handleDownloadReport = () => {
    alert("Downloading lineage report...")
    // In a real application, this would trigger a file download
  }

  const filteredNodes = initialNodes.filter(
    (node) =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(node.metadata).some(
        (value) => typeof value === "string" && value.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  )

  return (
    <Card className="shadow-lg border-gray-200 dark:border-gray-800">
      <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          End-to-End Lineage Tracking
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Visualize and track every dataset version, transformation step, and model version back to its source.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Top Bar: Breadcrumbs and Export Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              {selectedNode?.path.map((segment, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {index === selectedNode.path.length - 1 ? (
                      <BreadcrumbPage className="font-semibold text-gray-900 dark:text-gray-50">
                        {segment}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href="#"
                        onClick={() => {
                          const node = initialNodes.find((n) => n.name === segment && n.path.length === index + 1)
                          if (node) setSelectedNode(node)
                        }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {segment}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < selectedNode.path.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <Button variant="outline" onClick={handleDownloadReport} className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download Lineage Report
          </Button>
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-800" />

        {/* Main Content: Graph and Detail Pane */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pipeline Graph */}
          <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-50">Pipeline Graph</h3>
            <div className="flex-1 overflow-x-auto pb-4">
              <div className="flex items-center space-x-4 md:space-x-8 lg:space-x-12 min-w-max">
                {filteredNodes.length > 0 ? (
                  filteredNodes.map((node, index) => (
                    <React.Fragment key={node.id}>
                      <Button
                        variant={selectedNode?.id === node.id ? "default" : "outline"}
                        className="flex flex-col h-auto p-4 text-center min-w-[140px] shadow-md transition-all duration-200 hover:scale-105"
                        onClick={() => handleNodeClick(node)}
                      >
                        <span className="font-medium text-base">{node.name}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
                        </span>
                      </Button>
                      {index < filteredNodes.length - 1 && (
                        <ArrowRight className="text-gray-400 dark:text-gray-600 shrink-0" />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center w-full">No nodes match your search.</p>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Click on a node to view its details. (Zoom/Pan functionality coming soon!)
            </p>
          </div>

          {/* Detail Pane */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-50">Node Details</h3>
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Name:</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-50">{selectedNode.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</p>
                  <p className="text-base text-gray-900 dark:text-gray-50">
                    {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}
                  </p>
                </div>
                {Object.entries(selectedNode.metadata).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}:
                    </p>
                    <p className="text-base text-gray-900 dark:text-gray-50">{value}</p>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => alert("Viewing upstream nodes...")}>
                    View Upstream
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => alert("Viewing downstream nodes...")}>
                    View Downstream
                  </Button>
                  {(selectedNode.type === "dataset" ||
                    selectedNode.type === "transformation" ||
                    selectedNode.type === "model") && (
                    <Button variant="default" size="sm" onClick={handleViewDetails}>
                      View More Details
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Select a node from the graph to see its details.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
