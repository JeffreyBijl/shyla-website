const instagramSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
</svg>`

const appSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.37c1.57.07 2.65.83 3.56.87 1.36-.28 2.66-1.06 4.12-.91 1.74.19 3.04.89 3.88 2.28-3.47 2.17-2.68 6.88.44 8.51-.7 1.72-1.63 3.41-4 4.16zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
</svg>`

export function renderContact(): string {
  return `
    <section class="section contact-section">
      <div class="contact-bg-blob" aria-hidden="true"></div>
      <div class="container">
        <div class="section-title">
          <span class="section-label">Samenwerken?</span>
          <h2>Neem <em class="text-pink">contact</em> op</h2>
          <p>Heb je een vraag of wil je graag samenwerken? Ik hoor het graag!</p>
        </div>

        <div class="contact-grid">
          <!-- Form -->
          <div class="contact-form-wrap">
            <form class="contact-form" id="contact-form" novalidate>
              <div class="form-row">
                <div class="form-group">
                  <label for="name">Naam</label>
                  <input type="text" id="name" name="name" placeholder="Jouw naam" required autocomplete="name" />
                </div>
                <div class="form-group">
                  <label for="email">E-mailadres</label>
                  <input type="email" id="email" name="email" placeholder="jouw@email.nl" required autocomplete="email" />
                </div>
              </div>
              <div class="form-group">
                <label for="subject">Onderwerp</label>
                <input type="text" id="subject" name="subject" placeholder="Waarover wil je contact?" />
              </div>
              <div class="form-group">
                <label for="message">Bericht</label>
                <textarea id="message" name="message" rows="6" placeholder="Schrijf hier je bericht..." required></textarea>
              </div>
              <button type="submit" class="btn btn-primary contact-submit">
                Verstuur bericht
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
              <div class="form-feedback" id="form-feedback" hidden role="alert"></div>
            </form>
          </div>

          <!-- Aside -->
          <aside class="contact-aside">
            <div class="contact-info-card card">
              <div class="contact-info-header">
                <div class="contact-info-avatar">
                  <img src="/shyla.JPG" alt="Shyla" />
                </div>
                <div>
                  <strong>Shyla</strong>
                  <span>Voedingscoach</span>
                </div>
              </div>
              <p>Ik reageer doorgaans binnen 1-2 werkdagen. Kijk ook gerust op mijn socials!</p>

              <div class="contact-social-list">
                <a href="https://instagram.com" target="_blank" rel="noopener" class="contact-social-link contact-social-link--instagram">
                  ${instagramSVG}
                  <div>
                    <strong>Instagram</strong>
                    <span>@fit.foodbyshyla</span>
                  </div>
                </a>
                <a href="#" class="contact-social-link contact-social-link--app">
                  ${appSVG}
                  <div>
                    <strong>Mijn app</strong>
                    <span>Download nu gratis</span>
                  </div>
                </a>
              </div>
            </div>

            <div class="contact-faq">
              <h3>Veelgestelde vragen</h3>
              <details class="faq-item">
                <summary>Wat kost een traject?</summary>
                <p>Dit bespreken we tijdens een gratis kennismakingsgesprek. Neem gerust contact op!</p>
              </details>
              <details class="faq-item">
                <summary>Werken we online of op locatie?</summary>
                <p>Beide is mogelijk. Ik werk veel online via video, maar kom ook bij jou in de buurt.</p>
              </details>
              <details class="faq-item">
                <summary>Hoe lang duurt een traject?</summary>
                <p>Een standaard traject duurt 3 maanden, maar dit is volledig aanpasbaar aan jouw situatie.</p>
              </details>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `
}

export function setupContact(): void {
  const form     = document.getElementById('contact-form') as HTMLFormElement | null
  const feedback = document.getElementById('form-feedback')
  const submitBtn = form?.querySelector<HTMLButtonElement>('.contact-submit')

  form?.addEventListener('submit', (e) => {
    e.preventDefault()

    const data = {
      name:    (form.elements.namedItem('name')    as HTMLInputElement).value,
      email:   (form.elements.namedItem('email')   as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    console.log('📬 Contactformulier ontvangen:', data)

    // Show success
    if (feedback) {
      feedback.textContent = '✅ Bedankt voor je bericht! Ik neem zo snel mogelijk contact met je op.'
      feedback.hidden = false
      feedback.className = 'form-feedback form-feedback--success'
    }
    if (submitBtn) {
      submitBtn.textContent = 'Verstuurd!'
      submitBtn.disabled = true
    }
    form.reset()
  })
}
