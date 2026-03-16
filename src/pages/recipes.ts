import recipesData from '../data/recipes.json'
import type { Recipe, RecipeCategory } from '../data/types.js'
import { escapeHtml } from '../utils.js'

const recipes: Recipe[] = recipesData as Recipe[]

function recipeCard(recipe: Recipe): string {
  const imageHTML = recipe.image
    ? `<img src="${import.meta.env.BASE_URL}${recipe.image}" alt="${escapeHtml(recipe.title)}" loading="lazy">`
    : `<span class="recipe-emoji">${escapeHtml(recipe.emoji)}</span>`

  return `
    <a href="#recept/${encodeURIComponent(recipe.slug)}" class="recipe-card-link" data-category="${escapeHtml(recipe.category)}">
      <article class="card recipe-card">
        <div class="recipe-image-wrap ${recipe.image ? '' : 'recipe-image-wrap--fallback'}">
          ${imageHTML}
          <span class="recipe-category-badge badge badge-pink">${escapeHtml(recipe.category)}</span>
        </div>
        <div class="recipe-body">
          <h3 class="recipe-title">${escapeHtml(recipe.title)}</h3>
          <p>${escapeHtml(recipe.description)}</p>
          <div class="recipe-meta-row">
            <span class="recipe-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              ${escapeHtml(recipe.time)}
            </span>
            <span class="recipe-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              ${recipe.nutrition.kcal} kcal
            </span>
          </div>
        </div>
      </article>
    </a>
  `
}

export function renderRecipes(): string {
  const categories: Array<'alle' | RecipeCategory> = ['alle', 'ontbijt', 'lunch', 'diner', 'snack', 'dessert']

  const filterHTML = categories.map(cat => `
    <button class="filter-btn ${cat === 'alle' ? 'filter-btn--active' : ''}" data-filter="${cat}">
      ${cat === 'ontbijt' ? '☀️' : cat === 'lunch' ? '🥗' : cat === 'diner' ? '🍽️' : cat === 'snack' ? '🍎' : cat === 'dessert' ? '🍰' : '✨'}
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
      grid?.querySelectorAll<HTMLElement>('.recipe-card-link').forEach(link => {
        const show = filter === 'alle' || link.dataset.category === filter
        link.style.display = show ? '' : 'none'
        if (show) visibleCount++
      })

      if (empty) empty.hidden = visibleCount > 0
    })
  })
}
