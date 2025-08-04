import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user organization from session/auth - for now using placeholder
    const organization = "demo-org"

    const reports = await sql`
      SELECT id, type, title, status, created_at
      FROM reports 
      WHERE organization_id = ${organization}
      ORDER BY created_at DESC
      LIMIT 20
    `.catch(() => [])

    const formattedReports = reports.map((report: any) => ({
      id: report.id,
      type: report.type,
      title: report.title,
      status: report.status,
      createdAt: report.created_at,
    }))

    return NextResponse.json(formattedReports)
  } catch (error) {
    console.error("List reports error:", error)
    return NextResponse.json([])
  }
}
