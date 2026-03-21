<script setup lang="ts">
import type { Ingredient } from '../../data/types'
import { RECIPE_UNITS } from '../../data/types'

const props = defineProps<{ modelValue: Ingredient }>()
const emit = defineEmits<{
  'update:modelValue': [value: Ingredient]
  remove: []
}>()

function update(field: keyof Ingredient, value: string | number | null) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<template>
  <div class="admin-ingredient-row">
    <input
      type="number"
      step="any"
      placeholder="Aantal"
      :value="modelValue.amount ?? ''"
      @input="update('amount', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
      class="ingredient-amount-input"
    >
    <select
      :value="modelValue.unit"
      @change="update('unit', ($event.target as HTMLSelectElement).value)"
      class="ingredient-unit-select"
    >
      <option value="">—</option>
      <option v-for="u in RECIPE_UNITS" :key="u" :value="u">{{ u }}</option>
    </select>
    <input
      type="text"
      placeholder="Ingredient"
      :value="modelValue.name"
      @input="update('name', ($event.target as HTMLInputElement).value)"
      class="ingredient-name-input"
    >
    <button type="button" class="admin-row-remove" title="Verwijderen" @click="emit('remove')">×</button>
  </div>
</template>
