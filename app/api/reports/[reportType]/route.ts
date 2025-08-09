import { NextResponse } from "next/server"
import { listReports } from "@/lib/report-store"

export async function GET(req: Request, { params }: { params: { reportType: string } }) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const report = listReports().find((r) => r.id === id && r.type === params.reportType)
  if (!report) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json({
    title: report.title,
    createdAt: report.createdAt,
    content: report.content ?? "",
  })
}
