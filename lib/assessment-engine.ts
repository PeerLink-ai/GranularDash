import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export class AssessmentEngine {
  // Run comprehensive automated assessment
  static async runAssessment(templateId: string, targetType: string, targetId: string, userId: string) {
    try {
      // Get assessment template
      const template = await sql(
        `
        SELECT * FROM assessment_templates 
        WHERE id = $1 AND is_active = true
      `,
        [templateId],
      )

      if (template.length === 0) {
        throw new Error("Assessment template not found")
      }

      // Create assessment record
      const assessment = await sql(
        `
        INSERT INTO automated_assessments (
          assessment_name, template_id, target_type, target_id, 
          status, user_id, organization_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
        [
          `${template[0].template_name} - ${targetId}`,
          templateId,
          targetType,
          targetId,
          "running",
          userId,
          null, // organization_id
        ],
      )

      const assessmentId = assessment[0].id

      // Execute assessment
      const results = await this.executeAssessmentCriteria(template[0], targetType, targetId, userId)

      // Calculate overall score
      const overallScore = this.calculateOverallScore(results, template[0].scoring_weights)
      const passStatus = overallScore >= template[0].pass_threshold

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

      // Generate risk assessments if security template
      if (template[0].template_type === "security") {
        await this.generateRiskAssessments(assessmentId, results)
      }

      // Generate compliance checks if compliance template
      if (template[0].template_type === "compliance") {
        await this.generateComplianceChecks(assessmentId, results)
      }

      return {
        assessment_id: assessmentId,
        overall_score: overallScore,
        pass_status: passStatus,
        results,
      }
    } catch (error) {
      console.error("Error running assessment:", error)
      throw error
    }
  }

  // Execute all assessment criteria
  private static async executeAssessmentCriteria(template: any, targetType: string, targetId: string, userId: string) {
    const criteria = template.assessment_criteria
    const weights = template.scoring_weights
    const results = []

    for (const [criterionName, criterionConfig] of Object.entries(criteria)) {
      const startTime = Date.now()

      try {
        const result = await this.executeSingleCriterion(criterionName, criterionConfig, targetType, targetId, userId)

        results.push({
          criterion_name: criterionName,
          criterion_category: template.template_type,
          score: result.score,
          max_score: result.maxScore,
          weight: weights[criterionName] || 1,
          status: result.status,
          details: result.details,
          evidence: result.evidence,
          recommendations: result.recommendations,
          execution_time_ms: Date.now() - startTime,
        })
      } catch (error) {
        results.push({
          criterion_name: criterionName,
          criterion_category: template.template_type,
          score: 0,
          max_score: 100,
          weight: weights[criterionName] || 1,
          status: "fail",
          details: `Error executing criterion: ${error.message}`,
          evidence: { error: error.message },
          recommendations: ["Review criterion configuration", "Check target availability"],
          execution_time_ms: Date.now() - startTime,
        })
      }
    }

    return results
  }

  // Execute a single assessment criterion
  private static async executeSingleCriterion(
    criterionName: string,
    config: any,
    targetType: string,
    targetId: string,
    userId: string,
  ) {
    switch (criterionName) {
      case "response_time":
        return await this.assessResponseTime(config, targetType, targetId, userId)
      case "success_rate":
        return await this.assessSuccessRate(config, targetType, targetId, userId)
      case "error_rate":
        return await this.assessErrorRate(config, targetType, targetId, userId)
      case "throughput":
        return await this.assessThroughput(config, targetType, targetId, userId)
      case "availability":
        return await this.assessAvailability(config, targetType, targetId, userId)
      case "security_score":
        return await this.assessSecurityScore(config, targetType, targetId, userId)
      case "compliance_score":
        return await this.assessComplianceScore(config, targetType, targetId, userId)
      case "quality_score":
        return await this.assessQualityScore(config, targetType, targetId, userId)
      default:
        throw new Error(`Unknown criterion: ${criterionName}`)
    }
  }

  // Assessment criterion implementations
  private static async assessResponseTime(config: any, targetType: string, targetId: string, userId: string) {
    const maxAcceptable = config.max_acceptable || 3000

    const data = await sql(
      `
      SELECT 
        AVG(response_time_ms) as avg_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
        COUNT(*) as sample_size
      FROM agent_performance_metrics 
      WHERE user_id = $1 AND agent_id = $2
        AND recorded_at >= NOW() - INTERVAL '24 hours'
    `,
      [userId, targetId],
    )

    const avgResponseTime = data[0]?.avg_response_time || 0
    const p95ResponseTime = data[0]?.p95_response_time || 0
    const sampleSize = data[0]?.sample_size || 0

    if (sampleSize < 10) {
      return {
        score: 0,
        maxScore: 100,
        status: "fail",
        details: "Insufficient data for response time assessment",
        evidence: { sample_size: sampleSize },
        recommendations: ["Collect more performance data", "Ensure agent is actively used"],
      }
    }

    const score =
      p95ResponseTime <= maxAcceptable
        ? 100
        : Math.max(0, 100 - ((p95ResponseTime - maxAcceptable) / maxAcceptable) * 100)

    return {
      score: Math.round(score),
      maxScore: 100,
      status: score >= 80 ? "pass" : score >= 60 ? "warning" : "fail",
      details: `P95 response time: ${p95ResponseTime.toFixed(0)}ms (threshold: ${maxAcceptable}ms)`,
      evidence: {
        avg_response_time: avgResponseTime,
        p95_response_time: p95ResponseTime,
        threshold: maxAcceptable,
        sample_size: sampleSize,
      },
      recommendations:
        p95ResponseTime > maxAcceptable ? ["Optimize agent performance", "Scale resources", "Review bottlenecks"] : [],
    }
  }

  private static async assessSuccessRate(config: any, targetType: string, targetId: string, userId: string) {
    const minAcceptable = config.min_acceptable || 95

    const data = await sql(
      `
      SELECT 
        AVG(success_rate) as avg_success_rate,
        COUNT(*) as sample_size,
        SUM(error_count) as total_errors
      FROM agent_performance_metrics 
      WHERE user_id = $1 AND agent_id = $2
        AND recorded_at >= NOW() - INTERVAL '24 hours'
    `,
      [userId, targetId],
    )

    const avgSuccessRate = data[0]?.avg_success_rate || 0
    const sampleSize = data[0]?.sample_size || 0
    const totalErrors = data[0]?.total_errors || 0

    if (sampleSize < 10) {
      return {
        score: 0,
        maxScore: 100,
        status: "fail",
        details: "Insufficient data for success rate assessment",
        evidence: { sample_size: sampleSize },
        recommendations: ["Collect more performance data", "Ensure agent is actively used"],
      }
    }

    const score = avgSuccessRate >= minAcceptable ? 100 : (avgSuccessRate / minAcceptable) * 100

    return {
      score: Math.round(score),
      maxScore: 100,
      status: score >= 90 ? "pass" : score >= 70 ? "warning" : "fail",
      details: `Average success rate: ${avgSuccessRate.toFixed(1)}% (threshold: ${minAcceptable}%)`,
      evidence: {
        avg_success_rate: avgSuccessRate,
        threshold: minAcceptable,
        sample_size: sampleSize,
        total_errors: totalErrors,
      },
      recommendations:
        avgSuccessRate < minAcceptable
          ? ["Investigate error patterns", "Improve error handling", "Check dependencies"]
          : [],
    }
  }

  private static async assessAvailability(config: any, targetType: string, targetId: string, userId: string) {
    const minAcceptable = config.min_acceptable || 99.9

    // Calculate uptime based on successful health checks
    const data = await sql(
      `
      SELECT 
        COUNT(*) as total_checks,
        COUNT(CASE WHEN metric_value > 0 THEN 1 END) as successful_checks
      FROM system_health_metrics 
      WHERE component = $1 
        AND metric_name = 'availability_check'
        AND recorded_at >= NOW() - INTERVAL '24 hours'
    `,
      [targetId],
    )

    const totalChecks = data[0]?.total_checks || 0
    const successfulChecks = data[0]?.successful_checks || 0

    if (totalChecks < 10) {
      return {
        score: 0,
        maxScore: 100,
        status: "fail",
        details: "Insufficient availability data",
        evidence: { total_checks: totalChecks },
        recommendations: ["Implement availability monitoring", "Increase monitoring frequency"],
      }
    }

    const availability = (successfulChecks / totalChecks) * 100
    const score = availability >= minAcceptable ? 100 : (availability / minAcceptable) * 100

    return {
      score: Math.round(score),
      maxScore: 100,
      status: score >= 95 ? "pass" : score >= 80 ? "warning" : "fail",
      details: `Availability: ${availability.toFixed(2)}% (threshold: ${minAcceptable}%)`,
      evidence: {
        availability: availability,
        threshold: minAcceptable,
        total_checks: totalChecks,
        successful_checks: successfulChecks,
      },
      recommendations:
        availability < minAcceptable
          ? ["Improve system reliability", "Implement redundancy", "Monitor dependencies"]
          : [],
    }
  }

  // Calculate overall assessment score
  private static calculateOverallScore(results: any[], weights: any) {
    let totalScore = 0
    let totalWeight = 0

    for (const result of results) {
      const weight = weights[result.criterion_name] || 1
      totalScore += result.score * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  // Generate risk assessments for security evaluations
  private static async generateRiskAssessments(assessmentId: string, results: any[]) {
    for (const result of results) {
      if (result.status === "fail" || result.status === "warning") {
        const severity = result.status === "fail" ? "high" : "medium"
        const likelihood = result.score < 30 ? "high" : result.score < 60 ? "medium" : "low"
        const impact = severity === "high" ? "high" : "medium"
        const riskScore = this.calculateRiskScore(severity, likelihood, impact)

        await sql(
          `
          INSERT INTO risk_assessments (
            assessment_id, risk_category, risk_type, severity, likelihood,
            impact, risk_score, title, description, affected_components,
            mitigation_strategies, remediation_priority
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
          [
            assessmentId,
            "security",
            result.criterion_name,
            severity,
            likelihood,
            impact,
            riskScore,
            `${result.criterion_name} Risk`,
            result.details,
            JSON.stringify([result.criterion_name]),
            JSON.stringify(result.recommendations),
            severity === "high" ? 1 : severity === "medium" ? 3 : 5,
          ],
        )
      }
    }
  }

  // Generate compliance checks
  private static async generateComplianceChecks(assessmentId: string, results: any[]) {
    const complianceMapping = {
      data_protection: "GDPR Article 32",
      financial_regulations: "SOX Section 404",
      industry_standards: "ISO 27001",
      audit_trail: "SOX Section 302",
    }

    for (const result of results) {
      const regulation = complianceMapping[result.criterion_name] || "General Compliance"
      const complianceStatus =
        result.status === "pass" ? "compliant" : result.status === "warning" ? "partial" : "non_compliant"

      await sql(
        `
        INSERT INTO compliance_checks (
          assessment_id, regulation_name, requirement_id, requirement_description,
          compliance_status, evidence, gaps_identified, remediation_actions,
          compliance_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          assessmentId,
          regulation,
          result.criterion_name,
          result.details,
          complianceStatus,
          JSON.stringify(result.evidence),
          JSON.stringify(result.status !== "pass" ? [result.details] : []),
          JSON.stringify(result.recommendations),
          result.score,
        ],
      )
    }
  }

  // Calculate risk score based on severity, likelihood, and impact
  private static calculateRiskScore(severity: string, likelihood: string, impact: string) {
    const severityScores = { critical: 5, high: 4, medium: 3, low: 2, info: 1 }
    const likelihoodScores = { very_high: 5, high: 4, medium: 3, low: 2, very_low: 1 }
    const impactScores = { very_high: 5, high: 4, medium: 3, low: 2, very_low: 1 }

    const severityScore = severityScores[severity] || 3
    const likelihoodScore = likelihoodScores[likelihood] || 3
    const impactScore = impactScores[impact] || 3

    return (severityScore * likelihoodScore * impactScore) / 3
  }

  // Schedule automated assessments
  static async scheduleAssessment(templateId: string, targetType: string, scheduleConfig: any, userId: string) {
    try {
      const schedule = await sql(
        `
        INSERT INTO assessment_schedules (
          schedule_name, template_id, target_type, target_filter,
          schedule_config, created_by, organization_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
        [
          scheduleConfig.name || "Automated Assessment",
          templateId,
          targetType,
          JSON.stringify(scheduleConfig.target_filter || {}),
          JSON.stringify(scheduleConfig),
          userId,
          null, // organization_id
        ],
      )

      return schedule[0]
    } catch (error) {
      console.error("Error scheduling assessment:", error)
      throw error
    }
  }

  // Execute scheduled assessments
  static async executeScheduledAssessments() {
    try {
      const dueSchedules = await sql(`
        SELECT * FROM assessment_schedules 
        WHERE is_active = true 
          AND (next_execution IS NULL OR next_execution <= NOW())
      `)

      for (const schedule of dueSchedules) {
        // Get targets based on filter
        const targets = await this.getTargetsForSchedule(schedule)

        for (const target of targets) {
          await this.runAssessment(schedule.template_id, schedule.target_type, target.id, schedule.created_by)
        }

        // Update schedule
        const nextExecution = this.calculateNextExecution(schedule.schedule_config)
        await sql(
          `
          UPDATE assessment_schedules 
          SET last_execution = NOW(), next_execution = $2, execution_count = execution_count + 1
          WHERE id = $1
        `,
          [schedule.id, nextExecution],
        )
      }

      return dueSchedules.length
    } catch (error) {
      console.error("Error executing scheduled assessments:", error)
      return 0
    }
  }

  // Get targets for scheduled assessment
  private static async getTargetsForSchedule(schedule: any) {
    // This would implement logic to find targets based on the schedule's target_filter
    // For now, return a simple example
    if (schedule.target_type === "agent") {
      return await sql(
        `
        SELECT DISTINCT agent_id as id 
        FROM connected_agents 
        WHERE status = 'active'
        LIMIT 10
      `,
      )
    }

    return []
  }

  // Calculate next execution time based on schedule config
  private static calculateNextExecution(scheduleConfig: any) {
    const now = new Date()
    const frequency = scheduleConfig.frequency || "daily"

    switch (frequency) {
      case "hourly":
        return new Date(now.getTime() + 60 * 60 * 1000)
      case "daily":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case "weekly":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case "monthly":
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  }
}
