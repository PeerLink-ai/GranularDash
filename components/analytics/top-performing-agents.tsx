import { CheckCircle2 } from "lucide-react"

const topPerformingAgents = [
  { name: "AI-Finance-001", performance: "99.8% Uptime", efficiency: "+12% ROI" },
  { name: "AI-SupplyChain-005", performance: "99.5% Accuracy", efficiency: "-8% Costs" },
  { name: "AI-HR-002", performance: "98.0% Compliance", efficiency: "+15% Speed" },
  { name: "AI-Legal-003", performance: "97.5% Coverage", efficiency: "+5% Discovery" },
  { name: "AI-Energy-007", performance: "99.9% Stability", efficiency: "+20% Efficiency" },
]

export function TopPerformingAgents() {
  return (
    <div className="space-y-8">
      {topPerformingAgents.map((agent) => (
        <div key={agent.name} className="flex items-center">
          <CheckCircle2 className="mr-2 h-4 w-4 text-muted-foreground" />
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{agent.name}</p>
            <p className="text-sm text-muted-foreground">{agent.performance}</p>
          </div>
          <div className="ml-auto font-medium text-green-500">{agent.efficiency}</div>
        </div>
      ))}
    </div>
  )
}
