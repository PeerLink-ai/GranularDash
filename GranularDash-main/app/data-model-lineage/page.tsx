"use client"

import * as React from "react"
import { DataModelLineage } from "@/components/data-model-lineage"
import { DatasetVersioningModal } from "@/components/modals/dataset-versioning-modal"
import { TransformationStepsModal } from "@/components/modals/transformation-steps-modal"
import { ModelVersionTrackingModal } from "@/components/modals/model-version-tracking-modal"

export default function DataModelLineagePage() {
  const [isDatasetVersioningModalOpen, setIsDatasetVersioningModalOpen] = React.useState(false)
  const [isTransformationStepsModalOpen, setIsTransformationStepsModalOpen] = React.useState(false)
  const [isModelVersionTrackingModalOpen, setIsModelVersionTrackingModalOpen] = React.useState(false)

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 mb-6">
        Data & Model Lineage
      </h1>
      <DataModelLineage
        onOpenDatasetVersioning={() => setIsDatasetVersioningModalOpen(true)}
        onOpenTransformationSteps={() => setIsTransformationStepsModalOpen(true)}
        onOpenModelVersionTracking={() => setIsModelVersionTrackingModalOpen(true)}
      />

      <DatasetVersioningModal
        isOpen={isDatasetVersioningModalOpen}
        onClose={() => setIsDatasetVersioningModalOpen(false)}
      />
      <TransformationStepsModal
        isOpen={isTransformationStepsModalOpen}
        onClose={() => setIsTransformationStepsModalOpen(false)}
      />
      <ModelVersionTrackingModal
        isOpen={isModelVersionTrackingModalOpen}
        onClose={() => setIsModelVersionTrackingModalOpen(false)}
      />
    </div>
  )
}
