export interface AIModelProvider {
  id: string
  name: string
  display_name: string
  provider_type: "openai" | "anthropic" | "huggingface" | "local" | "custom"
  api_endpoint?: string
  authentication_type: "api_key" | "oauth" | "none"
  configuration: Record<string, any>
  supported_features: string[]
  rate_limits: Record<string, any>
  pricing: Record<string, any>
  is_active: boolean
}

export interface AIModel {
  id: string
  provider_id: string
  model_id: string
  name: string
  description: string
  model_type: "chat" | "completion" | "embedding" | "multimodal"
  capabilities: string[]
  context_length: number
  max_tokens: number
  input_cost_per_token: number
  output_cost_per_token: number
  training_data_cutoff?: string
  parameters: Record<string, any>
  performance_metrics: Record<string, any>
  is_available: boolean
}

export interface ModelConfiguration {
  id: string
  agent_id: string
  model_id: string
  configuration: Record<string, any>
  system_prompt: string
  is_primary: boolean
  is_active: boolean
}

export interface FineTuningJob {
  id: string
  agent_id: string
  base_model_id: string
  job_name: string
  provider_job_id?: string
  training_data_id?: string
  validation_data_id?: string
  hyperparameters: Record<string, any>
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  progress_percentage: number
  estimated_completion?: string
  fine_tuned_model_id?: string
  training_metrics: Record<string, any>
  validation_metrics: Record<string, any>
  cost_estimate: number
  actual_cost: number
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
  created_by: string
}

export class AIModelManager {
  static async getAvailableModels(
    options: {
      providerType?: string
      modelType?: string
      agentId?: string
    } = {},
  ): Promise<{
    models: AIModel[]
    grouped: Record<string, { provider: AIModelProvider; models: AIModel[] }>
    currentConfig?: ModelConfiguration
  }> {
    const params = new URLSearchParams()
    if (options.providerType) params.set("provider", options.providerType)
    if (options.modelType) params.set("type", options.modelType)
    if (options.agentId) params.set("agentId", options.agentId)

    const response = await fetch(`/api/agents/models?${params}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get available models")
    }

    return await response.json()
  }

  static async configureAgentModel(
    agentId: string,
    modelId: string,
    configuration: Record<string, any>,
    systemPrompt?: string,
    isPrimary = true,
  ): Promise<ModelConfiguration> {
    const response = await fetch("/api/agents/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        modelId,
        configuration,
        systemPrompt,
        isPrimary,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to configure model")
    }

    const { config } = await response.json()
    return config
  }

  static async startFineTuning(
    agentId: string,
    baseModelId: string,
    jobName: string,
    options: {
      trainingDataId?: string
      validationDataId?: string
      hyperparameters?: Record<string, any>
    } = {},
  ): Promise<FineTuningJob> {
    const response = await fetch("/api/agents/models/fine-tune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        baseModelId,
        jobName,
        ...options,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to start fine-tuning")
    }

    const { job } = await response.json()
    return job
  }

  static async getFineTuningJobs(
    options: {
      agentId?: string
      status?: string
    } = {},
  ): Promise<FineTuningJob[]> {
    const params = new URLSearchParams()
    if (options.agentId) params.set("agentId", options.agentId)
    if (options.status) params.set("status", options.status)

    const response = await fetch(`/api/agents/models/fine-tune?${params}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get fine-tuning jobs")
    }

    const { jobs } = await response.json()
    return jobs
  }

  static async evaluateModel(
    agentId: string,
    modelConfigId: string,
    evaluationName: string,
    evaluationType: "benchmark" | "custom" | "a_b_test",
    evaluationConfig: Record<string, any>,
  ): Promise<any> {
    const response = await fetch("/api/agents/models/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        modelConfigId,
        evaluationName,
        evaluationType,
        evaluationConfig,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to start model evaluation")
    }

    return await response.json()
  }

  static async getModelMetrics(
    agentId: string,
    timeRange: "1h" | "24h" | "7d" | "30d" = "24h",
  ): Promise<{
    usage: Array<{ timestamp: string; tokens: number; cost: number; requests: number }>
    performance: Array<{ timestamp: string; latency: number; success_rate: number }>
    costs: { total: number; breakdown: Record<string, number> }
  }> {
    const response = await fetch(`/api/agents/models/metrics?agentId=${agentId}&range=${timeRange}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get model metrics")
    }

    return await response.json()
  }

  static async optimizeModelConfiguration(
    agentId: string,
    optimizationGoal: "cost" | "performance" | "accuracy",
  ): Promise<{
    recommendations: Array<{
      type: string
      description: string
      impact: string
      configuration: Record<string, any>
    }>
    estimatedImprovement: Record<string, number>
  }> {
    const response = await fetch("/api/agents/models/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        optimizationGoal,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to optimize model configuration")
    }

    return await response.json()
  }

  static calculateTokenCost(
    inputTokens: number,
    outputTokens: number,
    model: AIModel,
  ): { inputCost: number; outputCost: number; totalCost: number } {
    const inputCost = inputTokens * model.input_cost_per_token
    const outputCost = outputTokens * model.output_cost_per_token
    const totalCost = inputCost + outputCost

    return {
      inputCost: Math.round(inputCost * 1000000) / 1000000, // Round to 6 decimal places
      outputCost: Math.round(outputCost * 1000000) / 1000000,
      totalCost: Math.round(totalCost * 1000000) / 1000000,
    }
  }

  static getModelRecommendations(
    agentType: string,
    requirements: {
      budget?: "low" | "medium" | "high"
      latency?: "low" | "medium" | "high"
      accuracy?: "low" | "medium" | "high"
      features?: string[]
    },
  ): Array<{
    model: AIModel
    score: number
    reasoning: string
    pros: string[]
    cons: string[]
  }> {
    // This would implement a recommendation algorithm based on agent type and requirements
    // For now, return a placeholder implementation
    return []
  }
}

export const MODEL_CATEGORIES = {
  chat: {
    name: "Chat Models",
    description: "Conversational AI models for interactive applications",
    icon: "MessageCircle",
    color: "blue",
  },
  completion: {
    name: "Completion Models",
    description: "Text completion models for content generation",
    icon: "FileText",
    color: "green",
  },
  embedding: {
    name: "Embedding Models",
    description: "Models for semantic search and similarity",
    icon: "Search",
    color: "purple",
  },
  multimodal: {
    name: "Multimodal Models",
    description: "Models that can process text, images, and other media",
    icon: "Image",
    color: "orange",
  },
} as const

export const PROVIDER_TYPES = {
  openai: {
    name: "OpenAI",
    description: "Industry-leading AI models from OpenAI",
    icon: "Zap",
    color: "green",
  },
  anthropic: {
    name: "Anthropic",
    description: "Constitutional AI models focused on safety",
    icon: "Shield",
    color: "orange",
  },
  huggingface: {
    name: "Hugging Face",
    description: "Open-source models and transformers",
    icon: "Heart",
    color: "yellow",
  },
  local: {
    name: "Local Models",
    description: "Self-hosted and on-premise AI models",
    icon: "Server",
    color: "gray",
  },
  custom: {
    name: "Custom",
    description: "Custom AI model integrations",
    icon: "Settings",
    color: "blue",
  },
} as const
