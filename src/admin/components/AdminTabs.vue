<script setup lang="ts">
import { useUIStore } from '../stores/ui'

const ui = useUIStore()
</script>

<template>
  <div class="admin-tabs">
    <button
      class="admin-tab"
      :class="{ 'admin-tab--active': ui.activeTab === 'recipes' }"
      @click="ui.activeTab = 'recipes'"
    >
      Recepten
    </button>
    <button
      class="admin-tab"
      :class="{ 'admin-tab--active': ui.activeTab === 'blog' }"
      @click="ui.activeTab = 'blog'"
    >
      Blog
    </button>
  </div>
</template>
