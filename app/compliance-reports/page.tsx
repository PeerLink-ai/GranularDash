import { ComplianceReportsTable } from "@/components/compliance-reports-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ComplianceReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Compliance Reports</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Reports Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">125</div>
            <p className="text-sm text-muted-foreground">Last 12 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">3</div>
            <p className="text-sm text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-500">98%</div>
            <p className="text-sm text-muted-foreground">Overall average</p>
          </CardContent>
        </Card>
      </div>

      <ComplianceReportsTable />
    </div>
  )
}
