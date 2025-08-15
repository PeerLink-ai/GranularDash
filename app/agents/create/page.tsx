"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Bot,
  Code,
  BarChart3,
  FileText,
  MessageCircle,
  Settings,
  ArrowRight,
  ArrowLeft,
  Check,
  Github,
  Zap,
} from "lucide-react"

interface AgentTemplate {
  id: string
  name: string
  description: string
  category: string
  capabilities: string[]
  template_config: Record<string, any>
  code_template: string
}

interface AIModel {
  id: string
  name: string
  description: string
  model_type: string
  provider_name: string
  input_cost_per_token: number
  output_cost_per_token: number
}

const CATEGORY_ICONS = {
  code: Code,
  data: BarChart3,
  content: FileText,
  support: MessageCircle,
  custom: Settings,
}

const CATEGORY_COLORS = {
  code: "bg-blue-500",
  data: "bg-green-500",
  content: "bg-purple-500",
  support: "bg-orange-500",
  custom: "bg-gray-500",
}

export default function CreateAgentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [templates, setTemplates] = useState<AgentTemplate[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1: Template Selection
    templateId: "",

    // Step 2: Basic Configuration
    name: "",
    description: "",
    agentType: "",

    // Step 3: AI Model Configuration
    modelId: "",
    modelConfig: {
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1.0,
    },
    systemPrompt: "",

    // Step 4: Repository Integration (Optional)
    repositoryUrl: "",
    repositoryType: "github",
    branch: "main",
    accessToken: "",

    // Step 5: Capabilities & Features
    capabilities: [] as string[],
    customCapabilities: "",
  })

  const steps = [
    { title: "Choose Template", description: "Select an agent template" },
    { title: "Basic Info", description: "Configure basic settings" },
    { title: "AI Model", description: "Select and configure AI model" },
    { title: "Repository", description: "Connect to code repository" },
    { title: "Capabilities", description: "Define agent capabilities" },
    { title: "Review", description: "Review and create agent" },
  ]

  useEffect(() => {
    fetchTemplates()
    fetchModels()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/agents/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/agents/models")
      if (response.ok) {
        const data = await response.json()
        setModels(data.models)
      }
    } catch (error) {
      console.error("Error fetching models:", error)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleTemplateSelect = (template: AgentTemplate) => {
    setFormData((prev) => ({
      ...prev,
      templateId: template.id,
      agentType: template.category,
      capabilities: template.capabilities,
      systemPrompt: `You are a ${template.name}. ${template.description}`,
    }))
  }

  const handleCreateAgent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          templateId: formData.templateId,
          agentType: formData.agentType,
          configuration: formData.modelConfig,
          capabilities: formData.capabilities,
          repositoryUrl: formData.repositoryUrl || undefined,
          repositoryType: formData.repositoryType,
          branch: formData.branch,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create agent")
      }

      const { agent } = await response.json()

      // Configure AI model if selected
      if (formData.modelId) {
        await fetch("/api/agents/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: agent.id,
            modelId: formData.modelId,
            configuration: formData.modelConfig,
            systemPrompt: formData.systemPrompt,
          }),
        })
      }

      toast({
        title: "Agent Created Successfully",
        description: `${formData.name} has been created and is ready for deployment.`,
      })

      router.push(`/agents/${agent.id}`)
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create agent",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTemplate = templates.find((t) => t.id === formData.templateId)
  const selectedModel = models.find((m) => m.id === formData.modelId)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Agent</h1>
          <p className="text-muted-foreground">Build and deploy your custom AI agent</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="mb-4" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step, index) => (
              <div key={index} className={`flex flex-col items-center ${index <= currentStep ? "text-primary" : ""}`}>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted"
                  }`}
                >
                  {index < currentStep ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <span className="text-center">{step.title}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Template Selection */}
          {currentStep === 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => {
                const Icon = CATEGORY_ICONS[template.category as keyof typeof CATEGORY_ICONS] || Settings
                const colorClass = CATEGORY_COLORS[template.category as keyof typeof CATEGORY_COLORS] || "bg-gray-500"

                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.templateId === template.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg ${colorClass} text-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">{template.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {template.capabilities.slice(0, 3).map((capability) => (
                              <Badge key={capability} variant="secondary" className="text-xs">
                                {capability.replace(/_/g, " ")}
                              </Badge>
                            ))}
                            {template.capabilities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.capabilities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Step 2: Basic Configuration */}
          {currentStep === 1 && (
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="My AI Assistant"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this agent does..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {selectedTemplate && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-lg ${CATEGORY_COLORS[selectedTemplate.category as keyof typeof CATEGORY_COLORS]} text-white`}
                      >
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{selectedTemplate.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: AI Model Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-2">
                <Label>Select AI Model</Label>
                <div className="grid gap-3">
                  {models.map((model) => (
                    <Card
                      key={model.id}
                      className={`cursor-pointer transition-all hover:shadow-sm ${
                        formData.modelId === model.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, modelId: model.id }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{model.name}</h4>
                            <p className="text-sm text-muted-foreground">{model.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span>Provider: {model.provider_name}</span>
                              <span>Type: {model.model_type}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              <div>Input: ${model.input_cost_per_token.toFixed(6)}/token</div>
                              <div>Output: ${model.output_cost_per_token.toFixed(6)}/token</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {formData.modelId && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Model Configuration</h4>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Temperature</Label>
                      <Input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={formData.modelConfig.temperature}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            modelConfig: { ...prev.modelConfig, temperature: Number.parseFloat(e.target.value) },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Tokens</Label>
                      <Input
                        type="number"
                        min="1"
                        max="4000"
                        value={formData.modelConfig.max_tokens}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            modelConfig: { ...prev.modelConfig, max_tokens: Number.parseInt(e.target.value) },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Top P</Label>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.modelConfig.top_p}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            modelConfig: { ...prev.modelConfig, top_p: Number.parseFloat(e.target.value) },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>System Prompt</Label>
                    <Textarea
                      placeholder="You are a helpful AI assistant..."
                      value={formData.systemPrompt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Repository Integration */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Github className="w-4 h-4" />
                <span>Connect your agent to a code repository (optional)</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Repository URL</Label>
                  <Input
                    placeholder="https://github.com/username/repository"
                    value={formData.repositoryUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, repositoryUrl: e.target.value }))}
                  />
                </div>

                {formData.repositoryUrl && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Repository Type</Label>
                        <Select
                          value={formData.repositoryType}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, repositoryType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="github">GitHub</SelectItem>
                            <SelectItem value="gitlab">GitLab</SelectItem>
                            <SelectItem value="bitbucket">Bitbucket</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Branch</Label>
                        <Input
                          value={formData.branch}
                          onChange={(e) => setFormData((prev) => ({ ...prev, branch: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Access Token (Optional)</Label>
                      <Input
                        type="password"
                        placeholder="For private repositories"
                        value={formData.accessToken}
                        onChange={(e) => setFormData((prev) => ({ ...prev, accessToken: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Capabilities */}
          {currentStep === 4 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="font-semibold mb-4">Agent Capabilities</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {selectedTemplate?.capabilities.map((capability) => (
                    <div key={capability} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={capability}
                        checked={formData.capabilities.includes(capability)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              capabilities: [...prev.capabilities, capability],
                            }))
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              capabilities: prev.capabilities.filter((c) => c !== capability),
                            }))
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={capability} className="text-sm">
                        {capability.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Custom Capabilities</Label>
                <Textarea
                  placeholder="Describe any additional capabilities..."
                  value={formData.customCapabilities}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customCapabilities: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h4 className="font-semibold">Review Your Agent Configuration</h4>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <strong>Name:</strong> {formData.name}
                    </div>
                    <div>
                      <strong>Type:</strong> {formData.agentType}
                    </div>
                    <div>
                      <strong>Template:</strong> {selectedTemplate?.name}
                    </div>
                    <div>
                      <strong>Description:</strong> {formData.description}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Model</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <strong>Model:</strong> {selectedModel?.name}
                    </div>
                    <div>
                      <strong>Provider:</strong> {selectedModel?.provider_name}
                    </div>
                    <div>
                      <strong>Temperature:</strong> {formData.modelConfig.temperature}
                    </div>
                    <div>
                      <strong>Max Tokens:</strong> {formData.modelConfig.max_tokens}
                    </div>
                  </CardContent>
                </Card>

                {formData.repositoryUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Repository</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <strong>URL:</strong> {formData.repositoryUrl}
                      </div>
                      <div>
                        <strong>Type:</strong> {formData.repositoryType}
                      </div>
                      <div>
                        <strong>Branch:</strong> {formData.branch}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {formData.capabilities.map((capability) => (
                        <Badge key={capability} variant="secondary">
                          {capability.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 0 && !formData.templateId) ||
              (currentStep === 1 && (!formData.name || !formData.description)) ||
              (currentStep === 2 && !formData.modelId)
            }
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleCreateAgent} disabled={isLoading || !formData.name || !formData.templateId}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Create Agent
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
