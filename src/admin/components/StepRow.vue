<script setup lang="ts">
defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  remove: []
}>()
</script>

<template>
  <div class="admin-step-row">
    <textarea
      placeholder="Beschrijf deze stap..."
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    ></textarea>
    <button type="button" class="admin-row-remove" title="Verwijderen" @click="emit('remove')">×</button>
  </div>
</template>
