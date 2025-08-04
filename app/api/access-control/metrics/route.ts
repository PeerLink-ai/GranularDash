import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get access control metrics for the user's organization
    const [totalRules, activeRules, recentActivity] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM access_rules WHERE organization = ${user.organization}`,
      sql`SELECT COUNT(*) as count FROM access_rules WHERE organization = ${user.organization} AND status = 'active'`,
      sql`SELECT COUNT(*) as count FROM audit_logs WHERE organization = ${user.organization} AND action LIKE '%access%' AND timestamp > NOW() - INTERVAL '24 hours'`,
    ])

    return NextResponse.json({
      totalRules: Number.parseInt(totalRules[0]?.count || "0"),
      activeRules: Number.parseInt(activeRules[0]?.count || "0"),
      recentActivity: Number.parseInt(recentActivity[0]?.count || "0"),
      complianceScore: 95, // Calculate based on policy adherence
    })
  } catch (error) {
    console.error("Failed to fetch access control metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
