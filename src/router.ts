import { renderHome }                      from './pages/home.js'
import { renderAbout }                     from './pages/about.js'
import { renderRecipes, setupRecipes }     from './pages/recipes.js'
import { renderRecipeDetail, setupRecipeDetail } from './pages/recipe-detail.js'
import { renderBlog }                      from './pages/blog.js'
import { renderBlogDetail, setupBlogDetail } from './pages/blog-detail.js'
import { renderContact, setupContact }     from './pages/contact.js'
import { renderAdmin, setupAdmin }         from './admin/page.js'

type PageSetup = () => void

interface Route {
  render: () => string
  setup?: PageSetup
}

const routes: Record<string, Route> = {
  '#home':     { render: renderHome },
  '#about':    { render: renderAbout },
  '#recepten': { render: renderRecipes, setup: setupRecipes },
  '#blog':     { render: renderBlog },
  '#contact':     { render: renderContact, setup: setupContact },
  '#admin-shyla': { render: renderAdmin, setup: setupAdmin },
}

export function navigate(): void {
  const hash  = window.location.hash || '#home'
  const app   = document.getElementById('app')
  if (!app) return

  // Check for parameterized recipe route
  if (hash.startsWith('#recept/')) {
    const slug = decodeURIComponent(hash.slice('#recept/'.length))
    app.innerHTML = `<div class="page-enter">${renderRecipeDetail(slug)}</div>`
    setupRecipeDetail()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  if (hash.startsWith('#blog/')) {
    const slug = decodeURIComponent(hash.slice('#blog/'.length))
    app.innerHTML = `<div class="page-enter">${renderBlogDetail(slug)}</div>`
    setupBlogDetail()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  const route = routes[hash] ?? routes['#home']
  app.innerHTML = `<div class="page-enter">${route.render()}</div>`
  route.setup?.()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function setupRouter(): void {
  window.addEventListener('hashchange', navigate)
  navigate()
}
