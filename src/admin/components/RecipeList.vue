<script setup lang="ts">
import { useRecipeStore } from '../stores/recipe'
import { useQueueStore } from '../stores/queue'
import { useUIStore } from '../stores/ui'
import { readModifyWrite, deleteFile, CONFIG } from '../github'
import type { Recipe } from '../../data/types'

const recipeStore = useRecipeStore()
const queueStore = useQueueStore()
const ui = useUIStore()
const baseUrl = import.meta.env.BASE_URL

function editRecipe(id: number) {
  recipeStore.editingRecipeId = id
  document.querySelector('.admin-form')?.scrollIntoView({ behavior: 'smooth' })
}

async function deleteRecipe(id: number) {
  const recipe = recipeStore.recipes.find(r => r.id === id)
  if (!recipe) return

  const confirmed = await ui.showDeleteConfirm(recipe.title)
  if (!confirmed) return

  recipeStore.recipes = recipeStore.recipes.filter(r => r.id !== id)

  queueStore.operationQueue.enqueue({
    label: `Verwijder: ${recipe.title}`,
    execute: async () => {
      recipeStore.recipes = await readModifyWrite<Recipe[]>(
        CONFIG.RECIPES_PATH,
        data => data.filter(r => r.id !== id),
        `Verwijder recept: ${recipe.title}`,
      )

      if (recipe.image) {
        await deleteFile(`public/${recipe.image}`, `Verwijder afbeelding: ${recipe.title}`).catch(() => {})
      }

      queueStore.pollDeploy()
    },
  })
}
</script>

<template>
  <div id="recipes-items">
    <div v-for="r in recipeStore.recipes" :key="r.id" class="admin-item" :data-id="r.id">
      <div class="admin-item-thumbnail">
        <img
          v-if="r.image"
          :src="`${baseUrl}${r.image}`"
          :alt="r.title"
          @error="($event.target as HTMLImageElement).style.display='none'; ($event.target as HTMLImageElement).nextElementSibling!.style.display=''"
        >
        <span class="emoji-fallback" :style="{ display: r.image ? 'none' : '' }">{{ r.emoji || '\uD83C\uDF7D\uFE0F' }}</span>
      </div>
      <div class="admin-item-info">
        <div class="admin-item-title">{{ r.title }}</div>
        <div class="admin-item-meta">{{ r.category }} · {{ r.time }}</div>
      </div>
      <button class="admin-item-edit" :data-id="r.id" title="Bewerken" @click="editRecipe(r.id)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="admin-item-delete" :data-id="r.id" title="Verwijderen" @click="deleteRecipe(r.id)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>
  </div>
</template>
