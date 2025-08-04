"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface FinancialGoal {
  id: string
  user_id: string
  title: string
  category: string
  target_amount: number
  current_amount: number
  due_date?: string
  status: "pending" | "in_progress" | "completed" | "delayed"
  notes?: string
  created_at: string
  updated_at: string
}

export function FinancialGoalsList() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [editFormData, setEditFormData] = useState<Omit<FinancialGoal, "id" | "user_id" | "created_at" | "updated_at">>(
    {
      title: "",
      category: "",
      target_amount: 0,
      current_amount: 0,
      due_date: "",
      status: "pending",
      notes: "",
    },
  )

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/financial-goals")
      if (response.ok) {
        const data = await response.json()
        setGoals(data)
      }
    } catch (error) {
      console.error("Failed to fetch financial goals:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: FinancialGoal["status"]) => {
    switch (status) {
      case "in_progress":
        return "default"
      case "completed":
        return "secondary" // Using secondary as success variant
      case "pending":
        return "secondary"
      case "delayed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleEditClick = (goal?: FinancialGoal) => {
    setSelectedGoal(goal || null)
    if (goal) {
      setEditFormData({
        title: goal.title,
        category: goal.category,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        due_date: goal.due_date || "",
        status: goal.status,
        notes: goal.notes || "",
      })
    } else {
      setEditFormData({
        title: "",
        category: "",
        target_amount: 0,
        current_amount: 0,
        due_date: "",
        status: "pending",
        notes: "",
      })
    }
    setIsEditModalOpen(true)
  }

  const handleSaveGoal = async () => {
    try {
      const url = selectedGoal ? `/api/financial-goals/${selectedGoal.id}` : "/api/financial-goals"
      const method = selectedGoal ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        await fetchGoals() // Refresh the list
        setIsEditModalOpen(false)
        setSelectedGoal(null)
      }
    } catch (error) {
      console.error("Failed to save goal:", error)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/financial-goals/${goalId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        await fetchGoals() // Refresh the list
      }
    } catch (error) {
      console.error("Failed to delete goal:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Your Financial Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading goals...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">Your Financial Goals</CardTitle>
          <Button onClick={() => handleEditClick()}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Goal
          </Button>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                No financial goals found. Create your first goal to start tracking your financial progress.
              </div>
              <Button variant="outline" onClick={() => handleEditClick()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">{goal.title}</TableCell>
                    <TableCell>{goal.category}</TableCell>
                    <TableCell>${goal.target_amount.toLocaleString()}</TableCell>
                    <TableCell>${goal.current_amount.toLocaleString()}</TableCell>
                    <TableCell>{goal.due_date ? new Date(goal.due_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(goal.status)}>{goal.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(goal)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Goal Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedGoal ? "Edit Financial Goal" : "Add New Financial Goal"}</DialogTitle>
            <DialogDescription>
              {selectedGoal ? "Make changes to your financial goal." : "Enter details for your new financial goal."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetAmount" className="text-right">
                Target Amount
              </Label>
              <Input
                id="targetAmount"
                type="number"
                value={editFormData.target_amount}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, target_amount: Number.parseFloat(e.target.value) || 0 })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentAmount" className="text-right">
                Current Amount
              </Label>
              <Input
                id="currentAmount"
                type="number"
                value={editFormData.current_amount}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, current_amount: Number.parseFloat(e.target.value) || 0 })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !editFormData.due_date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editFormData.due_date ? format(new Date(editFormData.due_date), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editFormData.due_date ? new Date(editFormData.due_date) : undefined}
                    onSelect={(date) =>
                      setEditFormData({ ...editFormData, due_date: date ? format(date, "yyyy-MM-dd") : "" })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={editFormData.status}
                onValueChange={(value: FinancialGoal["status"]) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveGoal}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
