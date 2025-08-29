import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const agentId = searchParams.get("agentId")
    const timeRange = searchParams.get("timeRange") || "24h"

    // Calculate time filter
    const now = new Date()
    let timeFilter = new Date()
    switch (timeRange) {
      case "1h":
        timeFilter.setHours(now.getHours() - 1)
        break
      case "24h":
        timeFilter.setDate(now.getDate() - 1)
        break
      case "7d":
        timeFilter.setDate(now.getDate() - 7)
        break
      case "30d":
        timeFilter.setDate(now.getDate() - 30)
        break
      default:
        timeFilter = new Date(0) // All time
    }

    // Build query conditions
    const whereConditions = ["created_at >= $1"]
    const queryParams: any[] = [timeFilter.toISOString()]
    let paramIndex = 2

    if (agentId && agentId !== "all") {
      whereConditions.push(`agent_id = $${paramIndex}`)
      queryParams.push(agentId)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Query lineage_mapping table
    const lineageQuery = `
      SELECT 
        id,
        agent_id,
        interaction_type,
        prompt,
        response,
        response_time,
        token_usage,
        evaluation_scores,
        decisions,
        tool_calls,
        db_queries,
        parent_interaction_id,
        session_id,
        created_at,
        updated_at
      FROM lineage_mapping 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex}
    `

    queryParams.push(limit)

    const lineageData = await sql(lineageQuery, queryParams)

    // Also get agent activity stream for additional context
    const activityQuery = `
      SELECT 
        id,
        agent_id,
        activity_type,
        activity_data,
        status,
        lineage_id,
        timestamp,
        duration_ms
      FROM agent_activity_stream 
      WHERE timestamp >= $1
      ORDER BY timestamp DESC 
      LIMIT 50
    `

    const activityData = await sql(activityQuery, [timeFilter.toISOString()])

    // Get governance logs for compliance tracking
    const governanceQuery = `
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
        created_at
      FROM agent_governance_logs 
      WHERE created_at >= $1
      ORDER BY created_at DESC 
      LIMIT 50
    `

    const governanceData = await sql(governanceQuery, [timeFilter.toISOString()])

    // Combine all data sources
    const combinedData = {
      lineage: lineageData,
      activity: activityData,
      governance: governanceData,
      metadata: {
        totalLineageRecords: lineageData.length,
        totalActivityRecords: activityData.length,
        totalGovernanceRecords: governanceData.length,
        timeRange,
        queryTime: new Date().toISOString(),
      },
    }

    return NextResponse.json({
      success: true,
      data: lineageData,
      activity: activityData,
      governance: governanceData,
      metadata: combinedData.metadata,
    })
  } catch (error) {
    console.error("Failed to fetch lineage actions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch lineage data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
