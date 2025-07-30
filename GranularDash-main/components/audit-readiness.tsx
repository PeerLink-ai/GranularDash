"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const auditReadinessItems = [
  { name: "GDPR Compliance", current: 85, target: 100 },
  { name: "SOC 2 Readiness", current: 70, target: 90 },
  { name: "Internal Audit Prep", current: 95, target: 100 },
]

export function AuditReadiness() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newGoal, setNewGoal] = useState({ name: "", current: 0, target: 100 })

  const handleAddGoal = () => {
    // In a real application, you would add this to a state management system or send to a backend
    console.log("Adding new audit goal:", newGoal)
    setIsModalOpen(false)
    setNewGoal({ name: "", current: 0, target: 100 }) // Reset form
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">Audit Readiness</CardTitle>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">Add new audit goal</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Audit Goal</DialogTitle>
              <DialogDescription>Enter the details for your new audit readiness goal.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goalName" className="text-right">
                  Name
                </Label>
                <Input
                  id="goalName"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentProgress" className="text-right">
                  Current (%)
                </Label>
                <Input
                  id="currentProgress"
                  type="number"
                  value={newGoal.current}
                  onChange={(e) => setNewGoal({ ...newGoal, current: Number.parseInt(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetProgress" className="text-right">
                  Target (%)
                </Label>
                <Input
                  id="targetProgress"
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: Number.parseInt(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGoal}>Add Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditReadinessItems.map((goal) => {
            const percentage = (goal.current / goal.target) * 100
            return (
              <div key={goal.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{goal.name}</span>
                  <span>
                    {goal.current}% / {goal.target}%
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-xs text-right text-muted-foreground">{percentage.toFixed(1)}% complete</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
