"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ShieldCheck, AlertTriangle, Link2, Hash } from "lucide-react"

type LedgerRecord = {
  index: number
  timestamp: number
  agentId: string
  action: string
  data: any
  prevHash: string
  hash: string
}

export function LedgerVerifier() {
  const [input, setInput] = React.useState("")
  const [result, setResult] = React.useState<null | { valid: boolean; errors: string[]; length: number }>(null)
  const [loading, setLoading] = React.useState(false)

  const example = React.useMemo(
    () =>
      JSON.stringify(
        [
          {
            index: 1,
            timestamp: Date.now() - 30000,
            agentId: "agent-123",
            action: "DECISION",
            data: { context: { task: "summarize" }, decision: { tool: "read" }, confidence: 0.87 },
            prevHash: "GENESIS",
            hash: "will-be-validated",
          },
          {
            index: 2,
            timestamp: Date.now() - 20000,
            agentId: "agent-123",
            action: "TOOL_CALL",
            data: { tool: "database_modify", params: { table: "logs", op: "update" } },
            prevHash: "hash-of-1",
            hash: "will-be-validated",
          },
        ],
        null,
        2,
      ),
    [],
  )

  async function verify() {
    setLoading(true)
    try {
      const parsed = JSON.parse(input) as LedgerRecord[]
      const res = await fetch("/api/ledger/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: parsed }),
      })
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setResult({ valid: false, errors: ["Invalid JSON or server error"], length: 0 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Ledger Verifier</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paste ImmutableLedger records to validate prevHash → hash chain integrity.
          </p>
        </div>
        {result && (
          <Badge variant={result.valid ? "default" : "destructive"} className="uppercase">
            {result.valid ? "Valid chain" : "Invalid chain"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Records JSON</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your ledger records JSON array here..."
            className="min-h-40 font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setInput(example)}>
              Load Example
            </Button>
            <Button onClick={verify} disabled={loading || !input.trim()}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="rounded-md border p-4">
            <div className="flex items-center gap-2">
              {result.valid ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <p className="font-medium">
                {result.valid
                  ? "Chain verified. Hash links are consistent and tamper-evident."
                  : "Chain invalid. One or more links are broken or altered."}
              </p>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span>{`Links checked: ${result.length}`}</span>
              </div>
              {result.errors.length > 0 && (
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span className="font-medium">Issues</span>
                  </div>
                  <ul className="list-disc pl-6">
                    {result.errors.map((err, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-md bg-muted/50 p-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-semibold">Tip</span>
          </div>
          <p className="mt-1 text-muted-foreground">
            For audits, export your ledger records and attach this verification output as evidence of tamper-proof logs.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
