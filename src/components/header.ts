export function renderHeader(): string {
  return `
    <nav class="header-nav" id="header-nav">
      <div class="container header-inner">
        <a href="#home" class="header-logo" aria-label="fit.foodbyshyla home">
          <img src="${import.meta.env.BASE_URL}logo.jpeg" alt="fit.foodbyshyla logo" class="header-logo-img" />
        </a>
        <ul class="header-links" id="header-links" role="list">
          <li><a href="#home"     class="header-link">Home</a></li>
          <li><a href="#about"    class="header-link">Over mij</a></li>
          <li><a href="#recepten" class="header-link">Recepten</a></li>
          <li><a href="#blog"     class="header-link">Blog</a></li>
          <li><a href="#contact"  class="header-link btn btn-primary header-cta">Contact</a></li>
        </ul>
        <button class="hamburger" id="hamburger" aria-label="Menu openen" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `
}

export function setupHeader(): void {
  const nav       = document.getElementById('header-nav')
  const hamburger = document.getElementById('hamburger')
  const links     = document.getElementById('header-links')

  // Sticky shadow on scroll
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('header-scrolled', window.scrollY > 10)
  })

  // Hamburger toggle
  hamburger?.addEventListener('click', () => {
    const isOpen = links?.classList.toggle('header-links--open')
    hamburger.setAttribute('aria-expanded', String(isOpen))
    hamburger.classList.toggle('hamburger--open', isOpen ?? false)
  })

  // Close menu on link click
  links?.querySelectorAll('.header-link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('header-links--open')
      hamburger?.classList.remove('hamburger--open')
      hamburger?.setAttribute('aria-expanded', 'false')
    })
  })

  // Highlight active link
  function updateActiveLink(): void {
    const hash = window.location.hash || '#home'
    links?.querySelectorAll('.header-link').forEach(link => {
      link.classList.toggle('header-link--active', link.getAttribute('href') === hash)
    })
  }
  window.addEventListener('hashchange', updateActiveLink)
  updateActiveLink()
}
