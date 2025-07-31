import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IncidentDashboard } from "@/components/incident-dashboard" // Assuming IncidentDashboard exists and is correct

export default function IncidentResponsePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Incident Response</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Open Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">7</div>
            <p className="text-sm text-muted-foreground">Currently active incidents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resolved Incidents (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">23</div>
            <p className="text-sm text-muted-foreground">Successfully closed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Resolution Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">4h 30m</div>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <IncidentDashboard />
    </div>
  )
}
