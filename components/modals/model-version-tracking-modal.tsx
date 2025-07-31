"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ModelVersionTrackingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ModelVersionTrackingModal({ isOpen, onClose }: ModelVersionTrackingModalProps) {
  const modelVersions = [
    {
      version: "1.0",
      date: "2022-11-01",
      trainingData: "Dataset v1.0.0",
      accuracy: "90%",
      status: "Archived",
      notes: "Initial baseline model.",
    },
    {
      version: "1.1",
      date: "2022-12-05",
      trainingData: "Dataset v1.0.1",
      accuracy: "92%",
      status: "Archived",
      notes: "Improved feature engineering.",
    },
    {
      version: "1.2",
      date: "2023-01-10",
      trainingData: "Dataset v1.1.0",
      accuracy: "94%",
      status: "Deployed",
      notes: "New algorithm, significant performance boost.",
    },
    {
      version: "1.3 (Beta)",
      date: "2023-02-20",
      trainingData: "Dataset v1.1.1",
      accuracy: "95%",
      status: "Testing",
      notes: "Experimenting with real-time features.",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Model Version Tracking Details</DialogTitle>
          <DialogDescription>
            Record every iteration and version of your AI models, linking them to specific training data.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h4 className="font-semibold mb-2">Fraud Detection Model Versions</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Training Data</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelVersions.map((model, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{model.version}</TableCell>
                  <TableCell>{model.date}</TableCell>
                  <TableCell>{model.trainingData}</TableCell>
                  <TableCell>{model.accuracy}</TableCell>
                  <TableCell>
                    <Badge variant={model.status === "Deployed" ? "default" : "outline"}>{model.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{model.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground mt-4">
            This table provides a detailed overview of each model version, its performance, and the data used for
            training.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
