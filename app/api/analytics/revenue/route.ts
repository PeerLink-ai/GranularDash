import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

async function tableExists(name: string) {
  try {
    const rows = await sql`SELECT to_regclass(${`public.${name}`}) AS exists`
    return rows?.[0]?.exists !== null
  } catch {
    return false
  }
}

export async function GET(_request: NextRequest) {
  try {
    const hasTx = await tableExists("transactions")
    if (!hasTx) return NextResponse.json([])

    const revenueData = await sql`
      SELECT 
        TO_CHAR(created_at, 'Mon') as name,
        COALESCE(SUM(amount), 0)::numeric as total
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY 1, EXTRACT(month FROM created_at)
      ORDER BY EXTRACT(month FROM created_at)
    `

    const formatted = (revenueData as any[]).map((row) => ({
      name: row.name,
      total: Number(row.total),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Revenue data error:", error)
    return NextResponse.json([])
  }
}
