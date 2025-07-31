"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle } from "lucide-react"
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

const initialPolicies = [
  {
    id: "P001",
    name: "Data Privacy Policy",
    category: "Compliance",
    version: "1.0",
    lastUpdated: "2023-07-20",
    description: "Governs the collection, storage, and processing of personal data in accordance with GDPR and CCPA.",
  },
  {
    id: "P002",
    name: "Ethical AI Use Policy",
    category: "Ethics",
    version: "1.1",
    lastUpdated: "2023-07-15",
    description:
      "Outlines principles for responsible AI development and deployment, focusing on fairness, transparency, and accountability.",
  },
  {
    id: "P003",
    name: "Financial Transaction Monitoring",
    category: "Security",
    version: "1.0",
    lastUpdated: "2023-07-10",
    description: "Rules for real-time monitoring of financial transactions to detect and prevent fraud.",
  },
  {
    id: "P004",
    name: "Agent Deployment Guidelines",
    category: "Operations",
    version: "1.2",
    lastUpdated: "2023-07-22",
    description: "Procedures and requirements for deploying new AI agents into production environments.",
  },
]

export function PolicyList() {
  const [policies, setPolicies] = useState(initialPolicies)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [editFormData, setEditFormData] = useState({ id: "", name: "", category: "", version: "", description: "" })
  const [addFormData, setAddFormData] = useState({
    name: "",
    category: "",
    version: "",
    description: "",
  })

  const handleEditClick = (policy) => {
    setSelectedPolicy(policy)
    setEditFormData({
      id: policy.id,
      name: policy.name,
      category: policy.category,
      version: policy.version,
      description: policy.description,
    })
    setIsEditModalOpen(true)
  }

  const handleViewDetails = (policy) => {
    setSelectedPolicy(policy)
    setIsViewModalOpen(true)
  }

  const handleSavePolicy = () => {
    setPolicies(
      policies.map((p) =>
        p.id === editFormData.id ? { ...p, ...editFormData, lastUpdated: new Date().toISOString().split("T")[0] } : p,
      ),
    )
    setIsEditModalOpen(false)
  }

  const handleDeletePolicy = (policyId) => {
    setPolicies(policies.filter((p) => p.id !== policyId))
  }

  const handleAddPolicy = () => {
    const newPolicyId = `P${String(policies.length + 1).padStart(3, "0")}`
    const newPolicy = {
      id: newPolicyId,
      ...addFormData,
      lastUpdated: new Date().toISOString().split("T")[0],
    }
    setPolicies([...policies, newPolicy])
    setAddFormData({ name: "", category: "", version: "", description: "" })
    setIsAddModalOpen(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Policy List</CardTitle>
        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Policy
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell className="font-medium">{policy.id}</TableCell>
                <TableCell>{policy.name}</TableCell>
                <TableCell>{policy.category}</TableCell>
                <TableCell>{policy.version}</TableCell>
                <TableCell>{policy.lastUpdated}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(policy)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditClick(policy)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeletePolicy(policy.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Add Policy Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Policy</DialogTitle>
            <DialogDescription>Enter the details for the new policy.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-name" className="text-right">
                Name
              </Label>
              <Input
                id="add-name"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-category" className="text-right">
                Category
              </Label>
              <Input
                id="add-category"
                value={addFormData.category}
                onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-version" className="text-right">
                Version
              </Label>
              <Input
                id="add-version"
                value={addFormData.version}
                onChange={(e) => setAddFormData({ ...addFormData, version: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="add-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="add-description"
                value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAddPolicy}>
              Create Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>Make changes to the policy details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
              <Label htmlFor="version" className="text-right">
                Version
              </Label>
              <Input
                id="version"
                value={editFormData.version}
                onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSavePolicy}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Policy Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Policy Details: {selectedPolicy?.name}</DialogTitle>
            <DialogDescription>Comprehensive information about the selected policy.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">ID:</span>
              <span>{selectedPolicy?.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Category:</span>
              <span>{selectedPolicy?.category}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Version:</span>
              <span>{selectedPolicy?.version}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Last Updated:</span>
              <span>{selectedPolicy?.lastUpdated}</span>
            </div>
            {selectedPolicy?.description && (
              <>
                <div className="col-span-2">
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{selectedPolicy.description}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
