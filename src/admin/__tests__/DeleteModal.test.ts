import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DeleteModal from '../components/DeleteModal.vue'
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

describe('DeleteModal', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    // Clean up teleported content
    document.body.querySelectorAll('.admin-modal-overlay').forEach(el => el.remove())
  })

  it('does not render overlay when not visible', () => {
    wrapper = mount(DeleteModal)
    expect(document.body.querySelector('.admin-modal-overlay')).toBeNull()
  })

  it('renders modal with title when visible', async () => {
    const store = useUIStore()
    store.deleteModal = { visible: true, title: 'Test Recept', resolve: vi.fn() }

    wrapper = mount(DeleteModal)
    await wrapper.vm.$nextTick()

    const overlay = document.body.querySelector('.admin-modal-overlay')
    expect(overlay).not.toBeNull()
    expect(overlay!.querySelector('.admin-modal-text')!.textContent).toContain('Test Recept')
  })

  it('calls resolve(true) on confirm click', async () => {
    const store = useUIStore()
    const resolveFn = vi.fn()
    store.deleteModal = { visible: true, title: 'Test', resolve: resolveFn }

    wrapper = mount(DeleteModal)
    await wrapper.vm.$nextTick()

    const confirmBtn = document.body.querySelector('.admin-modal-delete-btn') as HTMLElement
    confirmBtn.click()

    expect(resolveFn).toHaveBeenCalledWith(true)
  })

  it('calls resolve(false) on cancel click', async () => {
    const store = useUIStore()
    const resolveFn = vi.fn()
    store.deleteModal = { visible: true, title: 'Test', resolve: resolveFn }

    wrapper = mount(DeleteModal)
    await wrapper.vm.$nextTick()

    const cancelBtn = document.body.querySelector('.btn-outline') as HTMLElement
    cancelBtn.click()

    expect(resolveFn).toHaveBeenCalledWith(false)
  })

  it('closes on Escape key', async () => {
    const store = useUIStore()
    const resolveFn = vi.fn()
    store.deleteModal = { visible: true, title: 'Test', resolve: resolveFn }

    wrapper = mount(DeleteModal)
    await wrapper.vm.$nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(resolveFn).toHaveBeenCalledWith(false)
  })
})
