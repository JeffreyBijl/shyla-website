import type { Recipe } from '../data/types.ts'
import { parseTimeToISO, formatIngredient } from './formatting.ts'

export function buildRecipeSchema(recipe: Recipe, pageUrl: string, siteUrl: string, base: string) {
  const imageUrl = recipe.image
    ? new URL(base + recipe.image, siteUrl).href
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    ...(imageUrl && { image: imageUrl }),
    author: { '@type': 'Person', name: 'Shyla', jobTitle: 'Voedingscoach' },
    description: recipe.description,
    prepTime: parseTimeToISO(recipe.time),
    totalTime: parseTimeToISO(recipe.time),
    recipeCategory: recipe.category,
    recipeCuisine: 'Nederlands',
    recipeYield: `${recipe.servings} ${recipe.servings === 1 ? 'portie' : 'porties'}`,
    recipeIngredient: recipe.ingredients.map(i => formatIngredient(i.amount, i.unit, i.name)),
    recipeInstructions: recipe.steps.map(step => ({
      '@type': 'HowToStep',
      text: step,
    })),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${recipe.nutrition.kcal} kcal`,
      proteinContent: `${recipe.nutrition.protein}g`,
      carbohydrateContent: `${recipe.nutrition.carbs}g`,
      fatContent: `${recipe.nutrition.fat}g`,
    },
    ...((recipe as Record<string, unknown>).datePublished && {
      datePublished: (recipe as Record<string, unknown>).datePublished,
    }),
    ...((recipe as Record<string, unknown>).keywords && {
      keywords: ((recipe as Record<string, unknown>).keywords as string[]).join(', '),
    }),
  }
}

export function buildArticleSchema(
  title: string,
  description: string,
  date: string,
  imageUrl: string | undefined,
  dateModified?: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    ...(imageUrl && { image: imageUrl }),
    author: { '@type': 'Person', name: 'Shyla', jobTitle: 'Voedingscoach' },
    datePublished: date,
    ...(dateModified && { dateModified }),
    description,
    inLanguage: 'nl',
    publisher: { '@type': 'Organization', name: 'fit.foodbyshyla' },
  }
}
