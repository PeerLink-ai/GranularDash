import { type NextRequest, NextResponse } from "next/server"

// Mock database - in real implementation, use actual database
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

export async function GET() {
  return NextResponse.json({ agents: connectedAgents })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newAgent = {
    id: `${body.provider.toLowerCase()}-${Date.now()}`,
    name: body.name,
    provider: body.provider,
    model: body.model,
    status: "active",
    endpoint: body.endpoint,
    connectedAt: new Date().toISOString(),
    lastActive: "Just now",
    usage: {
      requests: 0,
      tokensUsed: 0,
      estimatedCost: 0,
    },
  }

  connectedAgents.push(newAgent)

  return NextResponse.json({ agent: newAgent })
}
