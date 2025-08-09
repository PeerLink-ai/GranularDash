import { NextResponse } from "next/server"
import { signToken } from "@/lib/sign"

export async function GET(req: Request, { params }: { params: { reportType: string } }) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const ttlSec = Number(searchParams.get("ttl") || "600") // 10 minutes
  const exp = Date.now() + ttlSec * 1000
  const token = signToken({ id, type: params.reportType, exp })

  const url = new URL(req.url)
  url.pathname = `/api/reports/${params.reportType}/download`
  url.searchParams.set("id", id)
  url.searchParams.set("token", token)

  return NextResponse.json({ url: url.toString(), exp })
}
