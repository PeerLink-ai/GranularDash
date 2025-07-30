"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function ViewAgentModal({ isOpen, onOpenChange, agent }) {
  const [command, setCommand] = useState('')
  const [commandDetails, setCommandDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  if (!agent) return null

  const handleSendCommand = async (e) => {
    e.preventDefault()
    if (!command.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/agents/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.agentId,
          action: 'command',
          command: command,
          details: commandDetails
        })
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        setCommand('')
        setCommandDetails('')
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{agent.agentName}</DialogTitle>
          <DialogDescription>
            Agent ID: {agent.agentId}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Agent Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Agent Type</Label>
              <div className="mt-1">
                <Badge variant="outline">{agent.agentType || 'custom'}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1">
                <Badge className={
                  agent.status === 'active' ? 'bg-green-100 text-green-800' :
                  agent.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }>
                  {agent.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <div className="mt-1 text-sm text-muted-foreground">
                {formatTimestamp(agent.createdAt)}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Connected</Label>
              <div className="mt-1 text-sm text-muted-foreground">
                {formatTimestamp(agent.lastConnected)}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">API URL</Label>
            <div className="mt-1 text-sm font-mono bg-gray-100 p-2 rounded break-all">
              {agent.agentApiUrl}
            </div>
          </div>

          {agent.details && (
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <div className="mt-1 text-sm text-muted-foreground">
                {agent.details}
              </div>
            </div>
          )}

          <Separator />

          {/* Send Command */}
          <div>
            <Label className="text-sm font-medium">Send Command</Label>
            <form onSubmit={handleSendCommand} className="mt-2 space-y-3">
              <div>
                <Input
                  placeholder="Enter command..."
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Optional command details..."
                  value={commandDetails}
                  onChange={(e) => setCommandDetails(e.target.value)}
                  rows={2}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading || !command.trim()}>
                {loading ? 'Sending...' : 'Send Command'}
              </Button>
            </form>
          </div>

          {/* Command Result */}
          {result && (
            <div className={`p-3 rounded ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="text-sm font-medium">
                {result.success ? 'Command Sent Successfully' : 'Command Failed'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {result.message}
              </div>
              {result.response && (
                <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-32">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
