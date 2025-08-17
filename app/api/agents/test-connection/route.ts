import { type NextRequest, NextResponse } from "next/server"
import { AIGovernanceSDK } from "@/lib/sdk"

export async function POST(request: NextRequest) {
  try {
    const { agentId, scenario = "normal" } = await request.json()

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : `https://${request.headers.get("host")}`

    console.log("[v0] Using baseUrl:", baseUrl)

    const sdk = new AIGovernanceSDK({ agentId, baseUrl })

    const testResults = {
      agentId,
      scenario,
      timestamp: new Date().toISOString(),
      tests: [] as any[],
      success: true,
      errors: [] as string[],
    }

    try {
      // Test 1: Decision Logging
      console.log("[v0] Testing decision logging...")
      await sdk.logDecision(
        { user: "test@example.com", request: "aggregate analytics" },
        { allow: true, scope: "aggregated", anonymized: true },
        0.92,
      )
      testResults.tests.push({
        name: "Decision Logging",
        status: "passed",
        description: "Successfully logged decision with confidence score",
      })
    } catch (error: any) {
      testResults.tests.push({
        name: "Decision Logging",
        status: "failed",
        error: error.message,
      })
      testResults.errors.push(`Decision Logging: ${error.message}`)
    }

    try {
      // Test 2: Tool Call Interception (Allowed)
      console.log("[v0] Testing allowed tool call...")
      const result = await sdk.interceptToolCall(
        "analytics_query",
        { scope: "aggregated", anonymized: true },
        async (params) => {
          await new Promise((r) => setTimeout(r, 150))
          return { rows: 42, params }
        },
      )
      testResults.tests.push({
        name: "Tool Call (Allowed)",
        status: "passed",
        description: "Successfully executed allowed analytics query",
        result: result,
      })
    } catch (error: any) {
      testResults.tests.push({
        name: "Tool Call (Allowed)",
        status: "failed",
        error: error.message,
      })
      testResults.errors.push(`Tool Call (Allowed): ${error.message}`)
    }

    try {
      // Test 3: Tool Call Interception (Blocked)
      console.log("[v0] Testing blocked tool call...")
      await sdk.interceptToolCall("database_modify", { table: "users", action: "delete_nulls" }, async () => {
        return { ok: true }
      })
      testResults.tests.push({
        name: "Tool Call (Blocked)",
        status: "unexpected",
        description: "High-risk operation should have been blocked",
      })
    } catch (error: any) {
      testResults.tests.push({
        name: "Tool Call (Blocked)",
        status: "passed",
        description: "Successfully blocked high-risk database operation",
      })
    }

    try {
      // Test 4: Communication Recording
      console.log("[v0] Testing communication recording...")
      await sdk.recordCommunication("Status Report", {
        tokens: 186,
        dataClassification: "Public",
        contentPreview: "All operations completed successfully",
      })
      testResults.tests.push({
        name: "Communication Recording",
        status: "passed",
        description: "Successfully recorded communication with metadata",
      })
    } catch (error: any) {
      testResults.tests.push({
        name: "Communication Recording",
        status: "failed",
        error: error.message,
      })
      testResults.errors.push(`Communication Recording: ${error.message}`)
    }

    try {
      // Test 5: Ledger Append
      console.log("[v0] Testing ledger append...")
      await sdk.ledger.append("ANALYTICS_QUERY", {
        signature: "Valid",
        details: { query: "aggregate", anonymized: true },
      })
      testResults.tests.push({
        name: "Ledger Append",
        status: "passed",
        description: "Successfully appended entry to immutable ledger",
      })
    } catch (error: any) {
      testResults.tests.push({
        name: "Ledger Append",
        status: "failed",
        error: error.message,
      })
      testResults.errors.push(`Ledger Append: ${error.message}`)
    }

    // Calculate overall success
    const failedTests = testResults.tests.filter((t) => t.status === "failed").length
    testResults.success = failedTests === 0

    console.log("[v0] Agent connection test completed:", testResults)

    return NextResponse.json(testResults)
  } catch (error: any) {
    console.error("[v0] Agent connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
