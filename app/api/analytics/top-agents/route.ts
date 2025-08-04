import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user organization from session/auth - for now using placeholder
    const organization = "demo-org"

    // Fetch top agents with security scores
    const agents = await sql`
      SELECT 
        ca.id,
        ca.name,
        ca.status,
        ca.last_activity,
        COALESCE(100 - (COUNT(pv.id) * 10), 100) as security_score
      FROM connected_agents ca
      LEFT JOIN policy_violations pv ON ca.id = pv.agent_id AND pv.status = 'open'
      WHERE ca.organization_id = ${organization}
      GROUP BY ca.id, ca.name, ca.status, ca.last_activity
      ORDER BY security_score DESC
      LIMIT 5
    `.catch(() => [])

    const formattedAgents = agents.map((agent: any) => ({
      id: agent.id,
      name: agent.name || `Agent ${agent.id}`,
      securityScore: Math.max(0, Math.min(100, Number(agent.security_score || 100))),
      status: agent.status || "active",
      lastActivity: agent.last_activity ? new Date(agent.last_activity).toLocaleDateString() : "Never",
    }))

    return NextResponse.json(formattedAgents)
  } catch (error) {
    console.error("Top agents error:", error)
    return NextResponse.json([])
  }
}
