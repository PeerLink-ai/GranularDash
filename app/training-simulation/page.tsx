"use client"

import { TrainingSimulationList } from "@/components/training-simulation-list"

export default function TrainingSimulationPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Training & Simulations</h2>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Manage training modules and security simulations for your organization.
          </p>
        </div>
      </div>

      <TrainingSimulationList />
    </div>
  )
}
