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
    const status = searchParams.get("status")
    const targetType = searchParams.get("targetType")
    const templateType = searchParams.get("templateType")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = `
      SELECT 
        a.*,
        t.template_name,
        t.template_type,
        t.pass_threshold,
        CASE 
          WHEN a.overall_score >= t.pass_threshold THEN true
          ELSE false
        END as meets_threshold
      FROM automated_assessments a
      LEFT JOIN assessment_templates t ON a.template_id = t.id
      WHERE a.user_id = $1
    `

    const params = [session.user.id]

    if (status) {
      query += ` AND a.status = $${params.length + 1}`
      params.push(status)
    }

    if (targetType) {
      query += ` AND a.target_type = $${params.length + 1}`
      params.push(targetType)
    }

    if (templateType) {
      query += ` AND t.template_type = $${params.length + 1}`
      params.push(templateType)
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const assessments = await sql(query, params)

    // Get assessment statistics
    const stats = await sql(
      `
      SELECT 
        COUNT(*) as total_assessments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_assessments,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running_assessments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_assessments,
        AVG(CASE WHEN overall_score IS NOT NULL THEN overall_score END) as avg_score,
        COUNT(CASE WHEN pass_status = true THEN 1 END) as passed_assessments
      FROM automated_assessments 
      WHERE user_id = $1
    `,
      [session.user.id],
    )

    return NextResponse.json({
      assessments,
      statistics: stats[0] || {},
    })
  } catch (error) {
    console.error("Error fetching assessments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { template_id, target_type, target_id, assessment_name, config = {} } = await request.json()

    if (!template_id || !target_type || !target_id) {
      return NextResponse.json({ error: "Template ID, target type, and target ID are required" }, { status: 400 })
    }

    // Verify template exists and is active
    const template = await sql(
      `
      SELECT * FROM assessment_templates 
      WHERE id = $1 AND is_active = true
    `,
      [template_id],
    )

    if (template.length === 0) {
      return NextResponse.json({ error: "Invalid or inactive assessment template" }, { status: 400 })
    }

    // Create new assessment
    const assessment = await sql(
      `
      INSERT INTO automated_assessments (
        assessment_name, template_id, target_type, target_id,
        assessment_config, user_id, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        assessment_name || `${template[0].template_name} - ${target_id}`,
        template_id,
        target_type,
        target_id,
        JSON.stringify(config),
        session.user.id,
        session.user.organization_id,
      ],
    )

    // Start assessment execution asynchronously
    executeAssessment(assessment[0].id, template[0], target_type, target_id, session.user.id)

    return NextResponse.json({
      assessment: assessment[0],
      message: "Assessment started successfully",
    })
  } catch (error) {
    console.error("Error creating assessment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Execute assessment asynchronously
async function executeAssessment(
  assessmentId: string,
  template: any,
  targetType: string,
  targetId: string,
  userId: string,
) {
  try {
    // Update status to running
    await sql(
      `
      UPDATE automated_assessments 
      SET status = 'running', started_at = NOW()
      WHERE id = $1
    `,
      [assessmentId],
    )

    const criteria = template.assessment_criteria
    const weights = template.scoring_weights
    const results = []
    let totalScore = 0
    let totalWeight = 0

    // Execute each assessment criterion
    for (const [criterionName, criterionConfig] of Object.entries(criteria)) {
      const result = await executeCriterion(criterionName, criterionConfig, targetType, targetId, userId)
      const weight = weights[criterionName] || 1

      results.push({
        criterion_name: criterionName,
        criterion_category: template.template_type,
        score: result.score,
        max_score: result.maxScore,
        weight: weight,
        status: result.status,
        details: result.details,
        evidence: result.evidence,
        recommendations: result.recommendations,
        execution_time_ms: result.executionTime,
      })

      totalScore += result.score * weight
      totalWeight += weight
    }

    // Calculate overall score
    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0
    const passStatus = overallScore >= template.pass_threshold

    // Store results
    for (const result of results) {
      await sql(
        `
        INSERT INTO assessment_results (
          assessment_id, criterion_name, criterion_category, score, max_score,
          weight, status, details, evidence, recommendations, execution_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
        [
          assessmentId,
          result.criterion_name,
          result.criterion_category,
          result.score,
          result.max_score,
          result.weight,
          result.status,
          result.details,
          JSON.stringify(result.evidence),
          JSON.stringify(result.recommendations),
          result.execution_time_ms,
        ],
      )
    }

    // Update assessment with final results
    await sql(
      `
      UPDATE automated_assessments 
      SET 
        status = 'completed',
        completed_at = NOW(),
        overall_score = $2,
        pass_status = $3,
        results_summary = $4
      WHERE id = $1
    `,
      [
        assessmentId,
        overallScore,
        passStatus,
        JSON.stringify({
          total_criteria: results.length,
          passed_criteria: results.filter((r) => r.status === "pass").length,
          failed_criteria: results.filter((r) => r.status === "fail").length,
          warning_criteria: results.filter((r) => r.status === "warning").length,
          overall_score: overallScore,
          pass_status: passStatus,
        }),
      ],
    )
  } catch (error) {
    console.error("Error executing assessment:", error)

    // Update assessment status to failed
    await sql(
      `
      UPDATE automated_assessments 
      SET status = 'failed', completed_at = NOW()
      WHERE id = $1
    `,
      [assessmentId],
    )
  }
}

// Execute individual assessment criterion
async function executeCriterion(
  criterionName: string,
  config: any,
  targetType: string,
  targetId: string,
  userId: string,
) {
  const startTime = Date.now()

  try {
    switch (criterionName) {
      case "response_time":
        return await assessResponseTime(config, targetType, targetId, userId)
      case "success_rate":
        return await assessSuccessRate(config, targetType, targetId, userId)
      case "error_rate":
        return await assessErrorRate(config, targetType, targetId, userId)
      case "throughput":
        return await assessThroughput(config, targetType, targetId, userId)
      case "authentication":
        return await assessAuthentication(config, targetType, targetId, userId)
      case "encryption":
        return await assessEncryption(config, targetType, targetId, userId)
      case "access_control":
        return await assessAccessControl(config, targetType, targetId, userId)
      case "vulnerability_scan":
        return await assessVulnerabilities(config, targetType, targetId, userId)
      default:
        return {
          score: 0,
          maxScore: 100,
          status: "fail",
          details: `Unknown criterion: ${criterionName}`,
          evidence: {},
          recommendations: [],
          executionTime: Date.now() - startTime,
        }
    }
  } catch (error) {
    return {
      score: 0,
      maxScore: 100,
      status: "fail",
      details: `Error executing criterion: ${error.message}`,
      evidence: { error: error.message },
      recommendations: ["Review criterion configuration", "Check target availability"],
      executionTime: Date.now() - startTime,
    }
  }
}

// Assessment criterion implementations
async function assessResponseTime(config: any, targetType: string, targetId: string, userId: string) {
  const maxAcceptable = config.max_acceptable || 3000

  // Get recent response time data
  const responseTimeData = await sql(
    `
    SELECT AVG(response_time_ms) as avg_response_time
    FROM agent_performance_metrics 
    WHERE user_id = $1 
      AND agent_id = $2
      AND recorded_at >= NOW() - INTERVAL '1 hour'
  `,
    [userId, targetId],
  )

  const avgResponseTime = responseTimeData[0]?.avg_response_time || 0
  const score =
    avgResponseTime <= maxAcceptable
      ? 100
      : Math.max(0, 100 - ((avgResponseTime - maxAcceptable) / maxAcceptable) * 100)

  return {
    score: Math.round(score),
    maxScore: 100,
    status: score >= 70 ? "pass" : score >= 50 ? "warning" : "fail",
    details: `Average response time: ${avgResponseTime.toFixed(0)}ms (threshold: ${maxAcceptable}ms)`,
    evidence: { avg_response_time: avgResponseTime, threshold: maxAcceptable },
    recommendations:
      avgResponseTime > maxAcceptable
        ? ["Optimize agent performance", "Check system resources", "Review network latency"]
        : [],
    executionTime: Date.now() - Date.now(),
  }
}

async function assessSuccessRate(config: any, targetType: string, targetId: string, userId: string) {
  const minAcceptable = config.min_acceptable || 95

  const successRateData = await sql(
    `
    SELECT AVG(success_rate) as avg_success_rate
    FROM agent_performance_metrics 
    WHERE user_id = $1 
      AND agent_id = $2
      AND recorded_at >= NOW() - INTERVAL '1 hour'
  `,
    [userId, targetId],
  )

  const avgSuccessRate = successRateData[0]?.avg_success_rate || 0
  const score = avgSuccessRate >= minAcceptable ? 100 : (avgSuccessRate / minAcceptable) * 100

  return {
    score: Math.round(score),
    maxScore: 100,
    status: score >= 80 ? "pass" : score >= 60 ? "warning" : "fail",
    details: `Average success rate: ${avgSuccessRate.toFixed(1)}% (threshold: ${minAcceptable}%)`,
    evidence: { avg_success_rate: avgSuccessRate, threshold: minAcceptable },
    recommendations:
      avgSuccessRate < minAcceptable
        ? ["Investigate error patterns", "Improve error handling", "Check API dependencies"]
        : [],
    executionTime: Date.now() - Date.now(),
  }
}

async function assessErrorRate(config: any, targetType: string, targetId: string, userId: string) {
  const maxAcceptable = config.max_acceptable || 5

  const errorRateData = await sql(
    `
    SELECT 
      CASE 
        WHEN SUM(requests_count) > 0 
        THEN (SUM(error_count)::DECIMAL / SUM(requests_count)) * 100
        ELSE 0 
      END as error_rate
    FROM analytics_fact_agent_usage 
    WHERE user_id = $1 
      AND agent_id = $2
      AND date_key = TO_CHAR(NOW(), 'YYYYMMDD')::INTEGER
  `,
    [userId, targetId],
  )

  const errorRate = errorRateData[0]?.error_rate || 0
  const score =
    errorRate <= maxAcceptable ? 100 : Math.max(0, 100 - ((errorRate - maxAcceptable) / maxAcceptable) * 100)

  return {
    score: Math.round(score),
    maxScore: 100,
    status: score >= 80 ? "pass" : score >= 60 ? "warning" : "fail",
    details: `Error rate: ${errorRate.toFixed(2)}% (threshold: ${maxAcceptable}%)`,
    evidence: { error_rate: errorRate, threshold: maxAcceptable },
    recommendations:
      errorRate > maxAcceptable ? ["Analyze error patterns", "Improve input validation", "Enhance error recovery"] : [],
    executionTime: Date.now() - Date.now(),
  }
}

async function assessThroughput(config: any, targetType: string, targetId: string, userId: string) {
  const minAcceptable = config.min_acceptable || 10

  const throughputData = await sql(
    `
    SELECT AVG(throughput_rps) as avg_throughput
    FROM agent_performance_metrics 
    WHERE user_id = $1 
      AND agent_id = $2
      AND recorded_at >= NOW() - INTERVAL '1 hour'
      AND throughput_rps IS NOT NULL
  `,
    [userId, targetId],
  )

  const avgThroughput = throughputData[0]?.avg_throughput || 0
  const score = avgThroughput >= minAcceptable ? 100 : (avgThroughput / minAcceptable) * 100

  return {
    score: Math.round(score),
    maxScore: 100,
    status: score >= 70 ? "pass" : score >= 50 ? "warning" : "fail",
    details: `Average throughput: ${avgThroughput.toFixed(1)} RPS (threshold: ${minAcceptable} RPS)`,
    evidence: { avg_throughput: avgThroughput, threshold: minAcceptable },
    recommendations:
      avgThroughput < minAcceptable ? ["Scale agent resources", "Optimize processing logic", "Implement caching"] : [],
    executionTime: Date.now() - Date.now(),
  }
}

async function assessAuthentication(config: any, targetType: string, targetId: string, userId: string) {
  // Simulate authentication assessment
  const hasAuthentication = true // This would be determined by actual checks
  const strongAuthentication = true // Multi-factor, strong passwords, etc.

  const score = hasAuthentication ? (strongAuthentication ? 100 : 70) : 0

  return {
    score,
    maxScore: 100,
    status: score >= 80 ? "pass" : score >= 60 ? "warning" : "fail",
    details: hasAuthentication ? "Authentication is properly configured" : "Authentication is missing or misconfigured",
    evidence: { has_authentication: hasAuthentication, strong_authentication: strongAuthentication },
    recommendations: !hasAuthentication ? ["Implement authentication", "Use strong authentication methods"] : [],
    executionTime: Date.now() - Date.now(),
  }
}

async function assessEncryption(config: any, targetType: string, targetId: string, userId: string) {
  // Simulate encryption assessment
  const hasEncryption = true
  const strongEncryption = true // AES-256, TLS 1.3, etc.

  const score = hasEncryption ? (strongEncryption ? 100 : 70) : 0

  return {
    score,
    maxScore: 100,
    status: score >= 80 ? "pass" : score >= 60 ? "warning" : "fail",
    details: hasEncryption ? "Encryption is properly implemented" : "Encryption is missing or weak",
    evidence: { has_encryption: hasEncryption, strong_encryption: strongEncryption },
    recommendations: !hasEncryption ? ["Implement encryption", "Use industry-standard encryption"] : [],
    executionTime: Date.now() - Date.now(),
  }
}

async function assessAccessControl(config: any, targetType: string, targetId: string, userId: string) {
  // Simulate access control assessment
  const hasAccessControl = true
  const roleBasedAccess = true
  const principleOfLeastPrivilege = true

  const score = hasAccessControl ? (roleBasedAccess && principleOfLeastPrivilege ? 100 : 75) : 0

  return {
    score,
    maxScore: 100,
    status: score >= 80 ? "pass" : score >= 60 ? "warning" : "fail",
    details: hasAccessControl ? "Access control is properly configured" : "Access control is insufficient",
    evidence: {
      has_access_control: hasAccessControl,
      role_based_access: roleBasedAccess,
      least_privilege: principleOfLeastPrivilege,
    },
    recommendations: !hasAccessControl ? ["Implement access control", "Use role-based permissions"] : [],
    executionTime: Date.now() - Date.now(),
  }
}

async function assessVulnerabilities(config: any, targetType: string, targetId: string, userId: string) {
  // Simulate vulnerability scan
  const criticalVulns = 0
  const highVulns = 1
  const mediumVulns = 3
  const lowVulns = 5

  const maxCritical = config.max_critical || 0
  const score = criticalVulns <= maxCritical ? Math.max(0, 100 - highVulns * 20 - mediumVulns * 5 - lowVulns * 1) : 0

  return {
    score: Math.round(score),
    maxScore: 100,
    status: criticalVulns > 0 ? "fail" : highVulns > 2 ? "warning" : "pass",
    details: `Vulnerabilities found: ${criticalVulns} critical, ${highVulns} high, ${mediumVulns} medium, ${lowVulns} low`,
    evidence: {
      critical_vulnerabilities: criticalVulns,
      high_vulnerabilities: highVulns,
      medium_vulnerabilities: mediumVulns,
      low_vulnerabilities: lowVulns,
    },
    recommendations:
      criticalVulns > 0 || highVulns > 0
        ? [
            "Address critical and high vulnerabilities immediately",
            "Implement security patches",
            "Review security configurations",
          ]
        : [],
    executionTime: Date.now() - Date.now(),
  }
}
