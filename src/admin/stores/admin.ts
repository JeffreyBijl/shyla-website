import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Recipe, BlogPost } from '../../data/types'
import { getToken, saveToken, validateToken, readFile, startDeployPolling, CONFIG } from '../github'
import { OperationQueue } from '../queue'
import { toastSuccess, toastError, toastProgress } from '../../components/toast'

export const useAdminStore = defineStore('admin', () => {
  const recipes = ref<Recipe[]>([])
  const blogPosts = ref<BlogPost[]>([])
  const editingRecipeId = ref<number | null>(null)
  const editingBlogId = ref<number | null>(null)
  const activeTab = ref<'recipes' | 'blog'>('recipes')
  const isAuthenticated = ref(false)
  let stopCurrentPolling: (() => void) | null = null
  const operationQueue = new OperationQueue()

  const deleteModal = ref<{
    visible: boolean
    title: string
    resolve: ((confirmed: boolean) => void) | null
  }>({ visible: false, title: '', resolve: null })

  function initAuth() {
    isAuthenticated.value = !!getToken()
    if (isAuthenticated.value) {
      loadData()
      setupQueueToasts()
    }
  }

  async function login(token: string): Promise<boolean> {
    const valid = await validateToken(token)
    if (valid) {
      saveToken(token)
      isAuthenticated.value = true
      loadData()
      setupQueueToasts()
    }
    return valid
  }

  async function loadData() {
    try {
      const [recipesResult, blogResult] = await Promise.all([
        readFile<Recipe[]>(CONFIG.RECIPES_PATH),
        readFile<BlogPost[]>(CONFIG.BLOG_PATH),
      ])
      recipes.value = recipesResult.content
      blogPosts.value = blogResult.content
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kan data niet laden'
      toastError(msg)
    }
  }

  function setupQueueToasts() {
    let errorHandled = false

    operationQueue.setStatusCallback((status) => {
      if (status.total === 0 && !status.error) return

      if (status.error) {
        toastError(`Fout: ${status.error}`, 'queue', [
          { label: 'Opnieuw', onClick: () => operationQueue.retry() },
          { label: 'Annuleren', onClick: () => { operationQueue.clear(); loadData() } },
        ])
        if (!errorHandled) {
          errorHandled = true
          loadData()
        }
      } else if (status.completed === status.total && status.total > 0) {
        toastSuccess('Alle acties verwerkt!', 'queue')
      } else {
        errorHandled = false
        toastProgress(`Verwerken: ${status.completed + 1} van ${status.total} — ${status.current}`, 'queue')
      }
    })
  }

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

  function pollDeploy() {
    if (stopCurrentPolling) stopCurrentPolling()

    toastProgress('Website wordt bijgewerkt...', 'deploy')

    stopCurrentPolling = startDeployPolling((status) => {
      switch (status) {
        case 'queued':
          toastProgress('Website wordt bijgewerkt — in de wachtrij...', 'deploy')
          break
        case 'in_progress':
          toastProgress('Website wordt bijgewerkt — publiceren...', 'deploy')
          break
        case 'completed':
          stopCurrentPolling = null
          toastSuccess('Website is live!', 'deploy')
          break
        case 'failed':
          stopCurrentPolling = null
          toastError('Publicatie mislukt', 'deploy')
          break
      }
    })
  }

  return {
    recipes,
    blogPosts,
    editingRecipeId,
    editingBlogId,
    activeTab,
    isAuthenticated,
    operationQueue,
    deleteModal,
    initAuth,
    login,
    loadData,
    showDeleteConfirm,
    resolveDeleteModal,
    pollDeploy,
  }
})
