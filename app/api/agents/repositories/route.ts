import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { encryptSecret } from "@/lib/crypto"
import { addAuditLog } from "@/lib/audit-store"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      agentId,
      repositoryUrl,
      repositoryType = "github",
      branch = "main",
      accessToken,
      syncFrequency = "on_push",
      filePatterns = ["**/*.js", "**/*.ts", "**/*.py", "**/*.md"],
      ignorePatterns = [".git/**", "node_modules/**", "*.log"],
    } = await req.json()

    // Validate required fields
    if (!agentId || !repositoryUrl) {
      return NextResponse.json(
        {
          error: "Agent ID and repository URL are required",
        },
        { status: 400 },
      )
    }

    // Verify agent exists and belongs to user
    const agents = await sql<any[]>`
      SELECT id FROM created_agents WHERE id = ${agentId} AND user_id = ${user.id}
    `
    if (agents.length === 0) {
      return NextResponse.json(
        {
          error: "Agent not found or access denied",
        },
        { status: 404 },
      )
    }

    // Validate repository URL
    if (!isValidRepositoryUrl(repositoryUrl)) {
      return NextResponse.json(
        {
          error: "Invalid repository URL",
        },
        { status: 400 },
      )
    }

    // Check if repository is already connected to this agent
    const existing = await sql<any[]>`
      SELECT id FROM agent_repositories 
      WHERE agent_id = ${agentId} AND repository_url = ${repositoryUrl}
    `
    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: "Repository already connected to this agent",
        },
        { status: 409 },
      )
    }

    // Encrypt access token if provided
    const encryptedToken = accessToken ? encryptSecret(accessToken) : null

    // Test repository access
    const accessTest = await testRepositoryAccess(repositoryUrl, repositoryType, accessToken)
    if (!accessTest.success) {
      return NextResponse.json(
        {
          error: `Repository access failed: ${accessTest.error}`,
        },
        { status: 400 },
      )
    }

    // Create repository connection
    const [repository] = await sql<any[]>`
      INSERT INTO agent_repositories (
        agent_id,
        repository_url,
        repository_type,
        branch,
        access_token_encrypted,
        sync_frequency,
        file_patterns,
        ignore_patterns,
        sync_status,
        metadata
      ) VALUES (
        ${agentId},
        ${repositoryUrl},
        ${repositoryType},
        ${branch},
        ${encryptedToken},
        ${syncFrequency},
        ${JSON.stringify(filePatterns)},
        ${JSON.stringify(ignorePatterns)},
        'connected',
        ${JSON.stringify(accessTest.metadata)}
      )
      RETURNING *
    `

    // Start initial sync
    await initiateRepositorySync(repository.id)

    // Log the connection
    await addAuditLog({
      userId: user.id,
      organization: user.organization,
      action: "repository_connected",
      resourceType: "agent_repository",
      resourceId: repository.id,
      details: {
        agentId,
        repositoryUrl,
        repositoryType,
        branch,
        syncFrequency,
      },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    })

    return NextResponse.json(
      {
        message: "Repository connected successfully",
        repository,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Repository connection error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get("agentId")

    let query = `
      SELECT 
        ar.*,
        ca.name as agent_name,
        ca.agent_type
      FROM agent_repositories ar
      JOIN created_agents ca ON ar.agent_id = ca.id
      WHERE ca.user_id = $1
    `

    const params = [user.id]
    if (agentId) {
      query += ` AND ar.agent_id = $2`
      params.push(agentId)
    }

    query += ` ORDER BY ar.created_at DESC`

    const repositories = await sql<any[]>`${query}`

    return NextResponse.json({ repositories })
  } catch (error) {
    console.error("Get repositories error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

function isValidRepositoryUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const validHosts = ["github.com", "gitlab.com", "bitbucket.org"]
    return validHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

async function testRepositoryAccess(
  url: string,
  type: string,
  token?: string,
): Promise<{ success: boolean; error?: string; metadata?: any }> {
  try {
    // Extract owner and repo from URL
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return { success: false, error: "Invalid repository URL format" }
    }

    const [, owner, repo] = match
    const apiUrl = `https://api.github.com/repos/${owner}/${repo.replace(".git", "")}`

    const headers: Record<string, string> = {
      "User-Agent": "AI-Agent-Platform/1.0",
    }

    if (token) {
      headers.Authorization = `token ${token}`
    }

    const response = await fetch(apiUrl, { headers })

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Repository not found or access denied" }
      }
      if (response.status === 401) {
        return { success: false, error: "Invalid access token" }
      }
      return { success: false, error: `API error: ${response.status}` }
    }

    const repoData = await response.json()
    return {
      success: true,
      metadata: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        defaultBranch: repoData.default_branch,
        private: repoData.private,
      },
    }
  } catch (error) {
    return { success: false, error: `Connection failed: ${error}` }
  }
}

async function initiateRepositorySync(repositoryId: string): Promise<void> {
  // Queue repository sync job
  console.log(`Initiating sync for repository ${repositoryId}`)
  // This would typically queue a background job
}
