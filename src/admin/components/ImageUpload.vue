<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  label: string
  required?: boolean
  existingImage?: string | null
}>()

const emit = defineEmits<{
  fileSelected: [file: File]
}>()

const fileInput = ref<HTMLInputElement>()
const previewUrl = ref<string | null>(null)
const hasImage = ref(false)
const imageInfo = ref('')

watch(() => props.existingImage, (img) => {
  if (img) {
    previewUrl.value = `${import.meta.env.BASE_URL}${img}`
    hasImage.value = true
  }
}, { immediate: true })

function onFileChange() {
  const file = fileInput.value?.files?.[0]
  if (!file) return

  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
  hasImage.value = true

  const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
  imageInfo.value = `Origineel: ${sizeMB} MB — wordt automatisch verkleind bij opslaan`

  emit('fileSelected', file)
}

function reset() {
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  hasImage.value = false
  imageInfo.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

defineExpose({ reset, fileInput })
</script>

<template>
  <div class="admin-image-upload">
    <label>{{ label }} <span v-if="required !== false">({{ existingImage ? 'optioneel — bestaande foto blijft behouden' : 'verplicht' }})</span></label>
    <div class="admin-image-input-wrap">
      <span class="admin-image-btn">Kies foto</span>
      <input type="file" accept="image/*" ref="fileInput" @change="onFileChange">
    </div>
    <div class="admin-image-preview" :class="{ 'has-image': hasImage }">
      <img v-if="previewUrl" :src="previewUrl" alt="Preview">
    </div>
    <div class="admin-image-info" v-if="imageInfo">{{ imageInfo }}</div>
  </div>
</template>
