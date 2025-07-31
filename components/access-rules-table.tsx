"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
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

const initialRules = [
  {
    id: "AR001",
    name: "Admin Access to Financial Data",
    resource: "Financial Records",
    role: "Admin",
    permission: "Read/Write",
    status: "Active",
    lastModified: "2023-07-20",
    description: "Allows administrators full access to financial databases.",
  },
  {
    id: "AR002",
    name: "HR Agent Data Access",
    resource: "Employee Records",
    role: "AI-HR-Agent",
    permission: "Read-Only",
    status: "Active",
    lastModified: "2023-07-18",
    description: "Grants HR AI agents read-only access to employee profiles for processing.",
  },
  {
    id: "AR003",
    name: "Marketing Content Approval",
    resource: "Marketing Assets",
    role: "Editor",
    permission: "Approve",
    status: "Inactive",
    lastModified: "2023-07-15",
    description: "Requires editor approval for all marketing content before publication.",
  },
  {
    id: "AR004",
    name: "External API Access",
    resource: "External APIs",
    role: "Developer",
    permission: "Execute",
    status: "Active",
    lastModified: "2023-07-22",
    description: "Permits developers to execute calls to approved external APIs.",
  },
]

export function AccessRulesTable() {
  const [rules, setRules] = useState(initialRules)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState(null)
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    resource: "",
    role: "",
    permission: "",
    status: "",
    description: "",
  })

  const handleEditClick = (rule) => {
    setSelectedRule(rule)
    setEditFormData({
      id: rule.id,
      name: rule.name,
      resource: rule.resource,
      role: rule.role,
      permission: rule.permission,
      status: rule.status,
      description: rule.description,
    })
    setIsEditModalOpen(true)
  }

  const handleViewDetails = (rule) => {
    setSelectedRule(rule)
    setIsViewModalOpen(true)
  }

  const handleSaveRule = () => {
    setRules(
      rules.map((r) =>
        r.id === editFormData.id ? { ...r, ...editFormData, lastModified: new Date().toISOString().split("T")[0] } : r,
      ),
    )
    setIsEditModalOpen(false)
  }

  const handleDeleteRule = (ruleId) => {
    setRules(rules.filter((r) => r.id !== ruleId))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>{rule.resource}</TableCell>
                <TableCell>{rule.role}</TableCell>
                <TableCell>{rule.permission}</TableCell>
                <TableCell>{rule.status}</TableCell>
                <TableCell>{rule.lastModified}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(rule)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditClick(rule)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteRule(rule.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Edit Access Rule Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Access Rule</DialogTitle>
            <DialogDescription>Make changes to the access rule details.</DialogDescription>
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
              <Label htmlFor="resource" className="text-right">
                Resource
              </Label>
              <Input
                id="resource"
                value={editFormData.resource}
                onChange={(e) => setEditFormData({ ...editFormData, resource: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="permission" className="text-right">
                Permission
              </Label>
              <Input
                id="permission"
                value={editFormData.permission}
                onChange={(e) => setEditFormData({ ...editFormData, permission: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="submit" onClick={handleSaveRule}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Access Rule Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Access Rule Details: {selectedRule?.name}</DialogTitle>
            <DialogDescription>Comprehensive information about the selected access rule.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">ID:</span>
              <span>{selectedRule?.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Resource:</span>
              <span>{selectedRule?.resource}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Role:</span>
              <span>{selectedRule?.role}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Permission:</span>
              <span>{selectedRule?.permission}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Status:</span>
              <span>{selectedRule?.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Last Modified:</span>
              <span>{selectedRule?.lastModified}</span>
            </div>
            {selectedRule?.description && (
              <>
                <div className="col-span-2">
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{selectedRule.description}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
