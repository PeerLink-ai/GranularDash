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

    // Generate PDF content (simplified - in real app would use PDF library)
    const pdfContent = `
      ${report[0].title}
      Generated: ${new Date(report[0].created_at).toLocaleDateString()}
      
      This is a security report containing detailed analysis and recommendations.
      In a real implementation, this would be a properly formatted PDF document.
    `

    return new Response(pdfContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${params.reportType}-report-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Download report error:", error)
    return NextResponse.json({ error: "Failed to download report" }, { status: 500 })
  }
}
