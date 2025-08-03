import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  // Mock metrics data
  const metrics = {
    totalRequests: Math.floor(Math.random() * 5000) + 1000,
    requestsToday: Math.floor(Math.random() * 200) + 50,
    successRate: Math.floor(Math.random() * 20) + 80,
    avgResponseTime: Math.floor(Math.random() * 1000) + 200,
    errorRate: Math.floor(Math.random() * 10) + 1,
    uptime: Math.floor(Math.random() * 10) + 90,
    tokensUsed: Math.floor(Math.random() * 100000) + 10000,
    estimatedCost: (Math.random() * 50 + 5).toFixed(2),
    recentLogs: [
      {
        status: "success",
        message: "Chat completion request processed successfully",
        timestamp: "2 minutes ago",
      },
      {
        status: "success",
        message: "Text generation completed",
        timestamp: "5 minutes ago",
      },
      {
        status: "error",
        message: "Rate limit exceeded, request queued",
        timestamp: "12 minutes ago",
      },
      {
        status: "success",
        message: "Code analysis request completed",
        timestamp: "18 minutes ago",
      },
    ],
  }

  return NextResponse.json(metrics)
}
