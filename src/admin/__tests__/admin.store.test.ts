import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAdminStore } from '../stores/admin'

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

describe('useAdminStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initAuth', () => {
    it('sets isAuthenticated=false when no token', () => {
      vi.mocked(getToken).mockReturnValue(null)
      const store = useAdminStore()
      store.initAuth()
      expect(store.isAuthenticated).toBe(false)
    })

    it('sets isAuthenticated=true and loads data when token exists', async () => {
      vi.mocked(getToken).mockReturnValue('ghp_test123')
      vi.mocked(readFile).mockResolvedValue({ content: [], sha: 'abc' })

      const store = useAdminStore()
      store.initAuth()

      expect(store.isAuthenticated).toBe(true)
      expect(readFile).toHaveBeenCalledTimes(2)
    })
  })

  describe('login', () => {
    it('returns false for invalid token', async () => {
      vi.mocked(validateToken).mockResolvedValue(false)
      const store = useAdminStore()
      const result = await store.login('bad-token')
      expect(result).toBe(false)
      expect(store.isAuthenticated).toBe(false)
      expect(saveToken).not.toHaveBeenCalled()
    })

    it('saves token and authenticates for valid token', async () => {
      vi.mocked(validateToken).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue({ content: [], sha: 'abc' })

      const store = useAdminStore()
      const result = await store.login('ghp_valid')

      expect(result).toBe(true)
      expect(store.isAuthenticated).toBe(true)
      expect(saveToken).toHaveBeenCalledWith('ghp_valid')
    })
  })

  describe('loadData', () => {
    it('populates recipes and blogPosts', async () => {
      const mockRecipes = [{ id: 1, title: 'Test Recept' }]
      const mockBlogs = [{ id: 1, title: 'Test Blog' }]

      vi.mocked(readFile)
        .mockResolvedValueOnce({ content: mockRecipes, sha: 'r1' })
        .mockResolvedValueOnce({ content: mockBlogs, sha: 'b1' })

      const store = useAdminStore()
      await store.loadData()

      expect(store.recipes).toEqual(mockRecipes)
      expect(store.blogPosts).toEqual(mockBlogs)
    })

    it('shows toast on error', async () => {
      vi.mocked(readFile).mockRejectedValue(new Error('Network fail'))

      const store = useAdminStore()
      await store.loadData()

      expect(toastError).toHaveBeenCalledWith('Network fail')
    })
  })

  describe('deleteModal', () => {
    it('resolves with true on confirm', async () => {
      const store = useAdminStore()
      const promise = store.showDeleteConfirm('Test item')

      expect(store.deleteModal.visible).toBe(true)
      expect(store.deleteModal.title).toBe('Test item')

      store.resolveDeleteModal(true)

      const result = await promise
      expect(result).toBe(true)
      expect(store.deleteModal.visible).toBe(false)
    })

    it('resolves with false on cancel', async () => {
      const store = useAdminStore()
      const promise = store.showDeleteConfirm('Test item')

      store.resolveDeleteModal(false)

      const result = await promise
      expect(result).toBe(false)
    })
  })
})
