type ToastType = 'success' | 'error' | 'progress'

interface ToastOptions {
  message: string
  type: ToastType
  id?: string // Reuse existing toast with same id instead of creating new one
  duration?: number // ms, 0 = persistent. Default: 4000 for success, 0 for error/progress
  actions?: Array<{ label: string; onClick: () => void }>
}

interface ToastHandle {
  update: (message: string) => void
  dismiss: () => void
}

let container: HTMLElement | null = null
const activeToasts = new Map<string, { handle: ToastHandle; el: HTMLElement; textSpan: HTMLElement }>()

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container
  container = document.createElement('div')
  container.className = 'toast-container'
  document.body.appendChild(container)
  return container
}

export function toast(opts: ToastOptions): ToastHandle {
  // Reuse existing toast with same id
  if (opts.id) {
    const existing = activeToasts.get(opts.id)
    if (existing && existing.el.parentNode) {
      existing.textSpan.textContent = opts.message
      // Update type if changed
      existing.el.className = `toast toast--${opts.type} toast--visible`
      // Rebuild actions if provided
      const oldActions = existing.el.querySelector('.toast-actions')
      if (oldActions) oldActions.remove()
      if (opts.actions) {
        appendActions(existing.el, opts.actions, existing.handle.dismiss)
      }
      // Reset auto-dismiss timer
      const duration = opts.duration ?? (opts.type === 'success' ? 4000 : 0)
      if (duration > 0) {
        clearAutoTimer(opts.id)
        setAutoTimer(opts.id, existing.handle.dismiss, duration)
      }
      return existing.handle
    }
  }

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
    appendActions(el, opts.actions, () => dismiss())
  }

  const parent = ensureContainer()
  parent.appendChild(el)

  requestAnimationFrame(() => el.classList.add('toast--visible'))

  const duration = opts.duration ?? (opts.type === 'success' ? 4000 : 0)

  function dismiss() {
    if (opts.id) {
      clearAutoTimer(opts.id)
      activeToasts.delete(opts.id)
    }
    el.classList.remove('toast--visible')
    el.addEventListener('transitionend', () => el.remove(), { once: true })
    setTimeout(() => el.remove(), 400)
  }

  const handle: ToastHandle = {
    update(message: string) {
      textSpan.textContent = message
    },
    dismiss,
  }

  if (opts.id) {
    activeToasts.set(opts.id, { handle, el, textSpan })
  }

  if (duration > 0) {
    if (opts.id) {
      setAutoTimer(opts.id, dismiss, duration)
    } else {
      window.setTimeout(dismiss, duration)
    }
  }

  return handle
}

// --- Auto-dismiss timer tracking ---
const autoTimers = new Map<string, number>()

function setAutoTimer(id: string, fn: () => void, ms: number) {
  autoTimers.set(id, window.setTimeout(fn, ms))
}

function clearAutoTimer(id: string) {
  const t = autoTimers.get(id)
  if (t != null) {
    clearTimeout(t)
    autoTimers.delete(id)
  }
}

// --- Action buttons helper ---
function appendActions(el: HTMLElement, actions: ToastOptions['actions'], dismissFn: () => void) {
  if (!actions) return
  const actionsDiv = document.createElement('div')
  actionsDiv.className = 'toast-actions'
  for (const action of actions) {
    const btn = document.createElement('button')
    btn.className = 'toast-btn'
    btn.textContent = action.label
    btn.addEventListener('click', () => {
      action.onClick()
      dismissFn()
    })
    actionsDiv.appendChild(btn)
  }
  el.appendChild(actionsDiv)
}

// Convenience helpers
export function toastSuccess(message: string, id?: string, duration = 4000): ToastHandle {
  return toast({ message, type: 'success', id, duration })
}

export function toastError(message: string, id?: string, actions?: ToastOptions['actions']): ToastHandle {
  return toast({ message, type: 'error', id, actions })
}

export function toastProgress(message: string, id?: string): ToastHandle {
  return toast({ message, type: 'progress', id })
}
