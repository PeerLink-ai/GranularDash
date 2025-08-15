import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const provider = searchParams.get("provider")
    const includeHealth = searchParams.get("health") === "true"

    // Get integration instances with registry information
    let query = `
      SELECT 
        i.*,
        r.integration_name,
        r.integration_type,
        r.provider,
        r.version,
        r.description,
        r.is_critical,
        r.tags,
        CASE 
          WHEN i.last_health_check > NOW() - INTERVAL '10 minutes' THEN i.health_status
          ELSE 'unknown'
        END as current_health_status
      FROM integration_instances i
      JOIN integration_registry r ON i.registry_id = r.id
      WHERE i.user_id = $1
    `

    const params = [session.user.id]

    if (type) {
      query += ` AND r.integration_type = $${params.length + 1}`
      params.push(type)
    }

    if (status) {
      query += ` AND i.status = $${params.length + 1}`
      params.push(status)
    }

    if (provider) {
      query += ` AND r.provider = $${params.length + 1}`
      params.push(provider)
    }

    query += ` ORDER BY r.is_critical DESC, i.created_at DESC`

    const integrations = await sql(query, params)

    // Get health check data if requested
    if (includeHealth && integrations.length > 0) {
      const instanceIds = integrations.map((i) => i.id)
      const healthChecks = await sql(
        `
        SELECT 
          integration_instance_id,
          status,
          response_time_ms,
          error_message,
          checked_at
        FROM integration_health_checks 
        WHERE integration_instance_id = ANY($1)
          AND checked_at >= NOW() - INTERVAL '24 hours'
        ORDER BY checked_at DESC
      `,
        [instanceIds],
      )

      // Attach health data to integrations
      integrations.forEach((integration) => {
        integration.recent_health_checks = healthChecks.filter((h) => h.integration_instance_id === integration.id)
      })
    }

    // Get integration statistics
    const stats = await sql(
      `
      SELECT 
        COUNT(*) as total_integrations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_integrations,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_integrations,
        COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_integrations,
        COUNT(CASE WHEN r.is_critical = true THEN 1 END) as critical_integrations
      FROM integration_instances i
      JOIN integration_registry r ON i.registry_id = r.id
      WHERE i.user_id = $1
    `,
      [session.user.id],
    )

    return NextResponse.json({
      integrations,
      statistics: stats[0] || {},
    })
  } catch (error) {
    console.error("Error fetching integrations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      registry_id,
      instance_name,
      environment = "production",
      configuration = {},
      credentials,
    } = await request.json()

    if (!registry_id || !instance_name) {
      return NextResponse.json({ error: "Registry ID and instance name are required" }, { status: 400 })
    }

    // Verify registry exists
    const registry = await sql(
      `
      SELECT * FROM integration_registry 
      WHERE id = $1 AND is_active = true
    `,
      [registry_id],
    )

    if (registry.length === 0) {
      return NextResponse.json({ error: "Invalid or inactive integration registry" }, { status: 400 })
    }

    // Encrypt credentials if provided
    let encryptedCredentials = null
    if (credentials) {
      // In production, use proper encryption
      encryptedCredentials = Buffer.from(JSON.stringify(credentials)).toString("base64")
    }

    // Create integration instance
    const instance = await sql(
      `
      INSERT INTO integration_instances (
        registry_id, instance_name, environment, configuration,
        credentials_encrypted, user_id, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        registry_id,
        instance_name,
        environment,
        JSON.stringify(configuration),
        encryptedCredentials,
        session.user.id,
        session.user.organization_id,
      ],
    )

    // Perform initial health check
    await performHealthCheck(instance[0].id, registry[0])

    return NextResponse.json({
      integration: instance[0],
      message: "Integration created successfully",
    })
  } catch (error) {
    console.error("Error creating integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Perform health check for integration
async function performHealthCheck(instanceId: string, registry: any) {
  try {
    const healthConfig = registry.health_check_config || {}
    let status = "unknown"
    let responseTime = 0
    let errorMessage = null

    const startTime = Date.now()

    // Simulate health check based on integration type
    switch (registry.integration_type) {
      case "api":
        try {
          const response = await fetch(`${registry.endpoint_url}${healthConfig.endpoint || "/health"}`, {
            method: healthConfig.method || "GET",
            timeout: 5000,
          })
          responseTime = Date.now() - startTime
          status = response.ok ? "healthy" : "unhealthy"
          if (!response.ok) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
        } catch (error) {
          responseTime = Date.now() - startTime
          status = "unhealthy"
          errorMessage = error.message
        }
        break

      case "database":
        try {
          // Simulate database health check
          await new Promise((resolve) => setTimeout(resolve, 100))
          responseTime = Date.now() - startTime
          status = "healthy"
        } catch (error) {
          responseTime = Date.now() - startTime
          status = "unhealthy"
          errorMessage = error.message
        }
        break

      case "webhook":
        // Webhooks are considered healthy if they can receive requests
        status = "healthy"
        responseTime = 0
        break

      default:
        status = "unknown"
    }

    // Store health check result
    await sql(
      `
      INSERT INTO integration_health_checks (
        integration_instance_id, check_type, check_config, status,
        response_time_ms, error_message, check_details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        instanceId,
        "automated",
        JSON.stringify(healthConfig),
        status,
        responseTime,
        errorMessage,
        JSON.stringify({ registry_type: registry.integration_type }),
      ],
    )

    // Update instance health status
    await sql(
      `
      UPDATE integration_instances 
      SET health_status = $2, last_health_check = NOW()
      WHERE id = $1
    `,
      [instanceId, status],
    )

    // Create alert if unhealthy
    if (status === "unhealthy" && registry.is_critical) {
      await sql(
        `
        INSERT INTO integration_alerts (
          integration_instance_id, alert_type, severity, title, description, alert_data
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          instanceId,
          "health_check_failed",
          "high",
          `Critical Integration Health Check Failed`,
          `Health check failed for ${registry.integration_name}: ${errorMessage}`,
          JSON.stringify({ response_time: responseTime, error: errorMessage }),
        ],
      )
    }
  } catch (error) {
    console.error("Error performing health check:", error)
  }
}
