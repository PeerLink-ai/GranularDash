// Node.js script to simulate an agent using the SDK
// Run with: node --loader ts-node/esm scripts/simulate-agent-sdk.ts
import { AIGovernanceSDK } from "../lib/sdk"

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")

async function main() {
  const agentId = process.env.AGENT_ID || "agent-123"
  const sdk = new AIGovernanceSDK({ agentId, baseUrl: BASE_URL })

  await sdk.logDecision(
    { user: "alice@example.com", request: "aggregate analytics" },
    { allow: true, scope: "aggregated", anonymized: true },
    0.92
  )

  await sdk.interceptToolCall(
    "analytics_query",
    { scope: "aggregated", anonymized: true },
    async (params) => {
      await new Promise((r) => setTimeout(r, 150))
      return { rows: 42, params }
    }
  )

  try {
    await sdk.interceptToolCall(
      "database_modify",
      { table: "users", action: "delete_nulls" },
      async () => {
        return { ok: true }
      }
    )
  } catch {
    console.log("Blocked risky operation as expected.")
  }

  await sdk.recordCommunication("Status Report", {
    tokens: 186,
    dataClassification: "Public",
    contentPreview: "All operations completed successfully",
  })

  await sdk.ledger.append("ANALYTICS_QUERY", {
    signature: "Valid",
    details: { query: "aggregate", anonymized: true },
  })

  console.log("Simulation complete.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
