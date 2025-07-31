"use client"

import { useState } from "react"
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
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

type FinancialGoal = {
  id: string
  title: string
  category: string
  targetAmount: number
  currentAmount: number
  dueDate: string
  status: "In Progress" | "Completed" | "Pending" | "Delayed"
  notes?: string
}

const initialGoals: FinancialGoal[] = [
  {
    id: "FG001",
    title: "Emergency Fund",
    category: "Savings",
    targetAmount: 15000,
    currentAmount: 10000,
    dueDate: "2024-12-31",
    status: "In Progress",
    notes: "Aiming for 6 months of living expenses.",
  },
  {
    id: "FG002",
    title: "New Car Down Payment",
    category: "Purchase",
    targetAmount: 10000,
    currentAmount: 2500,
    dueDate: "2025-06-30",
    status: "In Progress",
    notes: "Looking at electric vehicles.",
  },
  {
    id: "FG003",
    title: "Student Loan Payoff",
    category: "Debt",
    targetAmount: 25000,
    currentAmount: 25000,
    dueDate: "2024-07-25",
    status: "Completed",
    notes: "Paid off ahead of schedule!",
  },
  {
    id: "FG004",
    title: "Retirement Savings Boost",
    category: "Investment",
    targetAmount: 5000,
    currentAmount: 1000,
    dueDate: "2024-12-31",
    status: "Pending",
    notes: "Increase 401k contributions.",
  },
]

export function FinancialGoalsList() {
  const [goals, setGoals] = useState(initialGoals)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null)
  const [editFormData, setEditFormData] = useState<Omit<FinancialGoal, "id">>({
    title: "",
    category: "",
    targetAmount: 0,
    currentAmount: 0,
    dueDate: "",
    status: "Pending",
    notes: "",
  })

  const getStatusBadgeVariant = (status: FinancialGoal["status"]) => {
    switch (status) {
      case "In Progress":
        return "default"
      case "Completed":
        return "success" // Assuming 'success' variant exists or use a custom class
      case "Pending":
        return "secondary"
      case "Delayed":
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
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        dueDate: goal.dueDate,
        status: goal.status,
        notes: goal.notes || "",
      })
    } else {
      setEditFormData({
        title: "",
        category: "",
        targetAmount: 0,
        currentAmount: 0,
        dueDate: "",
        status: "Pending",
        notes: "",
      })
    }
    setIsEditModalOpen(true)
  }

  const handleSaveGoal = () => {
    if (selectedGoal) {
      setGoals(goals.map((g) => (g.id === selectedGoal.id ? { ...g, ...editFormData } : g)))
    } else {
      const newGoal: FinancialGoal = {
        ...editFormData,
        id: `FG${Date.now()}`, // Simple unique ID
      }
      setGoals([...goals, newGoal])
    }
    setIsEditModalOpen(false)
    setSelectedGoal(null)
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter((g) => g.id !== goalId))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Your Financial Goals</CardTitle>
        <Button onClick={() => handleEditClick()}>Add New Goal</Button>
      </CardHeader>
      <CardContent>
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
                <TableCell>${goal.targetAmount.toLocaleString()}</TableCell>
                <TableCell>${goal.currentAmount.toLocaleString()}</TableCell>
                <TableCell>{goal.dueDate}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(goal.status)}>{goal.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
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
      </CardContent>

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
                value={editFormData.targetAmount}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, targetAmount: Number.parseFloat(e.target.value) || 0 })
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
                value={editFormData.currentAmount}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, currentAmount: Number.parseFloat(e.target.value) || 0 })
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
                      !editFormData.dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editFormData.dueDate ? format(new Date(editFormData.dueDate), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editFormData.dueDate ? new Date(editFormData.dueDate) : undefined}
                    onSelect={(date) =>
                      setEditFormData({ ...editFormData, dueDate: date ? format(date, "yyyy-MM-dd") : "" })
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
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
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
    </Card>
  )
}
