import { TrainingSimulationList } from "@/components/training-simulation-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TrainingSimulationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Training & Simulation</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">15</div>
            <p className="text-sm text-muted-foreground">Available for agents & staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed Simulations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">8</div>
            <p className="text-sm text-muted-foreground">Last 6 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-500">88%</div>
            <p className="text-sm text-muted-foreground">Across all completed trainings</p>
          </CardContent>
        </Card>
      </div>

      <TrainingSimulationList />
    </div>
  )
}
