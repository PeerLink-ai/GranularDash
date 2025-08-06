import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user from session/auth - for now using placeholder
    const organizationId = 1

    // Fetch metrics from database
    const [agentCount, userCount, transactionCount, revenueSum] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM connected_agents WHERE user_id IN (SELECT id FROM users WHERE organization = (SELECT organization FROM users WHERE id = ${organizationId}))`,
      sql`SELECT COUNT(*) as count FROM users WHERE organization = (SELECT organization FROM users WHERE id = ${organizationId})`,
      sql`SELECT COUNT(*) as count FROM transactions WHERE organization_id = (SELECT organization FROM users WHERE id = ${organizationId})`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE organization_id = (SELECT organization FROM users WHERE id = ${organizationId})`,
    ])

    const metrics = {
      totalRevenue: `$${Number(revenueSum[0]?.total || 0).toLocaleString()}`,
      totalUsers: (userCount[0]?.count || 0).toString(),
      totalTransactions: (transactionCount[0]?.count || 0).toString(),
      activeAgents: (agentCount[0]?.count || 0).toString(),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Metrics error:", error)
    return NextResponse.json({
      totalRevenue: "$0",
      totalUsers: "0",
      totalTransactions: "0",
      activeAgents: "0",
    })
  }
}
