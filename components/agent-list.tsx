"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { EditAgentModal } from "./edit-agent-modal" // Import the new modal

const initialAgents = [
  {
    id: "AG001",
    name: "Core AI Agent",
    type: "Internal",
    status: "Active",
    version: "1.2.0",
    lastUpdate: "2023-07-20",
  },
  {
    id: "AG002",
    name: "Data Processing Unit",
    type: "Internal",
    status: "Active",
    version: "1.1.5",
    lastUpdate: "2023-07-18",
  },
  {
    id: "AG003",
    name: "Compliance Monitor",
    type: "Internal",
    status: "Inactive",
    version: "1.0.0",
    lastUpdate: "2023-07-15",
  },
  {
    id: "AG004",
    name: "GPT-4o Enterprise",
    type: "External",
    status: "Active",
    version: "4.0.0",
    lastUpdate: "2023-07-22",
    apiKey: "sk-example-gpt",
    endpointUrl: "https://api.openai.com/v1/chat/completions",
  },
  {
    id: "AG005",
    name: "Claude 3 Opus",
    type: "External",
    status: "Active",
    version: "3.0.0",
    lastUpdate: "2023-07-21",
    apiKey: "sk-example-claude",
    endpointUrl: "https://api.anthropic.com/v1/messages",
  },
]

export function AgentList() {
  const [agents, setAgents] = useState(initialAgents)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const handleEditClick = (agent) => {
    setSelectedAgent(agent)
    setIsEditModalOpen(true)
  }

  const handleSaveAgent = (updatedAgent) => {
    setAgents(agents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent)))
  }

  const handleDeleteAgent = (agentId) => {
    setAgents(agents.filter((agent) => agent.id !== agentId))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Agent List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.id}</TableCell>
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent.type}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                  </TableCell>
                  <TableCell>{agent.version}</TableCell>
                  <TableCell>{agent.lastUpdate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(agent)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteAgent(agent.id)}>Delete</DropdownMenuItem>
                        {/* Add more actions here if needed */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {selectedAgent && (
        <EditAgentModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          agent={selectedAgent}
          onSaveAgent={handleSaveAgent}
        />
      )}
    </Card>
  )
}
