import { addSDKLog } from "../lib/sdk-log-store"

async function addDemoSDKLogs() {
  console.log("[v0] Adding demo SDK logs...")

  try {
    // Add some realistic demo logs
    await addSDKLog({
      timestamp: BigInt(Date.now() - 300000), // 5 minutes ago
      level: "info",
      type: "agent_request",
      agent_id: "financial-analyzer-001",
      payload: {
        action: "analyze_transaction",
        status: "success",
        duration_ms: 1200,
        transaction_id: "txn_123456",
      },
    })

    await addSDKLog({
      timestamp: BigInt(Date.now() - 240000), // 4 minutes ago
      level: "info",
      type: "agent_response",
      agent_id: "financial-analyzer-001",
      payload: {
        action: "generate_report",
        status: "success",
        duration_ms: 800,
        report_type: "risk_assessment",
      },
    })

    await addSDKLog({
      timestamp: BigInt(Date.now() - 180000), // 3 minutes ago
      level: "warn",
      type: "performance_alert",
      agent_id: "compliance-checker-002",
      payload: {
        action: "compliance_scan",
        status: "warning",
        duration_ms: 5500,
        anomaly: true,
        threshold_exceeded: "response_time",
      },
    })

    await addSDKLog({
      timestamp: BigInt(Date.now() - 120000), // 2 minutes ago
      level: "error",
      type: "security_event",
      agent_id: "security-monitor-003",
      payload: {
        action: "access_attempt",
        status: "blocked",
        security_violation: true,
        ip_address: "192.168.1.100",
      },
    })

    await addSDKLog({
      timestamp: BigInt(Date.now() - 60000), // 1 minute ago
      level: "info",
      type: "agent_request",
      agent_id: "data-processor-004",
      payload: {
        action: "process_batch",
        status: "success",
        duration_ms: 2100,
        records_processed: 1500,
      },
    })

    console.log("[v0] Demo SDK logs added successfully!")
  } catch (error) {
    console.error("[v0] Failed to add demo SDK logs:", error)
  }
}

addDemoSDKLogs()
