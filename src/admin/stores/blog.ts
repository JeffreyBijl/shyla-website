import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BlogPost } from '../../data/types'
import { readFile, CONFIG } from '../github'
import { toastError } from '../../components/toast'

export const useBlogStore = defineStore('blog', () => {
  const blogPosts = ref<BlogPost[]>([])
  const editingBlogId = ref<number | null>(null)

  async function loadData() {
    try {
      const result = await readFile<BlogPost[]>(CONFIG.BLOG_PATH)
      blogPosts.value = result.content
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kan blogposts niet laden'
      toastError(msg)
    }
  }

  return { blogPosts, editingBlogId, loadData }
})
