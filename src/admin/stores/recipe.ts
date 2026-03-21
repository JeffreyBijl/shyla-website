import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Recipe } from '../../data/types'
import { readFile, CONFIG } from '../github'
import { toastError } from '../../components/toast'

export const useRecipeStore = defineStore('recipe', () => {
  const recipes = ref<Recipe[]>([])
  const editingRecipeId = ref<number | null>(null)

  async function loadData() {
    try {
      const result = await readFile<Recipe[]>(CONFIG.RECIPES_PATH)
      recipes.value = result.content
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kan recepten niet laden'
      toastError(msg)
    }
  }

  return { recipes, editingRecipeId, loadData }
})
