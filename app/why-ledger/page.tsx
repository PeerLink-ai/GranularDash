import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, ActivitySquare, BarChart3, GitBranch, Lock } from "lucide-react"
import { LedgerVerifier } from "@/components/ledger-verifier"

export default function WhyLedgerPage() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">Why an Immutable Ledger (not just logs)</h1>
        <p className="text-muted-foreground max-w-3xl">
          Traditional databases can be altered. Our ImmutableLedger creates a cryptographically verifiable chain of
          records, so any tampering is immediately detectable. Pair this with predictive anomaly detection to stop
          issues before they become incidents.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="uppercase">
            Tamper-evident
          </Badge>
          <Badge variant="outline" className="uppercase">
            Audit-ready
          </Badge>
          <Badge variant="outline" className="uppercase">
            Preventative
          </Badge>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verifiable Audit Trails
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Each entry links to the prior via a hash. Auditors can recompute these links to verify no tampering has
            occurred.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivitySquare className="h-5 w-5" />
              Predictive Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Low-confidence decisions or risky tool calls (e.g., database_modify) are flagged automatically, with
            contextual details.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Project-based Governance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Link policies to projects/repos and enforce rules consistently across environments and CI/CD pipelines.
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Live Verification</h2>
          <p className="text-muted-foreground text-sm">
            Paste a chain of ledger records below. We recompute the hashes to ensure integrity.
          </p>
          <LedgerVerifier />
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">How it fits Enterprises</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Lock className="h-4 w-4 mt-0.5" /> Zero-trust by default; verification requires no internal trust.
            </li>
            <li className="flex gap-2">
              <GitBranch className="h-4 w-4 mt-0.5" /> Works with your existing repos, CI/CD, and ticketing systems.
            </li>
            <li className="flex gap-2">
              <BarChart3 className="h-4 w-4 mt-0.5" /> Rich reports (GDPR, SOC 2) and read-only Analyst views.
            </li>
          </ul>
        </div>
      </section>
    </main>
  )
}
