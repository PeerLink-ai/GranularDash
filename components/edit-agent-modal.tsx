"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EditAgentModal({ isOpen, onOpenChange, agent, onSaveAgent }) {
  const [agentName, setAgentName] = useState(agent?.agentName || "")
  const [agentType, setAgentType] = useState(agent?.agentType || "")
  const [apiKey, setApiKey] = useState(agent?.apiKey || "") // In a real app, avoid pre-filling sensitive data
  const [endpointUrl, setEndpointUrl] = useState(agent?.endpointUrl || "")

  useEffect(() => {
    if (agent) {
      setAgentName(agent.agentName)
      setAgentType(agent.agentType)
      setApiKey(agent.apiKey) // Still, be cautious with real API keys
      setEndpointUrl(agent.endpointUrl)
    }
  }, [agent])

  const handleSubmit = () => {
    if (agentName && agentType && apiKey && endpointUrl) {
      onSaveAgent({ ...agent, agentName, agentType, apiKey, endpointUrl })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>Modify the details for the AI agent.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agentName" className="text-right">
              Agent Name
            </Label>
            <Input
              id="agentName"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agentType" className="text-right">
              Agent Type
            </Label>
            <Select value={agentType} onValueChange={setAgentType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt">GPT (OpenAI)</SelectItem>
                <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                <SelectItem value="gemini">Gemini (Google)</SelectItem>
                <SelectItem value="custom">Custom/Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endpointUrl" className="text-right">
              Endpoint URL
            </Label>
            <Input
              id="endpointUrl"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
