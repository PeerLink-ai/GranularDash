import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get real-time agent health metrics
    const agentHealth = await sql`
      SELECT 
        ca.name,
        ca.status,
        ca.health_status,
        ca.last_active,
        ca.error_count,
        ca.usage_requests,
        ca.usage_estimated_cost,
        COALESCE(recent_metrics.avg_response_time, 0) as avg_response_time,
        COALESCE(recent_metrics.success_rate, 100) as success_rate
      FROM connected_agents ca
      LEFT JOIN (
        SELECT 
          agent_id,
          AVG(CASE WHEN metric_type = 'response_time' THEN value END) as avg_response_time,
          (COUNT(CASE WHEN metadata->>'status' = 'success' THEN 1 END) * 100.0 / COUNT(*)) as success_rate
        FROM agent_metrics 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY agent_id
      ) recent_metrics ON ca.agent_id = recent_metrics.agent_id
      WHERE ca.user_id = ${user.id}
      ORDER BY ca.last_active DESC NULLS LAST
    `

    // Get active security threats
    const securityThreats = await sql`
      SELECT 
        threat_type,
        severity,
        description,
        detected_at,
        status
      FROM security_threats 
      WHERE status = 'active' 
      ORDER BY detected_at DESC 
      LIMIT 5
    `

    // Get recent policy violations
    const policyViolations = await sql`
      SELECT 
        policy_name,
        severity,
        description,
        detected_at,
        agent_id,
        status
      FROM policy_violations 
      WHERE status = 'open'
      ORDER BY detected_at DESC 
      LIMIT 10
    `

    // Get financial metrics
    const financialMetrics = await sql`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_transaction_value,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as transactions_24h
      FROM payments 
      WHERE status = 'succeeded'
    `

    // Get subscription metrics
    const subscriptionMetrics = await sql`
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN status = 'trialing' THEN 1 END) as trial_subscriptions,
        COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_subscriptions
      FROM subscriptions
    `

    return NextResponse.json({
      agentHealth,
      securityThreats,
      policyViolations,
      financialMetrics: financialMetrics[0],
      subscriptionMetrics: subscriptionMetrics[0],
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching real-time metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
