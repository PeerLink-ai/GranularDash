import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Simulate ServiceNow incident creation
    const number = "INC" + Math.floor(100000 + Math.random() * 900000)
    return NextResponse.json({ number, url: `https://servicenow.example.com/${number}`, body })
  } catch {
    return NextResponse.json({ error: "Failed to create ServiceNow incident" }, { status: 500 })
  }
}
