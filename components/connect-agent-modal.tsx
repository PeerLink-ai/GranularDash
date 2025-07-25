"use client"

import { useState } from "react"
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

export function ConnectAgentModal({ isOpen, onOpenChange, onConnectAgent }) {
  const [agentName, setAgentName] = useState("")
  const [agentType, setAgentType] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [endpointUrl, setEndpointUrl] = useState("")

  const handleSubmit = () => {
    if (agentName && agentType && apiKey && endpointUrl) {
      onConnectAgent({ agentName, agentType, apiKey, endpointUrl })
      setAgentName("")
      setAgentType("")
      setApiKey("")
      setEndpointUrl("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect New Agent</DialogTitle>
          <DialogDescription>Enter the details for the external AI agent you want to connect.</DialogDescription>
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
              placeholder="e.g., GPT-4o Enterprise"
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
              placeholder="sk-********************"
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
              placeholder="https://api.example.com/v1/chat"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Connect Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
