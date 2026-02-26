import './style.css'
import { renderHeader, setupHeader } from './components/header.js'
import { renderFooter }              from './components/footer.js'
import { setupRouter }               from './router.js'

function init(): void {
  const headerEl = document.getElementById('site-header')
  const footerEl = document.getElementById('site-footer')

  if (headerEl) headerEl.innerHTML = renderHeader()
  if (footerEl) footerEl.innerHTML = renderFooter()

  setupHeader()
  setupRouter()
}

init()
