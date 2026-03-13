export type RecipeCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack'

export interface Recipe {
  id: number
  title: string
  category: RecipeCategory
  image: string | null
  emoji: string
  time: string
  calories: string
  description: string
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
