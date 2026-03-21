import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import BlogForm from '../components/BlogForm.vue'
import { useAdminStore } from '../stores/admin'

vi.mock('../github', () => ({
  getToken: vi.fn(() => 'ghp_test'),
  saveToken: vi.fn(),
  validateToken: vi.fn(),
  readFile: vi.fn(),
  readModifyWrite: vi.fn(async (_path: string, modify: (d: any) => any) => modify([])),
  uploadImage: vi.fn(async () => 'public/images/blog/test.jpg'),
  startDeployPolling: vi.fn(() => () => {}),
  CONFIG: {
    RECIPES_PATH: 'src/data/recipes.json',
    BLOG_PATH: 'src/data/blog.json',
    RECIPE_IMAGES_DIR: 'public/images/recipes',
    BLOG_IMAGES_DIR: 'public/images/blog',
  },
}))

vi.mock('../image', () => ({
  compressWithToast: vi.fn(async () => ({ base64: 'abc123' })),
  slugify: vi.fn((s: string) => s.toLowerCase().replace(/\s+/g, '-')),
}))

vi.mock('../../components/toast', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastProgress: vi.fn(() => ({ update: vi.fn(), dismiss: vi.fn() })),
}))

// Mock Quill as a global class since BlogForm uses `new Quill(...)`
const mockQuillRoot = { innerHTML: '' }
class MockQuill {
  root = mockQuillRoot
  constructor(_el: any, _opts: any) {}
}
vi.stubGlobal('Quill', MockQuill)

describe('BlogForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockQuillRoot.innerHTML = ''
  })

  it('renders with default title for new post', () => {
    const wrapper = mount(BlogForm)
    expect(wrapper.find('h3').text()).toBe('Nieuwe blogpost toevoegen')
  })

  it('shows Bijwerken button when editing', async () => {
    const store = useAdminStore()
    store.blogPosts = [{
      id: 1, title: 'Test Blog', slug: 'test-blog', date: '2026-01-01',
      category: 'Voeding', image: null, shortDescription: 'Kort',
      readTime: '3 min', content: '<p>Inhoud</p>',
    }]

    const wrapper = mount(BlogForm)
    store.editingBlogId = 1
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.btn-primary').text()).toBe('Bijwerken')
  })

  it('populates form fields when editing', async () => {
    const store = useAdminStore()
    store.blogPosts = [{
      id: 1, title: 'Gezond Eten', slug: 'gezond-eten', date: '2026-03-01',
      category: 'Voeding', image: null, shortDescription: 'Tips over eten',
      readTime: '5 min', content: '<p>Content hier</p>',
      keywords: ['gezond', 'voeding'],
    }]

    const wrapper = mount(BlogForm)
    await flushPromises() // wait for onMounted async (loadQuill + new Quill)
    store.editingBlogId = 1
    await wrapper.vm.$nextTick()

    expect((wrapper.find('#blog-title').element as HTMLInputElement).value).toBe('Gezond Eten')
    expect((wrapper.find('#blog-readtime').element as HTMLInputElement).value).toBe('5 min')
    expect((wrapper.find('#blog-short-description').element as HTMLTextAreaElement).value).toBe('Tips over eten')
    expect(mockQuillRoot.innerHTML).toBe('<p>Content hier</p>')
  })

  it('validates title is required on submit', async () => {
    const wrapper = mount(BlogForm)

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.field-error-message').exists()).toBe(true)
  })

  it('clears form on cancel', async () => {
    const store = useAdminStore()
    store.blogPosts = [{
      id: 1, title: 'Test', slug: 'test', date: '2026-01-01',
      category: 'Voeding', image: null, shortDescription: 'Kort',
      readTime: '3 min', content: '<p>X</p>',
    }]

    const wrapper = mount(BlogForm)
    store.editingBlogId = 1
    await wrapper.vm.$nextTick()

    await wrapper.find('.admin-form-actions .btn-outline').trigger('click')
    await wrapper.vm.$nextTick()

    expect(store.editingBlogId).toBeNull()
    expect((wrapper.find('#blog-title').element as HTMLInputElement).value).toBe('')
    expect(mockQuillRoot.innerHTML).toBe('')
  })

  it('adds optimistic blog post to store on submit', async () => {
    const store = useAdminStore()
    const wrapper = mount(BlogForm)
    await wrapper.vm.$nextTick()

    await wrapper.find('#blog-title').setValue('Nieuwe Post')
    mockQuillRoot.innerHTML = '<p>Blog content</p>'

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    expect(store.blogPosts.length).toBe(1)
    expect(store.blogPosts[0].title).toBe('Nieuwe Post')
    expect(store.blogPosts[0].content).toBe('<p>Blog content</p>')
  })
})
