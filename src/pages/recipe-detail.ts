import recipesData from '../data/recipes.json'
import type { Recipe } from '../data/types.js'

const recipes: Recipe[] = recipesData as Recipe[]

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

export function renderRecipeDetail(slug: string): string {
  const recipe = recipes.find(r => r.slug === slug)

  if (!recipe) {
    return `
      <section class="section">
        <div class="container">
          <a href="#recepten" class="recipe-detail-back">← Terug naar recepten</a>
          <h1>Recept niet gevonden</h1>
          <p>Dit recept bestaat niet of is verwijderd.</p>
        </div>
      </section>
    `
  }

  const heroHTML = recipe.image
    ? `<div class="recipe-detail-hero">
        <img src="${import.meta.env.BASE_URL}${recipe.image}" alt="${escapeHtml(recipe.title)}">
      </div>`
    : `<div class="recipe-detail-hero recipe-detail-hero--fallback">
        <span class="recipe-detail-emoji">${escapeHtml(recipe.emoji)}</span>
      </div>`

  const ingredientsHTML = recipe.ingredients.length > 0
    ? `<div class="recipe-detail-ingredients">
        <h2>Ingrediënten</h2>
        ${recipe.servings ? `<p class="recipe-detail-servings">${escapeHtml(recipe.servings)}</p>` : ''}
        <ul>
          ${recipe.ingredients.map(ing =>
            `<li><span class="ingredient-amount">${escapeHtml(ing.amount)}</span> ${escapeHtml(ing.name)}</li>`
          ).join('')}
        </ul>
      </div>`
    : ''

  const stepsHTML = recipe.steps.length > 0
    ? `<div class="recipe-detail-steps">
        <h2>Bereiding</h2>
        <ol>
          ${recipe.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
        </ol>
      </div>`
    : ''

  const hasNutrition = recipe.nutrition && recipe.nutrition.kcal > 0
  const nutritionHTML = hasNutrition
    ? `<div class="recipe-detail-nutrition">
        <h2>Voedingswaarde</h2>
        <div class="nutrition-grid">
          <div class="nutrition-item">
            <span class="nutrition-value">${recipe.nutrition.kcal}</span>
            <span class="nutrition-label">kcal</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-value">${recipe.nutrition.protein}g</span>
            <span class="nutrition-label">eiwit</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-value">${recipe.nutrition.carbs}g</span>
            <span class="nutrition-label">koolhydraten</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-value">${recipe.nutrition.fat}g</span>
            <span class="nutrition-label">vet</span>
          </div>
        </div>
      </div>`
    : ''

  const hasDetailContent = recipe.ingredients.length > 0 || recipe.steps.length > 0

  return `
    <section class="section recipe-detail-section">
      <div class="container">
        <a href="#recepten" class="recipe-detail-back">← Terug naar recepten</a>
        ${heroHTML}
        <div class="recipe-detail-header">
          <span class="badge badge-pink">${escapeHtml(recipe.category)}</span>
          <h1>${escapeHtml(recipe.title)}</h1>
          <div class="recipe-detail-meta">
            <span class="recipe-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              ${escapeHtml(recipe.time)}
            </span>
            <span class="recipe-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              ${escapeHtml(recipe.calories)}
            </span>
            ${recipe.servings ? `
              <span class="recipe-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                ${escapeHtml(recipe.servings)}
              </span>
            ` : ''}
          </div>
          <p class="recipe-detail-description">${escapeHtml(recipe.description)}</p>
        </div>
        ${hasDetailContent ? `
          <div class="recipe-detail-content">
            ${ingredientsHTML}
            ${stepsHTML}
          </div>
        ` : ''}
        ${nutritionHTML}
      </div>
    </section>
  `
}

export function setupRecipeDetail(): void {
  // No interactive elements needed for now
}
