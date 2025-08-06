import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const logs = await sql`
      SELECT 
        id, interaction_type, input_data, output_data, metadata, 
        timestamp, created_at
      FROM agent_logs 
      WHERE agent_id = ${id}
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const violations = await sql`
      SELECT 
        v.id, v.violation_type, v.severity, v.description, v.detected_at,
        l.interaction_type
      FROM policy_violations v
      JOIN agent_logs l ON v.log_id = l.id
      WHERE v.agent_id = ${id}
      ORDER BY v.detected_at DESC
      LIMIT 20
    `

    return NextResponse.json({
      logs,
      violations,
      total: logs.length,
    })
  } catch (error) {
    console.error("Error fetching agent logs:", error)
    return NextResponse.json({ error: "Failed to fetch agent logs" }, { status: 500 })
  }
}
