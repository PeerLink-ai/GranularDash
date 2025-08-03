import { type NextRequest, NextResponse } from "next/server"
import type { Agent } from "@/contexts/auth-context" // Import Agent type

// In-memory store for agents, keyed by user ID (same as in /api/agents/route.ts)
const userAgents = new Map<string, Agent[]>()

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const userId = request.headers.get("X-User-ID")

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let agents = userAgents.get(userId) || []
  const initialLength = agents.length
  agents = agents.filter((agent) => agent.id !== id)

  if (agents.length === initialLength) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  userAgents.set(userId, agents)

  return NextResponse.json({ success: true })
}
