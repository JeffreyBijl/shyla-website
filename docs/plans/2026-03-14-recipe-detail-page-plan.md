# Recipe Detail Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add clickable recipe cards that navigate to a detail page with hero image, ingredients, preparation steps, and nutrition info.

**Architecture:** Extend the existing Recipe interface with new fields (slug, servings, ingredients, steps, nutrition). Add a new recipe detail page rendered by `renderRecipeDetail()`. Extend the hash router to support parameterized routes (`#recept/{slug}`). Update the admin form with fields for the new data.

**Tech Stack:** Vanilla TypeScript, Vite, pure CSS with custom properties

---

### Task 1: Extend Recipe data model

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/data/recipes.json`

**Step 1: Add new interfaces and fields to types.ts**

```typescript
export type RecipeCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack'

export interface Ingredient {
  amount: string
  name: string
}

export interface Nutrition {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface Recipe {
  id: number
  title: string
  slug: string
  category: RecipeCategory
  image: string | null
  emoji: string
  time: string
  calories: string
  description: string
  servings: string
  ingredients: Ingredient[]
  steps: string[]
  nutrition: Nutrition
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

**Step 2: Add default values to existing recipes in recipes.json**

Add to every existing recipe object:
```json
{
  "slug": "<slugified-title>",
  "servings": "",
  "ingredients": [],
  "steps": [],
  "nutrition": { "kcal": 0, "protein": 0, "carbs": 0, "fat": 0 }
}
```

Slug values:
- id 1: `"overnight-oats-met-aardbei"`
- id 2: `"avocado-toast-met-ei"`
- id 3: `"griekse-salade-bowl"`
- id 4: `"kip-teriyaki-met-quinoa"`
- id 5: `"zalm-met-geroosterde-groenten"`
- id 6: `"proteine-smoothie"`
- id 7: `"muscle-meat-mexicano"`

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/data/types.ts src/data/recipes.json
git commit -m "feat: extend Recipe model with slug, ingredients, steps, nutrition"
```

---

### Task 2: Make recipe cards clickable

**Files:**
- Modify: `src/pages/recipes.ts`

**Step 1: Wrap card in anchor tag**

In the `recipeCard()` function, wrap the entire `<article>` in an `<a>` tag linking to `#recept/{slug}`. The card needs to import the `slug` field.

Replace the return value of `recipeCard()`:

```typescript
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
              ${escapeHtml(recipe.calories)}
            </span>
          </div>
        </div>
      </article>
    </a>
  `
}
```

**Step 2: Update filter logic in setupRecipes()**

The filter currently looks for `.recipe-card` with `data-category`. Now the `data-category` is on the `<a>` wrapper (`.recipe-card-link`). Update `setupRecipes()`:

```typescript
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
```

**Step 3: Add CSS for clickable cards**

Add to `src/style.css` after the existing `.recipe-meta-item` block (after line 748):

```css
/* ── Recipe card link ───────────────────────────────── */
.recipe-card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-md);
  transition: transform var(--transition), box-shadow var(--transition);
}
.recipe-card-link:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
```

Also remove the hover from `.card` that applies to recipe cards — the hover is now on the link wrapper. Check if `.card` has hover styles that conflict; if so, add `.recipe-card { border: 1px solid var(--color-border); }` without hover override since the link handles it.

**Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/pages/recipes.ts src/style.css
git commit -m "feat: make recipe cards clickable with link to detail page"
```

---

### Task 3: Add parameterized routing

**Files:**
- Modify: `src/router.ts`

**Step 1: Extend router to support parameterized routes**

The router currently does exact hash matching. Add support for `#recept/{slug}` by checking for the prefix before falling back to exact match.

```typescript
import { renderHome }                      from './pages/home.js'
import { renderAbout }                     from './pages/about.js'
import { renderRecipes, setupRecipes }     from './pages/recipes.js'
import { renderRecipeDetail, setupRecipeDetail } from './pages/recipe-detail.js'
import { renderBlog }                      from './pages/blog.js'
import { renderContact, setupContact }     from './pages/contact.js'
import { renderAdmin, setupAdmin }         from './pages/admin.js'

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

  const route = routes[hash] ?? routes['#home']
  app.innerHTML = `<div class="page-enter">${route.render()}</div>`
  route.setup?.()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function setupRouter(): void {
  window.addEventListener('hashchange', navigate)
  navigate()
}
```

**Step 2: Create stub recipe-detail page**

Create file `src/pages/recipe-detail.ts` with a minimal stub so the router compiles:

```typescript
export function renderRecipeDetail(slug: string): string {
  return `<section class="section"><div class="container"><p>Detail: ${slug}</p></div></section>`
}

export function setupRecipeDetail(): void {}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/router.ts src/pages/recipe-detail.ts
git commit -m "feat: add parameterized routing for recipe detail pages"
```

---

### Task 4: Build the recipe detail page

**Files:**
- Modify: `src/pages/recipe-detail.ts`

**Step 1: Implement the full detail page render function**

```typescript
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
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/recipe-detail.ts
git commit -m "feat: implement recipe detail page with ingredients, steps, nutrition"
```

---

### Task 5: Add CSS for recipe detail page

**Files:**
- Modify: `src/style.css`

**Step 1: Add recipe detail styles**

Add after the recipe card link styles (after the `.recipe-card-link` block):

```css
/* ── Recipe detail page ─────────────────────────────── */
.recipe-detail-back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-pink);
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  transition: color var(--transition);
}
.recipe-detail-back:hover { color: var(--color-pink-hover); }

.recipe-detail-hero {
  width: 100%;
  max-height: 500px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 2rem;
}
.recipe-detail-hero img {
  width: 100%;
  height: 100%;
  max-height: 500px;
  object-fit: cover;
  display: block;
}
.recipe-detail-hero--fallback {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, var(--color-pink-light), #fff0f5);
}
.recipe-detail-emoji { font-size: 5rem; }

.recipe-detail-header { margin-bottom: 2.5rem; }
.recipe-detail-header .badge { margin-bottom: 0.75rem; }
.recipe-detail-header h1 { margin-bottom: 1rem; }
.recipe-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.recipe-detail-meta .recipe-meta-item { font-size: 0.95rem; }
.recipe-detail-description {
  font-size: 1.1rem;
  line-height: 1.75;
  max-width: 700px;
}

.recipe-detail-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

.recipe-detail-ingredients h2,
.recipe-detail-steps h2 {
  font-size: 1.3rem;
  margin-bottom: 1.25rem;
}

.recipe-detail-servings {
  font-size: 0.9rem;
  color: var(--color-gray-light);
  margin-bottom: 1rem;
}

.recipe-detail-ingredients ul {
  list-style: none;
}
.recipe-detail-ingredients li {
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.95rem;
}
.ingredient-amount {
  font-weight: 600;
  color: var(--color-gray);
  margin-right: 0.25rem;
}

.recipe-detail-steps ol {
  list-style: none;
  counter-reset: step-counter;
}
.recipe-detail-steps li {
  counter-increment: step-counter;
  position: relative;
  padding-left: 2.5rem;
  margin-bottom: 1.25rem;
  font-size: 0.95rem;
  line-height: 1.75;
}
.recipe-detail-steps li::before {
  content: counter(step-counter);
  position: absolute;
  left: 0;
  top: 0;
  width: 1.75rem;
  height: 1.75rem;
  background: var(--color-pink);
  color: var(--color-white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.recipe-detail-nutrition {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 2rem;
}
.recipe-detail-nutrition h2 {
  font-size: 1.3rem;
  margin-bottom: 1.25rem;
}
.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  text-align: center;
}
.nutrition-item {
  padding: 1rem;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
}
.nutrition-value {
  display: block;
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-pink);
  margin-bottom: 0.25rem;
}
.nutrition-label {
  font-size: 0.8rem;
  color: var(--color-gray-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Responsive recipe detail */
@media (max-width: 768px) {
  .recipe-detail-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .nutrition-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .recipe-detail-hero { max-height: 300px; }
  .recipe-detail-hero img { max-height: 300px; }
}
```

**Step 2: Verify the dev server shows the page correctly**

Run: `npm run dev`
Navigate to `#recept/muscle-meat-mexicano` in the browser — should show the detail page with hero image.

**Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat: add CSS styles for recipe detail page"
```

---

### Task 6: Update admin form with new recipe fields

**Files:**
- Modify: `src/pages/admin.ts`

**Step 1: Update renderRecipeForm() with new fields**

Add these fields after the description textarea (before the submit button):

```typescript
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
      <div class="form-group">
        <label for="recipe-servings">Porties</label>
        <input type="text" id="recipe-servings" placeholder="bijv. 4 personen">
      </div>
      <div class="form-group">
        <label>Ingrediënten</label>
        <div id="recipe-ingredients-list"></div>
        <button type="button" class="btn btn-outline btn-sm" id="add-ingredient">+ Ingredient</button>
      </div>
      <div class="form-group">
        <label>Bereidingsstappen</label>
        <div id="recipe-steps-list"></div>
        <button type="button" class="btn btn-outline btn-sm" id="add-step">+ Stap</button>
      </div>
      <div class="form-group">
        <label>Voedingswaarde (per portie)</label>
        <div class="admin-nutrition-grid">
          <div>
            <label for="recipe-kcal">kcal</label>
            <input type="number" id="recipe-kcal" placeholder="0">
          </div>
          <div>
            <label for="recipe-protein">Eiwit (g)</label>
            <input type="number" id="recipe-protein" placeholder="0">
          </div>
          <div>
            <label for="recipe-carbs">Koolhydraten (g)</label>
            <input type="number" id="recipe-carbs" placeholder="0">
          </div>
          <div>
            <label for="recipe-fat">Vet (g)</label>
            <input type="number" id="recipe-fat" placeholder="0">
          </div>
        </div>
      </div>
      <button class="btn btn-primary" id="recipe-submit">Opslaan</button>
    </div>
  `
}
```

**Step 2: Add dynamic ingredient/step row helpers**

Add these helper functions in admin.ts:

```typescript
function addIngredientRow(container: HTMLElement, amount = '', name = ''): void {
  const row = document.createElement('div')
  row.className = 'admin-ingredient-row'
  row.innerHTML = `
    <input type="text" placeholder="Hoeveelheid" value="${escapeHtml(amount)}" class="ingredient-amount-input">
    <input type="text" placeholder="Ingredient" value="${escapeHtml(name)}" class="ingredient-name-input">
    <button type="button" class="admin-row-remove" title="Verwijderen">×</button>
  `
  row.querySelector('.admin-row-remove')?.addEventListener('click', () => row.remove())
  container.appendChild(row)
}

function addStepRow(container: HTMLElement, text = ''): void {
  const row = document.createElement('div')
  row.className = 'admin-step-row'
  row.innerHTML = `
    <textarea placeholder="Beschrijf deze stap...">${escapeHtml(text)}</textarea>
    <button type="button" class="admin-row-remove" title="Verwijderen">×</button>
  `
  row.querySelector('.admin-row-remove')?.addEventListener('click', () => row.remove())
  container.appendChild(row)
}
```

**Step 3: Wire up the add buttons in setupDashboard()**

Add after the existing recipe submit listener in `setupDashboard()`:

```typescript
  // Ingredient add button
  document.getElementById('add-ingredient')?.addEventListener('click', () => {
    const list = document.getElementById('recipe-ingredients-list')
    if (list) addIngredientRow(list)
  })

  // Step add button
  document.getElementById('add-step')?.addEventListener('click', () => {
    const list = document.getElementById('recipe-steps-list')
    if (list) addStepRow(list)
  })
```

**Step 4: Update handleRecipeSubmit() to collect new fields**

After the existing field reads (title, category, etc.), add:

```typescript
  const servings = (document.getElementById('recipe-servings') as HTMLInputElement)?.value.trim()

  // Collect ingredients
  const ingredientRows = document.querySelectorAll('.admin-ingredient-row')
  const ingredients: Array<{ amount: string; name: string }> = []
  ingredientRows.forEach(row => {
    const amount = (row.querySelector('.ingredient-amount-input') as HTMLInputElement)?.value.trim()
    const name = (row.querySelector('.ingredient-name-input') as HTMLInputElement)?.value.trim()
    if (amount || name) ingredients.push({ amount, name })
  })

  // Collect steps
  const stepRows = document.querySelectorAll('.admin-step-row textarea')
  const steps: string[] = []
  stepRows.forEach(ta => {
    const text = (ta as HTMLTextAreaElement).value.trim()
    if (text) steps.push(text)
  })

  // Collect nutrition
  const kcal = Number((document.getElementById('recipe-kcal') as HTMLInputElement)?.value) || 0
  const protein = Number((document.getElementById('recipe-protein') as HTMLInputElement)?.value) || 0
  const carbs = Number((document.getElementById('recipe-carbs') as HTMLInputElement)?.value) || 0
  const fat = Number((document.getElementById('recipe-fat') as HTMLInputElement)?.value) || 0
```

Update the `newRecipe` object construction to include the new fields:

```typescript
    const newRecipe: Recipe = {
      id: newId,
      title,
      slug: slugify(title),
      category,
      image: imagePath.replace(/^public\//, ''),
      emoji: '',
      time,
      calories,
      description,
      servings,
      ingredients,
      steps,
      nutrition: { kcal, protein, carbs, fat },
    }
```

Note: `slugify` is already imported from `'../lib/image.js'`.

**Step 5: Update clearRecipeForm() to clear new fields**

Add to `clearRecipeForm()`:

```typescript
  ;(document.getElementById('recipe-servings') as HTMLInputElement).value = ''
  const ingredientsList = document.getElementById('recipe-ingredients-list')
  if (ingredientsList) ingredientsList.innerHTML = ''
  const stepsList = document.getElementById('recipe-steps-list')
  if (stepsList) stepsList.innerHTML = ''
  ;(document.getElementById('recipe-kcal') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-protein') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-carbs') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-fat') as HTMLInputElement).value = ''
```

**Step 6: Add admin form CSS for new elements**

Add to `src/style.css`:

```css
/* ── Admin form: ingredients & steps ────────────────── */
.admin-ingredient-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.admin-ingredient-row input:first-child { flex: 0 0 120px; }
.admin-ingredient-row input:nth-child(2) { flex: 1; }

.admin-step-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.admin-step-row textarea {
  flex: 1;
  min-height: 60px;
  resize: vertical;
}

.admin-row-remove {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--color-gray-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 0.25rem;
}
.admin-row-remove:hover {
  color: #e74c3c;
  border-color: #e74c3c;
}

.admin-nutrition-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}
.admin-nutrition-grid label {
  font-size: 0.8rem;
  color: var(--color-gray-light);
  margin-bottom: 0.25rem;
  display: block;
}

.btn-sm {
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
}

@media (max-width: 600px) {
  .admin-nutrition-grid { grid-template-columns: repeat(2, 1fr); }
  .admin-ingredient-row input:first-child { flex: 0 0 80px; }
}
```

**Step 7: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add src/pages/admin.ts src/style.css
git commit -m "feat: add ingredient, step, and nutrition fields to admin recipe form"
```

---

### Task 7: Manual verification

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test recipe cards**

- Navigate to `#recepten`
- Verify cards are clickable
- Click a card → should navigate to `#recept/{slug}`
- Verify the filter buttons still work

**Step 3: Test detail page**

- Verify hero image displays correctly for "Muscle meat mexicano"
- Verify emoji fallback for recipes without images
- Verify the back button navigates to `#recepten`
- Verify 404 page for `#recept/nonexistent`

**Step 4: Test admin form**

- Navigate to `#admin-shyla`
- Verify new fields appear (porties, ingrediënten, stappen, voedingswaarde)
- Click "+ Ingredient" — adds a row
- Click "+ Stap" — adds a row
- Click "×" on a row — removes it

**Step 5: Test responsive**

- Resize browser to mobile width
- Verify detail page stacks ingredients above steps
- Verify nutrition grid goes to 2 columns

**Step 6: Commit any fixes if needed**
