<script setup lang="ts">
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
</script>

<template>
  <div class="admin-tabs">
    <button
      class="admin-tab"
      :class="{ 'admin-tab--active': store.activeTab === 'recipes' }"
      @click="store.activeTab = 'recipes'"
    >
      Recepten
    </button>
    <button
      class="admin-tab"
      :class="{ 'admin-tab--active': store.activeTab === 'blog' }"
      @click="store.activeTab = 'blog'"
    >
      Blog
    </button>
  </div>
</template>
