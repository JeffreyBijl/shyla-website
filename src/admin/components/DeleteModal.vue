<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()

function onConfirm() {
  store.resolveDeleteModal(true)
}

function onCancel() {
  store.resolveDeleteModal(false)
}

function onOverlayClick(e: Event) {
  if ((e.target as HTMLElement).classList.contains('admin-modal-overlay')) {
    onCancel()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && store.deleteModal.visible) {
    onCancel()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="store.deleteModal.visible" class="admin-modal-overlay visible" @click="onOverlayClick">
      <div class="admin-modal">
        <div class="admin-modal-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </div>
        <h3 class="admin-modal-title">Verwijderen</h3>
        <p class="admin-modal-text">
          Weet je zeker dat je "{{ store.deleteModal.title }}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div class="admin-modal-actions">
          <button class="btn btn-outline" @click="onCancel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            Annuleren
          </button>
          <button class="btn admin-modal-delete-btn" @click="onConfirm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
