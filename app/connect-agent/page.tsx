import ConnectAgentLauncher from "@/components/connect-agent-launcher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConnectAgentDemoPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Agents</h1>
        <p className="text-sm text-muted-foreground">Add a new agent by connecting to your provider endpoint.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Connect</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Launch the guided flow to connect an agent with encrypted key storage, live endpoint checks, and automatic
            audit logging.
          </p>
          <ConnectAgentLauncher />
        </CardContent>
      </Card>
    </main>
  )
}
