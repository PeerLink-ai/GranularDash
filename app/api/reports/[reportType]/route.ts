import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { reportType: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get("id")

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    // Get user organization from session/auth - for now using placeholder
    const organization = "demo-org"

    const report = await sql`
      SELECT * FROM reports 
      WHERE id = ${reportId} AND organization_id = ${organization}
    `

    if (report.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Generate report content based on type
    const reportData = {
      id: report[0].id,
      title: report[0].title,
      type: report[0].type,
      status: report[0].status,
      createdAt: report[0].created_at,
      content: `This is a ${report[0].title} generated on ${new Date(report[0].created_at).toLocaleDateString()}. Report content would include detailed security analysis, compliance checks, and recommendations.`,
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Get report error:", error)
    return NextResponse.json({ error: "Failed to get report" }, { status: 500 })
  }
}
