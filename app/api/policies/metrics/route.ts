import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, email, organization 
      FROM users 
      WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]

    // Get policy metrics for the user's organization
    const [totalPoliciesResult, activePoliciesResult, violationsResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM policies WHERE organization = ${user.organization}`,
      sql`SELECT COUNT(*) as count FROM policies WHERE organization = ${user.organization} AND status = 'active'`,
      sql`SELECT COUNT(*) as count FROM policy_violations WHERE organization = ${user.organization} AND status = 'open'`,
    ])

    const totalPolicies = Number.parseInt(totalPoliciesResult[0]?.count || "0")
    const activePolicies = Number.parseInt(activePoliciesResult[0]?.count || "0")
    const openViolations = Number.parseInt(violationsResult[0]?.count || "0")

    // Calculate compliance rate
    const complianceRate =
      totalPolicies > 0 ? Math.round(((totalPolicies - openViolations) / totalPolicies) * 100) : 100

    return NextResponse.json({
      totalPolicies,
      activePolicies,
      openViolations,
      complianceRate,
    })
  } catch (error) {
    console.error("Failed to fetch policy metrics:", error)
    return NextResponse.json({
      totalPolicies: 0,
      activePolicies: 0,
      openViolations: 0,
      complianceRate: 100,
    })
  }
}
