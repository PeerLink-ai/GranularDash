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
    const hasAgents = await tableExists("connected_agents")
    const hasUsers = await tableExists("users")
    const hasTx = await tableExists("transactions")

    let activeAgents = 0
    let totalUsers = 0
    let totalTransactions = 0
    let totalRevenueNum = 0

    if (hasAgents) {
      const rows =
        await sql`SELECT COUNT(*)::int AS count FROM connected_agents WHERE status IS NULL OR status = 'active'`
      activeAgents = Number(rows?.[0]?.count ?? 0)
    }

    if (hasUsers) {
      const rows = await sql`SELECT COUNT(*)::int AS count FROM users`
      totalUsers = Number(rows?.[0]?.count ?? 0)
    }

    if (hasTx) {
      const [txRows, revRows] = await Promise.all([
        sql`SELECT COUNT(*)::int AS count FROM transactions`,
        sql`SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM transactions`,
      ])
      totalTransactions = Number(txRows?.[0]?.count ?? 0)
      totalRevenueNum = Number(revRows?.[0]?.total ?? 0)
    }

    return NextResponse.json({
      totalRevenue: `$${totalRevenueNum.toLocaleString()}`,
      totalUsers: totalUsers.toString(),
      totalTransactions: totalTransactions.toString(),
      activeAgents: activeAgents.toString(),
    })
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
