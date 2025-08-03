import { type NextRequest, NextResponse } from "next/server"
import type { Agent } from "@/contexts/auth-context" // Import Agent type

// In-memory store for agents, keyed by user ID (same as in /api/agents/route.ts)
const userAgents = new Map<string, Agent[]>()

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const userId = request.headers.get("X-User-ID")

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agents = userAgents.get(userId) || []
  const agent = agents.find((a) => a.id === id)

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const { status } = await request.json()
  if (!["active", "inactive", "paused"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  agent.status = status
  agent.lastStatusChange = new Date().toISOString() // Update last status change timestamp

  userAgents.set(userId, agents) // Save updated agents list

  return NextResponse.json({ agent })
}
