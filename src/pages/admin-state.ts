import type { Recipe, BlogPost } from '../data/types.js'
import { OperationQueue } from '../lib/queue.js'

export const adminState = {
  recipes: [] as Recipe[],
  blogPosts: [] as BlogPost[],
  editingRecipeId: null as number | null,
  editingBlogId: null as number | null,
  stopCurrentPolling: null as (() => void) | null,
  operationQueue: new OperationQueue(),
}
