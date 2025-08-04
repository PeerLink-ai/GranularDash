import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user from session/auth - for now using placeholder
    const organizationId = 1

    // Query product performance data if it exists
    const productData = await sql`
      SELECT 
        product_name as name,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM transactions 
      WHERE organization_id = (SELECT organization FROM users WHERE id = ${organizationId}) 
        AND product_name IS NOT NULL
      GROUP BY product_name
      ORDER BY revenue DESC
      LIMIT 5
    `

    const formattedData = productData.map((row: any) => ({
      name: row.name,
      revenue: `$${Number(row.revenue).toLocaleString()}`,
      growth: "+0%", // Would calculate from historical data
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Top products error:", error)
    return NextResponse.json([])
  }
}
