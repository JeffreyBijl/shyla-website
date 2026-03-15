const CONFIG = {
  REPO_OWNER: 'jeffreybijl',
  REPO_NAME: 'shyla-website',
  BRANCH: 'main',
  RECIPES_PATH: 'src/data/recipes.json',
  BLOG_PATH: 'src/data/blog.json',
  RECIPE_IMAGES_DIR: 'public/images/recipes',
  BLOG_IMAGES_DIR: 'public/images/blog',
} as const

const API_BASE = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}`
const TOKEN_KEY = 'shyla-admin-token'

// --- Token management ---

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// --- API helpers ---

function headers(): Record<string, string> {
  const token = getToken()
  if (!token) throw new Error('Geen token gevonden')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3+json',
  }
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { ...options, headers: { ...headers(), ...options?.headers } })
  } catch {
    throw new Error('Geen internetverbinding. Probeer het opnieuw.')
  }

  if (res.status === 401) {
    clearToken()
    throw new Error('Token is ongeldig of verlopen. Voer een nieuw token in.')
  }
  if (res.status === 403) {
    throw new Error('Token heeft niet de juiste rechten. Zorg voor "repo" scope.')
  }
  if (res.status === 409) {
    const err = new Error('Data is ondertussen gewijzigd. Ververs de pagina en probeer opnieuw.')
    ;(err as any).status = 409
    throw err
  }
  if (!res.ok) {
    throw new Error(`GitHub API fout (${res.status})`)
  }

  return res.json()
}

// --- Validate token ---

export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

// --- Read file from repo ---

interface GitHubFileResponse {
  content: string
  sha: string
}

export async function readFile<T>(path: string, noCache = false): Promise<{ content: T; sha: string }> {
  const url = noCache
    ? `${API_BASE}/contents/${path}?ref=${CONFIG.BRANCH}&_=${Date.now()}`
    : `${API_BASE}/contents/${path}?ref=${CONFIG.BRANCH}`
  const data = await apiRequest<GitHubFileResponse>(url, noCache ? {
    headers: { 'If-None-Match': '' },
  } : undefined)
  const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
  return { content: JSON.parse(decoded) as T, sha: data.sha }
}

// --- Write file to repo ---

async function writeFile(
  path: string,
  content: string,
  message: string,
  sha: string
): Promise<void> {
  const encoded = btoa(unescape(encodeURIComponent(content)))
  await apiRequest(`${API_BASE}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: encoded,
      sha,
      branch: CONFIG.BRANCH,
    }),
  })
}

// --- Read-modify-write with 409 retry ---

export async function readModifyWrite<T>(
  path: string,
  modify: (data: T) => T,
  message: string,
): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    // Use cache-busting on retries to avoid stale GitHub API responses
    const latest = await readFile<T>(path, attempt > 0)
    const updated = modify(latest.content)
    try {
      await writeFile(
        path,
        JSON.stringify(updated, null, 2),
        message,
        latest.sha
      )
      return updated
    } catch (err) {
      const is409 = err instanceof Error && (err as any).status === 409
      if (is409 && attempt < 4) {
        // Wait longer each retry: 2s, 4s, 6s, 8s
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error('Schrijven mislukt na meerdere pogingen')
}

// --- Upload image ---

export async function uploadImage(
  dir: string,
  filename: string,
  base64Data: string
): Promise<string> {
  const path = `${dir}/${filename}`
  await apiRequest(`${API_BASE}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Afbeelding: ${filename}`,
      content: base64Data,
      branch: CONFIG.BRANCH,
    }),
  })
  return path
}

// --- Delete file ---

export async function deleteFile(
  path: string,
  message: string
): Promise<void> {
  const data = await apiRequest<GitHubFileResponse>(
    `${API_BASE}/contents/${path}?ref=${CONFIG.BRANCH}`
  )
  await apiRequest(`${API_BASE}/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message,
      sha: data.sha,
      branch: CONFIG.BRANCH,
    }),
  })
}

// --- Deploy status polling ---

type DeployStatus = 'queued' | 'in_progress' | 'completed' | 'failed'

interface WorkflowRun {
  status: string
  conclusion: string | null
}

interface WorkflowRunsResponse {
  workflow_runs: WorkflowRun[]
}

export async function getLatestDeployStatus(): Promise<DeployStatus> {
  try {
    const data = await apiRequest<WorkflowRunsResponse>(
      `${API_BASE}/actions/runs?branch=${CONFIG.BRANCH}&per_page=1`
    )
    if (data.workflow_runs.length === 0) return 'completed'

    const run = data.workflow_runs[0]
    if (run.status === 'queued') return 'queued'
    if (run.status === 'in_progress') return 'in_progress'
    if (run.status === 'completed') {
      return run.conclusion === 'success' ? 'completed' : 'failed'
    }
    return 'in_progress'
  } catch {
    return 'completed'
  }
}

export function startDeployPolling(
  onStatus: (status: DeployStatus) => void
): () => void {
  let stopped = false
  let timeoutId: number

  const poll = async () => {
    if (stopped) return
    const status = await getLatestDeployStatus()
    if (stopped) return
    onStatus(status)
    if (status === 'completed' || status === 'failed') {
      stopped = true
      return
    }
    timeoutId = window.setTimeout(poll, 10_000)
  }

  timeoutId = window.setTimeout(poll, 3_000)

  return () => {
    stopped = true
    clearTimeout(timeoutId)
  }
}

export { CONFIG }
