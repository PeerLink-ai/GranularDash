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

    // Get real-time agent health metrics with actual usage data
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
        COALESCE(recent_metrics.success_rate, 100) as success_rate,
        COALESCE(ca.usage_tokens_used, 0) as tokens_used
      FROM connected_agents ca
      LEFT JOIN (
        SELECT 
          agent_id,
          AVG(CASE WHEN metric_type = 'response_time' THEN value END) as avg_response_time,
          (COUNT(CASE WHEN metadata->>'status' = 'success' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as success_rate
        FROM agent_metrics 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY agent_id
      ) recent_metrics ON ca.agent_id = recent_metrics.agent_id
      WHERE ca.user_id = ${user.id}
      ORDER BY ca.last_active DESC NULLS LAST
    `

    // Get actual user count from users table
    const userMetrics = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '24 hours' THEN 1 END) as active_users_24h,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_users_7d,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `

    // Get actual subscription metrics
    const subscriptionMetrics = await sql`
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN status = 'trialing' THEN 1 END) as trial_subscriptions,
        COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_subscriptions,
        SUM(CASE WHEN status = 'active' AND sp.amount IS NOT NULL THEN sp.amount END) as monthly_revenue
      FROM subscriptions s
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    `

    // Get actual payment/transaction data
    const financialMetrics = await sql`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_transaction_value,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as transactions_24h,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as transactions_7d
      FROM payments 
      WHERE status = 'succeeded'
    `

    // Get actual security threats and policy violations
    const securityMetrics = await sql`
      SELECT 
        (SELECT COUNT(*) FROM security_threats WHERE status = 'active') as active_threats,
        (SELECT COUNT(*) FROM policy_violations WHERE status = 'open') as open_violations,
        (SELECT COUNT(*) FROM incidents WHERE status IN ('open', 'investigating')) as active_incidents
    `

    // Get actual system performance from agent metrics
    const systemMetrics = await sql`
      SELECT 
        AVG(CASE WHEN metric_type = 'cpu_usage' THEN value END) as cpu_usage,
        AVG(CASE WHEN metric_type = 'memory_usage' THEN value END) as memory_usage,
        AVG(CASE WHEN metric_type = 'network_activity' THEN value END) as network_activity,
        AVG(CASE WHEN metric_type = 'throughput' THEN value END) as throughput
      FROM agent_metrics 
      WHERE timestamp > NOW() - INTERVAL '5 minutes'
    `

    // Get training and compliance metrics
    const trainingMetrics = await sql`
      SELECT 
        COUNT(DISTINCT user_id) as users_in_training,
        COUNT(*) as total_sessions,
        AVG(score) as avg_score,
        COUNT(CASE WHEN completed = true THEN 1 END) as completed_modules
      FROM training_progress tp
      JOIN training_sessions ts ON tp.user_id = ts.user_id
      WHERE tp.last_accessed > NOW() - INTERVAL '30 days'
    `

    return NextResponse.json({
      agentHealth,
      userMetrics: userMetrics[0],
      subscriptionMetrics: subscriptionMetrics[0],
      financialMetrics: financialMetrics[0],
      securityMetrics: securityMetrics[0],
      systemMetrics: systemMetrics[0],
      trainingMetrics: trainingMetrics[0],
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching real-time metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
