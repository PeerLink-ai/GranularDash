export interface RepositoryConnection {
  id: string
  agent_id: string
  repository_url: string
  repository_type: "github" | "gitlab" | "bitbucket" | "custom"
  branch: string
  access_token_encrypted?: string
  webhook_secret_encrypted?: string
  sync_status: "pending" | "connected" | "syncing" | "synced" | "error"
  last_sync_at?: string
  sync_frequency: "on_push" | "hourly" | "daily" | "manual"
  file_patterns: string[]
  ignore_patterns: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface RepositoryFile {
  path: string
  content: string
  type: string
  size: number
  lastModified: string
  sha: string
}

export interface RepositoryAnalysis {
  languages: Record<string, number>
  structure: Record<string, number>
  totalFiles: number
  processedFiles: number
  complexity: {
    cyclomatic: number
    cognitive: number
    maintainability: number
  }
  dependencies: string[]
  patterns: string[]
  issues: Array<{
    type: "warning" | "error" | "info"
    message: string
    file: string
    line?: number
  }>
}

export class RepositoryManager {
  static async connectRepository(
    agentId: string,
    repositoryUrl: string,
    options: {
      repositoryType?: string
      branch?: string
      accessToken?: string
      syncFrequency?: string
      filePatterns?: string[]
      ignorePatterns?: string[]
    } = {},
  ): Promise<RepositoryConnection> {
    const {
      repositoryType = "github",
      branch = "main",
      accessToken,
      syncFrequency = "on_push",
      filePatterns = ["**/*.js", "**/*.ts", "**/*.py", "**/*.md"],
      ignorePatterns = [".git/**", "node_modules/**", "*.log"],
    } = options

    // Validate repository access
    const accessTest = await this.testRepositoryAccess(repositoryUrl, repositoryType, accessToken)
    if (!accessTest.success) {
      throw new Error(`Repository access failed: ${accessTest.error}`)
    }

    // Create repository connection (this would call the API)
    const response = await fetch("/api/agents/repositories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        repositoryUrl,
        repositoryType,
        branch,
        accessToken,
        syncFrequency,
        filePatterns,
        ignorePatterns,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to connect repository")
    }

    const { repository } = await response.json()
    return repository
  }

  static async syncRepository(repositoryId: string): Promise<{
    success: boolean
    filesProcessed: number
    errors: string[]
  }> {
    const response = await fetch(`/api/agents/repositories/${repositoryId}/sync`, {
      method: "POST",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to sync repository")
    }

    const { result } = await response.json()
    return result
  }

  static async analyzeRepository(repositoryId: string): Promise<RepositoryAnalysis> {
    const response = await fetch(`/api/agents/repositories/${repositoryId}/analyze`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to analyze repository")
    }

    const { analysis } = await response.json()
    return analysis
  }

  static async getRepositoryFiles(repositoryId: string, path = "", includeContent = false): Promise<RepositoryFile[]> {
    const params = new URLSearchParams({
      path,
      includeContent: includeContent.toString(),
    })

    const response = await fetch(`/api/agents/repositories/${repositoryId}/files?${params}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get repository files")
    }

    const { files } = await response.json()
    return files
  }

  static async searchRepository(
    repositoryId: string,
    query: string,
    options: {
      fileTypes?: string[]
      maxResults?: number
      includeContent?: boolean
    } = {},
  ): Promise<Array<{ file: RepositoryFile; matches: Array<{ line: number; content: string }> }>> {
    const { fileTypes = [], maxResults = 50, includeContent = true } = options

    const params = new URLSearchParams({
      query,
      fileTypes: fileTypes.join(","),
      maxResults: maxResults.toString(),
      includeContent: includeContent.toString(),
    })

    const response = await fetch(`/api/agents/repositories/${repositoryId}/search?${params}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to search repository")
    }

    const { results } = await response.json()
    return results
  }

  static async setupWebhook(
    repositoryId: string,
    webhookUrl: string,
  ): Promise<{ success: boolean; webhookId: string }> {
    const response = await fetch(`/api/agents/repositories/${repositoryId}/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to setup webhook")
    }

    return await response.json()
  }

  private static async testRepositoryAccess(
    url: string,
    type: string,
    token?: string,
  ): Promise<{ success: boolean; error?: string; metadata?: any }> {
    try {
      // This would be implemented based on the repository type
      if (type === "github") {
        return await this.testGitHubAccess(url, token)
      } else if (type === "gitlab") {
        return await this.testGitLabAccess(url, token)
      } else {
        return { success: false, error: "Unsupported repository type" }
      }
    } catch (error) {
      return { success: false, error: `Access test failed: ${error}` }
    }
  }

  private static async testGitHubAccess(
    url: string,
    token?: string,
  ): Promise<{ success: boolean; error?: string; metadata?: any }> {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return { success: false, error: "Invalid GitHub URL format" }
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
  }

  private static async testGitLabAccess(
    url: string,
    token?: string,
  ): Promise<{ success: boolean; error?: string; metadata?: any }> {
    // Implement GitLab access testing
    return { success: false, error: "GitLab integration not yet implemented" }
  }
}

export const SUPPORTED_LANGUAGES = {
  javascript: { extensions: [".js", ".jsx"], icon: "FileCode", color: "yellow" },
  typescript: { extensions: [".ts", ".tsx"], icon: "FileCode", color: "blue" },
  python: { extensions: [".py"], icon: "FileCode", color: "green" },
  java: { extensions: [".java"], icon: "FileCode", color: "red" },
  cpp: { extensions: [".cpp", ".cc", ".cxx"], icon: "FileCode", color: "purple" },
  c: { extensions: [".c"], icon: "FileCode", color: "gray" },
  csharp: { extensions: [".cs"], icon: "FileCode", color: "purple" },
  php: { extensions: [".php"], icon: "FileCode", color: "indigo" },
  ruby: { extensions: [".rb"], icon: "FileCode", color: "red" },
  go: { extensions: [".go"], icon: "FileCode", color: "cyan" },
  rust: { extensions: [".rs"], icon: "FileCode", color: "orange" },
  markdown: { extensions: [".md", ".markdown"], icon: "FileText", color: "gray" },
  json: { extensions: [".json"], icon: "FileCode", color: "yellow" },
  yaml: { extensions: [".yml", ".yaml"], icon: "FileCode", color: "red" },
  xml: { extensions: [".xml"], icon: "FileCode", color: "orange" },
  html: { extensions: [".html", ".htm"], icon: "FileCode", color: "orange" },
  css: { extensions: [".css"], icon: "FileCode", color: "blue" },
  scss: { extensions: [".scss", ".sass"], icon: "FileCode", color: "pink" },
} as const
