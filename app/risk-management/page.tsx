import { RiskAssessmentTable } from "@/components/risk-assessment-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RiskManagementPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Risk Management</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Open Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">12</div>
            <p className="text-sm text-muted-foreground">Requiring immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mitigated Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">85</div>
            <p className="text-sm text-muted-foreground">Successfully addressed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-500">7.2</div>
            <p className="text-sm text-muted-foreground">Current average score (out of 10)</p>
          </CardContent>
        </Card>
      </div>

      <RiskAssessmentTable />
    </div>
  )
}
