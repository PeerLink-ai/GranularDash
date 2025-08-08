"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserSquare2 } from 'lucide-react'
import { ModalHeader } from "@/components/ui/modal-header"

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

export function ViewAgentModal({
  isOpen,
  onOpenChange,
  agent,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  agent: Agent | null
}) {
  if (!agent) return null

  const displayName = agent.name || agent.agentName || ""
  const displayType = agent.type || agent.agentType || ""

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        <ModalHeader
          title="Agent Details"
          description={`Information for ${displayName}`}
          icon={UserSquare2}
          gradientFrom="from-indigo-700"
          gradientTo="to-purple-600"
        />
        <div className="px-4 sm:px-6 py-4 grid gap-4">
          <Field label="ID" value={agent.id} />
          <Field label="Name" value={displayName} />
          <Field label="Type" value={displayType} />
          {agent.status && <Field label="Status" value={agent.status} />}
          {agent.version && <Field label="Version" value={agent.version} />}
          {agent.lastUpdate && <Field label="Last Update" value={agent.lastUpdate} />}
          {agent.apiKey && <Field label="API Key" value={agent.apiKey} />}
          {agent.endpointUrl && <Field label="Endpoint URL" value={agent.endpointUrl} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-4 items-center gap-3">
      <Label className="text-right col-span-1">{label}</Label>
      <Input className="col-span-3" value={value} readOnly />
    </div>
  )
}
