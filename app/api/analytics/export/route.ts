import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user organization from session/auth - for now using placeholder
    const organization = "demo-org"

    // Fetch data for export
    const [agents, violations, threats, reports] = await Promise.all([
      sql`SELECT * FROM connected_agents WHERE organization_id = ${organization}`,
      sql`SELECT * FROM policy_violations WHERE organization_id = ${organization}`,
      sql`SELECT * FROM security_threats WHERE organization_id = ${organization}`,
      sql`SELECT * FROM reports WHERE organization_id = ${organization}`,
    ])

    // Create CSV content
    const csvContent = [
      "Type,Name,Status,Created At,Details",
      ...agents.map(
        (agent: any) =>
          `Agent,${agent.name || agent.id},${agent.status || "active"},${agent.created_at},${agent.description || ""}`,
      ),
      ...violations.map(
        (violation: any) =>
          `Violation,${violation.policy_name},${violation.status},${violation.detected_at},${violation.description || ""}`,
      ),
      ...threats.map(
        (threat: any) =>
          `Threat,${threat.threat_type},${threat.status},${threat.detected_at},${threat.description || ""}`,
      ),
      ...reports.map((report: any) => `Report,${report.title},${report.status},${report.created_at},${report.type}`),
    ].join("\n")

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="security-analytics-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
