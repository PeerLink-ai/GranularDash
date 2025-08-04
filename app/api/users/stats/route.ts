import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total users in organization
    const totalUsersResult = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE organization = ${user.organization} 
      AND onboarding_completed = true
    `
    const totalUsers = Number.parseInt(totalUsersResult[0]?.count || "0")

    // Get active users (logged in within 7 days)
    const activeUsersResult = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE organization = ${user.organization} 
      AND onboarding_completed = true
      AND last_login > NOW() - INTERVAL '7 days'
    `
    const activeUsers = Number.parseInt(activeUsersResult[0]?.count || "0")

    // Get admin users
    const adminUsersResult = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE organization = ${user.organization} 
      AND role = 'admin'
      AND onboarding_completed = true
    `
    const adminUsers = Number.parseInt(adminUsersResult[0]?.count || "0")

    // Get pending users (not completed onboarding)
    const pendingUsersResult = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE organization = ${user.organization} 
      AND onboarding_completed = false
    `
    const pendingUsers = Number.parseInt(pendingUsersResult[0]?.count || "0")

    return NextResponse.json({
      totalUsers,
      activeUsers,
      adminUsers,
      pendingUsers,
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Failed to fetch user statistics" }, { status: 500 })
  }
}
