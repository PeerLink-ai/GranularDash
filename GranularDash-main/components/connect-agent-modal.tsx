"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function ConnectAgentModal({ isOpen, onOpenChange, onAgentAdded }) {
  const [formData, setFormData] = useState({
    agentId: '',
    agentName: '',
    agentApiUrl: '',
    agentApiKey: '',
    agentType: 'custom',
    details: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/agents/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        onAgentAdded?.()
        onOpenChange(false)
        setFormData({
          agentId: '',
          agentName: '',
          agentApiUrl: '',
          agentApiKey: '',
          agentType: 'custom',
          details: ''
        })
      } else {
        setError(result.error || 'Failed to connect agent')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect New Agent</DialogTitle>
          <DialogDescription>
            Add a new agent to your system. Provide the agent's API details to establish a connection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agentId">Agent ID *</Label>
              <Input
                id="agentId"
                value={formData.agentId}
                onChange={(e) => handleInputChange('agentId', e.target.value)}
                placeholder="e.g., chatgpt-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentName">Agent Name *</Label>
              <Input
                id="agentName"
                value={formData.agentName}
                onChange={(e) => handleInputChange('agentName', e.target.value)}
                placeholder="e.g., ChatGPT Assistant"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentApiUrl">API URL *</Label>
            <Input
              id="agentApiUrl"
              value={formData.agentApiUrl}
              onChange={(e) => handleInputChange('agentApiUrl', e.target.value)}
              placeholder="https://api.openai.com/v1/chat/completions"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentApiKey">API Key</Label>
            <Input
              id="agentApiKey"
              type="password"
              value={formData.agentApiKey}
              onChange={(e) => handleInputChange('agentApiKey', e.target.value)}
              placeholder="sk-..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentType">Agent Type</Label>
            <Select value={formData.agentType} onValueChange={(value) => handleInputChange('agentType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Description</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => handleInputChange('details', e.target.value)}
              placeholder="Optional description of this agent's purpose..."
              rows={3}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect Agent'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
