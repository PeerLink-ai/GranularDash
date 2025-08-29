import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const activityLogs = await sql`
      SELECT 
        id,
        agent_id,
        activity_type,
        status,
        duration_ms,
        lineage_id,
        activity_data,
        timestamp
      FROM agent_activity_stream 
      ORDER BY timestamp DESC 
      LIMIT 100
    `

    return NextResponse.json(activityLogs)
  } catch (error) {
    console.error("Error fetching agent activity logs:", error)
    return NextResponse.json({ error: "Failed to fetch agent activity logs" }, { status: 500 })
  }
}
