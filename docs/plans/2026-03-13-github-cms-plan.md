# GitHub-based CMS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a GitHub-based CMS so Shyla can add/delete recipes and blog posts (with photos) via a hidden admin page, without touching code.

**Architecture:** JSON data files imported compile-time via Vite. Admin page commits changes to repo via GitHub Contents API. GitHub Actions rebuilds and deploys automatically. Images stored in `public/images/`, compressed client-side before upload.

**Tech Stack:** Vanilla TypeScript, Vite, GitHub Contents API, GitHub Actions API, Canvas API (image compression)

**Design doc:** `docs/plans/2026-03-13-github-cms-design.md`

---

## Important notes

- This project has no test framework. Verification is done via `npm run build` (TypeScript + Vite) and manual browser testing with `npm run dev`.
- JSON files live in `src/data/` (not `public/data/`) so they can be imported compile-time. The admin writes to `src/data/recipes.json` and `src/data/blog.json` in the repo via GitHub API.
- Images live in `public/images/recipes/` and `public/images/blog/` — Vite copies these to `dist/` at build time.
- Existing 6 recipes have no photos yet. The `image` field will be `string | null` (not just `string` as in original design) so existing recipes can use a gradient+emoji fallback until Shyla uploads real photos. The admin form still requires a photo for new recipes.
- The `emoji` field is kept in the Recipe type for fallback display when `image` is null.

---

### Task 1: Data layer — types, JSON files, tsconfig

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/recipes.json`
- Create: `src/data/blog.json`
- Modify: `tsconfig.json`
- Delete: `src/data/recipes.ts` (after Task 4 is done)
- Delete: `src/data/blog.ts` (after Task 5 is done)

**Step 1: Enable JSON imports in tsconfig**

In `tsconfig.json`, add `"resolveJsonModule": true` to `compilerOptions`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "skipLibCheck": true,
    "resolveJsonModule": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

**Step 2: Create `src/data/types.ts`**

```typescript
export type RecipeCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack'

export interface Recipe {
  id: number
  title: string
  category: RecipeCategory
  image: string | null
  emoji: string
  time: string
  calories: string
  description: string
}

export interface BlogPost {
  id: number
  title: string
  date: string
  category: string
  image: string | null
  excerpt: string
  readTime: string
}
```

Note: `Recipe` keeps `emoji` for fallback when `image` is null. `image` is `string | null` for both types.

**Step 3: Create `src/data/recipes.json`**

```json
[
  {
    "id": 1,
    "title": "Overnight oats met aardbei",
    "category": "ontbijt",
    "image": null,
    "emoji": "🍓",
    "time": "10 min",
    "calories": "320 kcal",
    "description": "Romige haver met verse aardbeien en een vleugje honing. Bereid de avond van tevoren voor een zorgeloos ochtend."
  },
  {
    "id": 2,
    "title": "Avocado toast met ei",
    "category": "ontbijt",
    "image": null,
    "emoji": "🥑",
    "time": "15 min",
    "calories": "380 kcal",
    "description": "Knapperig volkorenbrood met gecremede avocado, een gepocheerd ei en chilivlokken."
  },
  {
    "id": 3,
    "title": "Griekse salade bowl",
    "category": "lunch",
    "image": null,
    "emoji": "🥗",
    "time": "20 min",
    "calories": "290 kcal",
    "description": "Frisse bowl met komkommer, tomaat, olijven, feta en een citroen-olijfolie dressing."
  },
  {
    "id": 4,
    "title": "Kip teriyaki met quinoa",
    "category": "diner",
    "image": null,
    "emoji": "🍗",
    "time": "35 min",
    "calories": "520 kcal",
    "description": "Sappige kipfilet in een zoet-zoute teriyaki saus, geserveerd op luchtige quinoa met broccolini."
  },
  {
    "id": 5,
    "title": "Zalm met geroosterde groenten",
    "category": "diner",
    "image": null,
    "emoji": "🐟",
    "time": "40 min",
    "calories": "480 kcal",
    "description": "Oven gebakken zalmfilet met kleurrijke geroosterde paprika, courgette en zoete aardappel."
  },
  {
    "id": 6,
    "title": "Proteïne smoothie",
    "category": "snack",
    "image": null,
    "emoji": "🥤",
    "time": "5 min",
    "calories": "210 kcal",
    "description": "Roze smoothie met banaan, aardbei, Griekse yoghurt en een schepje proteïnepoeder."
  }
]
```

**Step 4: Create `src/data/blog.json`**

```json
[
  {
    "id": 1,
    "title": "5 tips voor een gezond ontbijt dat je de hele ochtend volhoudt",
    "date": "15 februari 2026",
    "category": "Voeding",
    "image": null,
    "excerpt": "Een goed ontbijt is de basis van een productieve dag. Ontdek welke voedingsstoffen je niet mag overslaan en hoe je ze makkelijk in je ochtend verwerkt.",
    "readTime": "4 min"
  },
  {
    "id": 2,
    "title": "Waarom proteïne zo belangrijk is voor vrouwen",
    "date": "8 februari 2026",
    "category": "Educatie",
    "image": null,
    "excerpt": "Proteïne is meer dan spierherstel. Leer hoe het je hormoonbalans, huid en energieniveau ondersteunt — en hoeveel je eigenlijk nodig hebt.",
    "readTime": "6 min"
  },
  {
    "id": 3,
    "title": "Meal prep in 1 uur: zo plan je een hele week voor",
    "date": "1 februari 2026",
    "category": "Lifestyle",
    "image": null,
    "excerpt": "Met de juiste aanpak kun je in één uur alle maaltijden voor de week voorbereiden. Mijn stap-voor-stap methode voor beginners.",
    "readTime": "5 min"
  },
  {
    "id": 4,
    "title": "De waarheid over \"gezonde\" snacks uit de supermarkt",
    "date": "22 januari 2026",
    "category": "Voeding",
    "image": null,
    "excerpt": "Veel producten met een gezond imago bevatten verrassend veel suiker of additieven. Ik leer je hoe je een etiket leest als een pro.",
    "readTime": "7 min"
  }
]
```

**Step 5: Verify build**

Run: `npm run build`
Expected: No errors. JSON files imported successfully.

**Step 6: Commit**

```bash
git add src/data/types.ts src/data/recipes.json src/data/blog.json tsconfig.json
git commit -m "feat: add data types and JSON files for CMS migration"
```

---

### Task 2: Image compression library (`src/lib/image.ts`)

**Files:**
- Create: `src/lib/image.ts`

**Step 1: Create `src/lib/image.ts`**

```typescript
export interface CompressedImage {
  blob: Blob
  width: number
  height: number
  base64: string
}

const MAX_DIMENSION = 1200
const MIN_WIDTH = 400
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const JPEG_QUALITY = 0.80

export async function compressImage(file: File): Promise<CompressedImage> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Bestand is te groot (maximaal 10 MB)')
  }

  const bitmap = await loadImage(file)
  let { width, height } = bitmap

  if (width < MIN_WIDTH) {
    throw new Error('Afbeelding is te klein (minimaal 400px breed)')
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)

  if ('close' in bitmap) (bitmap as ImageBitmap).close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => b ? resolve(b) : reject(new Error('Compressie mislukt')),
      'image/jpeg',
      JPEG_QUALITY
    )
  })

  const base64 = await blobToBase64(blob)

  return { blob, width, height, base64 }
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap respects EXIF rotation
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // HEIC/HEIF or unsupported format — fall through
    }
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Dit bestandsformaat wordt niet ondersteund. Probeer een JPEG of PNG.'))
    }
    img.src = URL.createObjectURL(file)
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Strip data:image/jpeg;base64, prefix — GitHub API wants raw base64
      resolve(result.split(',')[1])
    }
    reader.onerror = () => reject(new Error('Kan bestand niet lezen'))
    reader.readAsDataURL(blob)
  })
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: No errors. (The file isn't imported yet, but TS should still compile it since it's in `src/`.)

Note: `noUnusedLocals` is enabled but since these are all `export`ed, it should be fine. If the build complains about unused exports, temporarily add `// @ts-ignore` or wait until Task 6 (admin) imports them.

**Step 3: Commit**

```bash
git add src/lib/image.ts
git commit -m "feat: add client-side image compression library"
```

---

### Task 3: GitHub API helpers (`src/lib/github.ts`)

**Files:**
- Create: `src/lib/github.ts`

**Step 1: Create `src/lib/github.ts`**

```typescript
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
    throw new Error('Data is ondertussen gewijzigd. Ververs de pagina en probeer opnieuw.')
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

export async function readFile<T>(path: string): Promise<{ content: T; sha: string }> {
  const data = await apiRequest<GitHubFileResponse>(
    `${API_BASE}/contents/${path}?ref=${CONFIG.BRANCH}`
  )
  const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
  return { content: JSON.parse(decoded) as T, sha: data.sha }
}

// --- Write file to repo ---

export async function writeFile(
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
  // First get the SHA of the file
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
    // Silently fail — don't crash if polling fails
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

  // Wait 3 seconds before first poll
  timeoutId = window.setTimeout(poll, 3_000)

  return () => {
    stopped = true
    clearTimeout(timeoutId)
  }
}

// --- Config exports ---

export { CONFIG }
```

**Step 2: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/github.ts
git commit -m "feat: add GitHub API helper library"
```

---

### Task 4: Update recipes page — JSON import + image display

**Files:**
- Modify: `src/pages/recipes.ts`
- Delete: `src/data/recipes.ts`

**Step 1: Rewrite `src/pages/recipes.ts`**

Replace the import and card rendering. Key changes:
- Import from `recipes.json` instead of `recipes.ts`
- Import types from `types.ts`
- Replace `.recipe-emoji-wrap` with `.recipe-image-wrap` containing `<img>` or emoji fallback

```typescript
import recipesData from '../data/recipes.json'
import type { Recipe, RecipeCategory } from '../data/types.js'

const recipes: Recipe[] = recipesData as Recipe[]

function recipeCard(recipe: Recipe): string {
  const imageHTML = recipe.image
    ? `<img src="${import.meta.env.BASE_URL}${recipe.image}" alt="${recipe.title}" loading="lazy">`
    : `<span class="recipe-emoji">${recipe.emoji}</span>`

  return `
    <article class="card recipe-card" data-category="${recipe.category}">
      <div class="recipe-image-wrap ${recipe.image ? '' : 'recipe-image-wrap--fallback'}">
        ${imageHTML}
        <span class="recipe-category-badge badge badge-pink">${recipe.category}</span>
      </div>
      <div class="recipe-body">
        <h3 class="recipe-title">${recipe.title}</h3>
        <p>${recipe.description}</p>
        <div class="recipe-meta-row">
          <span class="recipe-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            ${recipe.time}
          </span>
          <span class="recipe-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            ${recipe.calories}
          </span>
        </div>
      </div>
    </article>
  `
}

export function renderRecipes(): string {
  const categories: Array<'alle' | RecipeCategory> = ['alle', 'ontbijt', 'lunch', 'diner', 'snack']

  const filterHTML = categories.map(cat => `
    <button class="filter-btn ${cat === 'alle' ? 'filter-btn--active' : ''}" data-filter="${cat}">
      ${cat === 'ontbijt' ? '☀️' : cat === 'lunch' ? '🥗' : cat === 'diner' ? '🍽️' : cat === 'snack' ? '🍎' : '✨'}
      ${cat.charAt(0).toUpperCase() + cat.slice(1)}
    </button>
  `).join('')

  return `
    <section class="section recipes-section">
      <div class="container">
        <div class="section-title">
          <span class="section-label">Voeding</span>
          <h2>Heerlijke <em class="text-pink">recepten</em></h2>
          <p>Voedzaam, lekker en klaar in een handomdraai</p>
        </div>
        <div class="filter-bar">${filterHTML}</div>
        <div class="grid-3 recipes-grid" id="recipes-grid">
          ${recipes.map(recipeCard).join('')}
        </div>
        <div class="recipes-empty" id="recipes-empty" hidden>
          <span>😔</span>
          <p>Geen recepten gevonden in deze categorie.</p>
        </div>
      </div>
    </section>
  `
}

export function setupRecipes(): void {
  const grid    = document.getElementById('recipes-grid')
  const empty   = document.getElementById('recipes-empty')
  const buttons = document.querySelectorAll<HTMLButtonElement>('.filter-btn')

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter as 'alle' | RecipeCategory

      buttons.forEach(b => b.classList.remove('filter-btn--active'))
      btn.classList.add('filter-btn--active')

      let visibleCount = 0
      grid?.querySelectorAll<HTMLElement>('.recipe-card').forEach(card => {
        const show = filter === 'alle' || card.dataset.category === filter
        card.style.display = show ? '' : 'none'
        if (show) visibleCount++
      })

      if (empty) empty.hidden = visibleCount > 0
    })
  })
}
```

**Step 2: Delete `src/data/recipes.ts`**

```bash
rm src/data/recipes.ts
```

**Step 3: Verify build**

Run: `npm run build`
Expected: No errors. The recipes page should compile with JSON import.

**Step 4: Manual verification**

Run: `npm run dev`
Open browser → navigate to `#recepten`. Verify:
- Recipe cards render with emoji fallback (since all `image` fields are null)
- Category filtering still works
- No console errors

**Step 5: Commit**

```bash
git add src/pages/recipes.ts src/data/recipes.json
git rm src/data/recipes.ts
git commit -m "feat: migrate recipes to JSON import with image support"
```

---

### Task 5: Update blog page — JSON import + image display

**Files:**
- Modify: `src/pages/blog.ts`
- Delete: `src/data/blog.ts`

**Step 1: Rewrite `src/pages/blog.ts`**

Replace import and add image support to blog cards:

```typescript
import blogData from '../data/blog.json'
import type { BlogPost } from '../data/types.js'

const blogPosts: BlogPost[] = blogData as BlogPost[]

const categoryColors: Record<string, string> = {
  Voeding:   'badge-pink',
  Educatie:  'badge-green',
  Lifestyle: 'badge-purple',
}

const categoryEmojis: Record<string, string> = {
  Voeding:   '🥗',
  Educatie:  '📚',
  Lifestyle: '✨',
}

function blogCard(post: BlogPost, index: number): string {
  const colorClass = categoryColors[post.category] ?? 'badge-pink'
  const emoji      = categoryEmojis[post.category] ?? '📖'
  const accentHue  = index % 2 === 0 ? 'blog-card-accent--pink' : 'blog-card-accent--green'

  const visualHTML = post.image
    ? `<div class="blog-card-visual">
        <img src="${import.meta.env.BASE_URL}${post.image}" alt="${post.title}" loading="lazy">
      </div>`
    : `<div class="blog-card-visual ${accentHue}">
        <span class="blog-card-emoji">${emoji}</span>
      </div>`

  return `
    <article class="card blog-card">
      ${visualHTML}
      <div class="blog-body">
        <div class="blog-meta">
          <span class="badge ${colorClass}">${post.category}</span>
          <span class="blog-read-time">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            ${post.readTime} leestijd
          </span>
        </div>
        <h3 class="blog-title">${post.title}</h3>
        <p>${post.excerpt}</p>
        <div class="blog-footer">
          <span class="blog-date">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            ${post.date}
          </span>
          <a href="#" class="blog-read-btn">
            Lees meer
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      </div>
    </article>
  `
}

export function renderBlog(): string {
  return `
    <section class="section blog-section">
      <div class="container">
        <div class="section-title">
          <span class="section-label">Inspiratie</span>
          <h2>Van de <em class="text-pink">blog</em></h2>
          <p>Tips, kennis en verhalen over voeding en leefstijl</p>
        </div>
        <div class="grid-3 blog-grid" id="blog-grid">
          ${blogPosts.map((post, i) => blogCard(post, i)).join('')}
        </div>
        <div class="blog-cta">
          <p>Meer artikelen komen binnenkort!</p>
          <a href="#contact" class="btn btn-outline">Schrijf je in voor updates</a>
        </div>
      </div>
    </section>
  `
}
```

**Step 2: Delete `src/data/blog.ts`**

```bash
rm src/data/blog.ts
```

**Step 3: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 4: Manual verification**

Run: `npm run dev`
Open browser → navigate to `#blog`. Verify:
- Blog cards render with gradient+emoji fallback (all `image` fields are null)
- No console errors

**Step 5: Commit**

```bash
git add src/pages/blog.ts src/data/blog.json
git rm src/data/blog.ts
git commit -m "feat: migrate blog to JSON import with image support"
```

---

### Task 6: CSS — recipe/blog image styles + admin styles

**Files:**
- Modify: `src/style.css`

**Step 1: Replace recipe emoji styles with image styles**

Find the existing `.recipe-emoji-wrap` styles and replace/augment them. Add these styles:

```css
/* --- Recipe image --- */

.recipe-image-wrap {
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  position: relative;
}

.recipe-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Fallback when no image — keep emoji styling */
.recipe-image-wrap--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-pink-light);
}

.recipe-image-wrap--fallback .recipe-emoji {
  font-size: 3rem;
}

.recipe-category-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
}

@media (max-width: 600px) {
  .recipe-image-wrap {
    height: 180px;
  }
}
```

**Step 2: Add blog image styles**

```css
/* --- Blog image --- */

.blog-card-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (max-width: 600px) {
  .blog-card-visual {
    height: 160px;
  }
}
```

**Step 3: Add admin page styles**

Add at the end of `style.css`:

```css
/* ========================================
   Admin page
   ======================================== */

.admin-section {
  padding: 2rem 0 4rem;
}

.admin-header {
  text-align: center;
  margin-bottom: 2rem;
}

.admin-header h1 {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  color: var(--color-gray);
}

/* Token form */
.admin-token-card {
  max-width: 480px;
  margin: 4rem auto;
  padding: 2rem;
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.admin-token-card h2 {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.admin-token-warning {
  font-size: 0.85rem;
  color: var(--color-gray-light);
  margin-top: 0.5rem;
}

/* Tabs */
.admin-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--color-border);
}

.admin-tab {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-gray-light);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: var(--transition);
  min-height: 44px;
}

.admin-tab:hover {
  color: var(--color-pink);
}

.admin-tab--active {
  color: var(--color-pink);
  border-bottom-color: var(--color-pink);
}

.admin-tab-content {
  display: none;
}

.admin-tab-content--active {
  display: block;
}

/* Form */
.admin-form {
  background: var(--color-white);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
}

.admin-form h3 {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  margin-bottom: 1.25rem;
  color: var(--color-gray);
}

.admin-form .form-group {
  margin-bottom: 1rem;
}

.admin-form label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: var(--color-gray);
  font-size: 0.9rem;
}

.admin-form input[type="text"],
.admin-form textarea,
.admin-form select {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.95rem;
  transition: var(--transition);
  background: var(--color-white);
}

.admin-form input[type="text"]:focus,
.admin-form textarea:focus,
.admin-form select:focus {
  outline: none;
  border-color: var(--color-pink);
  box-shadow: 0 0 0 3px rgba(240, 107, 138, 0.15);
}

.admin-form textarea {
  min-height: 80px;
  resize: vertical;
}

/* Image upload */
.admin-image-upload {
  margin-bottom: 1rem;
}

.admin-image-input-wrap {
  position: relative;
}

.admin-image-input-wrap input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.admin-image-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: var(--color-pink-light);
  color: var(--color-pink);
  border: 1.5px dashed var(--color-pink);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  transition: var(--transition);
}

.admin-image-btn:hover {
  background: var(--color-pink);
  color: var(--color-white);
}

.admin-image-preview {
  margin-top: 0.75rem;
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: none;
}

.admin-image-preview.has-image {
  display: block;
}

.admin-image-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

.admin-image-info {
  font-size: 0.8rem;
  color: var(--color-gray-light);
  margin-top: 0.35rem;
}

/* Deploy status */
.admin-deploy-status {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  display: none;
}

.admin-deploy-status.visible {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.admin-deploy-status--pending {
  background: #FFF3E0;
  color: #E65100;
}

.admin-deploy-status--success {
  background: #E8F5E9;
  color: #2E7D32;
}

.admin-deploy-status--error {
  background: #FFEBEE;
  color: #C62828;
}

/* Item list */
.admin-items-list h3 {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  margin-bottom: 1rem;
  color: var(--color-gray);
}

.admin-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--color-white);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  margin-bottom: 0.5rem;
}

.admin-item-thumbnail {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-pink-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-item-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-item-thumbnail .emoji-fallback {
  font-size: 1.5rem;
}

.admin-item-info {
  flex: 1;
  min-width: 0;
}

.admin-item-title {
  font-weight: 500;
  color: var(--color-gray);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-item-meta {
  font-size: 0.8rem;
  color: var(--color-gray-light);
}

.admin-item-delete {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  background: #FFEBEE;
  color: #C62828;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  transition: var(--transition);
}

.admin-item-delete:hover {
  background: #C62828;
  color: var(--color-white);
}

/* Feedback */
.admin-feedback {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: none;
}

.admin-feedback.visible {
  display: block;
}

.admin-feedback--success {
  background: #E8F5E9;
  color: #2E7D32;
}

.admin-feedback--error {
  background: #FFEBEE;
  color: #C62828;
}

/* Progress */
.admin-progress {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-pink-light);
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: var(--color-pink);
}

.admin-progress.visible {
  display: flex;
}

.admin-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-pink-light);
  border-top-color: var(--color-pink);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .admin-form {
    padding: 1rem;
  }

  .admin-image-preview img {
    max-height: 200px;
  }

  .admin-item {
    gap: 0.75rem;
  }
}
```

**Step 4: Remove old `.recipe-emoji-wrap` styles**

Find and remove the old `.recipe-emoji-wrap` and `.recipe-emoji` CSS rules that are no longer needed, BUT keep any that the fallback still uses. Check the existing CSS to see what's there and remove only what's replaced.

**Step 5: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 6: Manual verification**

Run: `npm run dev`
- Check recipe cards look correct (emoji fallback styled properly)
- Check blog cards look correct
- Responsive: resize browser to mobile width

**Step 7: Commit**

```bash
git add src/style.css
git commit -m "feat: add image and admin page styles"
```

---

### Task 7: Admin page (`src/pages/admin.ts`)

**Files:**
- Create: `src/pages/admin.ts`

This is the largest task. The admin page contains:
- Token entry screen
- Tab interface (Recepten / Blog)
- Recipe form with image upload + preview
- Blog form with optional image upload + preview
- Item lists with delete functionality
- Deploy status polling
- Progress indicators and feedback messages

**Step 1: Create `src/pages/admin.ts`**

The file is large. Key structure:

```typescript
import type { Recipe, BlogPost, RecipeCategory } from '../data/types.js'
import {
  getToken, saveToken, clearToken, validateToken,
  readFile, writeFile, uploadImage, deleteFile,
  startDeployPolling, CONFIG,
} from '../lib/github.js'
import { compressImage, slugify } from '../lib/image.js'

// --- State ---
let activeTab: 'recipes' | 'blog' = 'recipes'
let recipes: Recipe[] = []
let blogPosts: BlogPost[] = []
let recipesSha = ''
let blogSha = ''

// --- Render ---
export function renderAdmin(): string {
  const token = getToken()
  if (!token) return renderTokenForm()
  return renderDashboard()
}

function renderTokenForm(): string {
  return `
    <section class="section admin-section">
      <div class="container">
        <div class="admin-token-card">
          <h2>Admin login</h2>
          <p>Voer je GitHub Personal Access Token in om content te beheren.</p>
          <div class="form-group">
            <label for="admin-token">Token</label>
            <input type="password" id="admin-token" placeholder="ghp_xxxxxxxxxxxx">
          </div>
          <div class="admin-feedback" id="token-feedback"></div>
          <button class="btn btn-primary" id="token-submit">Inloggen</button>
          <p class="admin-token-warning">Deel dit token met niemand.</p>
        </div>
      </div>
    </section>
  `
}

function renderDashboard(): string {
  return `
    <section class="section admin-section">
      <div class="container">
        <div class="admin-header">
          <h1>Admin — fit.foodbyshyla</h1>
          <button class="btn btn-outline" id="admin-refresh" style="margin-top:0.5rem;">Ververs data</button>
          <button class="btn" id="admin-logout" style="margin-top:0.5rem;margin-left:0.5rem;color:var(--color-gray-light);">Uitloggen</button>
        </div>

        <div class="admin-tabs">
          <button class="admin-tab admin-tab--active" data-tab="recipes">Recepten</button>
          <button class="admin-tab" data-tab="blog">Blog</button>
        </div>

        <div class="admin-tab-content admin-tab-content--active" id="tab-recipes">
          ${renderRecipeForm()}
          <div class="admin-deploy-status" id="deploy-status-recipes"></div>
          <div class="admin-feedback" id="feedback-recipes"></div>
          <div class="admin-progress" id="progress-recipes">
            <div class="admin-spinner"></div>
            <span id="progress-text-recipes"></span>
          </div>
          <div class="admin-items-list" id="recipes-list">
            <h3>Bestaande recepten</h3>
            <div id="recipes-items"></div>
          </div>
        </div>

        <div class="admin-tab-content" id="tab-blog">
          ${renderBlogForm()}
          <div class="admin-deploy-status" id="deploy-status-blog"></div>
          <div class="admin-feedback" id="feedback-blog"></div>
          <div class="admin-progress" id="progress-blog">
            <div class="admin-spinner"></div>
            <span id="progress-text-blog"></span>
          </div>
          <div class="admin-items-list" id="blog-list">
            <h3>Bestaande blogposts</h3>
            <div id="blog-items"></div>
          </div>
        </div>
      </div>
    </section>
  `
}

function renderRecipeForm(): string {
  return `
    <div class="admin-form">
      <h3>Nieuw recept toevoegen</h3>
      <div class="admin-image-upload">
        <label>Foto (verplicht)</label>
        <div class="admin-image-input-wrap">
          <span class="admin-image-btn">Kies foto</span>
          <input type="file" accept="image/*" id="recipe-image">
        </div>
        <div class="admin-image-preview" id="recipe-preview">
          <img id="recipe-preview-img" alt="Preview">
        </div>
        <div class="admin-image-info" id="recipe-image-info"></div>
      </div>
      <div class="form-group">
        <label for="recipe-title">Titel</label>
        <input type="text" id="recipe-title" placeholder="bijv. Overnight oats met aardbei">
      </div>
      <div class="form-group">
        <label for="recipe-category">Categorie</label>
        <select id="recipe-category">
          <option value="ontbijt">Ontbijt</option>
          <option value="lunch">Lunch</option>
          <option value="diner">Diner</option>
          <option value="snack">Snack</option>
        </select>
      </div>
      <div class="form-group">
        <label for="recipe-time">Bereidingstijd</label>
        <input type="text" id="recipe-time" placeholder="bijv. 10 min">
      </div>
      <div class="form-group">
        <label for="recipe-calories">Calorieën</label>
        <input type="text" id="recipe-calories" placeholder="bijv. 320 kcal">
      </div>
      <div class="form-group">
        <label for="recipe-description">Beschrijving</label>
        <textarea id="recipe-description" placeholder="Korte beschrijving (1-2 zinnen)"></textarea>
      </div>
      <button class="btn btn-primary" id="recipe-submit">Opslaan</button>
    </div>
  `
}

function renderBlogForm(): string {
  return `
    <div class="admin-form">
      <h3>Nieuwe blogpost toevoegen</h3>
      <div class="admin-image-upload">
        <label>Foto (optioneel)</label>
        <div class="admin-image-input-wrap">
          <span class="admin-image-btn">Kies foto</span>
          <input type="file" accept="image/*" id="blog-image">
        </div>
        <div class="admin-image-preview" id="blog-preview">
          <img id="blog-preview-img" alt="Preview">
        </div>
        <div class="admin-image-info" id="blog-image-info"></div>
      </div>
      <div class="form-group">
        <label for="blog-title">Titel</label>
        <input type="text" id="blog-title" placeholder="Titel van de blogpost">
      </div>
      <div class="form-group">
        <label for="blog-category">Categorie</label>
        <select id="blog-category">
          <option value="Voeding">Voeding</option>
          <option value="Educatie">Educatie</option>
          <option value="Lifestyle">Lifestyle</option>
        </select>
      </div>
      <div class="form-group">
        <label for="blog-excerpt">Samenvatting</label>
        <textarea id="blog-excerpt" placeholder="Korte samenvatting voor de kaart"></textarea>
      </div>
      <div class="form-group">
        <label for="blog-readtime">Leestijd</label>
        <input type="text" id="blog-readtime" placeholder="bijv. 4 min">
      </div>
      <button class="btn btn-primary" id="blog-submit">Opslaan</button>
    </div>
  `
}

// --- Render item lists ---

function renderRecipeItems(): void {
  const container = document.getElementById('recipes-items')
  if (!container) return
  container.innerHTML = recipes.map(r => `
    <div class="admin-item" data-id="${r.id}">
      <div class="admin-item-thumbnail">
        ${r.image
          ? `<img src="${import.meta.env.BASE_URL}${r.image}" alt="${r.title}">`
          : `<span class="emoji-fallback">${r.emoji}</span>`}
      </div>
      <div class="admin-item-info">
        <div class="admin-item-title">${r.title}</div>
        <div class="admin-item-meta">${r.category} · ${r.time}</div>
      </div>
      <button class="admin-item-delete" data-id="${r.id}" data-type="recipe" title="Verwijderen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>
  `).join('')
}

function renderBlogItems(): void {
  const container = document.getElementById('blog-items')
  if (!container) return
  container.innerHTML = blogPosts.map(p => `
    <div class="admin-item" data-id="${p.id}">
      <div class="admin-item-thumbnail">
        ${p.image
          ? `<img src="${import.meta.env.BASE_URL}${p.image}" alt="${p.title}">`
          : `<span class="emoji-fallback">${categoryEmoji(p.category)}</span>`}
      </div>
      <div class="admin-item-info">
        <div class="admin-item-title">${p.title}</div>
        <div class="admin-item-meta">${p.category} · ${p.date}</div>
      </div>
      <button class="admin-item-delete" data-id="${p.id}" data-type="blog" title="Verwijderen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>
  `).join('')
}

function categoryEmoji(category: string): string {
  const map: Record<string, string> = { Voeding: '🥗', Educatie: '📚', Lifestyle: '✨' }
  return map[category] ?? '📖'
}

// --- Setup (event listeners) ---

export function setupAdmin(): void {
  const token = getToken()
  if (!token) {
    setupTokenForm()
  } else {
    loadData()
    setupDashboard()
  }
}

function setupTokenForm(): void {
  const input = document.getElementById('admin-token') as HTMLInputElement
  const submit = document.getElementById('token-submit')
  const feedback = document.getElementById('token-feedback')

  submit?.addEventListener('click', async () => {
    const token = input?.value.trim()
    if (!token) {
      showFeedback(feedback, 'Voer een token in', 'error')
      return
    }
    submit.textContent = 'Controleren...'
    ;(submit as HTMLButtonElement).disabled = true

    const valid = await validateToken(token)
    if (valid) {
      saveToken(token)
      // Re-render the admin page with dashboard
      const app = document.getElementById('app')
      if (app) {
        app.innerHTML = `<div class="page-enter">${renderDashboard()}</div>`
        loadData()
        setupDashboard()
      }
    } else {
      showFeedback(feedback, 'Token is ongeldig. Controleer of het correct is en "repo" scope heeft.', 'error')
      submit.textContent = 'Inloggen'
      ;(submit as HTMLButtonElement).disabled = false
    }
  })
}

function setupDashboard(): void {
  // Tab switching
  document.querySelectorAll<HTMLButtonElement>('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab as 'recipes' | 'blog'
      activeTab = target
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('admin-tab--active'))
      tab.classList.add('admin-tab--active')
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('admin-tab-content--active'))
      document.getElementById(`tab-${target}`)?.classList.add('admin-tab-content--active')
    })
  })

  // Refresh
  document.getElementById('admin-refresh')?.addEventListener('click', () => loadData())

  // Logout
  document.getElementById('admin-logout')?.addEventListener('click', () => {
    clearToken()
    const app = document.getElementById('app')
    if (app) {
      app.innerHTML = `<div class="page-enter">${renderTokenForm()}</div>`
      setupTokenForm()
    }
  })

  // Recipe image preview
  setupImagePreview('recipe-image', 'recipe-preview', 'recipe-preview-img', 'recipe-image-info')

  // Blog image preview
  setupImagePreview('blog-image', 'blog-preview', 'blog-preview-img', 'blog-image-info')

  // Recipe submit
  document.getElementById('recipe-submit')?.addEventListener('click', () => handleRecipeSubmit())

  // Blog submit
  document.getElementById('blog-submit')?.addEventListener('click', () => handleBlogSubmit())

  // Delete buttons (event delegation)
  document.getElementById('recipes-items')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.admin-item-delete') as HTMLElement | null
    if (btn) handleDelete(Number(btn.dataset.id), 'recipe')
  })

  document.getElementById('blog-items')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.admin-item-delete') as HTMLElement | null
    if (btn) handleDelete(Number(btn.dataset.id), 'blog')
  })
}

function setupImagePreview(
  inputId: string, previewId: string, imgId: string, infoId: string
): void {
  const input = document.getElementById(inputId) as HTMLInputElement
  const preview = document.getElementById(previewId)
  const img = document.getElementById(imgId) as HTMLImageElement
  const info = document.getElementById(infoId)

  input?.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file || !preview || !img || !info) return

    // Show preview immediately
    const url = URL.createObjectURL(file)
    img.src = url
    preview.classList.add('has-image')

    // Show file info
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    info.textContent = `Origineel: ${sizeMB} MB — wordt automatisch verkleind bij opslaan`
  })
}

// --- Data loading ---

async function loadData(): Promise<void> {
  try {
    const [recipesResult, blogResult] = await Promise.all([
      readFile<Recipe[]>(CONFIG.RECIPES_PATH),
      readFile<BlogPost[]>(CONFIG.BLOG_PATH),
    ])
    recipes = recipesResult.content
    recipesSha = recipesResult.sha
    blogPosts = blogResult.content
    blogSha = blogResult.sha
    renderRecipeItems()
    renderBlogItems()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kan data niet laden'
    showFeedback(
      document.getElementById(`feedback-${activeTab === 'recipes' ? 'recipes' : 'blog'}`),
      msg, 'error'
    )
  }
}

// --- Submit handlers ---

async function handleRecipeSubmit(): Promise<void> {
  const title = (document.getElementById('recipe-title') as HTMLInputElement)?.value.trim()
  const category = (document.getElementById('recipe-category') as HTMLSelectElement)?.value as RecipeCategory
  const time = (document.getElementById('recipe-time') as HTMLInputElement)?.value.trim()
  const calories = (document.getElementById('recipe-calories') as HTMLInputElement)?.value.trim()
  const description = (document.getElementById('recipe-description') as HTMLTextAreaElement)?.value.trim()
  const imageInput = document.getElementById('recipe-image') as HTMLInputElement
  const file = imageInput?.files?.[0]

  const feedback = document.getElementById('feedback-recipes')
  const progress = document.getElementById('progress-recipes')
  const progressText = document.getElementById('progress-text-recipes')

  // Validate
  if (!title || !time || !calories || !description) {
    showFeedback(feedback, 'Vul alle velden in', 'error')
    return
  }
  if (!file) {
    showFeedback(feedback, 'Kies een foto', 'error')
    return
  }

  hideFeedback(feedback)
  showProgress(progress, progressText, 'Foto verkleinen...')

  try {
    // Step 1: Compress image
    const compressed = await compressImage(file)

    // Step 2: Upload image
    showProgress(progress, progressText, 'Foto uploaden...')
    const filename = `${slugify(title)}-${Date.now()}.jpg`
    const imagePath = await uploadImage(CONFIG.RECIPE_IMAGES_DIR, filename, compressed.base64)

    // Step 3: Update JSON
    showProgress(progress, progressText, 'Gegevens opslaan...')

    // Re-read to get latest SHA (avoid conflicts)
    const latest = await readFile<Recipe[]>(CONFIG.RECIPES_PATH)
    recipes = latest.content
    recipesSha = latest.sha

    const newId = recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) + 1 : 1
    const newRecipe: Recipe = {
      id: newId,
      title,
      category,
      image: imagePath,
      emoji: '',
      time,
      calories,
      description,
    }

    recipes.push(newRecipe)
    await writeFile(
      CONFIG.RECIPES_PATH,
      JSON.stringify(recipes, null, 2),
      `Nieuw recept: ${title}`,
      recipesSha
    )

    hideProgress(progress)
    showFeedback(feedback, 'Recept opgeslagen! Wordt binnen 1-2 minuten gepubliceerd.', 'success')
    clearRecipeForm()
    renderRecipeItems()

    // Start deploy polling
    pollDeploy('deploy-status-recipes')
  } catch (err) {
    hideProgress(progress)
    const msg = err instanceof Error ? err.message : 'Er ging iets mis'
    showFeedback(feedback, msg, 'error')
  }
}

async function handleBlogSubmit(): Promise<void> {
  const title = (document.getElementById('blog-title') as HTMLInputElement)?.value.trim()
  const category = (document.getElementById('blog-category') as HTMLSelectElement)?.value
  const excerpt = (document.getElementById('blog-excerpt') as HTMLTextAreaElement)?.value.trim()
  const readTime = (document.getElementById('blog-readtime') as HTMLInputElement)?.value.trim()
  const imageInput = document.getElementById('blog-image') as HTMLInputElement
  const file = imageInput?.files?.[0]

  const feedback = document.getElementById('feedback-blog')
  const progress = document.getElementById('progress-blog')
  const progressText = document.getElementById('progress-text-blog')

  // Validate
  if (!title || !excerpt || !readTime) {
    showFeedback(feedback, 'Vul alle verplichte velden in', 'error')
    return
  }

  hideFeedback(feedback)
  let imagePath: string | null = null

  try {
    if (file) {
      showProgress(progress, progressText, 'Foto verkleinen...')
      const compressed = await compressImage(file)

      showProgress(progress, progressText, 'Foto uploaden...')
      const filename = `${slugify(title)}-${Date.now()}.jpg`
      imagePath = await uploadImage(CONFIG.BLOG_IMAGES_DIR, filename, compressed.base64)
    }

    showProgress(progress, progressText, 'Gegevens opslaan...')

    // Re-read to get latest SHA
    const latest = await readFile<BlogPost[]>(CONFIG.BLOG_PATH)
    blogPosts = latest.content
    blogSha = latest.sha

    const newId = blogPosts.length > 0 ? Math.max(...blogPosts.map(p => p.id)) + 1 : 1

    // Format date: "15 maart 2026"
    const now = new Date()
    const months = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

    const newPost: BlogPost = {
      id: newId,
      title,
      date: dateStr,
      category,
      image: imagePath,
      excerpt,
      readTime,
    }

    blogPosts.push(newPost)
    await writeFile(
      CONFIG.BLOG_PATH,
      JSON.stringify(blogPosts, null, 2),
      `Nieuwe blogpost: ${title}`,
      blogSha
    )

    hideProgress(progress)
    showFeedback(feedback, 'Blogpost opgeslagen! Wordt binnen 1-2 minuten gepubliceerd.', 'success')
    clearBlogForm()
    renderBlogItems()

    pollDeploy('deploy-status-blog')
  } catch (err) {
    hideProgress(progress)
    const msg = err instanceof Error ? err.message : 'Er ging iets mis'
    showFeedback(feedback, msg, 'error')
  }
}

// --- Delete handler ---

async function handleDelete(id: number, type: 'recipe' | 'blog'): Promise<void> {
  const item = type === 'recipe'
    ? recipes.find(r => r.id === id)
    : blogPosts.find(p => p.id === id)

  if (!item) return

  const confirmed = confirm(`Weet je zeker dat je "${item.title}" wilt verwijderen?`)
  if (!confirmed) return

  const feedbackId = type === 'recipe' ? 'feedback-recipes' : 'feedback-blog'
  const feedback = document.getElementById(feedbackId)

  try {
    // Delete image if exists
    if (item.image) {
      await deleteFile(item.image, `Verwijder afbeelding: ${item.title}`)
    }

    // Update JSON
    if (type === 'recipe') {
      const latest = await readFile<Recipe[]>(CONFIG.RECIPES_PATH)
      recipes = latest.content.filter(r => r.id !== id)
      await writeFile(
        CONFIG.RECIPES_PATH,
        JSON.stringify(recipes, null, 2),
        `Verwijder recept: ${item.title}`,
        latest.sha
      )
      renderRecipeItems()
    } else {
      const latest = await readFile<BlogPost[]>(CONFIG.BLOG_PATH)
      blogPosts = latest.content.filter(p => p.id !== id)
      await writeFile(
        CONFIG.BLOG_PATH,
        JSON.stringify(blogPosts, null, 2),
        `Verwijder blogpost: ${item.title}`,
        latest.sha
      )
      renderBlogItems()
    }

    showFeedback(feedback, `"${item.title}" verwijderd`, 'success')
    pollDeploy(type === 'recipe' ? 'deploy-status-recipes' : 'deploy-status-blog')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Verwijderen mislukt'
    showFeedback(feedback, msg, 'error')
  }
}

// --- Deploy polling ---

function pollDeploy(statusElementId: string): void {
  const el = document.getElementById(statusElementId)
  if (!el) return

  el.className = 'admin-deploy-status visible admin-deploy-status--pending'
  el.textContent = 'Wachtrij...'

  startDeployPolling((status) => {
    switch (status) {
      case 'queued':
        el.className = 'admin-deploy-status visible admin-deploy-status--pending'
        el.textContent = 'Wachtrij...'
        break
      case 'in_progress':
        el.className = 'admin-deploy-status visible admin-deploy-status--pending'
        el.textContent = 'Publiceren...'
        break
      case 'completed':
        el.className = 'admin-deploy-status visible admin-deploy-status--success'
        el.textContent = 'Live!'
        setTimeout(() => { el.classList.remove('visible') }, 10_000)
        break
      case 'failed':
        el.className = 'admin-deploy-status visible admin-deploy-status--error'
        el.textContent = 'Publicatie mislukt. Probeer opnieuw of neem contact op.'
        break
    }
  })
}

// --- UI helpers ---

function showFeedback(el: HTMLElement | null, msg: string, type: 'success' | 'error'): void {
  if (!el) return
  el.textContent = msg
  el.className = `admin-feedback visible admin-feedback--${type}`
}

function hideFeedback(el: HTMLElement | null): void {
  if (!el) return
  el.className = 'admin-feedback'
}

function showProgress(el: HTMLElement | null, textEl: HTMLElement | null, msg: string): void {
  if (el) el.classList.add('visible')
  if (textEl) textEl.textContent = msg
}

function hideProgress(el: HTMLElement | null): void {
  if (el) el.classList.remove('visible')
}

function clearRecipeForm(): void {
  ;(document.getElementById('recipe-title') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-time') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-calories') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-description') as HTMLTextAreaElement).value = ''
  ;(document.getElementById('recipe-image') as HTMLInputElement).value = ''
  document.getElementById('recipe-preview')?.classList.remove('has-image')
  const info = document.getElementById('recipe-image-info')
  if (info) info.textContent = ''
}

function clearBlogForm(): void {
  ;(document.getElementById('blog-title') as HTMLInputElement).value = ''
  ;(document.getElementById('blog-excerpt') as HTMLTextAreaElement).value = ''
  ;(document.getElementById('blog-readtime') as HTMLInputElement).value = ''
  ;(document.getElementById('blog-image') as HTMLInputElement).value = ''
  document.getElementById('blog-preview')?.classList.remove('has-image')
  const info = document.getElementById('blog-image-info')
  if (info) info.textContent = ''
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/pages/admin.ts
git commit -m "feat: add admin page with CMS functionality"
```

---

### Task 8: Router — add admin route

**Files:**
- Modify: `src/router.ts`

**Step 1: Add admin route to `src/router.ts`**

Add import for admin page and the route entry:

```typescript
import { renderHome }                      from './pages/home.js'
import { renderAbout }                     from './pages/about.js'
import { renderRecipes, setupRecipes }     from './pages/recipes.js'
import { renderBlog }                      from './pages/blog.js'
import { renderContact, setupContact }     from './pages/contact.js'
import { renderAdmin, setupAdmin }         from './pages/admin.js'

type PageSetup = () => void

interface Route {
  render: () => string
  setup?: PageSetup
}

const routes: Record<string, Route> = {
  '#home':        { render: renderHome },
  '#about':       { render: renderAbout },
  '#recepten':    { render: renderRecipes, setup: setupRecipes },
  '#blog':        { render: renderBlog },
  '#contact':     { render: renderContact, setup: setupContact },
  '#admin-shyla': { render: renderAdmin, setup: setupAdmin },
}

export function navigate(): void {
  const hash  = window.location.hash || '#home'
  const route = routes[hash] ?? routes['#home']
  const app   = document.getElementById('app')
  if (!app) return

  app.innerHTML = `<div class="page-enter">${route.render()}</div>`
  route.setup?.()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function setupRouter(): void {
  window.addEventListener('hashchange', navigate)
  navigate()
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 3: Manual verification**

Run: `npm run dev`
1. Navigate to `#admin-shyla` → should show token entry form
2. Regular navigation (#home, #recepten, etc.) still works
3. No admin link visible in header/footer

**Step 4: Commit**

```bash
git add src/router.ts
git commit -m "feat: add admin route to router"
```

---

### Task 9: Create image directories + placeholder files

**Files:**
- Create: `public/images/recipes/.gitkeep`
- Create: `public/images/blog/.gitkeep`

**Step 1: Create directories**

```bash
mkdir -p public/images/recipes public/images/blog
touch public/images/recipes/.gitkeep public/images/blog/.gitkeep
```

**Step 2: Commit**

```bash
git add public/images/recipes/.gitkeep public/images/blog/.gitkeep
git commit -m "chore: add image directories for recipes and blog"
```

---

### Task 10: Final verification

**Step 1: Full build**

Run: `npm run build`
Expected: Clean build, no errors, no warnings.

**Step 2: Dev server test**

Run: `npm run dev`

Test checklist:
- [ ] `#home` loads correctly
- [ ] `#recepten` shows recipe cards with emoji fallback
- [ ] Recipe category filtering works
- [ ] `#blog` shows blog cards with gradient+emoji fallback
- [ ] `#contact` form works
- [ ] `#admin-shyla` shows token entry form
- [ ] No admin link in header or footer
- [ ] Responsive: check mobile layout (< 768px) for admin
- [ ] Responsive: check mobile layout for recipe and blog cards

**Step 3: Token + admin test (requires real GitHub token)**

1. Go to `#admin-shyla`
2. Enter a GitHub PAT with `repo` scope
3. Click "Inloggen" → should show dashboard
4. Verify existing recipes and blog posts appear in item lists
5. Test adding a recipe with photo → verify API calls succeed
6. Test deploy status polling → should show "Publiceren..." → "Live!"
7. Test deleting an item → verify confirmation dialog + API call
8. Close and reopen tab → token should persist (localStorage)

**Step 4: Commit any fixes**

If any issues found during testing, fix and commit.
