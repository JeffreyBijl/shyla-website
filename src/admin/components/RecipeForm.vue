<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { Recipe, RecipeCategory, Ingredient } from '../../data/types'
import { useAdminStore } from '../stores/admin'
import { readModifyWrite, uploadImage, CONFIG } from '../github'
import { compressWithToast, slugify } from '../image'
import { useValidation } from '../composables/useValidation'
import IngredientRow from './IngredientRow.vue'
import StepRow from './StepRow.vue'
import ImageUpload from './ImageUpload.vue'

const store = useAdminStore()
const imageUpload = ref<InstanceType<typeof ImageUpload>>()
const selectedFile = ref<File | null>(null)

const defaults = {
  title: '',
  category: 'ontbijt' as RecipeCategory,
  time: '',
  description: '',
  servings: '' as string | number,
  kcal: '' as string | number,
  protein: '' as string | number,
  carbs: '' as string | number,
  fat: '' as string | number,
  keywords: '',
  tips: '',
  datePublished: new Date().toISOString().split('T')[0],
}

const form = reactive({ ...defaults })
const ingredients = ref<Ingredient[]>([])
const steps = ref<string[]>([])

const { validateRequired, clearError, hasError } = useValidation()

const isEditing = computed(() => store.editingRecipeId !== null)
const editingRecipe = computed(() =>
  store.editingRecipeId !== null
    ? store.recipes.find(r => r.id === store.editingRecipeId) ?? null
    : null
)

const formTitle = computed(() =>
  isEditing.value && editingRecipe.value
    ? `Recept bewerken: ${editingRecipe.value.title}`
    : 'Nieuw recept toevoegen'
)

const imageRequiredText = computed(() =>
  isEditing.value ? '(optioneel — bestaande foto blijft behouden)' : '(verplicht)'
)

watch(() => store.editingRecipeId, (id) => {
  if (id === null) return
  const recipe = store.recipes.find(r => r.id === id)
  if (!recipe) return
  populateForm(recipe)
})

function populateForm(recipe: Recipe) {
  form.title = recipe.title
  form.category = recipe.category
  form.time = recipe.time
  form.description = recipe.description
  form.servings = recipe.servings
  form.kcal = recipe.nutrition.kcal || ''
  form.protein = recipe.nutrition.protein || ''
  form.carbs = recipe.nutrition.carbs || ''
  form.fat = recipe.nutrition.fat || ''
  form.keywords = recipe.keywords?.join(', ') || ''
  form.tips = recipe.tips || ''
  form.datePublished = recipe.datePublished || new Date().toISOString().split('T')[0]
  ingredients.value = recipe.ingredients.map(i => ({ ...i }))
  steps.value = [...recipe.steps]
}

function clearForm() {
  Object.assign(form, { ...defaults, datePublished: new Date().toISOString().split('T')[0] })
  ingredients.value = []
  steps.value = []
  selectedFile.value = null
  imageUpload.value?.reset()
  clearError('recipe-title')
}

function cancelEdit() {
  store.editingRecipeId = null
  clearForm()
}

function addIngredient() {
  ingredients.value.push({ amount: null, unit: '', name: '' })
}

function removeIngredient(index: number) {
  ingredients.value.splice(index, 1)
}

function addStep() {
  steps.value.push('')
}

function removeStep(index: number) {
  steps.value.splice(index, 1)
}

async function handleSubmit() {
  const titleValid = validateRequired('recipe-title', form.title)

  if (!isEditing.value && !selectedFile.value && !editingRecipe.value?.image) {
    // Image required for new recipes without an existing image
    if (!titleValid) return
    return
  }

  if (!titleValid) return

  const title = form.title.trim()
  const category = form.category
  const time = form.time.trim()
  const description = form.description.trim()
  const servings = Number(form.servings) || 1
  const kcal = Number(form.kcal) || 0
  const protein = Number(form.protein) || 0
  const carbs = Number(form.carbs) || 0
  const fat = Number(form.fat) || 0
  const keywordsRaw = form.keywords.trim()
  const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(Boolean) : undefined
  const tips = form.tips.trim() || ''
  const datePublished = form.datePublished || new Date().toISOString().split('T')[0]
  const dateModified = new Date().toISOString().split('T')[0]

  const validIngredients = ingredients.value.filter(i => i.name.trim())
  const validSteps = steps.value.filter(s => s.trim())

  const editId = store.editingRecipeId
  const wasEditing = isEditing.value

  // Compress image before enqueuing
  let compressed: { base64: string } | null = null
  try {
    if (selectedFile.value) compressed = await compressWithToast(selectedFile.value)
  } catch { return }

  // Optimistic UI update
  if (wasEditing && editId !== null) {
    const index = store.recipes.findIndex(r => r.id === editId)
    if (index !== -1) {
      const existing = store.recipes[index]
      store.recipes[index] = {
        ...existing,
        title,
        slug: slugify(title),
        category,
        time,
        description,
        servings,
        ingredients: validIngredients,
        steps: validSteps,
        nutrition: { kcal, protein, carbs, fat },
        keywords,
        tips,
        dateModified,
      }
    }
  } else {
    const newId = store.recipes.length > 0 ? Math.max(...store.recipes.map(r => r.id)) + 1 : 1
    store.recipes.push({
      id: newId,
      title,
      slug: slugify(title),
      category,
      image: '',
      emoji: '',
      time,
      description,
      servings,
      ingredients: validIngredients,
      steps: validSteps,
      nutrition: { kcal, protein, carbs, fat },
      keywords,
      tips,
      datePublished,
      dateModified,
    })
  }

  cancelEdit()

  const commitMsg = wasEditing ? `Recept bijgewerkt: ${title}` : `Nieuw recept: ${title}`

  store.operationQueue.enqueue({
    label: commitMsg,
    execute: async () => {
      let imagePath: string | undefined

      if (compressed) {
        const filename = `${slugify(title)}-${Date.now()}.jpg`
        const uploadedPath = await uploadImage(CONFIG.RECIPE_IMAGES_DIR, filename, compressed.base64)
        imagePath = uploadedPath.replace(/^public\//, '')
      }

      store.recipes = await readModifyWrite<Recipe[]>(
        CONFIG.RECIPES_PATH,
        (data) => {
          if (wasEditing && editId !== null) {
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
              description,
              servings,
              ingredients: validIngredients,
              steps: validSteps,
              nutrition: { kcal, protein, carbs, fat },
              keywords,
              tips,
              dateModified,
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
              description,
              servings,
              ingredients: validIngredients,
              steps: validSteps,
              nutrition: { kcal, protein, carbs, fat },
              keywords,
              tips,
              datePublished,
              dateModified,
            })
          }
          return data
        },
        commitMsg,
      )
      store.pollDeploy()
    },
  })
}
</script>

<template>
  <div class="admin-form">
    <h3>{{ formTitle }}</h3>

    <ImageUpload
      ref="imageUpload"
      label="Foto"
      :required="!isEditing"
      :existing-image="editingRecipe?.image"
      @file-selected="selectedFile = $event"
    />

    <div class="form-group">
      <label for="recipe-title">Titel</label>
      <input
        type="text"
        id="recipe-title"
        v-model="form.title"
        placeholder="bijv. Overnight oats met aardbei"
        :class="{ 'field-error': hasError('recipe-title') }"
        @input="clearError('recipe-title')"
        @blur="validateRequired('recipe-title', form.title)"
      >
      <span v-if="hasError('recipe-title')" class="field-error-message">Dit veld is verplicht</span>
    </div>

    <div class="form-group">
      <label for="recipe-category">Categorie</label>
      <select id="recipe-category" v-model="form.category">
        <option value="ontbijt">Ontbijt</option>
        <option value="lunch">Lunch</option>
        <option value="diner">Diner</option>
        <option value="snack">Snack</option>
        <option value="dessert">Dessert</option>
      </select>
    </div>

    <div class="form-group">
      <label for="recipe-time">Bereidingstijd</label>
      <input type="text" id="recipe-time" v-model="form.time" placeholder="bijv. 10 min">
    </div>

    <div class="form-group">
      <label for="recipe-description">Beschrijving</label>
      <textarea id="recipe-description" v-model="form.description" placeholder="Korte beschrijving (1-2 zinnen)"></textarea>
    </div>

    <div class="form-group">
      <label for="recipe-servings">Porties (personen)</label>
      <input type="number" min="1" id="recipe-servings" v-model="form.servings" placeholder="bijv. 4">
    </div>

    <div class="form-group">
      <label>Ingrediënten</label>
      <div>
        <IngredientRow
          v-for="(ing, index) in ingredients"
          :key="index"
          :model-value="ing"
          @update:model-value="ingredients[index] = $event"
          @remove="removeIngredient(index)"
        />
      </div>
      <button type="button" class="btn btn-outline btn-sm" @click="addIngredient">+ Ingredient</button>
    </div>

    <div class="form-group">
      <label>Bereidingsstappen</label>
      <div>
        <StepRow
          v-for="(step, index) in steps"
          :key="index"
          :model-value="step"
          @update:model-value="steps[index] = $event"
          @remove="removeStep(index)"
        />
      </div>
      <button type="button" class="btn btn-outline btn-sm" @click="addStep">+ Stap</button>
    </div>

    <div class="form-group">
      <label>Voedingswaarde (per portie)</label>
      <div class="admin-nutrition-grid">
        <div>
          <label for="recipe-kcal">kcal</label>
          <input type="number" id="recipe-kcal" v-model="form.kcal" placeholder="0">
        </div>
        <div>
          <label for="recipe-protein">Eiwit (g)</label>
          <input type="number" id="recipe-protein" v-model="form.protein" placeholder="0">
        </div>
        <div>
          <label for="recipe-carbs">Koolhydraten (g)</label>
          <input type="number" id="recipe-carbs" v-model="form.carbs" placeholder="0">
        </div>
        <div>
          <label for="recipe-fat">Vet (g)</label>
          <input type="number" id="recipe-fat" v-model="form.fat" placeholder="0">
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="recipe-keywords">Zoektermen (SEO)</label>
      <input type="text" id="recipe-keywords" v-model="form.keywords" placeholder="bijv. gezond ontbijt, overnight oats, makkelijk recept">
    </div>

    <div class="form-group">
      <label for="recipe-tips">Tips & variaties</label>
      <textarea id="recipe-tips" v-model="form.tips" placeholder="Extra tips of variaties voor dit recept..."></textarea>
    </div>

    <div class="form-group">
      <label for="recipe-date-published">Publicatiedatum</label>
      <input type="date" id="recipe-date-published" v-model="form.datePublished">
    </div>

    <div class="admin-form-actions">
      <button class="btn btn-primary" @click="handleSubmit">
        {{ isEditing ? 'Bijwerken' : 'Opslaan' }}
      </button>
      <button v-if="isEditing" class="btn btn-outline" @click="cancelEdit">
        Annuleren
      </button>
    </div>
  </div>
</template>
