import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user organization from session/auth - for now using placeholder
    const organization = "demo-org"

    // Generate last 6 months of data
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString("en-US", { month: "short" })

      // Query for threats and violations for this month
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const [threatCount, violationCount] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM security_threats 
            WHERE organization_id = ${organization} 
            AND detected_at >= ${startOfMonth.toISOString()} 
            AND detected_at <= ${endOfMonth.toISOString()}`.catch(() => [{ count: 0 }]),
        sql`SELECT COUNT(*) as count FROM policy_violations 
            WHERE organization_id = ${organization} 
            AND detected_at >= ${startOfMonth.toISOString()} 
            AND detected_at <= ${endOfMonth.toISOString()}`.catch(() => [{ count: 0 }]),
      ])

      months.push({
        month: monthName,
        threats: Number(threatCount[0]?.count || 0),
        violations: Number(violationCount[0]?.count || 0),
      })
    }

    return NextResponse.json(months)
  } catch (error) {
    console.error("Security trends error:", error)
    return NextResponse.json([])
  }
}
