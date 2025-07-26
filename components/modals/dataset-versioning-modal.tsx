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

interface DatasetVersioningModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DatasetVersioningModal({ isOpen, onClose }: DatasetVersioningModalProps) {
  const datasetVersions = [
    { version: "1.0.0", date: "2023-01-01", changes: "Initial import", owner: "Data Eng." },
    { version: "1.0.1", date: "2023-01-15", changes: "Fixed null values in 'email'", owner: "Data Eng." },
    { version: "1.1.0", date: "2023-02-01", changes: "Added 'customer_segment' column", owner: "Data Science" },
    { version: "1.1.1", date: "2023-02-10", changes: "Schema update: 'dob' to 'birth_date'", owner: "Data Eng." },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Dataset Versioning Details</DialogTitle>
          <DialogDescription>
            Comprehensive history and details of all dataset versions used in training and inference.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h4 className="font-semibold mb-2">Version History for Customer Data</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasetVersions.map((version, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{version.version}</TableCell>
                  <TableCell>{version.date}</TableCell>
                  <TableCell>{version.changes}</TableCell>
                  <TableCell>{version.owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground mt-4">
            This table provides a detailed audit trail for each version of the dataset, including modifications and
            responsible teams.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
