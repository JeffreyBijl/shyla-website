import { describe, it, expect } from 'vitest'
import { slugify } from '../image'

describe('image.ts', () => {
  describe('slugify', () => {
    it('converts to lowercase kebab-case', () => {
      expect(slugify('Overnight Oats')).toBe('overnight-oats')
    })

    it('strips diacritics', () => {
      expect(slugify('Crème brûlée')).toBe('creme-brulee')
    })

    it('handles special characters', () => {
      expect(slugify('Salade & Pasta!')).toBe('salade-pasta')
    })

    it('trims leading/trailing hyphens', () => {
      expect(slugify('--hello--')).toBe('hello')
    })

    it('handles empty string', () => {
      expect(slugify('')).toBe('')
    })

    it('collapses multiple hyphens', () => {
      expect(slugify('a   b   c')).toBe('a-b-c')
    })

    it('handles Dutch characters', () => {
      expect(slugify('Uitsmijter café')).toBe('uitsmijter-cafe')
    })
  })
})
