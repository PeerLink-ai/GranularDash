import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, AlertTriangle, FileText, TrendingUp } from "lucide-react"

const cards = [
  {
    title: "Policy Adherence",
    icon: ShieldCheck,
    amount: "98.5%",
    description: "+1.2% from last month",
    trend: "up",
  },
  {
    title: "Active Alerts",
    icon: AlertTriangle,
    amount: "12",
    description: "-3 from last month",
    trend: "down",
  },
  {
    title: "Audit Readiness Score",
    icon: FileText,
    amount: "92/100",
    description: "+5 points from last month",
    trend: "up",
  },
  {
    title: "Agent Deployment Rate",
    icon: TrendingUp,
    amount: "15%",
    description: "+3% from last month",
    trend: "up",
  },
]

export function GovernanceOverviewCards() {
  return (
    <>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.amount}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
            <div
              className={`mt-2 flex items-center text-xs ${card.trend === "up" ? "text-green-500" : "text-red-500"}`}
            >
              {card.trend === "up" ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingUp className="mr-1 h-3 w-3 transform rotate-180" />
              )}
              {card.description.split(" ")[0]}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
