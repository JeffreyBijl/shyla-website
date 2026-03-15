import type { Recipe, BlogPost } from '../data/types.js'
import {
  readModifyWrite, deleteFile, startDeployPolling, CONFIG,
} from './github.js'
import { escapeHtml } from '../utils.js'
import { toastSuccess, toastError, toastProgress } from '../components/toast.js'
import { adminState } from './state.js'

// --- Image preview ---

export function setupImagePreview(
  inputId: string, previewId: string, imgId: string, infoId: string
): void {
  const input = document.getElementById(inputId) as HTMLInputElement
  const preview = document.getElementById(previewId)
  const img = document.getElementById(imgId) as HTMLImageElement
  const info = document.getElementById(infoId)

  input?.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file || !preview || !img || !info) return

    if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src)
    const url = URL.createObjectURL(file)
    img.src = url
    preview.classList.add('has-image')

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    info.textContent = `Origineel: ${sizeMB} MB — wordt automatisch verkleind bij opslaan`
  })
}

// --- Delete modal ---

export function showDeleteModal(title: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'admin-modal-overlay visible'
    overlay.innerHTML = `
      <div class="admin-modal">
        <div class="admin-modal-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </div>
        <h3 class="admin-modal-title">Verwijderen</h3>
        <p class="admin-modal-text">${escapeHtml(`Weet je zeker dat je "${title}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)}</p>
        <div class="admin-modal-actions">
          <button class="btn btn-outline" id="delete-modal-cancel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            Annuleren
          </button>
          <button class="btn admin-modal-delete-btn" id="delete-modal-confirm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            Verwijderen
          </button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    const confirmBtn = document.getElementById('delete-modal-confirm')!
    const cancelBtn = document.getElementById('delete-modal-cancel')!

    const cleanup = () => {
      overlay.remove()
      document.removeEventListener('keydown', onKey)
    }
    const onConfirm = () => { cleanup(); resolve(true) }
    const onCancel = () => { cleanup(); resolve(false) }
    const onOverlay = (e: Event) => { if (e.target === overlay) { cleanup(); resolve(false) } }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { cleanup(); resolve(false) } }

    confirmBtn.addEventListener('click', onConfirm)
    cancelBtn.addEventListener('click', onCancel)
    overlay.addEventListener('click', onOverlay)
    document.addEventListener('keydown', onKey)
  })
}

// --- Deploy polling ---

export function pollDeploy(): void {
  if (adminState.stopCurrentPolling) adminState.stopCurrentPolling()

  toastProgress('Website wordt bijgewerkt...', 'deploy')

  adminState.stopCurrentPolling = startDeployPolling((status) => {
    switch (status) {
      case 'queued':
        toastProgress('Website wordt bijgewerkt — in de wachtrij...', 'deploy')
        break
      case 'in_progress':
        toastProgress('Website wordt bijgewerkt — publiceren...', 'deploy')
        break
      case 'completed':
        adminState.stopCurrentPolling = null
        toastSuccess('Website is live!', 'deploy')
        break
      case 'failed':
        adminState.stopCurrentPolling = null
        toastError('Publicatie mislukt', 'deploy')
        break
    }
  })
}

// --- Delete handler ---

export async function handleDelete(
  id: number,
  type: 'recipe' | 'blog',
  renderItems: () => void,
): Promise<void> {
  const item = type === 'recipe'
    ? adminState.recipes.find(r => r.id === id)
    : adminState.blogPosts.find(p => p.id === id)

  if (!item) return

  const confirmed = await showDeleteModal(item.title)
  if (!confirmed) return

  if (type === 'recipe') {
    adminState.recipes = adminState.recipes.filter(r => r.id !== id)
  } else {
    adminState.blogPosts = adminState.blogPosts.filter(p => p.id !== id)
  }
  renderItems()

  adminState.operationQueue.enqueue({
    label: `Verwijder: ${item.title}`,
    execute: async () => {
      if (type === 'recipe') {
        adminState.recipes = await readModifyWrite<Recipe[]>(
          CONFIG.RECIPES_PATH,
          data => data.filter(r => r.id !== id),
          `Verwijder recept: ${item.title}`,
        )
      } else {
        adminState.blogPosts = await readModifyWrite<BlogPost[]>(
          CONFIG.BLOG_PATH,
          data => data.filter(p => p.id !== id),
          `Verwijder blogpost: ${item.title}`,
        )
      }

      if (item.image) {
        deleteFile(`public/${item.image}`, `Verwijder afbeelding: ${item.title}`).catch(() => {})
      }

      renderItems()
      pollDeploy()
    },
  })
}
