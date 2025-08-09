import { type NextRequest, NextResponse } from "next/server"
import { sql as neonSql, query } from "@/lib/db"

// Helpers to detect tables/columns safely
async function tableExists(name: string) {
  const rows = await neonSql`
    SELECT to_regclass(${`public.${name}`}) AS exists
  `
  return rows?.[0]?.exists !== null
}

async function columnExists(table: string, column: string) {
  const rows = await neonSql`
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = ${table} 
      AND column_name = ${column}
    LIMIT 1
  `
  return rows.length > 0
}

async function getOrgFromRequest(req: NextRequest): Promise<string | null> {
  // Try session cookie
  const sessionToken = req.cookies.get("session")?.value || null
  try {
    if (sessionToken) {
      // Prefer user_sessions if present
      const hasSessions = await tableExists("user_sessions")
      if (hasSessions) {
        const rows = await neonSql`
          SELECT u.organization
          FROM user_sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.session_token = ${sessionToken}
            AND (s.expires_at IS NULL OR s.expires_at > NOW())
          LIMIT 1
        `
        if (rows.length > 0 && rows[0]?.organization) return rows[0].organization as string
      }
      // Fall back to users.session_token column if it exists
      const hasSessionTokenInUsers = await columnExists("users", "session_token")
      if (hasSessionTokenInUsers) {
        const rows = await neonSql`
          SELECT organization
          FROM users
          WHERE session_token = ${sessionToken}
          LIMIT 1
        `
        if (rows.length > 0 && rows[0]?.organization) return rows[0].organization as string
      }
    }
    // As a last resort, grab any org
    const anyUser = await neonSql`SELECT organization FROM users LIMIT 1`
    if (anyUser.length > 0 && anyUser[0]?.organization) return anyUser[0].organization as string
  } catch {
    // ignore and fall through
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    // Determine which tables we can use
    const hasGovernance = await tableExists("governance_policies")
    const hasPolicies = await tableExists("policies")
    const hasViolations = await tableExists("policy_violations")

    if (!hasGovernance && !hasPolicies) {
      // No policy tables at all
      return NextResponse.json(
        { totalPolicies: 0, activePolicies: 0, openViolations: 0, complianceRate: 100 },
        { status: 200 },
      )
    }

    const policyTable = hasGovernance ? "governance_policies" : "policies"
    const policyOrgCol = (await columnExists(policyTable, "organization_id"))
      ? "organization_id"
      : (await columnExists(policyTable, "organization"))
        ? "organization"
        : null

    const violationTable = hasViolations ? "policy_violations" : null
    const violationOrgCol = violationTable
      ? (await columnExists(violationTable, "organization_id"))
        ? "organization_id"
        : (await columnExists(violationTable, "organization"))
          ? "organization"
          : null
      : null

    // Resolve org (optional). If we can't resolve, we will compute global stats
    const org = await getOrgFromRequest(request)

    // Build policy stats query safely (dynamic identifiers → build string; values → params)
    let policySql = `SELECT COUNT(*)::int AS total_policies, COUNT(*) FILTER (WHERE status = 'active')::int AS active_policies FROM ${policyTable}`
    const policyParams: any[] = []
    if (org && policyOrgCol) {
      policySql += ` WHERE ${policyOrgCol} = $1`
      policyParams.push(org)
    }

    const { rows: policyRows } = await query<{ total_policies: number; active_policies: number }>(
      policySql,
      policyParams,
    )
    const totalPolicies = policyRows?.[0]?.total_policies ?? 0
    const activePolicies = policyRows?.[0]?.active_policies ?? 0

    let openViolations = 0
    let totalViolations = 0
    if (violationTable) {
      let violSql = `SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open_violations, COUNT(*)::int AS total_violations FROM ${violationTable}`
      const violParams: any[] = []
      if (org && violationOrgCol) {
        violSql += ` WHERE ${violationOrgCol} = $1`
        violParams.push(org)
      }
      const { rows: violRows } = await query<{ open_violations: number; total_violations: number }>(violSql, violParams)
      openViolations = violRows?.[0]?.open_violations ?? 0
      totalViolations = violRows?.[0]?.total_violations ?? 0
    }

    const complianceRate =
      totalViolations > 0 ? Math.round(((totalViolations - openViolations) / totalViolations) * 100) : 100

    const metrics = { totalPolicies, activePolicies, openViolations, complianceRate }
    return NextResponse.json(metrics, { status: 200 })
  } catch (error) {
    console.error("Policy metrics error:", error)
    return NextResponse.json(
      { totalPolicies: 0, activePolicies: 0, openViolations: 0, complianceRate: 100 },
      { status: 200 },
    )
  }
}
