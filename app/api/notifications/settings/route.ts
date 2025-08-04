import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user from session/auth - for now using placeholder
    const userId = 1

    const settings = await sql`
      SELECT * FROM notification_settings WHERE user_id = ${userId}
    `.catch(() => [])

    if (settings.length === 0) {
      // Return default settings
      return NextResponse.json({
        securityAlerts: true,
        policyViolations: true,
        agentAnomalies: false,
        complianceUpdates: false,
        accessChanges: false,
        systemHealth: true,
      })
    }

    const userSettings = settings[0]
    return NextResponse.json({
      securityAlerts: userSettings.security_alerts,
      policyViolations: userSettings.policy_violations,
      agentAnomalies: userSettings.agent_anomalies,
      complianceUpdates: userSettings.compliance_updates,
      accessChanges: userSettings.access_changes,
      systemHealth: userSettings.system_health,
    })
  } catch (error) {
    console.error("Get notification settings error:", error)
    return NextResponse.json({
      securityAlerts: true,
      policyViolations: true,
      agentAnomalies: false,
      complianceUpdates: false,
      accessChanges: false,
      systemHealth: true,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()

    // Get user from session/auth - for now using placeholder
    const userId = 1

    await sql`
      INSERT INTO notification_settings (
        user_id, security_alerts, policy_violations, agent_anomalies,
        compliance_updates, access_changes, system_health
      ) VALUES (
        ${userId}, ${settings.securityAlerts}, ${settings.policyViolations},
        ${settings.agentAnomalies}, ${settings.complianceUpdates},
        ${settings.accessChanges}, ${settings.systemHealth}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        security_alerts = ${settings.securityAlerts},
        policy_violations = ${settings.policyViolations},
        agent_anomalies = ${settings.agentAnomalies},
        compliance_updates = ${settings.complianceUpdates},
        access_changes = ${settings.accessChanges},
        system_health = ${settings.systemHealth},
        updated_at = NOW()
    `

    return NextResponse.json({ message: "Settings saved successfully" })
  } catch (error) {
    console.error("Save notification settings error:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
