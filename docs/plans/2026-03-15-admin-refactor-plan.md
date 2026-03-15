# Admin Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the monolithic admin.ts into logical modules, add blog edit functionality with a rich-text editor, and add per-field form validation.

**Architecture:** Extract admin.ts into 5 modules (admin.ts coordinator, admin-state.ts, admin-auth.ts, admin-recipes.ts, admin-blog.ts, admin-validation.ts) sharing state via a single exported object. Add Quill rich-text editor via CDN for blog content. Add a blog detail page at `#blog/{slug}`. Implement per-field validation with red borders and error messages.

**Tech Stack:** TypeScript, Vite, Quill (CDN), vanilla DOM

---

### Task 1: Create admin-state.ts — shared state module

**Files:**
- Create: `src/pages/admin-state.ts`

**Step 1: Create the state module**

```typescript
import type { Recipe, BlogPost } from '../data/types.js'
import { OperationQueue } from '../lib/queue.js'

export const adminState = {
  recipes: [] as Recipe[],
  blogPosts: [] as BlogPost[],
  editingRecipeId: null as number | null,
  editingBlogId: null as number | null,
  stopCurrentPolling: null as (() => void) | null,
  operationQueue: new OperationQueue(),
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to admin-state.ts

**Step 3: Commit**

```bash
git add src/pages/admin-state.ts
git commit -m "feat: add admin-state module for shared admin state"
```

---

### Task 2: Create admin-validation.ts — per-field validation

**Files:**
- Create: `src/pages/admin-validation.ts`
- Modify: `src/style.css` (add validation styles)

**Step 1: Create the validation module**

```typescript
interface ValidationRule {
  required?: boolean
}

export function validateField(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLElement,
  rules: ValidationRule
): boolean {
  clearFieldError(input)

  if (rules.required) {
    const value = 'value' in input ? (input as HTMLInputElement).value.trim() : ''
    if (!value) {
      showFieldError(input, 'Dit veld is verplicht')
      return false
    }
  }

  return true
}

export function validateFileField(
  input: HTMLInputElement,
  previewContainer: HTMLElement | null,
): boolean {
  clearFieldError(input.closest('.admin-image-upload') ?? input)

  const hasFile = input.files && input.files.length > 0
  const hasExisting = previewContainer?.classList.contains('has-image') ?? false

  if (!hasFile && !hasExisting) {
    showFieldError(input.closest('.admin-image-upload') ?? input, 'Kies een foto')
    return false
  }

  return true
}

function showFieldError(input: HTMLElement, message: string): void {
  input.classList.add('field-error')

  const existing = input.parentElement?.querySelector('.field-error-message')
  if (existing) existing.remove()

  const span = document.createElement('span')
  span.className = 'field-error-message'
  span.textContent = message
  input.insertAdjacentElement('afterend', span)
}

export function clearFieldError(input: HTMLElement): void {
  input.classList.remove('field-error')
  const msg = input.parentElement?.querySelector('.field-error-message')
    ?? input.nextElementSibling
  if (msg?.classList.contains('field-error-message')) msg.remove()
}

export function setupFieldBlurValidation(
  fieldId: string,
  rules: ValidationRule
): void {
  const input = document.getElementById(fieldId)
  if (!input) return
  input.addEventListener('blur', () => validateField(input as HTMLInputElement, rules))
  input.addEventListener('input', () => clearFieldError(input))
}
```

**Step 2: Add CSS for validation errors**

Add to `src/style.css` at the end of the admin section:

```css
/* --- Field validation --- */
.field-error {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.15);
}

.field-error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/pages/admin-validation.ts src/style.css
git commit -m "feat: add per-field validation module with error styling"
```

---

### Task 3: Create admin-auth.ts — token management

**Files:**
- Create: `src/pages/admin-auth.ts`

**Step 1: Create the auth module**

Extract from `admin.ts` lines 26-43 (renderTokenForm) and lines 366-393 (setupTokenForm). Also extract the login/logout logic from setupDashboard (lines 412-419).

```typescript
import {
  getToken, saveToken, clearToken, validateToken,
} from '../lib/github.js'
import { toastError } from '../lib/toast.js'

export function renderTokenForm(): string {
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
          <button class="btn btn-primary" id="token-submit">Inloggen</button>
          <p class="admin-token-warning">Deel dit token met niemand.</p>
        </div>
      </div>
    </section>
  `
}

export function setupTokenForm(onLogin: () => void): void {
  const input = document.getElementById('admin-token') as HTMLInputElement
  const submit = document.getElementById('token-submit')

  submit?.addEventListener('click', async () => {
    const token = input?.value.trim()
    if (!token) {
      toastError('Voer een token in')
      return
    }
    submit.textContent = 'Controleren...'
    ;(submit as HTMLButtonElement).disabled = true

    const valid = await validateToken(token)
    if (valid) {
      saveToken(token)
      onLogin()
    } else {
      toastError('Token is ongeldig. Controleer of het correct is en "repo" scope heeft.')
      submit.textContent = 'Inloggen'
      ;(submit as HTMLButtonElement).disabled = false
    }
  })
}

export function handleLogout(onLogout: () => void): void {
  clearToken()
  onLogout()
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/pages/admin-auth.ts
git commit -m "feat: extract admin auth module from admin.ts"
```

---

### Task 4: Create admin-recipes.ts — recipe CRUD

**Files:**
- Create: `src/pages/admin-recipes.ts`

**Step 1: Create the recipes module**

Extract from `admin.ts`:
- `renderRecipeForm()` (lines 81-162)
- `renderRecipeItems()` (lines 206-233)
- `addIngredientRow()` (lines 266-276)
- `addStepRow()` (lines 278-287)
- `setRecipeFormMode()` (lines 291-300)
- `populateRecipeForm()` (lines 302-346)
- `cancelRecipeEdit()` (lines 348-352)
- `handleRecipeSubmit()` (lines 534-693)
- `clearRecipeForm()` (lines 903-921)
- Recipe-specific parts of `setupDashboard()` (lines 421-458)

Import state from `admin-state.ts`. Import validation from `admin-validation.ts`.

Key changes:
- Use `adminState.recipes` instead of local `recipes` variable
- Use `adminState.editingRecipeId` instead of local `editingRecipeId`
- Use `adminState.operationQueue` instead of local `operationQueue`
- Add validation in `handleRecipeSubmit()`:

Replace the old validation block:
```typescript
// OLD:
if (!title || !time || !calories || !description) {
  toastError('Vul alle velden in')
  return
}
if (!isEditing && !file) {
  toastError('Kies een foto')
  return
}

// NEW:
import { validateField, validateFileField } from './admin-validation.js'

const titleInput = document.getElementById('recipe-title') as HTMLInputElement
let valid = validateField(titleInput, { required: true })

if (!isEditing) {
  const imageInput = document.getElementById('recipe-image') as HTMLInputElement
  const preview = document.getElementById('recipe-preview')
  const imageValid = validateFileField(imageInput, preview)
  valid = imageValid && valid
}

if (!valid) return
```

Export:
- `renderRecipeForm()`
- `renderRecipeItems()`
- `setupRecipes()` — sets up all recipe event listeners
- `clearRecipeForm()`

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/pages/admin-recipes.ts
git commit -m "feat: extract admin recipes module with per-field validation"
```

---

### Task 5: Update BlogPost type — add slug, shortDescription, content

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/data/blog.json`

**Step 1: Update the BlogPost interface**

In `src/data/types.ts`, change the BlogPost interface:

```typescript
export interface BlogPost {
  id: number
  title: string
  slug: string
  date: string
  category: string
  image: string | null
  shortDescription: string
  readTime: string
  content: string
}
```

**Step 2: Update blog.json**

For each blog post in `src/data/blog.json`:
- Rename `excerpt` → `shortDescription`
- Add `slug` field (generated from title using slugify logic: lowercase, replace spaces with hyphens, remove special chars)
- Add `content` field (set to `""` for existing posts)

Example for post 1:
```json
{
  "id": 1,
  "title": "5 tips voor een gezond ontbijt dat je de hele ochtend volhoudt",
  "slug": "5-tips-voor-een-gezond-ontbijt-dat-je-de-hele-ochtend-volhoudt",
  "date": "15 februari 2026",
  "category": "Voeding",
  "image": null,
  "shortDescription": "Een goed ontbijt is de basis van een productieve dag. Ontdek welke voedingsstoffen je niet mag overslaan en hoe je ze makkelijk in je ochtend verwerkt.",
  "readTime": "4 min",
  "content": ""
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: Errors in `admin.ts` and `blog.ts` where `excerpt` is referenced — these will be fixed in upcoming tasks.

**Step 4: Commit**

```bash
git add src/data/types.ts src/data/blog.json
git commit -m "feat: add slug, shortDescription, content fields to BlogPost type"
```

---

### Task 6: Add Quill CDN to index.html

**Files:**
- Modify: `index.html`

**Step 1: Add Quill CSS and JS to the `<head>`**

In `index.html`, add before the closing `</head>` tag:

```html
<link href="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js"></script>
```

**Step 2: Verify dev server still works**

Run: `npx vite --open`
Expected: Site loads without errors, Quill is available on `window.Quill`

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Quill rich-text editor via CDN"
```

---

### Task 7: Create admin-blog.ts — blog CRUD with rich-text editor

**Files:**
- Create: `src/pages/admin-blog.ts`

**Step 1: Create the blog module**

Extract from `admin.ts`:
- `renderBlogForm()` (lines 164-201)
- `renderBlogItems()` (lines 235-257)
- `categoryEmoji()` (lines 259-262)
- `handleBlogSubmit()` (lines 696-776)
- `clearBlogForm()` (lines 923-931)
- Blog-specific parts of `setupDashboard()` (lines 424-425, 443, 460-463)

Key changes to make:

**a) Update renderBlogForm() — add edit mode, content editor, rename excerpt:**

```typescript
export function renderBlogForm(): string {
  return `
    <div class="admin-form">
      <h3 id="blog-form-title">Nieuwe blogpost toevoegen</h3>
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
        <label for="blog-short-description">Korte beschrijving</label>
        <textarea id="blog-short-description" placeholder="Korte beschrijving voor de kaart"></textarea>
      </div>
      <div class="form-group">
        <label for="blog-readtime">Leestijd</label>
        <input type="text" id="blog-readtime" placeholder="bijv. 4 min">
      </div>
      <div class="form-group">
        <label>Inhoud</label>
        <div id="blog-editor"></div>
      </div>
      <div class="admin-form-actions">
        <button class="btn btn-primary" id="blog-submit">Opslaan</button>
        <button class="btn btn-outline" id="blog-cancel-edit" style="display:none;">Annuleren</button>
      </div>
    </div>
  `
}
```

**b) Add Quill initialization in setupBlog():**

Declare `quillInstance` at module scope. Quill is available on `window` via CDN.

```typescript
declare const Quill: any
let quillInstance: any = null

export function setupBlog(): void {
  // Initialize Quill editor
  quillInstance = new Quill('#blog-editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ],
    },
    placeholder: 'Schrijf je blogpost...',
  })

  // Image preview
  setupImagePreview('blog-image', 'blog-preview', 'blog-preview-img', 'blog-image-info')

  // Blog submit
  document.getElementById('blog-submit')?.addEventListener('click', () => handleBlogSubmit())

  // Blog cancel edit
  document.getElementById('blog-cancel-edit')?.addEventListener('click', () => cancelBlogEdit())

  // Edit & delete buttons (event delegation)
  document.getElementById('blog-items')?.addEventListener('click', (e) => {
    const editBtn = (e.target as HTMLElement).closest('.admin-item-edit') as HTMLElement | null
    if (editBtn) {
      const post = adminState.blogPosts.find(p => p.id === Number(editBtn.dataset.id))
      if (post) populateBlogForm(post)
      return
    }
    const btn = (e.target as HTMLElement).closest('.admin-item-delete') as HTMLElement | null
    if (btn) handleDelete(Number(btn.dataset.id), 'blog')
  })

  // Blur validation
  setupFieldBlurValidation('blog-title', { required: true })
}
```

**c) Add edit/populate/cancel functions:**

```typescript
function setBlogFormMode(mode: 'create' | 'edit', title?: string): void {
  const formTitle = document.getElementById('blog-form-title')
  if (formTitle) formTitle.textContent = mode === 'edit' ? `Blog bewerken: ${title}` : 'Nieuwe blogpost toevoegen'
  const submitBtn = document.getElementById('blog-submit')
  if (submitBtn) submitBtn.textContent = mode === 'edit' ? 'Bijwerken' : 'Opslaan'
  const cancelBtn = document.getElementById('blog-cancel-edit')
  if (cancelBtn) cancelBtn.style.display = mode === 'edit' ? '' : 'none'
}

function populateBlogForm(post: BlogPost): void {
  adminState.editingBlogId = post.id
  setBlogFormMode('edit', post.title)

  ;(document.getElementById('blog-title') as HTMLInputElement).value = post.title
  ;(document.getElementById('blog-category') as HTMLSelectElement).value = post.category
  ;(document.getElementById('blog-short-description') as HTMLTextAreaElement).value = post.shortDescription
  ;(document.getElementById('blog-readtime') as HTMLInputElement).value = post.readTime

  if (quillInstance) {
    quillInstance.root.innerHTML = post.content
  }

  if (post.image) {
    const preview = document.getElementById('blog-preview')
    const img = document.getElementById('blog-preview-img') as HTMLImageElement
    if (preview && img) {
      img.src = `${import.meta.env.BASE_URL}${post.image}`
      preview.classList.add('has-image')
    }
  }

  document.querySelector('#tab-blog .admin-form')?.scrollIntoView({ behavior: 'smooth' })
}

function cancelBlogEdit(): void {
  adminState.editingBlogId = null
  clearBlogForm()
  setBlogFormMode('create')
}
```

**d) Update renderBlogItems() to include an edit button:**

```typescript
export function renderBlogItems(): void {
  const container = document.getElementById('blog-items')
  if (!container) return
  container.innerHTML = adminState.blogPosts.map(p => `
    <div class="admin-item" data-id="${p.id}">
      <div class="admin-item-thumbnail">
        ${p.image
          ? `<img src="${import.meta.env.BASE_URL}${p.image}" alt="${escapeHtml(p.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display=''">`
          : ''}
        <span class="emoji-fallback" ${p.image ? 'style="display:none"' : ''}>${categoryEmoji(p.category)}</span>
      </div>
      <div class="admin-item-info">
        <div class="admin-item-title">${escapeHtml(p.title)}</div>
        <div class="admin-item-meta">${escapeHtml(p.category)} · ${escapeHtml(p.date)}</div>
      </div>
      <button class="admin-item-edit" data-id="${p.id}" title="Bewerken">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="admin-item-delete" data-id="${p.id}" data-type="blog" title="Verwijderen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>
  `).join('')
}
```

**e) Update handleBlogSubmit() to support edit mode and content field:**

Replace `excerpt` references with `shortDescription`. Read content from Quill:

```typescript
const content = quillInstance ? quillInstance.root.innerHTML : ''
```

Add edit support in the optimistic update and the enqueued operation, same pattern as recipes (check `adminState.editingBlogId`).

Add validation:
```typescript
const titleInput = document.getElementById('blog-title') as HTMLInputElement
const valid = validateField(titleInput, { required: true })
if (!valid) return
```

**f) Update clearBlogForm():**

```typescript
export function clearBlogForm(): void {
  ;(document.getElementById('blog-title') as HTMLInputElement).value = ''
  ;(document.getElementById('blog-short-description') as HTMLTextAreaElement).value = ''
  ;(document.getElementById('blog-readtime') as HTMLInputElement).value = ''
  ;(document.getElementById('blog-image') as HTMLInputElement).value = ''
  document.getElementById('blog-preview')?.classList.remove('has-image')
  const info = document.getElementById('blog-image-info')
  if (info) info.textContent = ''
  if (quillInstance) quillInstance.root.innerHTML = ''
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/pages/admin-blog.ts
git commit -m "feat: extract admin blog module with edit, rich-text editor, and validation"
```

---

### Task 8: Rewrite admin.ts as coordinator

**Files:**
- Modify: `src/pages/admin.ts`

**Step 1: Rewrite admin.ts**

Replace the entire content of `admin.ts` with a slim coordinator that imports from the new modules:

```typescript
import { getToken } from '../lib/github.js'
import { renderTokenForm, setupTokenForm, handleLogout } from './admin-auth.js'
import { adminState } from './admin-state.js'
import { renderRecipeForm, renderRecipeItems, setupRecipes } from './admin-recipes.js'
import { renderBlogForm, renderBlogItems, setupBlog } from './admin-blog.js'
import { readFile, CONFIG, startDeployPolling } from '../lib/github.js'
import { toastError, toastSuccess, toastProgress } from '../lib/toast.js'
import type { Recipe, BlogPost } from '../data/types.js'

export function renderAdmin(): string {
  const token = getToken()
  if (!token) return renderTokenForm()
  return renderDashboard()
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
          <div class="admin-items-list" id="recipes-list">
            <h3>Bestaande recepten</h3>
            <div id="recipes-items"></div>
          </div>
        </div>

        <div class="admin-tab-content" id="tab-blog">
          ${renderBlogForm()}
          <div class="admin-items-list" id="blog-list">
            <h3>Bestaande blogposts</h3>
            <div id="blog-items"></div>
          </div>
        </div>
      </div>
    </section>
  `
}

export function setupAdmin(): void {
  const token = getToken()
  if (!token) {
    setupTokenForm(() => {
      const app = document.getElementById('app')
      if (app) {
        app.innerHTML = `<div class="page-enter">${renderDashboard()}</div>`
        loadData()
        setupDashboard()
      }
    })
  } else {
    loadData()
    setupDashboard()
  }
}

function setupDashboard(): void {
  // Tab switching
  document.querySelectorAll<HTMLButtonElement>('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab as 'recipes' | 'blog'
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
    handleLogout(() => {
      const app = document.getElementById('app')
      if (app) {
        app.innerHTML = `<div class="page-enter">${renderTokenForm()}</div>`
        setupTokenForm(() => {
          app.innerHTML = `<div class="page-enter">${renderDashboard()}</div>`
          loadData()
          setupDashboard()
        })
      }
    })
  })

  // Delegate to sub-modules
  setupRecipes()
  setupBlog()

  // Queue toasts
  setupQueueToasts()
}

function setupQueueToasts(): void {
  let errorHandled = false

  adminState.operationQueue.setStatusCallback((status) => {
    if (status.total === 0 && !status.error) return

    if (status.error) {
      toastError(`Fout: ${status.error}`, 'queue', [
        { label: 'Opnieuw', onClick: () => adminState.operationQueue.retry() },
        { label: 'Annuleren', onClick: () => { adminState.operationQueue.clear(); loadData() } },
      ])
      if (!errorHandled) {
        errorHandled = true
        loadData()
      }
    } else if (status.completed === status.total && status.total > 0) {
      toastSuccess('Alle acties verwerkt!', 'queue')
    } else {
      errorHandled = false
      toastProgress(`Verwerken: ${status.completed + 1} van ${status.total} — ${status.current}`, 'queue')
    }
  })
}

export async function loadData(): Promise<void> {
  try {
    const [recipesResult, blogResult] = await Promise.all([
      readFile<Recipe[]>(CONFIG.RECIPES_PATH),
      readFile<BlogPost[]>(CONFIG.BLOG_PATH),
    ])
    adminState.recipes = recipesResult.content
    adminState.blogPosts = blogResult.content
    renderRecipeItems()
    renderBlogItems()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kan data niet laden'
    toastError(msg)
  }
}

export function pollDeploy(): void {
  if (adminState.stopCurrentPolling) adminState.stopCurrentPolling()

  toastProgress('Website wordt bijgewerkt...', 'deploy')

  adminState.stopCurrentPolling = startDeployPolling((status) => {
    switch (status) {
      case 'queued':
        toastProgress('Website wordt bijgewerkt — in de wachtrij...', 'deploy')
        break
      case 'in_progress':
        toastProgress('Website wordt bijgewerkt — publiceren...', 'deploy')
        break
      case 'completed':
        adminState.stopCurrentPolling = null
        toastSuccess('Website is live!', 'deploy')
        break
      case 'failed':
        adminState.stopCurrentPolling = null
        toastError('Publicatie mislukt', 'deploy')
        break
    }
  })
}

export function setupImagePreview(
  inputId: string, previewId: string, imgId: string, infoId: string
): void {
  const input = document.getElementById(inputId) as HTMLInputElement
  const preview = document.getElementById(previewId)
  const img = document.getElementById(imgId) as HTMLImageElement
  const info = document.getElementById(infoId)

  input?.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file || !preview || !img || !info) return

    if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src)
    const url = URL.createObjectURL(file)
    img.src = url
    preview.classList.add('has-image')

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    info.textContent = `Origineel: ${sizeMB} MB — wordt automatisch verkleind bij opslaan`
  })
}
```

Note: `loadData()`, `pollDeploy()`, `setupImagePreview()`, and `showDeleteModal()` are exported from admin.ts because they're shared between recipes and blog modules. The `handleDelete()` function is also shared — keep it in admin.ts and export it, or move it to a shared location.

`showDeleteModal()` and `handleDelete()` should stay in admin.ts since they're shared:

```typescript
export function showDeleteModal(title: string): Promise<boolean> {
  // ... exact same code as current admin.ts lines 780-825
}

export async function handleDelete(id: number, type: 'recipe' | 'blog'): Promise<void> {
  // ... exact same code as current admin.ts lines 827-873
  // but using adminState.recipes and adminState.blogPosts
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Test in browser**

Run: `npx vite`
- Navigate to `#admin-shyla`
- Verify login works
- Verify recipe list loads
- Verify blog list loads
- Verify tab switching works
- Verify adding/editing/deleting a recipe still works
- Verify adding/editing/deleting a blog post works
- Verify validation shows red border on empty title

**Step 4: Commit**

```bash
git add src/pages/admin.ts
git commit -m "refactor: rewrite admin.ts as slim coordinator importing from modules"
```

---

### Task 9: Update blog.ts display page — use shortDescription

**Files:**
- Modify: `src/pages/blog.ts`

**Step 1: Update blog.ts**

Change line 46 from:
```typescript
<p>${escapeHtml(post.excerpt)}</p>
```
to:
```typescript
<p>${escapeHtml(post.shortDescription)}</p>
```

Change the "Lees meer" link on line 54 from:
```typescript
<a href="#" class="blog-read-btn">
```
to:
```typescript
<a href="#blog/${encodeURIComponent(post.slug)}" class="blog-read-btn">
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/pages/blog.ts
git commit -m "feat: use shortDescription and link to blog detail page"
```

---

### Task 10: Create blog-detail.ts — blog detail page

**Files:**
- Create: `src/pages/blog-detail.ts`
- Modify: `src/router.ts`

**Step 1: Create blog-detail.ts**

Follow the same pattern as `recipe-detail.ts`:

```typescript
import blogData from '../data/blog.json'
import type { BlogPost } from '../data/types.js'
import { escapeHtml } from '../lib/html.js'

const blogPosts: BlogPost[] = blogData as BlogPost[]

export function renderBlogDetail(slug: string): string {
  const post = blogPosts.find(p => p.slug === slug)

  if (!post) {
    return `
      <section class="section">
        <div class="container">
          <a href="#blog" class="recipe-detail-back">← Terug naar blog</a>
          <h1>Blogpost niet gevonden</h1>
          <p>Deze blogpost bestaat niet of is verwijderd.</p>
        </div>
      </section>
    `
  }

  const heroHTML = post.image
    ? `<div class="recipe-detail-hero">
        <img src="${import.meta.env.BASE_URL}${post.image}" alt="${escapeHtml(post.title)}">
      </div>`
    : ''

  return `
    <section class="section blog-detail-section">
      <div class="container">
        <a href="#blog" class="recipe-detail-back">← Terug naar blog</a>
        ${heroHTML}
        <div class="blog-detail-header">
          <span class="badge badge-pink">${escapeHtml(post.category)}</span>
          <h1>${escapeHtml(post.title)}</h1>
          <div class="blog-detail-meta">
            <span>${escapeHtml(post.date)}</span>
            <span>${escapeHtml(post.readTime)} leestijd</span>
          </div>
        </div>
        <div class="blog-detail-content">
          ${post.content}
        </div>
      </div>
    </section>
  `
}

export function setupBlogDetail(): void {
  // No interactive elements needed for now
}
```

**Step 2: Add route in router.ts**

Import the new page:
```typescript
import { renderBlogDetail, setupBlogDetail } from './pages/blog-detail.js'
```

Add a parameterized route check in the `navigate()` function, after the recipe route check (after line 37):

```typescript
if (hash.startsWith('#blog/')) {
  const slug = decodeURIComponent(hash.slice('#blog/'.length))
  app.innerHTML = `<div class="page-enter">${renderBlogDetail(slug)}</div>`
  setupBlogDetail()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  return
}
```

**Step 3: Add basic CSS for blog detail page**

Add to `src/style.css`:

```css
/* --- Blog detail --- */
.blog-detail-section { padding-top: 2rem; }

.blog-detail-header { margin-bottom: 2rem; }
.blog-detail-header h1 { margin: 0.5rem 0; }

.blog-detail-meta {
  display: flex;
  gap: 1.5rem;
  color: var(--color-gray-light);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.blog-detail-content {
  max-width: 700px;
  line-height: 1.8;
  font-size: 1.05rem;
}
.blog-detail-content h2 { margin-top: 2rem; margin-bottom: 0.5rem; }
.blog-detail-content h3 { margin-top: 1.5rem; margin-bottom: 0.5rem; }
.blog-detail-content p { margin-bottom: 1rem; }
.blog-detail-content ul, .blog-detail-content ol { margin-bottom: 1rem; padding-left: 1.5rem; }
.blog-detail-content a { color: var(--color-primary); }
```

**Step 4: Verify it compiles**

Run: `npx tsc --noEmit`

**Step 5: Test in browser**

- Navigate to `#blog`
- Click "Lees meer" on a blog post
- Verify it navigates to `#blog/{slug}`
- Verify the detail page renders with title, date, category, content
- Verify the back link works

**Step 6: Commit**

```bash
git add src/pages/blog-detail.ts src/router.ts src/style.css
git commit -m "feat: add blog detail page with routing"
```

---

### Task 11: Add Quill editor styling for admin

**Files:**
- Modify: `src/style.css`

**Step 1: Add Quill overrides**

Add to the admin section of `src/style.css`:

```css
/* --- Quill editor in admin --- */
#blog-editor {
  min-height: 200px;
  background: #fff;
  border-radius: 0 0 var(--radius) var(--radius);
}
#blog-editor .ql-editor {
  min-height: 200px;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.7;
}
```

**Step 2: Commit**

```bash
git add src/style.css
git commit -m "style: add Quill editor overrides for admin"
```

---

### Task 12: End-to-end smoke test

**Files:** none (manual testing)

**Step 1: Start dev server**

Run: `npx vite`

**Step 2: Test recipe flow**

1. Navigate to `#admin-shyla`, log in
2. Create a recipe with only a title → verify red border on image field
3. Create a recipe with only an image → verify red border on title field
4. Fill in title + image → verify it saves
5. Edit the recipe → verify form populates
6. Delete the recipe → verify modal and removal

**Step 3: Test blog flow**

1. Switch to Blog tab
2. Create a blog with empty title → verify red border on title field
3. Fill in title, write content in Quill editor → verify it saves
4. Edit the blog → verify form populates including Quill content
5. Navigate to `#blog`, click "Lees meer" → verify detail page shows content
6. Delete the blog → verify modal and removal

**Step 4: Test validation clears**

1. Leave title empty, click submit → red border appears
2. Start typing in title → red border disappears
3. Tab away from empty title → red border appears

**Step 5: Verify no console errors**

Open browser dev tools, check console for any errors during all flows above.

**Step 6: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```
