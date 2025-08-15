"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Bot, Activity, BarChart3, Rocket, Github, Brain, Zap, Trash2, Edit, ExternalLink } from "lucide-react"

interface Agent {
  id: string
  name: string
  description: string
  agent_type: string
  status: string
  version: string
  capabilities: string[]
  configuration: Record<string, any>
  created_at: string
  updated_at: string
}

interface Repository {
  id: string
  repository_url: string
  repository_type: string
  branch: string
  sync_status: string
  last_sync_at?: string
}

interface Deployment {
  id: string
  environment_name: string
  status: string
  endpoint_url?: string
  deployed_at: string
}

export default function AgentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchAgentDetails()
      fetchRepositories()
      fetchDeployments()
    }
  }, [params.id])

  const fetchAgentDetails = async () => {
    try {
      const response = await fetch(`/api/agents/create?agentId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        const agentData = data.agents.find((a: Agent) => a.id === params.id)
        setAgent(agentData)
      }
    } catch (error) {
      console.error("Error fetching agent details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRepositories = async () => {
    try {
      const response = await fetch(`/api/agents/repositories?agentId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRepositories(data.repositories)
      }
    } catch (error) {
      console.error("Error fetching repositories:", error)
    }
  }

  const fetchDeployments = async () => {
    try {
      const response = await fetch(`/api/agents/deploy?agentId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setDeployments(data.deployments)
      }
    } catch (error) {
      console.error("Error fetching deployments:", error)
    }
  }

  const handleDeploy = () => {
    router.push(`/agents/${params.id}/deploy`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "draft":
        return "bg-yellow-500"
      case "deployed":
        return "bg-blue-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Agent Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested agent could not be found.</p>
            <Button onClick={() => router.push("/agent-management")}>Back to Agents</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.description}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                <span className="text-sm">{getStatusText(agent.status)}</span>
              </div>
              <Badge variant="outline">{agent.agent_type}</Badge>
              <span className="text-sm text-muted-foreground">v{agent.version}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button onClick={handleDeploy} size="sm">
            <Rocket className="w-4 h-4 mr-2" />
            Deploy
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Capabilities</CardTitle>
                <CardDescription>What this agent can do</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((capability) => (
                    <Badge key={capability} variant="secondary">
                      {capability.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Agent settings and parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {Object.entries(agent.configuration).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Github className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">{repositories.length}</div>
                    <div className="text-sm text-muted-foreground">Connected Repos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Rocket className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">{deployments.length}</div>
                    <div className="text-sm text-muted-foreground">Deployments</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">Active</div>
                    <div className="text-sm text-muted-foreground">Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="repositories" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Connected Repositories</h3>
            <Button size="sm">
              <Github className="w-4 h-4 mr-2" />
              Connect Repository
            </Button>
          </div>

          {repositories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Github className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Repositories Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect a repository to enable code analysis and context-aware responses.
                </p>
                <Button>Connect Your First Repository</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {repositories.map((repo) => (
                <Card key={repo.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Github className="w-6 h-6 text-muted-foreground" />
                        <div>
                          <h4 className="font-semibold">{repo.repository_url.split("/").pop()}</h4>
                          <p className="text-sm text-muted-foreground">
                            {repo.repository_type} • {repo.branch} branch
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={repo.sync_status === "synced" ? "default" : "secondary"}>
                          {repo.sync_status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Deployments</h3>
            <Button onClick={handleDeploy} size="sm">
              <Rocket className="w-4 h-4 mr-2" />
              New Deployment
            </Button>
          </div>

          {deployments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Deployments</h3>
                <p className="text-muted-foreground mb-4">Deploy your agent to make it accessible to users.</p>
                <Button onClick={handleDeploy}>Deploy Agent</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {deployments.map((deployment) => (
                <Card key={deployment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{deployment.environment_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Deployed {new Date(deployment.deployed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={deployment.status === "active" ? "default" : "secondary"}>
                          {deployment.status}
                        </Badge>
                        {deployment.endpoint_url && (
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-semibold">1,234</div>
                    <div className="text-sm text-muted-foreground">Total Requests</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">98.5%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="font-semibold">245ms</div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-semibold">$12.34</div>
                    <div className="text-sm text-muted-foreground">Monthly Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>Request volume and performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Analytics chart would be rendered here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Settings</CardTitle>
              <CardDescription>Configure your agent's behavior and parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Auto-scaling</h4>
                    <p className="text-sm text-muted-foreground">Automatically scale based on demand</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Monitoring</h4>
                    <p className="text-sm text-muted-foreground">Health checks and alerting</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Security</h4>
                    <p className="text-sm text-muted-foreground">Access control and authentication</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Delete Agent</h4>
                    <p className="text-sm text-muted-foreground">Permanently delete this agent and all its data</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
