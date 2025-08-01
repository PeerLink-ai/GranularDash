"use client"

import { FinancialGoalsList } from "@/components/financial-goals-list"

export default function FinancialGoalsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Financial Goals</h2>
      </div>
      <FinancialGoalsList />
    </div>
  )
}
