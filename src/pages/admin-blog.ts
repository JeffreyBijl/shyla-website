import type { BlogPost } from '../data/types.js'
import { adminState } from './admin-state.js'
import { readModifyWrite, uploadImage, CONFIG } from '../lib/github.js'
import { compressImage, slugify } from '../lib/image.js'
import { escapeHtml } from '../lib/html.js'
import { toastError, toastProgress } from '../lib/toast.js'
import { validateField, setupFieldBlurValidation } from './admin-validation.js'
// These will be available when admin.ts is rewritten (Task 8):
import { pollDeploy, setupImagePreview, handleDelete } from './admin.js'

// --- Quill ---

declare const Quill: any
let quillInstance: any = null

// --- Render ---

export function renderBlogForm(): string {
  return `
    <div class="admin-form">
      <h3 id="blog-form-title">Nieuwe blogpost toevoegen</h3>
      <div class="admin-image-upload">
        <label>Foto (optioneel)</label>
        <div class="admin-image-input-wrap">
          <span class="admin-image-btn">Kies foto</span>
          <input type="file" accept="image/*" id="blog-image">
        </div>
        <div class="admin-image-preview" id="blog-preview">
          <img id="blog-preview-img" alt="Preview">
        </div>
        <div class="admin-image-info" id="blog-image-info"></div>
      </div>
      <div class="form-group">
        <label for="blog-title">Titel</label>
        <input type="text" id="blog-title" placeholder="Titel van de blogpost">
      </div>
      <div class="form-group">
        <label for="blog-category">Categorie</label>
        <select id="blog-category">
          <option value="Voeding">Voeding</option>
          <option value="Educatie">Educatie</option>
          <option value="Lifestyle">Lifestyle</option>
        </select>
      </div>
      <div class="form-group">
        <label for="blog-short-description">Korte beschrijving</label>
        <textarea id="blog-short-description" placeholder="Korte samenvatting voor de kaart"></textarea>
      </div>
      <div class="form-group">
        <label for="blog-readtime">Leestijd</label>
        <input type="text" id="blog-readtime" placeholder="bijv. 4 min">
      </div>
      <div class="form-group">
        <label>Inhoud</label>
        <div id="blog-editor"></div>
      </div>
      <div class="admin-form-actions">
        <button class="btn btn-primary" id="blog-submit">Opslaan</button>
        <button class="btn btn-outline" id="blog-cancel-edit" style="display:none;">Annuleren</button>
      </div>
    </div>
  `
}

// --- Render item list ---

export function renderBlogItems(): void {
  const container = document.getElementById('blog-items')
  if (!container) return
  container.innerHTML = adminState.blogPosts.map(p => `
    <div class="admin-item" data-id="${p.id}">
      <div class="admin-item-thumbnail">
        ${p.image
          ? `<img src="${import.meta.env.BASE_URL}${p.image}" alt="${escapeHtml(p.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display=''">`
          : ''}
        <span class="emoji-fallback" ${p.image ? 'style="display:none"' : ''}>${categoryEmoji(p.category)}</span>
      </div>
      <div class="admin-item-info">
        <div class="admin-item-title">${escapeHtml(p.title)}</div>
        <div class="admin-item-meta">${escapeHtml(p.category)} · ${escapeHtml(p.date)}</div>
      </div>
      <button class="admin-item-edit" data-id="${p.id}" title="Bewerken">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="admin-item-delete" data-id="${p.id}" data-type="blog" title="Verwijderen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>
  `).join('')
}

// --- Helpers ---

function categoryEmoji(category: string): string {
  const map: Record<string, string> = { Voeding: '🥗', Educatie: '📚', Lifestyle: '✨' }
  return map[category] ?? '📖'
}

// --- Setup ---

export function setupBlog(): void {
  // Initialize Quill editor
  quillInstance = new Quill('#blog-editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ],
    },
    placeholder: 'Schrijf je blogpost...',
  })

  // Image preview
  setupImagePreview('blog-image', 'blog-preview', 'blog-preview-img', 'blog-image-info')

  // Blog submit
  document.getElementById('blog-submit')?.addEventListener('click', () => handleBlogSubmit())

  // Blog cancel edit
  document.getElementById('blog-cancel-edit')?.addEventListener('click', () => cancelBlogEdit())

  // Edit & delete buttons (event delegation)
  document.getElementById('blog-items')?.addEventListener('click', (e) => {
    const editBtn = (e.target as HTMLElement).closest('.admin-item-edit') as HTMLElement | null
    if (editBtn) {
      const post = adminState.blogPosts.find(p => p.id === Number(editBtn.dataset.id))
      if (post) populateBlogForm(post)
      return
    }
    const btn = (e.target as HTMLElement).closest('.admin-item-delete') as HTMLElement | null
    if (btn) handleDelete(Number(btn.dataset.id), 'blog')
  })

  // Blur validation
  setupFieldBlurValidation('blog-title', { required: true })
}

// --- Form mode ---

function setBlogFormMode(mode: 'create' | 'edit', title?: string): void {
  const formTitle = document.getElementById('blog-form-title')
  if (formTitle) formTitle.textContent = mode === 'edit' ? `Blog bewerken: ${title}` : 'Nieuwe blogpost toevoegen'
  const submitBtn = document.getElementById('blog-submit')
  if (submitBtn) submitBtn.textContent = mode === 'edit' ? 'Bijwerken' : 'Opslaan'
  const cancelBtn = document.getElementById('blog-cancel-edit')
  if (cancelBtn) cancelBtn.style.display = mode === 'edit' ? '' : 'none'
}

// --- Populate form for editing ---

function populateBlogForm(post: BlogPost): void {
  adminState.editingBlogId = post.id
  setBlogFormMode('edit', post.title)

  ;(document.getElementById('blog-title') as HTMLInputElement).value = post.title
  ;(document.getElementById('blog-category') as HTMLSelectElement).value = post.category
  ;(document.getElementById('blog-short-description') as HTMLTextAreaElement).value = post.shortDescription
  ;(document.getElementById('blog-readtime') as HTMLInputElement).value = post.readTime

  if (quillInstance) {
    quillInstance.root.innerHTML = post.content
  }

  if (post.image) {
    const preview = document.getElementById('blog-preview')
    const img = document.getElementById('blog-preview-img') as HTMLImageElement
    if (preview && img) {
      img.src = `${import.meta.env.BASE_URL}${post.image}`
      preview.classList.add('has-image')
    }
  }

  document.querySelector('#tab-blog .admin-form')?.scrollIntoView({ behavior: 'smooth' })
}

// --- Cancel edit ---

function cancelBlogEdit(): void {
  adminState.editingBlogId = null
  clearBlogForm()
  setBlogFormMode('create')
}

// --- Submit handler ---

async function handleBlogSubmit(): Promise<void> {
  const title = (document.getElementById('blog-title') as HTMLInputElement)?.value.trim()
  const category = (document.getElementById('blog-category') as HTMLSelectElement)?.value
  const shortDescription = (document.getElementById('blog-short-description') as HTMLTextAreaElement)?.value.trim()
  const readTime = (document.getElementById('blog-readtime') as HTMLInputElement)?.value.trim()
  const content = quillInstance ? quillInstance.root.innerHTML : ''
  const slug = slugify(title)
  const imageInput = document.getElementById('blog-image') as HTMLInputElement
  const file = imageInput?.files?.[0]

  // Validation: only title is required
  const titleInput = document.getElementById('blog-title') as HTMLInputElement
  const valid = validateField(titleInput, { required: true })
  if (!valid) return

  const isEditing = adminState.editingBlogId !== null
  const editId = adminState.editingBlogId

  // Compress image before enqueuing
  let compressed: { base64: string } | null = null
  let compressToast: ReturnType<typeof toastProgress> | null = null
  try {
    if (file) {
      compressToast = toastProgress('Foto verkleinen...')
      compressed = await compressImage(file)
      compressToast.dismiss()
    }
  } catch (err) {
    compressToast?.dismiss()
    const msg = err instanceof Error ? err.message : 'Foto verkleinen mislukt'
    toastError(msg)
    return
  }

  // Optimistic UI update
  const now = new Date()
  const months = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']
  const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

  if (isEditing && editId !== null) {
    const index = adminState.blogPosts.findIndex(p => p.id === editId)
    if (index !== -1) {
      const existing = adminState.blogPosts[index]
      adminState.blogPosts[index] = {
        ...existing,
        title,
        slug,
        category,
        shortDescription,
        readTime,
        content,
      }
    }
    renderBlogItems()
    cancelBlogEdit()
  } else {
    const newId = adminState.blogPosts.length > 0 ? Math.max(...adminState.blogPosts.map(p => p.id)) + 1 : 1
    adminState.blogPosts.push({
      id: newId,
      title,
      slug,
      date: dateStr,
      category,
      image: null,
      shortDescription,
      readTime,
      content,
    })
    renderBlogItems()
    clearBlogForm()
  }

  const commitMsg = isEditing ? `Blog bijgewerkt: ${title}` : `Nieuwe blogpost: ${title}`

  // Enqueue the actual GitHub operation
  adminState.operationQueue.enqueue({
    label: commitMsg,
    execute: async () => {
      let imagePath: string | null = null

      if (compressed) {
        const filename = `${slugify(title)}-${Date.now()}.jpg`
        imagePath = await uploadImage(CONFIG.BLOG_IMAGES_DIR, filename, compressed.base64)
      }

      adminState.blogPosts = await readModifyWrite<BlogPost[]>(
        CONFIG.BLOG_PATH,
        (data) => {
          if (isEditing && editId !== null) {
            const index = data.findIndex(p => p.id === editId)
            if (index === -1) throw new Error('Blogpost niet gevonden')
            const existing = data[index]
            data[index] = {
              ...existing,
              title,
              slug,
              category,
              image: imagePath?.replace(/^public\//, '') ?? existing.image,
              shortDescription,
              readTime,
              content,
            }
          } else {
            const freshId = data.length > 0 ? Math.max(...data.map(p => p.id)) + 1 : 1
            data.push({
              id: freshId,
              title,
              slug,
              date: dateStr,
              category,
              image: imagePath?.replace(/^public\//, '') ?? null,
              shortDescription,
              readTime,
              content,
            })
          }
          return data
        },
        commitMsg,
      )
      renderBlogItems()
      pollDeploy()
    },
  })
}

// --- Clear form ---

export function clearBlogForm(): void {
  ;(document.getElementById('blog-title') as HTMLInputElement).value = ''
  ;(document.getElementById('blog-short-description') as HTMLTextAreaElement).value = ''
  ;(document.getElementById('blog-readtime') as HTMLInputElement).value = ''
  ;(document.getElementById('blog-image') as HTMLInputElement).value = ''
  document.getElementById('blog-preview')?.classList.remove('has-image')
  const info = document.getElementById('blog-image-info')
  if (info) info.textContent = ''
  if (quillInstance) quillInstance.root.innerHTML = ''
}
