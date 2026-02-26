import { recipes, type RecipeCategory } from '../data/recipes.js'

function recipeCard(recipe: typeof recipes[0]): string {
  return `
    <article class="card recipe-card" data-category="${recipe.category}">
      <div class="recipe-emoji-wrap">
        <span class="recipe-emoji">${recipe.emoji}</span>
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
