import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Starting lineage API call")

    const [auditLogs, governanceLogs, activityLogs] = await Promise.all([
      sql`
        SELECT 
          id,
          agent_id,
          action,
          details,
          timestamp,
          user_id,
          session_id,
          metadata
        FROM audit_logs 
        WHERE agent_id IS NOT NULL
        ORDER BY timestamp DESC 
        LIMIT 50
      `,
      sql`
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
          created_at
        FROM agent_governance_logs 
        ORDER BY created_at DESC 
        LIMIT 50
      `,
      sql`
        SELECT 
          id,
          agent_id,
          activity_type,
          status,
          duration_ms,
          activity_data,
          timestamp
        FROM agent_activity_stream 
        ORDER BY timestamp DESC 
        LIMIT 50
      `,
    ])

    const nodes = []
    const edges = []

    auditLogs.forEach((log, index) => {
      nodes.push({
        id: `audit-${log.id}`,
        type: "action",
        data: {
          label: log.action || "Agent Action",
          agentId: log.agent_id,
          details: log.details,
          timestamp: log.timestamp,
          metadata: log.metadata,
        },
        position: { x: index * 250, y: 100 },
      })
    })

    governanceLogs.forEach((log, index) => {
      nodes.push({
        id: `governance-${log.id}`,
        type: "evaluation",
        data: {
          label: log.interaction_type || "Agent Response",
          agentId: log.agent_id,
          prompt: log.prompt,
          response: log.response,
          responseTime: log.response_time_ms,
          tokenUsage: log.token_usage,
          qualityScores: log.quality_scores,
        },
        position: { x: index * 250, y: 300 },
      })
    })

    activityLogs.forEach((log, index) => {
      nodes.push({
        id: `activity-${log.id}`,
        type: "activity",
        data: {
          label: log.activity_type || "Agent Activity",
          agentId: log.agent_id,
          status: log.status,
          duration: log.duration_ms,
          data: log.activity_data,
        },
        position: { x: index * 250, y: 500 },
      })
    })

    console.log("[v0] Processed lineage data:", {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      auditCount: auditLogs.length,
      governanceCount: governanceLogs.length,
      activityCount: activityLogs.length,
    })

    return NextResponse.json({
      nodes,
      edges,
      lineageMapping: [...auditLogs, ...governanceLogs, ...activityLogs],
    })
  } catch (e: any) {
    console.error("[v0] Lineage API error:", e)
    return NextResponse.json({ nodes: [], edges: [], lineageMapping: [] })
  }
}
