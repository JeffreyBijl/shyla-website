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

  input?.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file || !preview || !img || !info) return

    const url = URL.createObjectURL(file)
    img.src = url
    preview.classList.add('has-image')

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
      document.getElementById(activeTab === 'recipes' ? 'feedback-recipes' : 'feedback-blog'),
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
    const compressed = await compressImage(file)

    showProgress(progress, progressText, 'Foto uploaden...')
    const filename = `${slugify(title)}-${Date.now()}.jpg`
    const imagePath = await uploadImage(CONFIG.RECIPE_IMAGES_DIR, filename, compressed.base64)

    showProgress(progress, progressText, 'Gegevens opslaan...')

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

    const latest = await readFile<BlogPost[]>(CONFIG.BLOG_PATH)
    blogPosts = latest.content
    blogSha = latest.sha

    const newId = blogPosts.length > 0 ? Math.max(...blogPosts.map(p => p.id)) + 1 : 1

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
    if (item.image) {
      await deleteFile(item.image, `Verwijder afbeelding: ${item.title}`)
    }

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
