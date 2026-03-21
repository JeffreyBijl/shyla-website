import type { Recipe, BlogPost } from '../data/types.js'
import { getToken, readFile, CONFIG } from './github.js'
import { toastSuccess, toastError, toastProgress } from '../components/toast.js'
import { adminState } from './state.js'
import { renderTokenForm, setupTokenForm } from './auth.js'
import { renderRecipeForm, renderRecipeItems, setupRecipes } from './recipes.js'
import { renderBlogForm, renderBlogItems, setupBlog } from './blog.js'

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
      const app = document.getElementById('admin-app')
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

// --- Load data (only used in this module) ---

async function loadData(): Promise<void> {
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
