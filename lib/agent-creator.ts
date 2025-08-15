export interface AgentTemplate {
  id: string
  name: string
  description: string
  category: "code" | "data" | "content" | "support" | "custom"
  template_config: Record<string, any>
  capabilities: string[]
  required_integrations: string[]
  code_template: string
}

export interface CreatedAgent {
  id: string
  user_id: string
  organization_id?: string
  template_id?: string
  name: string
  description: string
  agent_type: string
  configuration: Record<string, any>
  capabilities: string[]
  status: "draft" | "training" | "testing" | "deployed" | "paused" | "error"
  version: string
  source_code: string
  deployment_config: Record<string, any>
  performance_metrics: Record<string, any>
  created_at: string
  updated_at: string
  deployed_at?: string
  last_trained_at?: string
}

export interface RepositoryConnection {
  id: string
  agent_id: string
  repository_url: string
  repository_type: "github" | "gitlab" | "bitbucket" | "custom"
  branch: string
  sync_status: string
  last_sync_at?: string
  sync_frequency: "on_push" | "hourly" | "daily" | "manual"
  file_patterns: string[]
  ignore_patterns: string[]
}

export class AgentCreator {
  static async generateAgentCode(template: AgentTemplate, config: Record<string, any>): Promise<string> {
    // Generate customized agent code based on template and configuration
    let code = template.code_template

    // Replace configuration placeholders
    Object.entries(config).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      code = code.replace(new RegExp(placeholder, "g"), JSON.stringify(value))
    })

    // Add capability-specific methods
    template.capabilities.forEach((capability) => {
      const methodCode = this.generateCapabilityMethod(capability)
      if (methodCode) {
        code = code.replace("// Agent implementation", `${methodCode}\n    // Agent implementation`)
      }
    })

    return code
  }

  static generateCapabilityMethod(capability: string): string {
    const methods: Record<string, string> = {
      code_generation: `
  async generateCode(prompt, language = 'javascript') {
    const response = await this.callLLM({
      prompt: \`Generate \${language} code for: \${prompt}\`,
      temperature: 0.1,
      max_tokens: 1500
    });
    return response.code;
  }`,
      code_review: `
  async reviewCode(code, language = 'javascript') {
    const response = await this.callLLM({
      prompt: \`Review this \${language} code and provide feedback: \${code}\`,
      temperature: 0.2,
      max_tokens: 1000
    });
    return response.review;
  }`,
      data_analysis: `
  async analyzeData(data, analysisType = 'summary') {
    const response = await this.callLLM({
      prompt: \`Perform \${analysisType} analysis on this data: \${JSON.stringify(data)}\`,
      temperature: 0.3,
      max_tokens: 1200
    });
    return response.analysis;
  }`,
      content_generation: `
  async generateContent(topic, contentType = 'article', tone = 'professional') {
    const response = await this.callLLM({
      prompt: \`Write a \${tone} \${contentType} about: \${topic}\`,
      temperature: 0.7,
      max_tokens: 2000
    });
    return response.content;
  }`,
      customer_service: `
  async handleCustomerQuery(query, context = {}) {
    const response = await this.callLLM({
      prompt: \`Customer query: \${query}\\nContext: \${JSON.stringify(context)}\\nProvide helpful response:\`,
      temperature: 0.4,
      max_tokens: 800
    });
    return response.response;
  }`,
    }

    return methods[capability] || ""
  }

  static async trainAgent(agentId: string, trainingData: any[]): Promise<void> {
    // Implement agent training logic
    // This would involve fine-tuning or providing examples to the agent
    console.log(`Training agent ${agentId} with ${trainingData.length} examples`)
  }

  static async deployAgent(agentId: string, deploymentConfig: Record<string, any>): Promise<string> {
    // Implement agent deployment logic
    // This would deploy the agent to the specified environment
    const endpoint = `https://agents.yourdomain.com/${agentId}`
    console.log(`Deploying agent ${agentId} to ${endpoint}`)
    return endpoint
  }

  static async syncRepository(repositoryId: string): Promise<void> {
    // Implement repository synchronization
    // This would pull latest code and update agent knowledge
    console.log(`Syncing repository ${repositoryId}`)
  }
}

export const AGENT_CATEGORIES = {
  code: {
    name: "Code Assistant",
    description: "Agents specialized in code analysis, generation, and review",
    icon: "Code",
    color: "blue",
  },
  data: {
    name: "Data Analyst",
    description: "Agents for data analysis, visualization, and insights",
    icon: "BarChart",
    color: "green",
  },
  content: {
    name: "Content Creator",
    description: "Agents for content generation, editing, and optimization",
    icon: "FileText",
    color: "purple",
  },
  support: {
    name: "Customer Support",
    description: "Agents for customer service and support automation",
    icon: "MessageCircle",
    color: "orange",
  },
  custom: {
    name: "Custom Agent",
    description: "Build your own specialized AI agent from scratch",
    icon: "Settings",
    color: "gray",
  },
} as const
