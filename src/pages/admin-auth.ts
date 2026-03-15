import {
  saveToken, clearToken, validateToken,
} from '../lib/github.js'
import { toastError } from '../lib/toast.js'

export function renderTokenForm(): string {
  return `
    <section class="section admin-section">
      <div class="container">
        <div class="admin-token-card">
          <h2>Admin login</h2>
          <p>Voer je GitHub Personal Access Token in om content te beheren.</p>
          <div class="form-group">
            <label for="admin-token">Token</label>
            <input type="password" id="admin-token" placeholder="ghp_xxxxxxxxxxxx">
          </div>
          <button class="btn btn-primary" id="token-submit">Inloggen</button>
          <p class="admin-token-warning">Deel dit token met niemand.</p>
        </div>
      </div>
    </section>
  `
}

export function setupTokenForm(onLogin: () => void): void {
  const input = document.getElementById('admin-token') as HTMLInputElement
  const submit = document.getElementById('token-submit')

  submit?.addEventListener('click', async () => {
    const token = input?.value.trim()
    if (!token) {
      toastError('Voer een token in')
      return
    }
    submit.textContent = 'Controleren...'
    ;(submit as HTMLButtonElement).disabled = true

    const valid = await validateToken(token)
    if (valid) {
      saveToken(token)
      onLogin()
    } else {
      toastError('Token is ongeldig. Controleer of het correct is en "repo" scope heeft.')
      submit.textContent = 'Inloggen'
      ;(submit as HTMLButtonElement).disabled = false
    }
  })
}

export function handleLogout(onLogout: () => void): void {
  clearToken()
  onLogout()
}
