import { type NextRequest, NextResponse } from "next/server"
import type { Agent } from "@/contexts/auth-context" // Import Agent type

// In-memory store for agents, keyed by user ID (same as in /api/agents/route.ts)
const userAgents = new Map<string, Agent[]>()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

  // Return actual metrics from the agent object
  const metrics = {
    totalRequests: agent.usage.requests,
    tokensUsed: agent.usage.tokensUsed,
    estimatedCost: agent.usage.estimatedCost,
    status: agent.status,
    connectedAt: agent.connectedAt,
    lastActive: agent.lastActive,
    // Simulate some dynamic metrics based on current usage
    requestsToday: agent.usage.requests > 0 ? Math.floor(agent.usage.requests / 2) + 1 : 0, // Simplified
    successRate: 95 + Math.floor(Math.random() * 5), // 95-100%
    avgResponseTime: 100 + Math.floor(Math.random() * 200), // 100-300ms
    errorRate: Math.random() < 0.1 ? Math.floor(Math.random() * 3) + 1 : 0, // 0-3%
    uptime: 99 + Math.random(), // 99-100%
    recentLogs: [
      {
        status: "success",
        message: `Chat completion request processed successfully (${agent.usage.requests} total)`,
        timestamp: agent.lastActive,
      },
      {
        status: "info",
        message: `Agent ${agent.status} at ${new Date(agent.lastStatusChange || agent.connectedAt).toLocaleTimeString()}`,
        timestamp: agent.lastStatusChange || agent.connectedAt,
      },
      // Add more dynamic logs if needed
    ],
  }

  return NextResponse.json(metrics)
}
