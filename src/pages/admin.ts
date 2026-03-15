import type { Recipe, BlogPost } from '../data/types.js'
import {
  getToken, readFile, readModifyWrite, deleteFile,
  startDeployPolling, CONFIG,
} from '../lib/github.js'
import { escapeHtml } from '../lib/html.js'
import { toastSuccess, toastError, toastProgress } from '../lib/toast.js'
import { adminState } from './admin-state.js'
import { renderTokenForm, setupTokenForm, handleLogout } from './admin-auth.js'
import { renderRecipeForm, renderRecipeItems, setupRecipes } from './admin-recipes.js'
import { renderBlogForm, renderBlogItems, setupBlog } from './admin-blog.js'

// --- Render ---
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

// --- Setup ---
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

// --- Shared helpers (exported for recipes & blog modules) ---

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

export function showDeleteModal(title: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'admin-modal-overlay visible'
    overlay.innerHTML = `
      <div class="admin-modal">
        <div class="admin-modal-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </div>
        <h3 class="admin-modal-title">Verwijderen</h3>
        <p class="admin-modal-text">${escapeHtml(`Weet je zeker dat je "${title}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)}</p>
        <div class="admin-modal-actions">
          <button class="btn btn-outline" id="delete-modal-cancel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            Annuleren
          </button>
          <button class="btn admin-modal-delete-btn" id="delete-modal-confirm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            Verwijderen
          </button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    const confirmBtn = document.getElementById('delete-modal-confirm')!
    const cancelBtn = document.getElementById('delete-modal-cancel')!

    const cleanup = () => {
      overlay.remove()
      document.removeEventListener('keydown', onKey)
    }
    const onConfirm = () => { cleanup(); resolve(true) }
    const onCancel = () => { cleanup(); resolve(false) }
    const onOverlay = (e: Event) => { if (e.target === overlay) { cleanup(); resolve(false) } }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { cleanup(); resolve(false) } }

    confirmBtn.addEventListener('click', onConfirm)
    cancelBtn.addEventListener('click', onCancel)
    overlay.addEventListener('click', onOverlay)
    document.addEventListener('keydown', onKey)
  })
}

export async function handleDelete(id: number, type: 'recipe' | 'blog'): Promise<void> {
  const item = type === 'recipe'
    ? adminState.recipes.find(r => r.id === id)
    : adminState.blogPosts.find(p => p.id === id)

  if (!item) return

  const confirmed = await showDeleteModal(item.title)
  if (!confirmed) return

  if (type === 'recipe') {
    adminState.recipes = adminState.recipes.filter(r => r.id !== id)
    renderRecipeItems()
  } else {
    adminState.blogPosts = adminState.blogPosts.filter(p => p.id !== id)
    renderBlogItems()
  }

  adminState.operationQueue.enqueue({
    label: `Verwijder: ${item.title}`,
    execute: async () => {
      if (type === 'recipe') {
        adminState.recipes = await readModifyWrite<Recipe[]>(
          CONFIG.RECIPES_PATH,
          data => data.filter(r => r.id !== id),
          `Verwijder recept: ${item.title}`,
        )
      } else {
        adminState.blogPosts = await readModifyWrite<BlogPost[]>(
          CONFIG.BLOG_PATH,
          data => data.filter(p => p.id !== id),
          `Verwijder blogpost: ${item.title}`,
        )
      }

      if (item.image) {
        deleteFile(`public/${item.image}`, `Verwijder afbeelding: ${item.title}`).catch(() => {})
      }

      pollDeploy()
    },
  })
}
