"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { MetricData } from "@/components/analytics/fairness-bias-tab"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface DisparityDetailModalProps {
  isOpen: boolean
  onClose: () => void
  group: string
  metricName: string
  metricData: MetricData
}

const metricLabels: { [key: string]: string } = {
  disparateImpact: "Disparate Impact Ratio",
  equalOpportunity: "Equal Opportunity Difference",
  demographicParity: "Demographic Parity",
  falsePositiveRate: "False Positive Rate",
}

export function DisparityDetailModal({ isOpen, onClose, group, metricName, metricData }: DisparityDetailModalProps) {
  const chartData = metricData.history.map((value, index) => ({
    date: `Day ${index + 1}`, // Placeholder for actual dates
    value: value,
  }))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {" "}
        {/* Adjusted max-width to sm:max-w-md */}
        <DialogHeader>
          <DialogTitle>
            Details for {metricLabels[metricName]} - {group}
          </DialogTitle>
          <DialogDescription>
            In-depth analysis of the selected fairness metric for the protected group.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Metric Trend Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {" "}
                {/* Slightly reduced height for smaller modal */}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sample Counts</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Total Samples: <span className="font-semibold">10,000</span>
                </p>
                <p>
                  Group Samples ({group}): <span className="font-semibold">2,500</span>
                </p>
                <p>
                  Reference Samples: <span className="font-semibold">7,500</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Remediation Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  <li>Review data collection process for potential biases.</li>
                  <li>Consider re-sampling or re-weighting training data for {group}.</li>
                  <li>Explore fairness-aware machine learning algorithms.</li>
                  <li>Monitor this metric closely after next model deployment.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
