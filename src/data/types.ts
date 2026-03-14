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

export interface BlogPost {
  id: number
  title: string
  date: string
  category: string
  image: string | null
  excerpt: string
  readTime: string
}
