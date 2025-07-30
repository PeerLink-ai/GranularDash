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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface TransformationStepsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TransformationStepsModal({ isOpen, onClose }: TransformationStepsModalProps) {
  const transformationSteps = [
    {
      id: "step-1",
      name: "Data Cleaning & Deduplication",
      description: "Removed duplicate records and handled missing values (e.g., email addresses).",
      script: "python scripts/clean_customer_data.py",
      input: "Raw Customer Data (v1.0.0)",
      output: "Staging Customer Data (v1.0.0)",
      timestamp: "2023-01-02 10:00 AM",
      status: "Completed",
    },
    {
      id: "step-2",
      name: "Age Group Categorization",
      description: "Categorized customers into age groups (e.g., '18-24', '25-34') based on birth date.",
      script: "spark_jobs/age_group_transform.scala",
      input: "Staging Customer Data (v1.0.0)",
      output: "Transformed Customer Data (v1.0.0)",
      timestamp: "2023-01-03 02:30 PM",
      status: "Completed",
    },
    {
      id: "step-3",
      name: "Country Encoding",
      description: "Converted country names to numerical codes for model compatibility.",
      script: "python scripts/encode_countries.py",
      input: "Transformed Customer Data (v1.0.0)",
      output: "Cleaned Customer Table (v1.0.0)",
      timestamp: "2023-01-04 09:15 AM",
      status: "Completed",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Transformation Steps Details</DialogTitle>
          <DialogDescription>
            Detailed logs and processes for all data transformation steps applied to datasets.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h4 className="font-semibold mb-2">Customer Data Transformation Pipeline</h4>
          <Accordion type="single" collapsible className="w-full">
            {transformationSteps.map((step) => (
              <AccordionItem key={step.id} value={step.id}>
                <AccordionTrigger className="text-left font-medium">{step.name}</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Description:</strong> {step.description}
                  </p>
                  <p>
                    <strong>Script/Job:</strong> <code>{step.script}</code>
                  </p>
                  <p>
                    <strong>Input Dataset:</strong> {step.input}
                  </p>
                  <p>
                    <strong>Output Dataset:</strong> {step.output}
                  </p>
                  <p>
                    <strong>Timestamp:</strong> {step.timestamp}
                  </p>
                  <p>
                    <strong>Status:</strong> {step.status}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="text-sm text-muted-foreground mt-4">
            Each step details the process, scripts used, and the input/output datasets, ensuring full traceability.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
