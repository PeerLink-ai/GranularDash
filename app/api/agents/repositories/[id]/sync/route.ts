import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { decryptSecret } from "@/lib/crypto"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const repositoryId = params.id

    // Get repository details
    const repositories = await sql<any[]>`
      SELECT ar.*, ca.user_id
      FROM agent_repositories ar
      JOIN created_agents ca ON ar.agent_id = ca.id
      WHERE ar.id = ${repositoryId} AND ca.user_id = ${user.id}
    `

    if (repositories.length === 0) {
      return NextResponse.json(
        {
          error: "Repository not found or access denied",
        },
        { status: 404 },
      )
    }

    const repository = repositories[0]

    // Update sync status
    await sql`
      UPDATE agent_repositories 
      SET sync_status = 'syncing', updated_at = NOW()
      WHERE id = ${repositoryId}
    `

    // Perform repository sync
    const syncResult = await performRepositorySync(repository)

    // Update sync status and timestamp
    await sql`
      UPDATE agent_repositories 
      SET 
        sync_status = ${syncResult.success ? "synced" : "error"},
        last_sync_at = NOW(),
        metadata = ${JSON.stringify({ ...repository.metadata, ...syncResult.metadata })},
        updated_at = NOW()
      WHERE id = ${repositoryId}
    `

    return NextResponse.json({
      message: syncResult.success ? "Repository synced successfully" : "Sync completed with errors",
      result: syncResult,
    })
  } catch (error) {
    console.error("Repository sync error:", error)

    // Update sync status to error
    await sql`
      UPDATE agent_repositories 
      SET sync_status = 'error', updated_at = NOW()
      WHERE id = ${params.id}
    `

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

async function performRepositorySync(repository: any): Promise<{
  success: boolean
  metadata: any
  filesProcessed: number
  errors: string[]
}> {
  const errors: string[] = []
  let filesProcessed = 0

  try {
    // Decrypt access token
    const accessToken = repository.access_token_encrypted ? decryptSecret(repository.access_token_encrypted) : null

    // Get repository contents
    const contents = await fetchRepositoryContents(
      repository.repository_url,
      repository.branch,
      accessToken,
      repository.file_patterns,
      repository.ignore_patterns,
    )

    // Process each file
    for (const file of contents.files) {
      try {
        await processRepositoryFile(repository.agent_id, file)
        filesProcessed++
      } catch (error) {
        errors.push(`Error processing ${file.path}: ${error}`)
      }
    }

    // Store repository analysis
    await storeRepositoryAnalysis(repository.agent_id, repository.id, contents.analysis)

    return {
      success: errors.length === 0,
      metadata: {
        lastSync: new Date().toISOString(),
        filesProcessed,
        totalFiles: contents.files.length,
        languages: contents.analysis.languages,
        structure: contents.analysis.structure,
      },
      filesProcessed,
      errors,
    }
  } catch (error) {
    errors.push(`Sync failed: ${error}`)
    return {
      success: false,
      metadata: {},
      filesProcessed,
      errors,
    }
  }
}

async function fetchRepositoryContents(
  repositoryUrl: string,
  branch: string,
  accessToken: string | null,
  filePatterns: string[],
  ignorePatterns: string[],
): Promise<{
  files: Array<{ path: string; content: string; type: string; size: number }>
  analysis: any
}> {
  // Extract owner and repo from URL
  const match = repositoryUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) {
    throw new Error("Invalid repository URL format")
  }

  const [, owner, repo] = match
  const repoName = repo.replace(".git", "")

  const headers: Record<string, string> = {
    "User-Agent": "AI-Agent-Platform/1.0",
    Accept: "application/vnd.github.v3+json",
  }

  if (accessToken) {
    headers.Authorization = `token ${accessToken}`
  }

  // Get repository tree
  const treeUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${branch}?recursive=1`
  const treeResponse = await fetch(treeUrl, { headers })

  if (!treeResponse.ok) {
    throw new Error(`Failed to fetch repository tree: ${treeResponse.status}`)
  }

  const treeData = await treeResponse.json()
  const files: Array<{ path: string; content: string; type: string; size: number }> = []
  const languages: Record<string, number> = {}
  const structure: Record<string, number> = {}

  // Filter files based on patterns
  const filteredFiles = treeData.tree.filter((item: any) => {
    if (item.type !== "blob") return false

    // Check ignore patterns
    if (ignorePatterns.some((pattern) => matchPattern(item.path, pattern))) {
      return false
    }

    // Check file patterns
    return filePatterns.some((pattern) => matchPattern(item.path, pattern))
  })

  // Fetch file contents (limit to reasonable number)
  const maxFiles = 100
  for (const item of filteredFiles.slice(0, maxFiles)) {
    try {
      const fileResponse = await fetch(item.url, { headers })
      if (fileResponse.ok) {
        const fileData = await fileResponse.json()
        if (fileData.encoding === "base64" && fileData.size < 100000) {
          // Only process files under 100KB
          const content = Buffer.from(fileData.content, "base64").toString("utf-8")
          files.push({
            path: item.path,
            content,
            type: getFileType(item.path),
            size: fileData.size,
          })

          // Track languages and structure
          const ext = item.path.split(".").pop()?.toLowerCase()
          if (ext) {
            languages[ext] = (languages[ext] || 0) + 1
          }

          const dir = item.path.split("/")[0]
          structure[dir] = (structure[dir] || 0) + 1
        }
      }
    } catch (error) {
      console.error(`Error fetching file ${item.path}:`, error)
    }
  }

  return {
    files,
    analysis: {
      languages,
      structure,
      totalFiles: filteredFiles.length,
      processedFiles: files.length,
    },
  }
}

function matchPattern(path: string, pattern: string): boolean {
  // Simple glob pattern matching
  const regex = pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]")
  return new RegExp(`^${regex}$`).test(path)
}

function getFileType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase()
  const typeMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    md: "markdown",
    txt: "text",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
  }
  return typeMap[ext || ""] || "unknown"
}

async function processRepositoryFile(
  agentId: string,
  file: { path: string; content: string; type: string; size: number },
): Promise<void> {
  // Store file content and analysis for the agent
  await sql`
    INSERT INTO agent_training_data (
      agent_id,
      data_type,
      input_data,
      source,
      created_at
    ) VALUES (
      ${agentId},
      'repository_file',
      ${JSON.stringify({
        path: file.path,
        content: file.content,
        type: file.type,
        size: file.size,
        analysis: analyzeFileContent(file.content, file.type),
      })},
      'repository',
      NOW()
    )
    ON CONFLICT (agent_id, data_type, input_data) 
    DO UPDATE SET created_at = NOW()
  `
}

function analyzeFileContent(content: string, type: string): any {
  const analysis: any = {
    lines: content.split("\n").length,
    characters: content.length,
    words: content.split(/\s+/).length,
  }

  if (type === "javascript" || type === "typescript") {
    analysis.functions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length
    analysis.classes = (content.match(/class\s+\w+/g) || []).length
    analysis.imports = (content.match(/import\s+.*from|require\s*\(/g) || []).length
  } else if (type === "python") {
    analysis.functions = (content.match(/def\s+\w+/g) || []).length
    analysis.classes = (content.match(/class\s+\w+/g) || []).length
    analysis.imports = (content.match(/import\s+|from\s+.*import/g) || []).length
  }

  return analysis
}

async function storeRepositoryAnalysis(agentId: string, repositoryId: string, analysis: any): Promise<void> {
  await sql`
    UPDATE agent_repositories 
    SET metadata = metadata || ${JSON.stringify({ analysis })}
    WHERE id = ${repositoryId}
  `
}
