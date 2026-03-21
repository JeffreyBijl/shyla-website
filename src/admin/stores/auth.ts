import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getToken, saveToken, validateToken } from '../github'
import { useRecipeStore } from './recipe'
import { useBlogStore } from './blog'
import { useQueueStore } from './queue'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)

  function initAuth() {
    isAuthenticated.value = !!getToken()
    if (isAuthenticated.value) {
      onAuthenticated()
    }
  }

  async function login(token: string): Promise<boolean> {
    const valid = await validateToken(token)
    if (valid) {
      saveToken(token)
      isAuthenticated.value = true
      onAuthenticated()
    }
    return valid
  }

  function onAuthenticated() {
    loadAllData()
    useQueueStore().setupToasts()
  }

  async function loadAllData() {
    await Promise.all([
      useRecipeStore().loadData(),
      useBlogStore().loadData(),
    ])
  }

  return { isAuthenticated, initAuth, login, loadAllData }
})
