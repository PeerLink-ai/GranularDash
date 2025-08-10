import { NextResponse } from "next/server"

// Lightweight repo scanner using GitHub API; no clone required.
// Scans up to MAX_FILES files to detect "agents" by heuristic matches.
const MAX_FILES = 250
const MAX_DEPTH = 4

type ScanResult = {
  repo: { owner: string; repo: string; branch: string; default_branch?: string }
  detectedAgents: Array<{
    name: string
    path: string
    id?: string
    provider?: string
    model?: string
    endpoint?: string
    metadata?: Record<string, any>
  }>
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const repoUrl: string | undefined = body.repo_url
    const branch: string | undefined = body.branch || "main"

    if (!repoUrl) {
      return NextResponse.json({ error: "repo_url is required" }, { status: 400 })
    }

    const parsed = parseGitHubUrl(repoUrl)
    if (!parsed) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
    }

    // Basic repo validation
    const repoRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`)
    if (!repoRes.ok) {
      return NextResponse.json({ error: `Repository not accessible (${repoRes.status})` }, { status: 400 })
    }
    const repoData = await repoRes.json()

    const detectedAgents = await scanRepoForAgents(parsed.owner, parsed.repo, branch)

    const payload: ScanResult = {
      repo: { owner: parsed.owner, repo: parsed.repo, branch, default_branch: repoData.default_branch },
      detectedAgents,
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    if (u.hostname !== "github.com") return null
    const parts = u.pathname.split("/").filter(Boolean)
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") }
  } catch {
    return null
  }
}

async function scanRepoForAgents(owner: string, repo: string, branch: string) {
  const detected: Array<ScanResult["detectedAgents"][number]> = []
  let visited = 0

  async function listDir(path: string, depth: number) {
    if (depth > MAX_DEPTH || visited > MAX_FILES) return
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`
    const res = await fetch(url)
    if (!res.ok) return
    const items = await res.json()
    if (!Array.isArray(items)) return

    for (const item of items) {
      if (visited > MAX_FILES) break
      if (item.type === "dir") {
        await listDir(item.path, depth + 1)
        continue
      }
      if (item.type !== "file") continue
      visited++

      const lowerPath = String(item.path).toLowerCase()
      // Quick path-based hints
      const pathHints = ["agents/", "src/agents/", "agent.config", "agents.json", "ai-agent", "governance", "policy"]
      const pathSuggestsAgent = pathHints.some((h) => lowerPath.includes(h))

      // Only fetch file content if hints say likely relevant or a recognized config filename.
      if (!pathSuggestsAgent && !/package\.json$|\.ya?ml$|\.json$|\.ts$|\.js$/.test(lowerPath)) {
        continue
      }

      // Skip large files
      if (item.size && item.size > 256 * 1024) continue

      const fileRes = await fetch(item.download_url)
      if (!fileRes.ok) continue
      const content = await fileRes.text()

      const match = detectAgentFromFile(item.path, content)
      if (match) detected.push(match)
    }
  }

  await listDir("", 0)
  // De-duplicate by path
  const unique = new Map(detected.map((a) => [a.path, a]))
  return Array.from(unique.values()).slice(0, 50)
}

function detectAgentFromFile(path: string, content: string) {
  const lower = content.toLowerCase()
  const isConfigJson = path.toLowerCase().endsWith(".json")

  // Heuristics:
  // - Looks for governance SDK imports, "agentId", "provider", "model", "endpoint"
  // - Recognizes files named like agents.json, agent.config.json, etc.
  const nameFromPath = path.split("/").pop() || "agent"

  const likelyAgent =
    /aigovernance|ai-governance|governance-sdk|agentid|policy|agents?\s*[:=]\s*\[|registerAgent/i.test(content) ||
    /(agents?\.(json|ya?ml)|agent\.config\.(json|ya?ml))/i.test(path)

  if (!likelyAgent) return null

  const provider = /openai|gpt|azure-openai/i.test(content)
    ? "openai"
    : /anthropic|claude/i.test(content)
      ? "anthropic"
      : /grok|xai/i.test(content)
        ? "xai"
        : /vertex|gemini|google/i.test(content)
          ? "google"
          : undefined

  const modelMatch = content.match(/model["'\s:]*["'\s]*([a-zA-Z0-9._-]+)/) || content.match(/"model"\s*:\s*"([^"]+)"/)
  const endpointMatch =
    content.match(/endpoint["'\s:]*["'\s]*([a-zA-Z0-9:/._-]+)/) || content.match(/"endpoint"\s*:\s*"([^"]+)"/)
  const agentIdMatch =
    content.match(/agentId["'\s:]*["'\s]*([a-zA-Z0-9._-]+)/) || content.match(/"agentId"\s*:\s*"([^"]+)"/)

  return {
    name: nameFromPath.replace(/\.(json|js|ts|yaml|yml)$/i, ""),
    path,
    id: agentIdMatch?.[1],
    provider,
    model: modelMatch?.[1],
    endpoint: endpointMatch?.[1],
    metadata: { hints: ["heuristic-detection"] },
  }
}
