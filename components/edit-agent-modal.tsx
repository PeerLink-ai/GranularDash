"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModalHeader } from "@/components/ui/modal-header"
import { Pencil } from 'lucide-react'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  agent: any | null
  onSaveAgent: (updated: any) => void
}

export function EditAgentModal({ isOpen, onOpenChange, agent, onSaveAgent }: Props) {
  const [agentName, setAgentName] = useState(agent?.agentName || "")
  const [agentType, setAgentType] = useState(agent?.agentType || "")
  const [apiKey, setApiKey] = useState(agent?.apiKey || "")
  const [endpointUrl, setEndpointUrl] = useState(agent?.endpointUrl || "")

  useEffect(() => {
    if (agent) {
      setAgentName(agent.agentName || agent.name || "")
      setAgentType(agent.agentType || agent.type || "")
      setApiKey(agent.apiKey || "")
      setEndpointUrl(agent.endpointUrl || agent.endpoint || "")
    }
  }, [agent])

  const canSave = useMemo(
    () => agentName.trim().length >= 2 && agentType.length > 0 && endpointUrl.trim().length > 0,
    [agentName, agentType, endpointUrl]
  )

  const handleSubmit = () => {
    if (!canSave) return
    onSaveAgent({ ...agent, agentName, agentType, apiKey, endpointUrl })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        <ModalHeader
          title="Edit Agent"
          description="Update the agent’s identifying details or connection"
          icon={Pencil}
          gradientFrom="from-sky-600"
          gradientTo="to-cyan-500"
        />
        <div className="px-4 sm:px-6 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agentName">Agent Name</Label>
              <Input id="agentName" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentType">Agent Type</Label>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger id="agentType">
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
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpointUrl">Endpoint URL</Label>
              <Input id="endpointUrl" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
