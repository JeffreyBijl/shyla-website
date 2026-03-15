interface ValidationRule {
  required?: boolean
}

export function validateField(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLElement,
  rules: ValidationRule
): boolean {
  clearFieldError(input)

  if (rules.required) {
    const value = 'value' in input ? (input as HTMLInputElement).value.trim() : ''
    if (!value) {
      showFieldError(input, 'Dit veld is verplicht')
      return false
    }
  }

  return true
}

export function validateFileField(
  input: HTMLInputElement,
  previewContainer: HTMLElement | null,
): boolean {
  clearFieldError(input.closest('.admin-image-upload') ?? input)

  const hasFile = input.files && input.files.length > 0
  const hasExisting = previewContainer?.classList.contains('has-image') ?? false

  if (!hasFile && !hasExisting) {
    showFieldError(input.closest('.admin-image-upload') ?? input, 'Kies een foto')
    return false
  }

  return true
}

function showFieldError(input: HTMLElement, message: string): void {
  input.classList.add('field-error')

  const existing = input.parentElement?.querySelector('.field-error-message')
  if (existing) existing.remove()

  const span = document.createElement('span')
  span.className = 'field-error-message'
  span.textContent = message
  input.insertAdjacentElement('afterend', span)
}

export function clearFieldError(input: HTMLElement): void {
  input.classList.remove('field-error')
  const msg = input.parentElement?.querySelector('.field-error-message')
    ?? input.nextElementSibling
  if (msg?.classList.contains('field-error-message')) msg.remove()
}

export function setupFieldBlurValidation(
  fieldId: string,
  rules: ValidationRule
): void {
  const input = document.getElementById(fieldId)
  if (!input) return
  input.addEventListener('blur', () => validateField(input as HTMLInputElement, rules))
  input.addEventListener('input', () => clearFieldError(input))
}
