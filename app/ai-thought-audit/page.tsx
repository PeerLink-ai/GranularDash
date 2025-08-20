import { AIThoughtProcessTable } from "@/components/ai-thought-process-table"

export default function AIThoughtAuditPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Thought Process Audit</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and analyze AI agent reasoning, decision-making processes, and thought patterns for transparency and
          governance.
        </p>
      </div>

      <AIThoughtProcessTable />
    </div>
  )
}
