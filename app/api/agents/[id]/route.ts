import { type NextRequest, NextResponse } from "next/server"

// Mock database - same as above
const connectedAgents = [
  {
    id: "openai-gpt4o-001",
    name: "GPT-4o Enterprise",
    provider: "OpenAI",
    model: "gpt-4o",
    status: "active",
    endpoint: "https://api.openai.com/v1/chat/completions",
    connectedAt: "2024-01-15T10:30:00Z",
    lastActive: "2 hours ago",
    usage: {
      requests: 1247,
      tokensUsed: 45230,
      estimatedCost: 12.45,
    },
  },
  {
    id: "anthropic-claude3-001",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    model: "claude-3-opus",
    status: "active",
    endpoint: "https://api.anthropic.com/v1/messages",
    connectedAt: "2024-01-14T15:20:00Z",
    lastActive: "1 hour ago",
    usage: {
      requests: 892,
      tokensUsed: 32100,
      estimatedCost: 8.9,
    },
  },
  {
    id: "groq-llama3-001",
    name: "Llama 3 70B",
    provider: "Groq",
    model: "llama3-70b",
    status: "inactive",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    connectedAt: "2024-01-13T09:15:00Z",
    lastActive: "1 day ago",
    usage: {
      requests: 456,
      tokensUsed: 18900,
      estimatedCost: 2.3,
    },
  },
]

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  const agentIndex = connectedAgents.findIndex((agent) => agent.id === id)
  if (agentIndex === -1) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  connectedAgents.splice(agentIndex, 1)

  return NextResponse.json({ success: true })
}
