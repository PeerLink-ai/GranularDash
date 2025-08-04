import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user from session/auth - for now using placeholder
    const organizationId = 1

    // Fetch revenue data by month
    const revenueData = await sql`
      SELECT 
        TO_CHAR(created_at, 'Mon') as name,
        COALESCE(SUM(amount), 0) as total
      FROM transactions 
      WHERE organization_id = (SELECT organization FROM users WHERE id = ${organizationId})
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(month FROM created_at)
      ORDER BY EXTRACT(month FROM created_at)
    `

    // If no data, return empty array
    if (revenueData.length === 0) {
      return NextResponse.json([])
    }

    const formattedData = revenueData.map((row: any) => ({
      name: row.name,
      total: Number(row.total),
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Revenue data error:", error)
    return NextResponse.json([])
  }
}
