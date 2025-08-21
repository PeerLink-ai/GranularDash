import { type NextRequest, NextResponse } from "next/server"
import { getSDKLogs, addSDKLog, clearSDKLogs } from "@/lib/sdk-log-store"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const options = {
      limit: Number.parseInt(searchParams.get("limit") || "50"),
      offset: Number.parseInt(searchParams.get("offset") || "0"),
      level: searchParams.get("level") || undefined,
      userId: searchParams.get("userId") || undefined,
      agentId: searchParams.get("agentId") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      organization: user.organization,
    }

    const result = await getSDKLogs(options)

    return NextResponse.json({
      success: true,
      data: result.logs,
      total: result.total,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        hasMore: result.total > options.offset + options.limit,
      },
    })
  } catch (error: any) {
    console.error("GET /api/sdk/log error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch logs",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const log = await addSDKLog({
      level: body.level || "info",
      message: body.message || "No message provided",
      metadata: body.metadata || {},
      user_id: body.user_id,
      agent_id: body.agent_id,
      action: body.action,
      resource: body.resource,
      status: body.status,
      duration_ms: body.duration_ms,
      error_code: body.error_code,
      user_agent: body.user_agent || request.headers.get("user-agent"),
      organization: user.organization,
    })

    return NextResponse.json({
      success: true,
      data: log,
    })
  } catch (error: any) {
    console.error("POST /api/sdk/log error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create log",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await clearSDKLogs(user.organization)

    return NextResponse.json({
      success: true,
      message: "All logs cleared successfully",
    })
  } catch (error: any) {
    console.error("DELETE /api/sdk/log error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to clear logs",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
