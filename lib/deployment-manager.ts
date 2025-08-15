export interface DeploymentEnvironment {
  id: string
  name: string
  display_name: string
  environment_type: "cloud" | "edge" | "local" | "serverless" | "kubernetes"
  provider: string
  configuration: Record<string, any>
  resource_limits: Record<string, any>
  networking_config: Record<string, any>
  security_config: Record<string, any>
  cost_config: Record<string, any>
  is_active: boolean
}

export interface AgentDeployment {
  id: string
  agent_id: string
  environment_id: string
  pipeline_id?: string
  build_id?: string
  version: string
  deployment_type: string
  endpoint_url?: string
  deployment_config: Record<string, any>
  resource_allocation: Record<string, any>
  scaling_config: Record<string, any>
  traffic_config: Record<string, any>
  status: "deploying" | "active" | "inactive" | "failed" | "terminated"
  health_check_url?: string
  metrics: Record<string, any>
  logs_location?: string
  deployed_at: string
  terminated_at?: string
  deployed_by: string
}

export interface DeploymentBuild {
  id: string
  agent_id: string
  pipeline_id?: string
  build_number: number
  commit_sha?: string
  branch: string
  build_config: Record<string, any>
  status: "pending" | "building" | "testing" | "completed" | "failed" | "cancelled"
  build_logs?: string
  test_results: Record<string, any>
  artifacts: Record<string, any>
  build_duration_seconds?: number
  started_at?: string
  completed_at?: string
  created_at: string
  triggered_by: string
}

export class DeploymentManager {
  static async getAvailableEnvironments(): Promise<DeploymentEnvironment[]> {
    const response = await fetch("/api/agents/environments")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get deployment environments")
    }

    const { environments } = await response.json()
    return environments
  }

  static async deployAgent(
    agentId: string,
    environmentId: string,
    options: {
      version?: string
      deploymentConfig?: Record<string, any>
      scalingConfig?: Record<string, any>
      trafficConfig?: Record<string, any>
    } = {},
  ): Promise<{ deployment: AgentDeployment; buildId: string }> {
    const response = await fetch("/api/agents/deploy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        environmentId,
        ...options,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to deploy agent")
    }

    return await response.json()
  }

  static async getDeployments(
    options: {
      agentId?: string
      status?: string
      environmentType?: string
    } = {},
  ): Promise<AgentDeployment[]> {
    const params = new URLSearchParams()
    if (options.agentId) params.set("agentId", options.agentId)
    if (options.status) params.set("status", options.status)
    if (options.environmentType) params.set("environmentType", options.environmentType)

    const response = await fetch(`/api/agents/deploy?${params}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get deployments")
    }

    const { deployments } = await response.json()
    return deployments
  }

  static async getDeploymentStatus(deploymentId: string): Promise<{
    deployment: AgentDeployment
    health: Array<{ type: string; status: string; last_check: string }>
    metrics: Record<string, any>
    logs: string[]
  }> {
    const response = await fetch(`/api/agents/deploy/${deploymentId}/status`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get deployment status")
    }

    return await response.json()
  }

  static async scaleDeployment(
    deploymentId: string,
    scalingConfig: {
      replicas?: number
      cpu?: string
      memory?: string
      autoScaling?: {
        enabled: boolean
        minReplicas: number
        maxReplicas: number
        targetCPU: number
        targetMemory: number
      }
    },
  ): Promise<void> {
    const response = await fetch(`/api/agents/deploy/${deploymentId}/scale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scalingConfig),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to scale deployment")
    }
  }

  static async updateTrafficRouting(
    deploymentId: string,
    routingConfig: {
      type: "blue_green" | "canary" | "a_b_test" | "weighted"
      trafficPercentage: number
      targetDeploymentId?: string
      routingRules?: Array<{
        condition: string
        target: string
        weight: number
      }>
    },
  ): Promise<void> {
    const response = await fetch(`/api/agents/deploy/${deploymentId}/traffic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(routingConfig),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update traffic routing")
    }
  }

  static async rollbackDeployment(deploymentId: string, targetDeploymentId: string, reason: string): Promise<void> {
    const response = await fetch(`/api/agents/deploy/${deploymentId}/rollback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetDeploymentId,
        reason,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to rollback deployment")
    }
  }

  static async terminateDeployment(deploymentId: string, reason?: string): Promise<void> {
    const response = await fetch(`/api/agents/deploy/${deploymentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to terminate deployment")
    }
  }

  static async getDeploymentLogs(
    deploymentId: string,
    options: {
      lines?: number
      since?: string
      follow?: boolean
    } = {},
  ): Promise<string[]> {
    const params = new URLSearchParams()
    if (options.lines) params.set("lines", options.lines.toString())
    if (options.since) params.set("since", options.since)
    if (options.follow) params.set("follow", "true")

    const response = await fetch(`/api/agents/deploy/${deploymentId}/logs?${params}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get deployment logs")
    }

    const { logs } = await response.json()
    return logs
  }

  static async getDeploymentMetrics(
    deploymentId: string,
    timeRange: "1h" | "24h" | "7d" | "30d" = "24h",
  ): Promise<{
    cpu: Array<{ timestamp: string; value: number }>
    memory: Array<{ timestamp: string; value: number }>
    requests: Array<{ timestamp: string; value: number }>
    errors: Array<{ timestamp: string; value: number }>
    latency: Array<{ timestamp: string; value: number }>
  }> {
    const response = await fetch(`/api/agents/deploy/${deploymentId}/metrics?range=${timeRange}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get deployment metrics")
    }

    return await response.json()
  }

  static async estimateDeploymentCost(
    agentId: string,
    environmentId: string,
    scalingConfig: Record<string, any>,
  ): Promise<{
    hourly: number
    daily: number
    monthly: number
    breakdown: Record<string, number>
  }> {
    const response = await fetch("/api/agents/deploy/cost-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        environmentId,
        scalingConfig,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to estimate deployment cost")
    }

    return await response.json()
  }

  static async createDeploymentPipeline(
    agentId: string,
    pipelineConfig: {
      name: string
      description?: string
      triggerConfig: Record<string, any>
      buildConfig: Record<string, any>
      testConfig: Record<string, any>
      deploymentStages: Array<{
        name: string
        environmentId: string
        config: Record<string, any>
      }>
    },
  ): Promise<any> {
    const response = await fetch("/api/agents/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        ...pipelineConfig,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create deployment pipeline")
    }

    return await response.json()
  }
}

export const DEPLOYMENT_STATUSES = {
  deploying: { label: "Deploying", color: "yellow", icon: "Loader" },
  active: { label: "Active", color: "green", icon: "CheckCircle" },
  inactive: { label: "Inactive", color: "gray", icon: "Pause" },
  failed: { label: "Failed", color: "red", icon: "XCircle" },
  terminated: { label: "Terminated", color: "gray", icon: "Square" },
} as const

export const ENVIRONMENT_TYPES = {
  cloud: { label: "Cloud", icon: "Cloud", color: "blue" },
  edge: { label: "Edge", icon: "Zap", color: "purple" },
  local: { label: "Local", icon: "Server", color: "gray" },
  serverless: { label: "Serverless", icon: "Lambda", color: "green" },
  kubernetes: { label: "Kubernetes", icon: "Container", color: "blue" },
} as const
