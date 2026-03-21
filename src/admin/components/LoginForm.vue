<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { toastError } from '../../components/toast'

const auth = useAuthStore()
const token = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!token.value.trim()) {
    toastError('Voer een token in')
    return
  }
  loading.value = true
  const valid = await auth.login(token.value.trim())
  if (!valid) {
    toastError('Token is ongeldig. Controleer of het correct is en "repo" scope heeft.')
  }
  loading.value = false
}
</script>

<template>
  <section class="section admin-section">
    <div class="container">
      <div class="admin-token-card">
        <h2>Admin login</h2>
        <p>Voer je GitHub Personal Access Token in om content te beheren.</p>
        <div class="form-group">
          <label for="admin-token">Token</label>
          <input
            type="password"
            id="admin-token"
            v-model="token"
            placeholder="ghp_xxxxxxxxxxxx"
            @keyup.enter="handleLogin"
          >
        </div>
        <button class="btn btn-primary" :disabled="loading" @click="handleLogin">
          {{ loading ? 'Controleren...' : 'Inloggen' }}
        </button>
        <p class="admin-token-warning">Deel dit token met niemand.</p>
      </div>
    </div>
  </section>
</template>
