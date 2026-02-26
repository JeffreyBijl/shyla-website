import { renderHome }                      from './pages/home.js'
import { renderAbout }                     from './pages/about.js'
import { renderRecipes, setupRecipes }     from './pages/recipes.js'
import { renderBlog }                      from './pages/blog.js'
import { renderContact, setupContact }     from './pages/contact.js'

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
  '#contact':  { render: renderContact, setup: setupContact },
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
