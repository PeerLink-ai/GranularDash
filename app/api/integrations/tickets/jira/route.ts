import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // In production, call Jira REST API with OAuth/Basic auth.
    // Here we simulate creation:
    const key =
      "GG-" +
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")
    return NextResponse.json({ key, url: `https://jira.example.com/browse/${key}`, body })
  } catch {
    return NextResponse.json({ error: "Failed to create Jira ticket" }, { status: 500 })
  }
}
