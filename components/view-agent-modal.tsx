"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Agent {
  id: string
  name?: string
  agentName?: string
  type?: string
  agentType?: string
  status?: string
  version?: string
  lastUpdate?: string
  apiKey?: string
  endpointUrl?: string
}

export function ViewAgentModal({ isOpen, onOpenChange, agent }: { isOpen: boolean; onOpenChange: (open: boolean) => void; agent: Agent | null }) {
  if (!agent) return null

  const displayName = agent.name || agent.agentName || ""
  const displayType = agent.type || agent.agentType || ""

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agent Details</DialogTitle>
          <DialogDescription>Information for {displayName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">ID</Label>
            <Input className="col-span-3" value={agent.id} readOnly />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Name</Label>
            <Input className="col-span-3" value={displayName} readOnly />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <Input className="col-span-3" value={displayType} readOnly />
          </div>
          {agent.status && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <Input className="col-span-3" value={agent.status} readOnly />
            </div>
          )}
          {agent.version && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Version</Label>
              <Input className="col-span-3" value={agent.version} readOnly />
            </div>
          )}
          {agent.lastUpdate && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Last Update</Label>
              <Input className="col-span-3" value={agent.lastUpdate} readOnly />
            </div>
          )}
          {agent.apiKey && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">API Key</Label>
              <Input className="col-span-3" value={agent.apiKey} readOnly />
            </div>
          )}
          {agent.endpointUrl && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Endpoint URL</Label>
              <Input className="col-span-3" value={agent.endpointUrl} readOnly />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

