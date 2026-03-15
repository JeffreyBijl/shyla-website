type ToastType = 'success' | 'error' | 'progress'

interface ToastOptions {
  message: string
  type: ToastType
  duration?: number // ms, 0 = persistent. Default: 4000 for success, 0 for error/progress
  actions?: Array<{ label: string; onClick: () => void }>
}

interface ToastHandle {
  update: (message: string) => void
  dismiss: () => void
}

let container: HTMLElement | null = null

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container
  container = document.createElement('div')
  container.className = 'toast-container'
  document.body.appendChild(container)
  return container
}

export function toast(opts: ToastOptions): ToastHandle {
  const el = document.createElement('div')
  el.className = `toast toast--${opts.type}`

  const textSpan = document.createElement('span')
  textSpan.className = 'toast-text'
  textSpan.textContent = opts.message

  if (opts.type === 'progress') {
    const spinner = document.createElement('span')
    spinner.className = 'toast-spinner'
    el.appendChild(spinner)
  }

  el.appendChild(textSpan)

  if (opts.actions) {
    const actionsDiv = document.createElement('div')
    actionsDiv.className = 'toast-actions'
    for (const action of opts.actions) {
      const btn = document.createElement('button')
      btn.className = 'toast-btn'
      btn.textContent = action.label
      btn.addEventListener('click', () => {
        action.onClick()
        dismiss()
      })
      actionsDiv.appendChild(btn)
    }
    el.appendChild(actionsDiv)
  }

  const parent = ensureContainer()
  parent.appendChild(el)

  // Trigger enter animation
  requestAnimationFrame(() => el.classList.add('toast--visible'))

  const duration = opts.duration ?? (opts.type === 'success' ? 4000 : 0)
  let timeoutId: number | undefined

  function dismiss() {
    if (timeoutId) clearTimeout(timeoutId)
    el.classList.remove('toast--visible')
    el.addEventListener('transitionend', () => el.remove(), { once: true })
    // Fallback if transition doesn't fire
    setTimeout(() => el.remove(), 400)
  }

  if (duration > 0) {
    timeoutId = window.setTimeout(dismiss, duration)
  }

  return {
    update(message: string) {
      textSpan.textContent = message
    },
    dismiss,
  }
}

// Convenience helpers
export function toastSuccess(message: string, duration = 4000): ToastHandle {
  return toast({ message, type: 'success', duration })
}

export function toastError(message: string, actions?: ToastOptions['actions']): ToastHandle {
  return toast({ message, type: 'error', actions })
}

export function toastProgress(message: string): ToastHandle {
  return toast({ message, type: 'progress' })
}
