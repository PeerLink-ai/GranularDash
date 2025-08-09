import { NextResponse } from "next/server"
import { listReports } from "@/lib/report-store"

export async function GET() {
  return NextResponse.json(listReports())
}
