import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import RecipeForm from '../components/RecipeForm.vue'
import { useAdminStore } from '../stores/admin'

vi.mock('../github', () => ({
  getToken: vi.fn(() => 'ghp_test'),
  saveToken: vi.fn(),
  validateToken: vi.fn(),
  readFile: vi.fn(),
  readModifyWrite: vi.fn(async (_path: string, modify: (d: any) => any) => modify([])),
  uploadImage: vi.fn(async () => 'public/images/recipes/test.jpg'),
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

describe('RecipeForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders with default title for new recipe', () => {
    const wrapper = mount(RecipeForm)
    expect(wrapper.find('h3').text()).toBe('Nieuw recept toevoegen')
  })

  it('shows Bijwerken button when editing', async () => {
    const store = useAdminStore()
    store.recipes = [{
      id: 1, title: 'Test', slug: 'test', category: 'ontbijt',
      image: null, emoji: '', time: '10 min', description: 'Desc',
      servings: 2, ingredients: [], steps: [], nutrition: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    }]

    const wrapper = mount(RecipeForm)
    store.editingRecipeId = 1
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.btn-primary').text()).toBe('Bijwerken')
    expect(wrapper.find('.btn-outline').exists()).toBe(true)
  })

  it('populates form fields when editing', async () => {
    const store = useAdminStore()
    store.recipes = [{
      id: 1, title: 'Overnight Oats', slug: 'overnight-oats', category: 'ontbijt',
      image: null, emoji: '', time: '10 min', description: 'Lekker ontbijt',
      servings: 2, ingredients: [{ amount: 100, unit: 'g', name: 'Havermout' }],
      steps: ['Meng alles'], nutrition: { kcal: 300, protein: 10, carbs: 40, fat: 8 },
    }]

    const wrapper = mount(RecipeForm)
    // Set editingRecipeId after mount so the watcher triggers
    store.editingRecipeId = 1
    await wrapper.vm.$nextTick()

    expect((wrapper.find('#recipe-title').element as HTMLInputElement).value).toBe('Overnight Oats')
    expect((wrapper.find('#recipe-time').element as HTMLInputElement).value).toBe('10 min')
  })

  it('clears form on cancel', async () => {
    const store = useAdminStore()
    store.recipes = [{
      id: 1, title: 'Test', slug: 'test', category: 'ontbijt',
      image: null, emoji: '', time: '10 min', description: 'Desc',
      servings: 2, ingredients: [], steps: [], nutrition: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    }]

    const wrapper = mount(RecipeForm)
    store.editingRecipeId = 1
    await wrapper.vm.$nextTick()

    const cancelBtn = wrapper.findAll('.admin-form-actions .btn-outline')
    await cancelBtn[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(store.editingRecipeId).toBeNull()
    expect((wrapper.find('#recipe-title').element as HTMLInputElement).value).toBe('')
  })

  it('validates title is required on submit', async () => {
    const wrapper = mount(RecipeForm)

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.field-error-message').exists()).toBe(true)
  })

  it('adds and removes ingredient rows', async () => {
    const wrapper = mount(RecipeForm)

    await wrapper.find('.btn-sm:first-of-type').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.admin-ingredient-row').length).toBe(1)

    await wrapper.find('.admin-row-remove').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.admin-ingredient-row').length).toBe(0)
  })
})
