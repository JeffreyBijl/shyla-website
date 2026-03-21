import { reactive } from 'vue'

export function useValidation() {
  const errors = reactive<Record<string, boolean>>({})

  function validateRequired(fieldId: string, value: string): boolean {
    if (!value.trim()) {
      errors[fieldId] = true
      return false
    }
    errors[fieldId] = false
    return true
  }

  function clearError(fieldId: string) {
    errors[fieldId] = false
  }

  function hasError(fieldId: string): boolean {
    return !!errors[fieldId]
  }

  return { validateRequired, clearError, hasError }
}
