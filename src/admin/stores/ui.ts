import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const activeTab = ref<'recipes' | 'blog'>('recipes')

  const deleteModal = ref<{
    visible: boolean
    title: string
    resolve: ((confirmed: boolean) => void) | null
  }>({ visible: false, title: '', resolve: null })

  function showDeleteConfirm(title: string): Promise<boolean> {
    return new Promise((resolve) => {
      deleteModal.value = { visible: true, title, resolve }
    })
  }

  function resolveDeleteModal(confirmed: boolean) {
    if (deleteModal.value.resolve) {
      deleteModal.value.resolve(confirmed)
    }
    deleteModal.value = { visible: false, title: '', resolve: null }
  }

  return { activeTab, deleteModal, showDeleteConfirm, resolveDeleteModal }
})
