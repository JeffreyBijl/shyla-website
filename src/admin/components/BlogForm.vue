<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import type { BlogPost, BlogCategory } from '../../data/types'
import { useAdminStore } from '../stores/admin'
import { readModifyWrite, uploadImage, CONFIG } from '../github'
import { compressWithToast, slugify } from '../image'
import { useValidation } from '../composables/useValidation'
import ImageUpload from './ImageUpload.vue'

declare const Quill: any

const store = useAdminStore()
const imageUpload = ref<InstanceType<typeof ImageUpload>>()
const selectedFile = ref<File | null>(null)
const editorRef = ref<HTMLElement>()
let quillInstance: any = null

const defaults = {
  title: '',
  category: 'Voeding' as BlogCategory,
  shortDescription: '',
  readTime: '',
  date: new Date().toISOString().split('T')[0],
  keywords: '',
}

const form = reactive({ ...defaults })
const { validateRequired, clearError, hasError } = useValidation()

const isEditing = computed(() => store.editingBlogId !== null)
const editingPost = computed(() =>
  store.editingBlogId !== null
    ? store.blogPosts.find(p => p.id === store.editingBlogId) ?? null
    : null
)

const formTitle = computed(() =>
  isEditing.value && editingPost.value
    ? `Blog bewerken: ${editingPost.value.title}`
    : 'Nieuwe blogpost toevoegen'
)

async function loadQuill(): Promise<void> {
  if (typeof Quill !== 'undefined') return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css'
  document.head.appendChild(link)

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Quill laden mislukt'))
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  await loadQuill()
  quillInstance = new Quill(editorRef.value, {
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
})

watch(() => store.editingBlogId, (id) => {
  if (id === null) return
  const post = store.blogPosts.find(p => p.id === id)
  if (!post) return
  populateForm(post)
})

function populateForm(post: BlogPost) {
  form.title = post.title
  form.category = post.category
  form.shortDescription = post.shortDescription
  form.readTime = post.readTime
  form.date = post.date || new Date().toISOString().split('T')[0]
  form.keywords = post.keywords?.join(', ') || ''
  if (quillInstance) {
    quillInstance.root.innerHTML = post.content
  }
}

function clearForm() {
  Object.assign(form, { ...defaults, date: new Date().toISOString().split('T')[0] })
  selectedFile.value = null
  imageUpload.value?.reset()
  if (quillInstance) quillInstance.root.innerHTML = ''
  clearError('blog-title')
}

function cancelEdit() {
  store.editingBlogId = null
  clearForm()
}

async function handleSubmit() {
  const titleValid = validateRequired('blog-title', form.title)
  if (!titleValid) return

  const title = form.title.trim()
  const category = form.category
  const shortDescription = form.shortDescription.trim()
  const readTime = form.readTime.trim()
  const content = quillInstance ? quillInstance.root.innerHTML : ''
  const slug = slugify(title)
  const dateStr = form.date || new Date().toISOString().split('T')[0]
  const keywordsRaw = form.keywords.trim()
  const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(Boolean) : undefined
  const dateModified = new Date().toISOString().split('T')[0]

  const editId = store.editingBlogId
  const wasEditing = isEditing.value

  // Compress image before enqueuing
  let compressed: { base64: string } | null = null
  try {
    if (selectedFile.value) compressed = await compressWithToast(selectedFile.value)
  } catch { return }

  // Optimistic UI update
  if (wasEditing && editId !== null) {
    const index = store.blogPosts.findIndex(p => p.id === editId)
    if (index !== -1) {
      const existing = store.blogPosts[index]
      store.blogPosts[index] = {
        ...existing,
        title,
        slug,
        category,
        shortDescription,
        readTime,
        content,
        keywords,
        dateModified,
      }
    }
  } else {
    const newId = store.blogPosts.length > 0 ? Math.max(...store.blogPosts.map(p => p.id)) + 1 : 1
    store.blogPosts.push({
      id: newId,
      title,
      slug,
      date: dateStr,
      category,
      image: null,
      shortDescription,
      readTime,
      content,
      keywords,
      dateModified,
    })
  }

  cancelEdit()

  const commitMsg = wasEditing ? `Blog bijgewerkt: ${title}` : `Nieuwe blogpost: ${title}`

  store.operationQueue.enqueue({
    label: commitMsg,
    execute: async () => {
      let imagePath: string | null = null

      if (compressed) {
        const filename = `${slugify(title)}-${Date.now()}.jpg`
        imagePath = await uploadImage(CONFIG.BLOG_IMAGES_DIR, filename, compressed.base64)
      }

      store.blogPosts = await readModifyWrite<BlogPost[]>(
        CONFIG.BLOG_PATH,
        (data) => {
          if (wasEditing && editId !== null) {
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
              keywords,
              dateModified,
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
              keywords,
              dateModified,
            })
          }
          return data
        },
        commitMsg,
      )
      store.pollDeploy()
    },
  })
}
</script>

<template>
  <div class="admin-form">
    <h3>{{ formTitle }}</h3>

    <ImageUpload
      ref="imageUpload"
      label="Foto (optioneel)"
      :required="false"
      :existing-image="editingPost?.image"
      @file-selected="selectedFile = $event"
    />

    <div class="form-group">
      <label for="blog-title">Titel</label>
      <input
        type="text"
        id="blog-title"
        v-model="form.title"
        placeholder="Titel van de blogpost"
        :class="{ 'field-error': hasError('blog-title') }"
        @input="clearError('blog-title')"
        @blur="validateRequired('blog-title', form.title)"
      >
      <span v-if="hasError('blog-title')" class="field-error-message">Dit veld is verplicht</span>
    </div>

    <div class="form-group">
      <label for="blog-category">Categorie</label>
      <select id="blog-category" v-model="form.category">
        <option value="Voeding">Voeding</option>
        <option value="Educatie">Educatie</option>
        <option value="Lifestyle">Lifestyle</option>
      </select>
    </div>

    <div class="form-group">
      <label for="blog-short-description">Korte beschrijving</label>
      <textarea id="blog-short-description" v-model="form.shortDescription" placeholder="Korte samenvatting voor de kaart"></textarea>
    </div>

    <div class="form-group">
      <label for="blog-readtime">Leestijd</label>
      <input type="text" id="blog-readtime" v-model="form.readTime" placeholder="bijv. 4 min">
    </div>

    <div class="form-group">
      <label for="blog-date">Datum</label>
      <input type="date" id="blog-date" v-model="form.date">
    </div>

    <div class="form-group">
      <label for="blog-keywords">Zoektermen (SEO)</label>
      <input type="text" id="blog-keywords" v-model="form.keywords" placeholder="bijv. gezond eten, voedingstips">
    </div>

    <div class="form-group">
      <label>Inhoud</label>
      <div ref="editorRef"></div>
    </div>

    <div class="admin-form-actions">
      <button class="btn btn-primary" @click="handleSubmit">
        {{ isEditing ? 'Bijwerken' : 'Opslaan' }}
      </button>
      <button v-if="isEditing" class="btn btn-outline" @click="cancelEdit">
        Annuleren
      </button>
    </div>
  </div>
</template>
