import { type NextRequest, NextResponse } from "next/server"
import type { Agent } from "@/contexts/auth-context" // Import Agent type

// In-memory store for agents, keyed by user ID
// In a real application, this would be a persistent database
const userAgents = new Map<string, Agent[]>()

export async function GET(request: NextRequest) {
  const userId = request.headers.get("X-User-ID")

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agents = userAgents.get(userId) || []
  return NextResponse.json({ agents })
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("X-User-ID")

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  const newAgent: Agent = {
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

  const agents = userAgents.get(userId) || []
  agents.push(newAgent)
  userAgents.set(userId, agents)

  return NextResponse.json({ agent: newAgent })
}
