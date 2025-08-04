import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()

    if (!type) {
      return NextResponse.json({ error: "Report type is required" }, { status: 400 })
    }

    // Get user organization from session/auth - for now using placeholder
    const organization = "demo-org"
    const userId = 1

    // Generate report title based on type
    const titles: Record<string, string> = {
      "security-audit": "Security Audit Report",
      "compliance-check": "Compliance Check Report",
      "threat-analysis": "Threat Analysis Report",
      "agent-security": "Agent Security Report",
      "policy-violations": "Policy Violations Report",
    }

    const title = titles[type] || "Security Report"

    // Insert report record
    const result = await sql`
      INSERT INTO reports (type, title, status, organization_id, created_by)
      VALUES (${type}, ${title}, 'generating', ${organization}, ${userId})
      RETURNING id
    `

    // Simulate report generation (in real app, this would be async)
    setTimeout(async () => {
      try {
        await sql`
          UPDATE reports 
          SET status = 'completed', file_path = ${`/reports/${result[0].id}.pdf`}
          WHERE id = ${result[0].id}
        `
      } catch (error) {
        await sql`
          UPDATE reports 
          SET status = 'failed'
          WHERE id = ${result[0].id}
        `
      }
    }, 2000)

    return NextResponse.json({
      id: result[0].id,
      message: "Report generation started",
    })
  } catch (error) {
    console.error("Generate report error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
