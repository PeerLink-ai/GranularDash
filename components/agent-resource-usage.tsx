import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const agentResourceUsage = [
  { name: "AI-Finance-001", cpu: 75, memory: 60, apiCalls: 12000 },
  { name: "AI-SupplyChain-005", cpu: 40, memory: 80, apiCalls: 8500 },
  { name: "AI-HR-002", cpu: 55, memory: 45, apiCalls: 3000 },
  { name: "AI-Legal-003", cpu: 90, memory: 70, apiCalls: 15000 },
]

export function AgentResourceUsage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Resource Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agentResourceUsage.map((agent) => (
            <div key={agent.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{agent.name}</span>
                <span className="text-sm text-muted-foreground">API Calls: {agent.apiCalls.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CPU Usage</p>
                  <Progress value={agent.cpu} className="h-1.5" />
                  <p className="text-xs text-right text-muted-foreground mt-1">{agent.cpu}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Memory Usage</p>
                  <Progress value={agent.memory} className="h-1.5" />
                  <p className="text-xs text-right text-muted-foreground mt-1">{agent.memory}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
