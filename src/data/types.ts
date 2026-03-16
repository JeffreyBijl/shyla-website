export type RecipeCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack' | 'dessert'

export const RECIPE_CATEGORY_EMOJIS: Record<RecipeCategory | 'alle', string> = {
  alle: '✨',
  ontbijt: '☀️',
  lunch: '🥗',
  diner: '🍽️',
  snack: '🍎',
  dessert: '🍰',
}

export const RECIPE_UNITS = [
  'g', 'kg', 'ml', 'dl', 'l', 'el', 'tl', 'stuk(s)',
  'snufje', 'handje', 'scheutje', 'takje', 'teen', 'plak', 'snee',
] as const

export const UNIT_PLURALS: Readonly<Record<string, string>> = {
  snufje: 'snufjes',
  handje: 'handjes',
  scheutje: 'scheutjes',
  takje: 'takjes',
  teen: 'tenen',
  plak: 'plakken',
  snee: 'sneetjes',
  'stuk(s)': 'stuk(s)',
}

export interface Ingredient {
  amount: number | null
  unit: string
  name: string
}

export interface Nutrition {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface Recipe {
  id: number
  title: string
  slug: string
  category: RecipeCategory
  image: string | null
  emoji: string
  time: string
  description: string
  servings: number
  ingredients: Ingredient[]
  steps: string[]
  nutrition: Nutrition
}

export type BlogCategory = 'Voeding' | 'Educatie' | 'Lifestyle'

export const BLOG_CATEGORY_EMOJIS: Record<BlogCategory, string> = {
  Voeding: '🥗',
  Educatie: '📚',
  Lifestyle: '✨',
}

export interface BlogPost {
  id: number
  title: string
  slug: string
  date: string
  category: BlogCategory
  image: string | null
  shortDescription: string
  readTime: string
  content: string
}
