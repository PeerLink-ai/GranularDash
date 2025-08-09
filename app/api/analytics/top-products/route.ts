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

    // If product_name doesn't exist, this will fail; guard by checking information_schema
    const col = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'transactions'
        AND column_name = 'product_name'
      LIMIT 1
    `
    const hasProductName = col.length > 0

    if (!hasProductName) return NextResponse.json([])

    const rows = await sql`
      SELECT 
        product_name as name,
        COALESCE(SUM(amount), 0)::numeric as revenue,
        COUNT(*)::int as transactions
      FROM transactions
      WHERE product_name IS NOT NULL
      GROUP BY product_name
      ORDER BY revenue DESC
      LIMIT 5
    `
    const data = (rows as any[]).map((r) => ({
      name: r.name,
      revenue: `$${Number(r.revenue).toLocaleString()}`,
      growth: "+0%",
    }))
    return NextResponse.json(data)
  } catch (error) {
    console.error("Top products error:", error)
    return NextResponse.json([])
  }
}
