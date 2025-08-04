import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user organization from session/auth - for now using placeholder
    const organization = "demo-org"

    // Fetch recent security events from multiple sources
    const [violations, threats, auditLogs] = await Promise.all([
      sql`SELECT 
            'policy_violation' as type,
            policy_name as description,
            severity,
            detected_at as timestamp,
            agent_id as agent
          FROM policy_violations 
          WHERE organization_id = ${organization}
          ORDER BY detected_at DESC 
          LIMIT 5`.catch(() => []),
      sql`SELECT 
            'security_threat' as type,
            CONCAT(threat_type, ': ', description) as description,
            severity,
            detected_at as timestamp,
            NULL as agent
          FROM security_threats 
          WHERE organization_id = ${organization}
          ORDER BY detected_at DESC 
          LIMIT 5`.catch(() => []),
      sql`SELECT 
            'audit_log' as type,
            description,
            'low' as severity,
            created_at as timestamp,
            NULL as agent
          FROM audit_logs 
          WHERE organization_id = ${organization}
          AND action IN ('agent_connected', 'agent_disconnected', 'policy_updated')
          ORDER BY created_at DESC 
          LIMIT 5`.catch(() => []),
    ])

    // Combine and sort all events
    const allEvents = [...violations, ...threats, ...auditLogs]
      .map((event: any, index: number) => ({
        id: `${event.type}-${index}`,
        type: event.type,
        description: event.description || "Security event",
        severity: event.severity || "low",
        timestamp: event.timestamp || new Date().toISOString(),
        agent: event.agent || undefined,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return NextResponse.json(allEvents)
  } catch (error) {
    console.error("Security activity error:", error)
    return NextResponse.json([])
  }
}
