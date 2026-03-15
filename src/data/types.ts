export type RecipeCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack'

export interface Ingredient {
  amount: string
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
  calories: string
  description: string
  servings: string
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
