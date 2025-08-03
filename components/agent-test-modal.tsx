"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, Bot, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Agent } from "@/contexts/auth-context" // Import Agent type
import { useAuth } from "@/contexts/auth-context"

interface AgentTestModalProps {
  isOpen: boolean
  onClose: () => void
  agent: Agent | null
}

export function AgentTestModal({ isOpen, onClose, agent }: AgentTestModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  const handleTest = async () => {
    if (!user || !user.permissions.includes("test_agents")) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to test agents.",
        variant: "destructive",
      })
      return
    }
    if (!agent || !prompt.trim()) {
      setTestError("Please enter a prompt.")
      return
    }

    setIsTesting(true)
    setResponse(null)
    setTestError(null)

    try {
      const res = await fetch(`/api/agents/${agent.id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id, // Pass user ID
        },
        body: JSON.stringify({ prompt }),
      })

      if (res.ok) {
        const data = await res.json()
        setResponse(data.response)
        toast({
          title: "Test Successful",
          description: "Agent responded successfully.",
          icon: <CheckCircle className="h-4 w-4" />,
        })
      } else {
        const errorData = await res.json()
        setTestError(errorData.error || "Agent test failed.")
        toast({
          title: "Test Failed",
          description: errorData.error || "Agent did not respond as expected.",
          variant: "destructive",
          icon: <XCircle className="h-4 w-4" />,
        })
      }
    } catch (error) {
      setTestError(error instanceof Error ? error.message : "An unexpected error occurred during testing.")
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
        icon: <XCircle className="h-4 w-4" />,
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Test Agent: {agent?.name}</DialogTitle>
          <DialogDescription>Send a prompt to the agent and view its response.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              disabled={isTesting}
            />
            {testError && <p className="text-sm text-red-500 mt-2">{testError}</p>}
          </div>
          <Button onClick={handleTest} disabled={isTesting || !prompt.trim()}>
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Prompt
              </>
            )}
          </Button>
          {response && (
            <div className="space-y-2 mt-4">
              <Label>Agent Response</Label>
              <div className="relative rounded-md border bg-muted p-4 text-sm">
                <Bot className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
                <p className="whitespace-pre-wrap">{response}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
