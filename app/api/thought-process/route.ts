import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const thoughtLogs = await sql`
      SELECT 
        id,
        agent_id,
        session_id,
        thought_type,
        thought_content,
        prompt,
        reasoning_steps,
        decision_factors,
        alternatives_considered,
        outcome_prediction,
        actual_outcome,
        confidence_score,
        processing_time_ms,
        tokens_used,
        model_used,
        temperature,
        context_data,
        audit_block_hash,
        created_at,
        updated_at
      FROM ai_thought_process_logs 
      ORDER BY created_at DESC 
      LIMIT 100
    `

    return NextResponse.json(thoughtLogs)
  } catch (error) {
    console.error("Error fetching thought process logs:", error)
    return NextResponse.json({ error: "Failed to fetch thought process logs" }, { status: 500 })
  }
}
