import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useRecipeStore } from '../stores/recipe'
import { useBlogStore } from '../stores/blog'
import { useUIStore } from '../stores/ui'

vi.mock('../github', () => ({
  getToken: vi.fn(() => null),
  saveToken: vi.fn(),
  validateToken: vi.fn(),
  readFile: vi.fn(),
  startDeployPolling: vi.fn(() => () => {}),
  CONFIG: {
    RECIPES_PATH: 'src/data/recipes.json',
    BLOG_PATH: 'src/data/blog.json',
    RECIPE_IMAGES_DIR: 'public/images/recipes',
    BLOG_IMAGES_DIR: 'public/images/blog',
  },
}))

vi.mock('../../components/toast', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastProgress: vi.fn(() => ({ update: vi.fn(), dismiss: vi.fn() })),
}))

import { getToken, saveToken, validateToken, readFile } from '../github'
import { toastError } from '../../components/toast'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initAuth', () => {
    it('sets isAuthenticated=false when no token', () => {
      vi.mocked(getToken).mockReturnValue(null)
      const auth = useAuthStore()
      auth.initAuth()
      expect(auth.isAuthenticated).toBe(false)
    })

    it('sets isAuthenticated=true and loads data when token exists', async () => {
      vi.mocked(getToken).mockReturnValue('ghp_test123')
      vi.mocked(readFile).mockResolvedValue({ content: [], sha: 'abc' })

      const auth = useAuthStore()
      auth.initAuth()

      expect(auth.isAuthenticated).toBe(true)
      expect(readFile).toHaveBeenCalledTimes(2)
    })
  })

  describe('login', () => {
    it('returns false for invalid token', async () => {
      vi.mocked(validateToken).mockResolvedValue(false)
      const auth = useAuthStore()
      const result = await auth.login('bad-token')
      expect(result).toBe(false)
      expect(auth.isAuthenticated).toBe(false)
      expect(saveToken).not.toHaveBeenCalled()
    })

    it('saves token and authenticates for valid token', async () => {
      vi.mocked(validateToken).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue({ content: [], sha: 'abc' })

      const auth = useAuthStore()
      const result = await auth.login('ghp_valid')

      expect(result).toBe(true)
      expect(auth.isAuthenticated).toBe(true)
      expect(saveToken).toHaveBeenCalledWith('ghp_valid')
    })
  })
})

describe('recipe store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadData populates recipes', async () => {
    const mockRecipes = [{ id: 1, title: 'Test Recept' }]
    vi.mocked(readFile).mockResolvedValue({ content: mockRecipes, sha: 'r1' })

    const store = useRecipeStore()
    await store.loadData()

    expect(store.recipes).toEqual(mockRecipes)
  })

  it('shows toast on error', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('Network fail'))

    const store = useRecipeStore()
    await store.loadData()

    expect(toastError).toHaveBeenCalledWith('Network fail')
  })
})

describe('blog store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadData populates blogPosts', async () => {
    const mockBlogs = [{ id: 1, title: 'Test Blog' }]
    vi.mocked(readFile).mockResolvedValue({ content: mockBlogs, sha: 'b1' })

    const store = useBlogStore()
    await store.loadData()

    expect(store.blogPosts).toEqual(mockBlogs)
  })
})

describe('UI store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('deleteModal', () => {
    it('resolves with true on confirm', async () => {
      const ui = useUIStore()
      const promise = ui.showDeleteConfirm('Test item')

      expect(ui.deleteModal.visible).toBe(true)
      expect(ui.deleteModal.title).toBe('Test item')

      ui.resolveDeleteModal(true)

      const result = await promise
      expect(result).toBe(true)
      expect(ui.deleteModal.visible).toBe(false)
    })

    it('resolves with false on cancel', async () => {
      const ui = useUIStore()
      const promise = ui.showDeleteConfirm('Test item')

      ui.resolveDeleteModal(false)

      const result = await promise
      expect(result).toBe(false)
    })
  })
})
