import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export class IntegrationManager {
  // Execute integration request with full lifecycle management
  static async executeIntegration(
    instanceId: string,
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
    userId?: string,
  ) {
    const startTime = Date.now()
    let executionId: string | null = null

    try {
      // Get integration configuration
      const integration = await sql(
        `
        SELECT 
          i.*,
          r.integration_type,
          r.provider,
          r.endpoint_url,
          r.authentication_type,
          r.authentication_config,
          r.connection_config,
          r.timeout_config,
          r.retry_config
        FROM integration_instances i
        JOIN integration_registry r ON i.registry_id = r.id
        WHERE i.id = $1 AND i.status = 'active'
      `,
        [instanceId],
      )

      if (integration.length === 0) {
        throw new Error("Integration not found or inactive")
      }

      const config = integration[0]

      // Create execution log
      const execution = await sql(
        `
        INSERT INTO integration_executions (
          integration_instance_id, execution_type, method, endpoint,
          request_headers, request_body, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
        [
          instanceId,
          "api_call",
          method,
          endpoint,
          JSON.stringify(headers || {}),
          data ? JSON.stringify(data) : null,
          userId,
        ],
      )

      executionId = execution[0].id

      // Apply authentication
      const authenticatedHeaders = await this.applyAuthentication(config, headers || {})

      // Apply rate limiting
      await this.checkRateLimit(instanceId, config.rate_limits)

      // Apply request transformation
      const transformedData = await this.applyRequestTransformation(instanceId, data)

      // Execute request with retry logic
      const result = await this.executeWithRetry(
        config,
        method,
        endpoint,
        transformedData,
        authenticatedHeaders,
        config.retry_config,
      )

      // Apply response transformation
      const transformedResponse = await this.applyResponseTransformation(instanceId, result.data)

      // Update execution log with success
      await sql(
        `
        UPDATE integration_executions 
        SET 
          response_status = $2,
          response_headers = $3,
          response_body = $4,
          execution_time_ms = $5
        WHERE id = $1
      `,
        [
          executionId,
          result.status,
          JSON.stringify(result.headers || {}),
          JSON.stringify(transformedResponse),
          Date.now() - startTime,
        ],
      )

      // Update usage analytics
      await this.updateUsageAnalytics(instanceId, true, Date.now() - startTime, result.data)

      // Update instance success timestamp
      await sql(
        `
        UPDATE integration_instances 
        SET last_success = NOW(), error_count = 0
        WHERE id = $1
      `,
        [instanceId],
      )

      return {
        success: true,
        data: transformedResponse,
        status: result.status,
        headers: result.headers,
        execution_time: Date.now() - startTime,
        execution_id: executionId,
      }
    } catch (error) {
      // Update execution log with error
      if (executionId) {
        await sql(
          `
          UPDATE integration_executions 
          SET 
            error_message = $2,
            execution_time_ms = $3
          WHERE id = $1
        `,
          [executionId, error.message, Date.now() - startTime],
        )
      }

      // Update usage analytics
      await this.updateUsageAnalytics(instanceId, false, Date.now() - startTime)

      // Update instance error count
      await sql(
        `
        UPDATE integration_instances 
        SET error_count = error_count + 1, last_error = $2
        WHERE id = $1
      `,
        [instanceId, error.message],
      )

      // Check if error threshold exceeded
      await this.checkErrorThreshold(instanceId)

      throw error
    }
  }

  // Apply authentication to request headers
  private static async applyAuthentication(config: any, headers: Record<string, string>) {
    const authConfig = config.authentication_config || {}
    const authType = config.authentication_type

    switch (authType) {
      case "api_key":
        if (authConfig.header_name && config.credentials_encrypted) {
          const credentials = JSON.parse(Buffer.from(config.credentials_encrypted, "base64").toString())
          headers[authConfig.header_name] = credentials.api_key
        }
        break

      case "bearer_token":
        if (config.credentials_encrypted) {
          const credentials = JSON.parse(Buffer.from(config.credentials_encrypted, "base64").toString())
          headers["Authorization"] = `Bearer ${credentials.token}`
        }
        break

      case "basic_auth":
        if (config.credentials_encrypted) {
          const credentials = JSON.parse(Buffer.from(config.credentials_encrypted, "base64").toString())
          const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64")
          headers["Authorization"] = `Basic ${encoded}`
        }
        break

      case "oauth2":
        // OAuth2 would require token refresh logic
        if (config.credentials_encrypted) {
          const credentials = JSON.parse(Buffer.from(config.credentials_encrypted, "base64").toString())
          headers["Authorization"] = `Bearer ${credentials.access_token}`
        }
        break
    }

    return headers
  }

  // Check rate limiting
  private static async checkRateLimit(instanceId: string, rateLimits: any) {
    if (!rateLimits) return

    const { requests_per_minute, requests_per_hour, requests_per_day } = rateLimits

    if (requests_per_minute) {
      const recentRequests = await sql(
        `
        SELECT COUNT(*) as request_count
        FROM integration_executions 
        WHERE integration_instance_id = $1 
          AND executed_at >= NOW() - INTERVAL '1 minute'
      `,
        [instanceId],
      )

      if (recentRequests[0].request_count >= requests_per_minute) {
        throw new Error("Rate limit exceeded: requests per minute")
      }
    }

    if (requests_per_hour) {
      const hourlyRequests = await sql(
        `
        SELECT COUNT(*) as request_count
        FROM integration_executions 
        WHERE integration_instance_id = $1 
          AND executed_at >= NOW() - INTERVAL '1 hour'
      `,
        [instanceId],
      )

      if (hourlyRequests[0].request_count >= requests_per_hour) {
        throw new Error("Rate limit exceeded: requests per hour")
      }
    }
  }

  // Execute request with retry logic
  private static async executeWithRetry(
    config: any,
    method: string,
    endpoint: string,
    data: any,
    headers: Record<string, string>,
    retryConfig: any,
  ) {
    const maxAttempts = retryConfig?.max_attempts || 3
    const backoffStrategy = retryConfig?.backoff_strategy || "exponential"
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const url = `${config.endpoint_url}${endpoint}`
        const timeoutMs = config.timeout_config?.read || 30000

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: AbortSignal.timeout(timeoutMs),
        })

        const responseData = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
        }
      } catch (error) {
        lastError = error as Error

        if (attempt < maxAttempts) {
          // Calculate backoff delay
          let delay = 1000 // 1 second base delay

          if (backoffStrategy === "exponential") {
            delay = Math.pow(2, attempt - 1) * 1000
          } else if (backoffStrategy === "linear") {
            delay = attempt * 1000
          }

          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }

  // Apply request transformation
  private static async applyRequestTransformation(instanceId: string, data: any) {
    const transformations = await sql(
      `
      SELECT transformation_rules, validation_rules
      FROM data_transformations 
      WHERE integration_instance_id = $1 
        AND transformation_type = 'request' 
        AND is_active = true
      ORDER BY version DESC
      LIMIT 1
    `,
      [instanceId],
    )

    if (transformations.length === 0) {
      return data
    }

    const rules = transformations[0].transformation_rules
    const validationRules = transformations[0].validation_rules

    // Apply transformation rules (simplified implementation)
    let transformedData = data

    if (rules.field_mappings) {
      transformedData = this.applyFieldMappings(data, rules.field_mappings)
    }

    if (rules.data_formatting) {
      transformedData = this.applyDataFormatting(transformedData, rules.data_formatting)
    }

    // Apply validation rules
    if (validationRules && validationRules.length > 0) {
      this.validateData(transformedData, validationRules)
    }

    return transformedData
  }

  // Apply response transformation
  private static async applyResponseTransformation(instanceId: string, data: any) {
    const transformations = await sql(
      `
      SELECT transformation_rules
      FROM data_transformations 
      WHERE integration_instance_id = $1 
        AND transformation_type = 'response' 
        AND is_active = true
      ORDER BY version DESC
      LIMIT 1
    `,
      [instanceId],
    )

    if (transformations.length === 0) {
      return data
    }

    const rules = transformations[0].transformation_rules

    // Apply transformation rules
    let transformedData = data

    if (rules.field_mappings) {
      transformedData = this.applyFieldMappings(data, rules.field_mappings)
    }

    if (rules.data_extraction) {
      transformedData = this.extractData(transformedData, rules.data_extraction)
    }

    return transformedData
  }

  // Apply field mappings
  private static applyFieldMappings(data: any, mappings: Record<string, string>) {
    if (!data || typeof data !== "object") return data

    const result = {}

    for (const [targetField, sourceField] of Object.entries(mappings)) {
      const value = this.getNestedValue(data, sourceField)
      if (value !== undefined) {
        this.setNestedValue(result, targetField, value)
      }
    }

    return result
  }

  // Apply data formatting
  private static applyDataFormatting(data: any, formatting: any) {
    if (!data || typeof data !== "object") return data

    const result = { ...data }

    for (const [field, format] of Object.entries(formatting)) {
      const value = this.getNestedValue(result, field)
      if (value !== undefined) {
        const formattedValue = this.formatValue(value, format)
        this.setNestedValue(result, field, formattedValue)
      }
    }

    return result
  }

  // Extract specific data from response
  private static extractData(data: any, extraction: any) {
    if (extraction.path) {
      return this.getNestedValue(data, extraction.path)
    }

    if (extraction.fields && Array.isArray(extraction.fields)) {
      const result = {}
      for (const field of extraction.fields) {
        const value = this.getNestedValue(data, field)
        if (value !== undefined) {
          this.setNestedValue(result, field, value)
        }
      }
      return result
    }

    return data
  }

  // Utility functions for nested object access
  private static getNestedValue(obj: any, path: string) {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  private static setNestedValue(obj: any, path: string, value: any) {
    const keys = path.split(".")
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  private static formatValue(value: any, format: any) {
    switch (format.type) {
      case "date":
        return new Date(value).toISOString()
      case "number":
        return Number.parseFloat(value)
      case "string":
        return String(value)
      case "uppercase":
        return String(value).toUpperCase()
      case "lowercase":
        return String(value).toLowerCase()
      default:
        return value
    }
  }

  // Validate data against rules
  private static validateData(data: any, rules: any[]) {
    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field)

      switch (rule.type) {
        case "required":
          if (value === undefined || value === null || value === "") {
            throw new Error(`Required field missing: ${rule.field}`)
          }
          break
        case "type":
          if (typeof value !== rule.expected_type) {
            throw new Error(`Invalid type for field ${rule.field}: expected ${rule.expected_type}`)
          }
          break
        case "range":
          if (typeof value === "number" && (value < rule.min || value > rule.max)) {
            throw new Error(`Value out of range for field ${rule.field}: ${value}`)
          }
          break
      }
    }
  }

  // Update usage analytics
  private static async updateUsageAnalytics(
    instanceId: string,
    success: boolean,
    executionTime: number,
    responseData?: any,
  ) {
    const now = new Date()
    const dateKey = Number.parseInt(now.toISOString().slice(0, 10).replace(/-/g, ""))
    const hourKey = now.getHours()

    const dataSize = responseData ? JSON.stringify(responseData).length : 0

    await sql(
      `
      INSERT INTO integration_usage_analytics (
        integration_instance_id, date_key, hour_key, request_count,
        success_count, error_count, avg_response_time_ms, total_data_transferred_bytes
      ) VALUES ($1, $2, $3, 1, $4, $5, $6, $7)
      ON CONFLICT (integration_instance_id, date_key, hour_key)
      DO UPDATE SET
        request_count = integration_usage_analytics.request_count + 1,
        success_count = integration_usage_analytics.success_count + $4,
        error_count = integration_usage_analytics.error_count + $5,
        avg_response_time_ms = (
          integration_usage_analytics.avg_response_time_ms * integration_usage_analytics.request_count + $6
        ) / (integration_usage_analytics.request_count + 1),
        total_data_transferred_bytes = integration_usage_analytics.total_data_transferred_bytes + $7
    `,
      [instanceId, dateKey, hourKey, success ? 1 : 0, success ? 0 : 1, executionTime, dataSize],
    )
  }

  // Check error threshold and create alerts
  private static async checkErrorThreshold(instanceId: string) {
    const instance = await sql(
      `
      SELECT error_count, instance_name
      FROM integration_instances 
      WHERE id = $1
    `,
      [instanceId],
    )

    if (instance.length === 0) return

    const errorCount = instance[0].error_count
    const instanceName = instance[0].instance_name

    // Create alert if error threshold exceeded
    if (errorCount >= 5) {
      await sql(
        `
        INSERT INTO integration_alerts (
          integration_instance_id, alert_type, severity, title, description, alert_data
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `,
        [
          instanceId,
          "high_error_rate",
          errorCount >= 10 ? "critical" : "high",
          `High Error Rate Detected`,
          `Integration ${instanceName} has ${errorCount} consecutive errors`,
          JSON.stringify({ error_count: errorCount, threshold: 5 }),
        ],
      )
    }
  }

  // Health check all integrations
  static async performHealthChecks() {
    try {
      const activeIntegrations = await sql(`
        SELECT 
          i.*,
          r.integration_type,
          r.provider,
          r.endpoint_url,
          r.health_check_config
        FROM integration_instances i
        JOIN integration_registry r ON i.registry_id = r.id
        WHERE i.status = 'active'
          AND (i.last_health_check IS NULL OR i.last_health_check < NOW() - INTERVAL '5 minutes')
      `)

      for (const integration of activeIntegrations) {
        await this.performSingleHealthCheck(integration)
      }

      return activeIntegrations.length
    } catch (error) {
      console.error("Error performing health checks:", error)
      return 0
    }
  }

  // Perform health check for single integration
  private static async performSingleHealthCheck(integration: any) {
    const startTime = Date.now()
    let status = "unknown"
    let responseTime = 0
    let errorMessage = null

    try {
      const healthConfig = integration.health_check_config || {}

      switch (integration.integration_type) {
        case "api":
          const response = await fetch(`${integration.endpoint_url}${healthConfig.endpoint || "/health"}`, {
            method: healthConfig.method || "GET",
            timeout: 5000,
          })
          responseTime = Date.now() - startTime
          status = response.ok ? "healthy" : "unhealthy"
          if (!response.ok) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
          break

        case "database":
          // Simulate database health check
          await new Promise((resolve) => setTimeout(resolve, 100))
          responseTime = Date.now() - startTime
          status = "healthy"
          break

        default:
          status = "healthy"
      }
    } catch (error) {
      responseTime = Date.now() - startTime
      status = "unhealthy"
      errorMessage = error.message
    }

    // Store health check result
    await sql(
      `
      INSERT INTO integration_health_checks (
        integration_instance_id, check_type, check_config, status,
        response_time_ms, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        integration.id,
        "scheduled",
        JSON.stringify(integration.health_check_config || {}),
        status,
        responseTime,
        errorMessage,
      ],
    )

    // Update instance health status
    await sql(
      `
      UPDATE integration_instances 
      SET health_status = $2, last_health_check = NOW()
      WHERE id = $1
    `,
      [integration.id, status],
    )
  }
}
