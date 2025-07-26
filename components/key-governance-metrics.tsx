"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

const metrics = [
  {
    id: "policy-compliance",
    name: "Policy Compliance Rate",
    value: "98.5%",
    change: "+0.2%",
    trend: "up",
    description: "Percentage of AI models and agents adhering to defined policies.",
  },
  {
    id: "risk-exposure",
    name: "Overall Risk Exposure",
    value: "Medium",
    change: "-5%",
    trend: "down",
    description: "Aggregated risk level across all AI systems.",
  },
  {
    id: "audit-readiness",
    name: "Audit Readiness Score",
    value: "85/100",
    change: "+3",
    trend: "up",
    description: "Score indicating preparedness for regulatory and internal audits.",
  },
  {
    id: "incident-response-time",
    name: "Avg. Incident Response Time",
    value: "2.5 hrs",
    change: "-0.5 hrs",
    trend: "down",
    description: "Average time taken to resolve AI-related incidents.",
  },
  {
    id: "data-privacy-score",
    name: "Data Privacy Compliance",
    value: "92%",
    change: "+1%",
    trend: "up",
    description: "Compliance rate with data privacy regulations (e.g., GDPR, CCPA).",
  },
  {
    id: "model-transparency",
    name: "Model Transparency Index",
    value: "7.8/10",
    change: "+0.1",
    trend: "up",
    description: "Measure of interpretability and explainability of AI models.",
  },
]

export function KeyGovernanceMetrics() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">Key Governance Metrics</CardTitle>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>All Key Governance Metrics</DialogTitle>
              <DialogDescription>A comprehensive overview of all AI governance metrics.</DialogDescription>
            </DialogHeader>
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell className="font-medium">{metric.name}</TableCell>
                      <TableCell>{metric.value}</TableCell>
                      <TableCell
                        className={`flex items-center gap-1 ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`}
                      >
                        {metric.trend === "up" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {metric.change}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{metric.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.slice(0, 3).map((metric) => (
            <div key={metric.id} className="flex flex-col items-start rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">{metric.name}</div>
              <div className="mt-1 text-2xl font-bold">{metric.value}</div>
              <div
                className={`flex items-center gap-1 text-sm ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`}
              >
                {metric.trend === "up" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {metric.change}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
