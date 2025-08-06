import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get("severity")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = `
      SELECT 
        v.id, v.violation_type, v.severity, v.description, v.detected_at,
        l.interaction_type, l.input_data, l.output_data
      FROM policy_violations v
      LEFT JOIN agent_logs l ON v.log_id = l.id
      WHERE v.agent_id = $1
    `

    const params_array = [id]

    if (severity) {
      query += ` AND v.severity = $2`
      params_array.push(severity)
    }

    query += ` ORDER BY v.detected_at DESC LIMIT $${params_array.length + 1}`
    params_array.push(limit.toString())

    const violations = await sql(query, params_array)

    return NextResponse.json({ violations })
  } catch (error) {
    console.error("Error fetching violations:", error)
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { violation_id, resolved } = body

    if (resolved) {
      await sql`
        UPDATE policy_violations 
        SET resolved_at = NOW() 
        WHERE id = ${violation_id} AND agent_id = ${id}
      `
    } else {
      await sql`
        UPDATE policy_violations 
        SET resolved_at = NULL 
        WHERE id = ${violation_id} AND agent_id = ${id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating violation:", error)
    return NextResponse.json({ error: "Failed to update violation" }, { status: 500 })
  }
}
