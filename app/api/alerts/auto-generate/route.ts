import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const alerts = []

    // Check for agents with high error rates
    const problematicAgents = await sql`
      SELECT 
        ca.name,
        ca.agent_id,
        ca.error_count,
        ca.usage_requests,
        (ca.error_count::float / NULLIF(ca.usage_requests, 0) * 100) as error_rate
      FROM connected_agents ca
      WHERE ca.user_id = ${user.id}
        AND ca.usage_requests > 10
        AND (ca.error_count::float / NULLIF(ca.usage_requests, 0) * 100) > 5
    `

    for (const agent of problematicAgents) {
      alerts.push({
        type: "agent_performance",
        severity: agent.error_rate > 20 ? "critical" : "high",
        title: `High Error Rate: ${agent.name}`,
        message: `Agent ${agent.name} has a ${agent.error_rate.toFixed(1)}% error rate (${agent.error_count} errors out of ${agent.usage_requests} requests)`,
        agent_id: agent.agent_id,
      })
    }

    // Check for inactive agents
    const inactiveAgents = await sql`
      SELECT name, agent_id, last_active
      FROM connected_agents
      WHERE user_id = ${user.id}
        AND status = 'active'
        AND (last_active < NOW() - INTERVAL '24 hours' OR last_active IS NULL)
    `

    for (const agent of inactiveAgents) {
      alerts.push({
        type: "agent_inactive",
        severity: "medium",
        title: `Inactive Agent: ${agent.name}`,
        message: `Agent ${agent.name} has been inactive for over 24 hours. Last activity: ${agent.last_active ? new Date(agent.last_active).toLocaleString() : "Never"}`,
        agent_id: agent.agent_id,
      })
    }

    // Check for unusual spending patterns
    const recentSpending = await sql`
      SELECT 
        SUM(usage_estimated_cost) as total_cost,
        COUNT(*) as agent_count,
        AVG(usage_estimated_cost) as avg_cost
      FROM connected_agents
      WHERE user_id = ${user.id}
        AND last_active > NOW() - INTERVAL '24 hours'
    `

    if (recentSpending[0]?.total_cost > 100) {
      alerts.push({
        type: "cost_alert",
        severity: "high",
        title: "High Usage Costs Detected",
        message: `Your agents have incurred $${recentSpending[0].total_cost.toFixed(2)} in estimated costs over the last 24 hours across ${recentSpending[0].agent_count} agents.`,
      })
    }

    // Insert alerts into notifications table
    for (const alert of alerts) {
      await sql`
        INSERT INTO notifications (
          organization_id,
          type,
          severity,
          title,
          message,
          read,
          created_at
        ) VALUES (
          ${user.organization || "default"},
          ${alert.type},
          ${alert.severity},
          ${alert.title},
          ${alert.message},
          false,
          NOW()
        )
      `
    }

    return NextResponse.json({
      alertsGenerated: alerts.length,
      alerts: alerts.map((a) => ({ type: a.type, severity: a.severity, title: a.title })),
    })
  } catch (error) {
    console.error("Error generating alerts:", error)
    return NextResponse.json({ error: "Failed to generate alerts" }, { status: 500 })
  }
}
