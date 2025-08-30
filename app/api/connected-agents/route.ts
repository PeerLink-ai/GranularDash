import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const connectedAgents = await sql`
      SELECT DISTINCT agent_id, agent_name, connection_status, created_at
      FROM connected_agents 
      WHERE connection_status = 'active'
      ORDER BY created_at DESC
    `

    return NextResponse.json(connectedAgents)
  } catch (error) {
    console.error("Error fetching connected agents:", error)
    return NextResponse.json([], { status: 500 })
  }
}
