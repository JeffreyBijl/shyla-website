import { describe, it, expect } from 'vitest'
import { useValidation } from '../composables/useValidation'

describe('useValidation', () => {
  it('validateRequired returns false for empty string', () => {
    const { validateRequired, hasError } = useValidation()
    const result = validateRequired('field1', '')
    expect(result).toBe(false)
    expect(hasError('field1')).toBe(true)
  })

  it('validateRequired returns false for whitespace-only', () => {
    const { validateRequired } = useValidation()
    expect(validateRequired('field1', '   ')).toBe(false)
  })

  it('validateRequired returns true for non-empty string', () => {
    const { validateRequired, hasError } = useValidation()
    const result = validateRequired('field1', 'hello')
    expect(result).toBe(true)
    expect(hasError('field1')).toBe(false)
  })

  it('clearError removes error state', () => {
    const { validateRequired, clearError, hasError } = useValidation()
    validateRequired('field1', '')
    expect(hasError('field1')).toBe(true)

    clearError('field1')
    expect(hasError('field1')).toBe(false)
  })

  it('hasError returns false for unknown field', () => {
    const { hasError } = useValidation()
    expect(hasError('unknown')).toBe(false)
  })
})
