"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DisparityHeatmap } from "@/components/fairness-bias/disparity-heatmap"
import { DisparitySummaryCard } from "@/components/fairness-bias/disparity-summary-card"
import { useState } from "react"
import { DisparityDetailModal } from "@/components/fairness-bias/disparity-detail-modal"

export type MetricData = {
  value: number
  history: number[]
  deviation: number // 0-100 for color intensity
}

export type HeatmapData = {
  group: string
  metrics: {
    disparateImpact: MetricData
    equalOpportunity: MetricData
    demographicParity: MetricData
    falsePositiveRate: MetricData
  }
}

const mockHeatmapData: HeatmapData[] = [
  {
    group: "Gender: Female",
    metrics: {
      disparateImpact: { value: 0.85, history: [0.82, 0.83, 0.85, 0.84, 0.85], deviation: 15 },
      equalOpportunity: { value: 0.05, history: [0.04, 0.05, 0.06, 0.05, 0.05], deviation: 50 },
      demographicParity: { value: 0.78, history: [0.77, 0.78, 0.79, 0.78, 0.78], deviation: 22 },
      falsePositiveRate: { value: 0.12, history: [0.11, 0.12, 0.13, 0.12, 0.12], deviation: 30 },
    },
  },
  {
    group: "Gender: Male",
    metrics: {
      disparateImpact: { value: 1.05, history: [1.03, 1.04, 1.05, 1.06, 1.05], deviation: 5 },
      equalOpportunity: { value: 0.02, history: [0.02, 0.03, 0.02, 0.02, 0.02], deviation: 20 },
      demographicParity: { value: 0.95, history: [0.94, 0.95, 0.96, 0.95, 0.95], deviation: 5 },
      falsePositiveRate: { value: 0.08, history: [0.09, 0.08, 0.07, 0.08, 0.08], deviation: 10 },
    },
  },
  {
    group: "Age: 18-25",
    metrics: {
      disparateImpact: { value: 0.92, history: [0.9, 0.91, 0.92, 0.93, 0.92], deviation: 8 },
      equalOpportunity: { value: 0.07, history: [0.06, 0.07, 0.08, 0.07, 0.07], deviation: 70 },
      demographicParity: { value: 0.85, history: [0.84, 0.85, 0.86, 0.85, 0.85], deviation: 15 },
      falsePositiveRate: { value: 0.15, history: [0.14, 0.15, 0.16, 0.15, 0.15], deviation: 40 },
    },
  },
  {
    group: "Age: 65+",
    metrics: {
      disparateImpact: { value: 0.7, history: [0.72, 0.71, 0.7, 0.69, 0.7], deviation: 30 },
      equalOpportunity: { value: 0.09, history: [0.08, 0.09, 0.1, 0.09, 0.09], deviation: 90 },
      demographicParity: { value: 0.65, history: [0.67, 0.66, 0.65, 0.64, 0.65], deviation: 35 },
      falsePositiveRate: { value: 0.2, history: [0.19, 0.2, 0.21, 0.2, 0.2], deviation: 50 },
    },
  },
]

export function FairnessBiasTab() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<{
    group: string
    metricName: string
    data: MetricData
  } | null>(null)

  const handleCellClick = (group: string, metricName: string, data: MetricData) => {
    setSelectedMetric({ group, metricName, data })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DisparitySummaryCard maxDisparityRatio={0.7} />
        {/* Add other summary cards here if needed */}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Fairness & Bias Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <DisparityHeatmap data={mockHeatmapData} onCellClick={handleCellClick} />
        </CardContent>
      </Card>

      {selectedMetric && (
        <DisparityDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          group={selectedMetric.group}
          metricName={selectedMetric.metricName}
          metricData={selectedMetric.data}
        />
      )}
    </div>
  )
}
