import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const integrationId = params.id

    // Get integration details
    const integration = await sql(
      `
      SELECT 
        i.*,
        r.integration_name,
        r.integration_type,
        r.provider,
        r.version,
        r.description,
        r.endpoint_url,
        r.authentication_type,
        r.connection_config,
        r.rate_limits,
        r.timeout_config,
        r.retry_config,
        r.is_critical,
        r.tags
      FROM integration_instances i
      JOIN integration_registry r ON i.registry_id = r.id
      WHERE i.id = $1 AND i.user_id = $2
    `,
      [integrationId, session.user.id],
    )

    if (integration.length === 0) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    // Get recent health checks
    const healthChecks = await sql(
      `
      SELECT * FROM integration_health_checks 
      WHERE integration_instance_id = $1 
      ORDER BY checked_at DESC 
      LIMIT 20
    `,
      [integrationId],
    )

    // Get recent executions
    const executions = await sql(
      `
      SELECT 
        execution_type,
        method,
        endpoint,
        response_status,
        execution_time_ms,
        error_message,
        executed_at
      FROM integration_executions 
      WHERE integration_instance_id = $1 
      ORDER BY executed_at DESC 
      LIMIT 50
    `,
      [integrationId],
    )

    // Get usage analytics for the last 7 days
    const analytics = await sql(
      `
      SELECT 
        date_key,
        SUM(request_count) as total_requests,
        SUM(success_count) as total_successes,
        SUM(error_count) as total_errors,
        AVG(avg_response_time_ms) as avg_response_time,
        SUM(total_data_transferred_bytes) as total_data_transferred
      FROM integration_usage_analytics 
      WHERE integration_instance_id = $1 
        AND date_key >= TO_CHAR(NOW() - INTERVAL '7 days', 'YYYYMMDD')::INTEGER
      GROUP BY date_key
      ORDER BY date_key DESC
    `,
      [integrationId],
    )

    // Get active alerts
    const alerts = await sql(
      `
      SELECT * FROM integration_alerts 
      WHERE integration_instance_id = $1 
        AND status = 'active'
      ORDER BY triggered_at DESC
    `,
      [integrationId],
    )

    // Get dependencies
    const dependencies = await sql(
      `
      SELECT 
        d.*,
        r.integration_name as dependent_name,
        i.instance_name as dependent_instance_name,
        i.status as dependent_status
      FROM integration_dependencies d
      JOIN integration_instances i ON d.dependent_integration_id = i.id
      JOIN integration_registry r ON i.registry_id = r.id
      WHERE d.parent_integration_id = $1 AND d.is_active = true
    `,
      [integrationId],
    )

    return NextResponse.json({
      integration: integration[0],
      health_checks: healthChecks,
      recent_executions: executions,
      analytics,
      alerts,
      dependencies,
    })
  } catch (error) {
    console.error("Error fetching integration details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const integrationId = params.id
    const { instance_name, status, configuration, credentials } = await request.json()

    // Verify integration exists and belongs to user
    const existing = await sql(
      `
      SELECT * FROM integration_instances 
      WHERE id = $1 AND user_id = $2
    `,
      [integrationId, session.user.id],
    )

    if (existing.length === 0) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    // Build update query
    let updateQuery = "UPDATE integration_instances SET updated_at = NOW()"
    const updateParams = [integrationId]

    if (instance_name) {
      updateQuery += `, instance_name = $${updateParams.length + 1}`
      updateParams.push(instance_name)
    }

    if (status) {
      updateQuery += `, status = $${updateParams.length + 1}`
      updateParams.push(status)
    }

    if (configuration) {
      updateQuery += `, configuration = $${updateParams.length + 1}`
      updateParams.push(JSON.stringify(configuration))
    }

    if (credentials) {
      const encryptedCredentials = Buffer.from(JSON.stringify(credentials)).toString("base64")
      updateQuery += `, credentials_encrypted = $${updateParams.length + 1}`
      updateParams.push(encryptedCredentials)
    }

    updateQuery += ` WHERE id = $1 RETURNING *`

    const updated = await sql(updateQuery, updateParams)

    return NextResponse.json({
      integration: updated[0],
      message: "Integration updated successfully",
    })
  } catch (error) {
    console.error("Error updating integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const integrationId = params.id

    // Verify integration exists and belongs to user
    const existing = await sql(
      `
      SELECT * FROM integration_instances 
      WHERE id = $1 AND user_id = $2
    `,
      [integrationId, session.user.id],
    )

    if (existing.length === 0) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    // Check for dependencies
    const dependencies = await sql(
      `
      SELECT COUNT(*) as dependent_count
      FROM integration_dependencies 
      WHERE parent_integration_id = $1 AND is_active = true
    `,
      [integrationId],
    )

    if (dependencies[0].dependent_count > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete integration with active dependencies",
          dependent_count: dependencies[0].dependent_count,
        },
        { status: 409 },
      )
    }

    // Delete integration (cascading deletes will handle related records)
    await sql(
      `
      DELETE FROM integration_instances 
      WHERE id = $1 AND user_id = $2
    `,
      [integrationId, session.user.id],
    )

    return NextResponse.json({
      message: "Integration deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
