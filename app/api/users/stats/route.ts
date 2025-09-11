import { type NextRequest, NextResponse } from "next/server"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await getUserBySession(sessionToken)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user statistics from the database
    const [totalUsersResult] = await sql`
      SELECT COUNT(*) as count FROM users 
      WHERE organization = ${currentUser.organization}
    `

    const [activeUsersResult] = await sql`
      SELECT COUNT(*) as count FROM users 
      WHERE organization = ${currentUser.organization}
      AND last_login > NOW() - INTERVAL '30 days'
    `

    const [pendingUsersResult] = await sql`
      SELECT COUNT(*) as count FROM users 
      WHERE organization = ${currentUser.organization}
      AND last_login IS NULL
    `

    const [adminUsersResult] = await sql`
      SELECT COUNT(*) as count FROM users 
      WHERE organization = ${currentUser.organization}
      AND role = 'admin'
    `

    // Calculate previous month stats for comparison
    const [previousMonthResult] = await sql`
      SELECT COUNT(*) as count FROM users 
      WHERE organization = ${currentUser.organization}
      AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `

    const totalUsers = Number.parseInt(totalUsersResult.count)
    const activeUsers = Number.parseInt(activeUsersResult.count)
    const pendingUsers = Number.parseInt(pendingUsersResult.count)
    const adminUsers = Number.parseInt(adminUsersResult.count)
    const previousMonthUsers = Number.parseInt(previousMonthResult.count)

    // Calculate growth percentage
    const growthPercentage =
      previousMonthUsers > 0 ? Math.round(((totalUsers - previousMonthUsers) / previousMonthUsers) * 100) : 0

    // Calculate active rate
    const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100 * 10) / 10 : 0

    return NextResponse.json({
      totalUsers,
      activeUsers,
      pendingUsers,
      adminUsers,
      growthPercentage,
      activeRate,
    })
  } catch (error) {
    console.error("Get user stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
