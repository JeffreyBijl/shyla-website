import type { Recipe, RecipeCategory } from '../data/types.js'
import {
  readModifyWrite, uploadImage, CONFIG,
} from './github.js'
import { compressWithToast, slugify } from './image.js'
import { escapeHtml } from '../utils.js'
import { adminState } from './state.js'
import { pollDeploy, setupImagePreview, handleDelete } from './shared.js'
import { validateField, validateFileField, setupFieldBlurValidation } from './validation.js'

// --- Render ---

export function renderRecipeForm(): string {
  return `
    <div class="admin-form">
      <h3 id="recipe-form-title">Nieuw recept toevoegen</h3>
      <div class="admin-image-upload">
        <label>Foto <span id="recipe-image-required">(verplicht)</span></label>
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
      <div class="admin-form-actions">
        <button class="btn btn-primary" id="recipe-submit">Opslaan</button>
        <button class="btn btn-outline" id="recipe-cancel-edit" style="display:none;">Annuleren</button>
      </div>
    </div>
  `
}

// --- Render item list ---

export function renderRecipeItems(): void {
  const container = document.getElementById('recipes-items')
  if (!container) return
  container.innerHTML = adminState.recipes.map(r => `
    <div class="admin-item" data-id="${r.id}">
      <div class="admin-item-thumbnail">
        ${r.image
          ? `<img src="${import.meta.env.BASE_URL}${r.image}" alt="${escapeHtml(r.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display=''">`
          : ''}
        <span class="emoji-fallback" ${r.image ? 'style="display:none"' : ''}>${escapeHtml(r.emoji || '🍽️')}</span>
      </div>
      <div class="admin-item-info">
        <div class="admin-item-title">${escapeHtml(r.title)}</div>
        <div class="admin-item-meta">${escapeHtml(r.category)} · ${escapeHtml(r.time)}</div>
      </div>
      <button class="admin-item-edit" data-id="${r.id}" title="Bewerken">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="admin-item-delete" data-id="${r.id}" data-type="recipe" title="Verwijderen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>
  `).join('')
}

// --- Dynamic row helpers ---

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

// --- Edit helpers ---

function setRecipeFormMode(mode: 'create' | 'edit', title?: string): void {
  const formTitle = document.getElementById('recipe-form-title')
  if (formTitle) formTitle.textContent = mode === 'edit' ? `Recept bewerken: ${title}` : 'Nieuw recept toevoegen'
  const imageRequired = document.getElementById('recipe-image-required')
  if (imageRequired) imageRequired.textContent = mode === 'edit' ? '(optioneel — bestaande foto blijft behouden)' : '(verplicht)'
  const submitBtn = document.getElementById('recipe-submit')
  if (submitBtn) submitBtn.textContent = mode === 'edit' ? 'Bijwerken' : 'Opslaan'
  const cancelBtn = document.getElementById('recipe-cancel-edit')
  if (cancelBtn) cancelBtn.style.display = mode === 'edit' ? '' : 'none'
}

function populateRecipeForm(recipe: Recipe): void {
  adminState.editingRecipeId = recipe.id
  setRecipeFormMode('edit', recipe.title)

  // Fill fields
  ;(document.getElementById('recipe-title') as HTMLInputElement).value = recipe.title
  ;(document.getElementById('recipe-category') as HTMLSelectElement).value = recipe.category
  ;(document.getElementById('recipe-time') as HTMLInputElement).value = recipe.time
  ;(document.getElementById('recipe-calories') as HTMLInputElement).value = recipe.calories
  ;(document.getElementById('recipe-description') as HTMLTextAreaElement).value = recipe.description
  ;(document.getElementById('recipe-servings') as HTMLInputElement).value = recipe.servings

  // Show existing image preview
  if (recipe.image) {
    const preview = document.getElementById('recipe-preview')
    const img = document.getElementById('recipe-preview-img') as HTMLImageElement
    if (preview && img) {
      img.src = `${import.meta.env.BASE_URL}${recipe.image}`
      preview.classList.add('has-image')
    }
  }

  // Fill ingredients
  const ingredientsList = document.getElementById('recipe-ingredients-list')
  if (ingredientsList) {
    ingredientsList.innerHTML = ''
    recipe.ingredients.forEach(ing => addIngredientRow(ingredientsList, ing.amount, ing.name))
  }

  // Fill steps
  const stepsList = document.getElementById('recipe-steps-list')
  if (stepsList) {
    stepsList.innerHTML = ''
    recipe.steps.forEach(step => addStepRow(stepsList, step))
  }

  // Fill nutrition
  ;(document.getElementById('recipe-kcal') as HTMLInputElement).value = recipe.nutrition.kcal ? String(recipe.nutrition.kcal) : ''
  ;(document.getElementById('recipe-protein') as HTMLInputElement).value = recipe.nutrition.protein ? String(recipe.nutrition.protein) : ''
  ;(document.getElementById('recipe-carbs') as HTMLInputElement).value = recipe.nutrition.carbs ? String(recipe.nutrition.carbs) : ''
  ;(document.getElementById('recipe-fat') as HTMLInputElement).value = recipe.nutrition.fat ? String(recipe.nutrition.fat) : ''

  // Scroll to form
  document.querySelector('.admin-form')?.scrollIntoView({ behavior: 'smooth' })
}

function cancelRecipeEdit(): void {
  adminState.editingRecipeId = null
  clearRecipeForm()
  setRecipeFormMode('create')
}

// --- Submit handler ---

async function handleRecipeSubmit(): Promise<void> {
  const title = (document.getElementById('recipe-title') as HTMLInputElement)?.value.trim()
  const category = (document.getElementById('recipe-category') as HTMLSelectElement)?.value as RecipeCategory
  const time = (document.getElementById('recipe-time') as HTMLInputElement)?.value.trim()
  const calories = (document.getElementById('recipe-calories') as HTMLInputElement)?.value.trim()
  const description = (document.getElementById('recipe-description') as HTMLTextAreaElement)?.value.trim()
  const imageInput = document.getElementById('recipe-image') as HTMLInputElement
  const file = imageInput?.files?.[0]
  const servings = (document.getElementById('recipe-servings') as HTMLInputElement)?.value.trim()

  const ingredientRows = document.querySelectorAll('.admin-ingredient-row')
  const ingredients: Array<{ amount: string; name: string }> = []
  ingredientRows.forEach(row => {
    const amount = (row.querySelector('.ingredient-amount-input') as HTMLInputElement)?.value.trim()
    const name = (row.querySelector('.ingredient-name-input') as HTMLInputElement)?.value.trim()
    if (amount || name) ingredients.push({ amount, name })
  })

  const stepRows = document.querySelectorAll('.admin-step-row textarea')
  const steps: string[] = []
  stepRows.forEach(ta => {
    const text = (ta as HTMLTextAreaElement).value.trim()
    if (text) steps.push(text)
  })

  const kcal = Number((document.getElementById('recipe-kcal') as HTMLInputElement)?.value) || 0
  const protein = Number((document.getElementById('recipe-protein') as HTMLInputElement)?.value) || 0
  const carbs = Number((document.getElementById('recipe-carbs') as HTMLInputElement)?.value) || 0
  const fat = Number((document.getElementById('recipe-fat') as HTMLInputElement)?.value) || 0

  const isEditing = adminState.editingRecipeId !== null
  const editId = adminState.editingRecipeId

  const titleInput = document.getElementById('recipe-title') as HTMLInputElement
  let valid = validateField(titleInput, { required: true })

  if (!isEditing) {
    const recipeImageInput = document.getElementById('recipe-image') as HTMLInputElement
    const preview = document.getElementById('recipe-preview')
    const imageValid = validateFileField(recipeImageInput, preview)
    valid = imageValid && valid
  }

  if (!valid) return

  // Compress image before enqueuing (CPU work, fast)
  let compressed: { base64: string } | null = null
  try {
    if (file) compressed = await compressWithToast(file)
  } catch { return }

  // Optimistic UI update
  if (isEditing && editId !== null) {
    const index = adminState.recipes.findIndex(r => r.id === editId)
    if (index !== -1) {
      const existing = adminState.recipes[index]
      adminState.recipes[index] = {
        ...existing,
        title,
        slug: slugify(title),
        category,
        time,
        calories,
        description,
        servings,
        ingredients,
        steps,
        nutrition: { kcal, protein, carbs, fat },
      }
    }
  } else {
    const newId = adminState.recipes.length > 0 ? Math.max(...adminState.recipes.map(r => r.id)) + 1 : 1
    adminState.recipes.push({
      id: newId,
      title,
      slug: slugify(title),
      category,
      image: '',
      emoji: '',
      time,
      calories,
      description,
      servings,
      ingredients,
      steps,
      nutrition: { kcal, protein, carbs, fat },
    })
  }

  renderRecipeItems()
  cancelRecipeEdit()

  const commitMsg = isEditing ? `Recept bijgewerkt: ${title}` : `Nieuw recept: ${title}`

  // Enqueue the actual GitHub operation
  adminState.operationQueue.enqueue({
    label: commitMsg,
    execute: async () => {
      let imagePath: string | undefined

      if (compressed) {
        const filename = `${slugify(title)}-${Date.now()}.jpg`
        const uploadedPath = await uploadImage(CONFIG.RECIPE_IMAGES_DIR, filename, compressed.base64)
        imagePath = uploadedPath.replace(/^public\//, '')
      }

      adminState.recipes = await readModifyWrite<Recipe[]>(
        CONFIG.RECIPES_PATH,
        (data) => {
          if (isEditing && editId !== null) {
            const index = data.findIndex(r => r.id === editId)
            if (index === -1) throw new Error('Recept niet gevonden')
            const existing = data[index]
            data[index] = {
              ...existing,
              title,
              slug: slugify(title),
              category,
              image: imagePath ?? existing.image,
              time,
              calories,
              description,
              servings,
              ingredients,
              steps,
              nutrition: { kcal, protein, carbs, fat },
            }
          } else {
            const newId = data.length > 0 ? Math.max(...data.map(r => r.id)) + 1 : 1
            data.push({
              id: newId,
              title,
              slug: slugify(title),
              category,
              image: imagePath!,
              emoji: '',
              time,
              calories,
              description,
              servings,
              ingredients,
              steps,
              nutrition: { kcal, protein, carbs, fat },
            })
          }
          return data
        },
        commitMsg,
      )
      renderRecipeItems()
      pollDeploy()
    },
  })
}

// --- Clear form ---

export function clearRecipeForm(): void {
  ;(document.getElementById('recipe-title') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-time') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-calories') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-description') as HTMLTextAreaElement).value = ''
  ;(document.getElementById('recipe-image') as HTMLInputElement).value = ''
  document.getElementById('recipe-preview')?.classList.remove('has-image')
  const info = document.getElementById('recipe-image-info')
  if (info) info.textContent = ''
  ;(document.getElementById('recipe-servings') as HTMLInputElement).value = ''
  const ingredientsList = document.getElementById('recipe-ingredients-list')
  if (ingredientsList) ingredientsList.innerHTML = ''
  const stepsList = document.getElementById('recipe-steps-list')
  if (stepsList) stepsList.innerHTML = ''
  ;(document.getElementById('recipe-kcal') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-protein') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-carbs') as HTMLInputElement).value = ''
  ;(document.getElementById('recipe-fat') as HTMLInputElement).value = ''
}

// --- Setup ---

export function setupRecipes(): void {
  // Recipe image preview
  setupImagePreview('recipe-image', 'recipe-preview', 'recipe-preview-img', 'recipe-image-info')

  // Recipe submit
  document.getElementById('recipe-submit')?.addEventListener('click', () => handleRecipeSubmit())

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

  // Cancel edit
  document.getElementById('recipe-cancel-edit')?.addEventListener('click', () => cancelRecipeEdit())

  // Edit & delete buttons (event delegation)
  document.getElementById('recipes-items')?.addEventListener('click', (e) => {
    const editBtn = (e.target as HTMLElement).closest('.admin-item-edit') as HTMLElement | null
    if (editBtn) {
      const recipe = adminState.recipes.find(r => r.id === Number(editBtn.dataset.id))
      if (recipe) populateRecipeForm(recipe)
      return
    }
    const btn = (e.target as HTMLElement).closest('.admin-item-delete') as HTMLElement | null
    if (btn) handleDelete(Number(btn.dataset.id), 'recipe', renderRecipeItems)
  })

  // Blur validation for title
  setupFieldBlurValidation('recipe-title', { required: true })
}
