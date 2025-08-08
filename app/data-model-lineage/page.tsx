"use client"

import * as React from "react"
import { DataModelLineage } from "@/components/data-model-lineage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function DataModelLineagePage() {
  const [datasetOpen, setDatasetOpen] = React.useState(false)
  const [transformOpen, setTransformOpen] = React.useState(false)
  const [modelOpen, setModelOpen] = React.useState(false)

  return (
    <>
      <DataModelLineage
        onOpenDatasetVersioning={() => setDatasetOpen(true)}
        onOpenTransformationSteps={() => setTransformOpen(true)}
        onOpenModelVersionTracking={() => setModelOpen(true)}
      />

      <Dialog open={datasetOpen} onOpenChange={setDatasetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dataset Versioning</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Track and compare dataset versions, diffs, and approvals.</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>v1.0.0 — Created by Data Engineering — 2023-01-01</li>
              <li>v1.1.0 — Columns normalized — 2023-02-14</li>
            </ul>
            <div className="pt-2">
              <Button size="sm" variant="outline">Compare v1.0.0 → v1.1.0</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={transformOpen} onOpenChange={setTransformOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transformation Steps</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <ol className="list-decimal ml-5 space-y-1">
              <li>Remove PII and hash emails</li>
              <li>Impute missing ages</li>
              <li>One-hot encode country</li>
              <li>Write to dw.customer_cleaned</li>
            </ol>
            <div className="pt-2">
              <Button size="sm" variant="outline">Open Job Logs</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modelOpen} onOpenChange={setModelOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Model Version Tracking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <ul className="list-disc ml-5 space-y-1">
              <li>v1.2 — AUC 0.94 — deployed 2023-01-10</li>
              <li>v1.3 — AUC 0.947 — staged, pending approval</li>
            </ul>
            <div className="pt-2 flex gap-2">
              <Button size="sm">Promote v1.3</Button>
              <Button size="sm" variant="outline">Open Registry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
