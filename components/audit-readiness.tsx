"use client"

import { useState, useEffect } from "react"
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
import { useAuth } from "@/contexts/auth-context"

interface AuditReadinessItem {
  id: string
  name: string
  current: number
  target: number
  organization: string
}

export function AuditReadiness() {
  const { user } = useAuth()
  const [auditItems, setAuditItems] = useState<AuditReadinessItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newGoal, setNewGoal] = useState({ name: "", current: 0, target: 100 })

  useEffect(() => {
    if (user?.organization) {
      fetchAuditReadiness()
    }
  }, [user])

  const fetchAuditReadiness = async () => {
    try {
      const response = await fetch(`/api/audit-readiness?organization=${user?.organization}`)
      if (response.ok) {
        const data = await response.json()
        setAuditItems(data)
      }
    } catch (error) {
      console.error("Failed to fetch audit readiness:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async () => {
    try {
      const response = await fetch("/api/audit-readiness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newGoal),
      })

      if (response.ok) {
        await fetchAuditReadiness() // Refresh the list
        setIsModalOpen(false)
        setNewGoal({ name: "", current: 0, target: 100 }) // Reset form
      }
    } catch (error) {
      console.error("Failed to add audit goal:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-md font-medium">Audit Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading audit readiness...</div>
          </div>
        </CardContent>
      </Card>
    )
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
        {auditItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit readiness goals found. Add your first goal to start tracking compliance progress.
          </div>
        ) : (
          <div className="space-y-4">
            {auditItems.map((goal) => {
              const percentage = (goal.current / goal.target) * 100
              return (
                <div key={goal.id} className="space-y-2">
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
        )}
      </CardContent>
    </Card>
  )
}
