import '../styles/global.css'
import { renderAdmin, setupAdmin } from './page.js'

function init(): void {
  const app = document.getElementById('admin-app')
  if (!app) return
  app.innerHTML = renderAdmin()
  setupAdmin()
}

init()
