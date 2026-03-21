<script setup lang="ts">
import { useBlogStore } from '../stores/blog'
import { useQueueStore } from '../stores/queue'
import { useUIStore } from '../stores/ui'
import { readModifyWrite, deleteFile, CONFIG } from '../github'
import type { BlogPost, BlogCategory } from '../../data/types'
import { BLOG_CATEGORY_EMOJIS } from '../../data/types'

const blogStore = useBlogStore()
const queueStore = useQueueStore()
const ui = useUIStore()
const baseUrl = import.meta.env.BASE_URL

function categoryEmoji(category: string): string {
  return BLOG_CATEGORY_EMOJIS[category as BlogCategory] ?? '\uD83D\uDCD6'
}

function editPost(id: number) {
  blogStore.editingBlogId = id
  document.querySelector('#tab-blog .admin-form')?.scrollIntoView({ behavior: 'smooth' })
}

async function deletePost(id: number) {
  const post = blogStore.blogPosts.find(p => p.id === id)
  if (!post) return

  const confirmed = await ui.showDeleteConfirm(post.title)
  if (!confirmed) return

  blogStore.blogPosts = blogStore.blogPosts.filter(p => p.id !== id)

  queueStore.operationQueue.enqueue({
    label: `Verwijder: ${post.title}`,
    execute: async () => {
      blogStore.blogPosts = await readModifyWrite<BlogPost[]>(
        CONFIG.BLOG_PATH,
        data => data.filter(p => p.id !== id),
        `Verwijder blogpost: ${post.title}`,
      )

      if (post.image) {
        await deleteFile(`public/${post.image}`, `Verwijder afbeelding: ${post.title}`).catch(() => {})
      }

      queueStore.pollDeploy()
    },
  })
}
</script>

<template>
  <div id="blog-items">
    <div v-for="p in blogStore.blogPosts" :key="p.id" class="admin-item" :data-id="p.id">
      <div class="admin-item-thumbnail">
        <img
          v-if="p.image"
          :src="`${baseUrl}${p.image}`"
          :alt="p.title"
          @error="($event.target as HTMLImageElement).style.display='none'; ($event.target as HTMLImageElement).nextElementSibling!.style.display=''"
        >
        <span class="emoji-fallback" :style="{ display: p.image ? 'none' : '' }">{{ categoryEmoji(p.category) }}</span>
      </div>
      <div class="admin-item-info">
        <div class="admin-item-title">{{ p.title }}</div>
        <div class="admin-item-meta">{{ p.category }} · {{ p.date }}</div>
      </div>
      <button class="admin-item-edit" :data-id="p.id" title="Bewerken" @click="editPost(p.id)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="admin-item-delete" :data-id="p.id" title="Verwijderen" @click="deletePost(p.id)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>
  </div>
</template>
