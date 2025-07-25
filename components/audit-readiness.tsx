import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

const auditReadinessItems = [
  { name: "GDPR Compliance", current: 85, target: 100 },
  { name: "SOC 2 Readiness", current: 70, target: 90 },
  { name: "Internal Audit Prep", current: 95, target: 100 },
]

export function AuditReadiness() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">Audit Readiness</CardTitle>
        <Button variant="outline" size="icon">
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Add new audit goal</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditReadinessItems.map((goal) => {
            const percentage = (goal.current / goal.target) * 100
            return (
              <div key={goal.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{goal.name}</span>
                  <span>
                    {goal.current}% / {goal.target}%
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-xs text-right text-muted-foreground">{percentage.toFixed(1)}% complete</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
