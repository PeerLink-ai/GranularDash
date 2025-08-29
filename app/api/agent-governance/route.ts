import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const governanceLogs = await sql`
      SELECT 
        id,
        agent_id,
        interaction_type,
        prompt,
        response,
        response_time_ms,
        token_usage,
        quality_scores,
        evaluation_flags,
        audit_block_hash,
        audit_block_signature,
        created_at,
        updated_at
      FROM agent_governance_logs 
      ORDER BY created_at DESC 
      LIMIT 100
    `

    return NextResponse.json(governanceLogs)
  } catch (error) {
    console.error("Error fetching agent governance logs:", error)
    return NextResponse.json({ error: "Failed to fetch agent governance logs" }, { status: 500 })
  }
}
