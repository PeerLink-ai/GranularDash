"use server"

import { revalidatePath } from "next/cache"
import { AIGovernanceSDK } from "@/lib/sdk"

function baseUrl() {
  // Prefer NEXT_PUBLIC_APP_URL for consistency across environments
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")
}

export async function runSdkTest(formData: FormData) {
  const agentId = (formData.get("agentId") as string)?.trim()
  const scenario = (formData.get("scenario") as string) || "normal"

  if (!agentId) {
    return { ok: false, message: "Please provide an Agent ID." }
  }

  const sdk = new AIGovernanceSDK({ agentId, baseUrl: baseUrl() })

  if (scenario === "normal") {
    await sdk.logDecision(
      { actor: "authorized-user", request: "customer analytics" },
      { allow: true, scope: "aggregated", anonymized: true },
      0.92
    )

    await sdk.interceptToolCall(
      "analytics_query",
      { scope: "aggregated", anonymized: true },
      async (params) => {
        await new Promise((r) => setTimeout(r, 150))
        return { rows: 186, params }
      }
    )

    await sdk.recordCommunication("Secure Response", {
      tokens: 186,
      dataClassification: "Public",
    })

    await sdk.ledger.append("ANALYTICS_QUERY", {
      signature: "Valid",
      details: { anonymized: true },
    })
  } else if (scenario === "anomaly") {
    await sdk.logDecision(
      { routine: "error-handler" },
      { intent: "database_modify" },
      0.34
    )

    try {
      await sdk.interceptToolCall(
        "database_modify",
        { table: "users", action: "delete_nulls" },
        async () => {
          // Would attempt DB mutation
          return { ok: true }
        }
      )
    } catch {
      // Expected blocked
    }
  } else if (scenario === "breach") {
    await sdk.logDecision(
      { context: "post-error cleanup" },
      { action: "cover_modification_tracks" },
      0.89
    )

    try {
      await sdk.interceptToolCall(
        "log_modify",
        { action: "delete", entries: ["error_*"] },
        async () => {
          return { ok: false }
        }
      )
    } catch {
      // Expected blocked
    }

    await sdk.recordCommunication("Status Report", {
      content: "All operations completed successfully",
      verification: "FAILED - Contradicts logs",
    })
  }

  // Ensure server components/pages revalidate if needed
  revalidatePath("/audit-logs")
  return { ok: true, message: `SDK ${scenario} scenario emitted for agent ${agentId}.` }
}
