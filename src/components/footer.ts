export function renderFooter(): string {
  const year = new Date().getFullYear()
  return `
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <img src="${import.meta.env.BASE_URL}logo.jpeg" alt="fit.foodbyshyla" class="footer-logo" />
          <p>Eet lekker. Leef gezond.<br>Jouw voedingscoach voor een duurzame leefstijl.</p>
        </div>
        <div class="footer-links">
          <h4>Pagina's</h4>
          <ul role="list">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">Over mij</a></li>
            <li><a href="#recepten">Recepten</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        <div class="footer-social">
          <h4>Volg Shyla</h4>
          <a href="https://instagram.com" target="_blank" rel="noopener" class="social-btn social-btn--instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
            </svg>
            @fit.foodbyshyla
          </a>
          <a href="#" class="social-btn social-btn--app">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.37c1.57.07 2.65.83 3.56.87 1.36-.28 2.66-1.06 4.12-.91 1.74.19 3.04.89 3.88 2.28-3.47 2.17-2.68 6.88.44 8.51-.7 1.72-1.63 3.41-4 4.16zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Download de app
          </a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© ${year} fit.foodbyshyla — met ❤️ gemaakt</p>
      </div>
    </footer>
  `
}
