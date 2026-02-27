export function renderHome(): string {
  return `
    <!-- ── Hero ── -->
    <section class="hero">
      <div class="hero-blob hero-blob--1" aria-hidden="true"></div>
      <div class="hero-blob hero-blob--2" aria-hidden="true"></div>
      <div class="container hero-inner">
        <div class="hero-content">
          <span class="hero-eyebrow">
            <span class="hero-eyebrow-dot"></span>
            Voedingscoach
          </span>
          <h1 class="hero-title">
            Eet lekker.<br>
            <em>Leef gezond.</em>
          </h1>
          <p class="hero-subtitle">
            Hoi, ik ben Shyla! Ik help jou om op een duurzame en
            lekkere manier gezonder te eten — zonder strikte diëten
            of saai eten.
          </p>
          <div class="hero-actions">
            <a href="#recepten" class="btn btn-primary">Bekijk recepten</a>
            <a href="#about"    class="btn btn-outline">Over mij</a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-number">50+</span>
              <span class="hero-stat-label">Recepten</span>
            </div>
            <div class="hero-stat-divider" aria-hidden="true"></div>
            <div class="hero-stat">
              <span class="hero-stat-number">100+</span>
              <span class="hero-stat-label">Tevreden klanten</span>
            </div>
            <div class="hero-stat-divider" aria-hidden="true"></div>
            <div class="hero-stat">
              <span class="hero-stat-number">5★</span>
              <span class="hero-stat-label">Beoordeling</span>
            </div>
          </div>
        </div>
        <div class="hero-image-wrap">
          <div class="hero-ring hero-ring--outer" aria-hidden="true"></div>
          <div class="hero-ring hero-ring--inner" aria-hidden="true"></div>
          <div class="hero-image-bg" aria-hidden="true"></div>
          <img
            src="${import.meta.env.BASE_URL}shyla.JPG"
            alt="Shyla, voedingscoach"
            class="hero-image"
          />
          <div class="hero-badge-float hero-badge-float--top" aria-hidden="true">
            <span>🌿</span> Gecertificeerd coach
          </div>
          <div class="hero-badge-float hero-badge-float--bottom" aria-hidden="true">
            <span>💪</span> Gezond &amp; lekker
          </div>
        </div>
      </div>
    </section>

    <!-- ── Wavy divider ── -->
    <div class="wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="var(--color-white)"/>
      </svg>
    </div>

    <!-- ── Features ── -->
    <section class="section features-section">
      <div class="container">
        <div class="section-title">
          <span class="section-label">Wat vind je hier?</span>
          <h2>Alles voor een<br><em class="text-pink">gezonde leefstijl</em></h2>
          <p>Van heerlijke recepten tot persoonlijk advies — ik heb het voor je</p>
        </div>
        <div class="grid-3 features-grid">
          <div class="feature-card card">
            <div class="feature-icon-wrap feature-icon-wrap--green">
              <span class="feature-icon">🥗</span>
            </div>
            <h3>Recepten</h3>
            <p>Heerlijke en voedzame recepten voor ontbijt, lunch, diner en snacks. Lekker en gezond hoeft niet moeilijk te zijn.</p>
            <a href="#recepten" class="btn btn-outline feature-btn">Recepten bekijken</a>
          </div>
          <div class="feature-card card feature-card--highlight">
            <div class="feature-card-glow" aria-hidden="true"></div>
            <div class="feature-icon-wrap feature-icon-wrap--pink">
              <span class="feature-icon">📱</span>
            </div>
            <h3>Mijn app</h3>
            <p>Alle recepten, maaltijdplannen en tips in één handige app. Download nu en begin vandaag nog.</p>
            <a href="#" class="btn btn-primary feature-btn">Download de app</a>
          </div>
          <div class="feature-card card">
            <div class="feature-icon-wrap feature-icon-wrap--green">
              <span class="feature-icon">📖</span>
            </div>
            <h3>Blog</h3>
            <p>Lees mijn artikelen over voeding, leefstijl en alles wat er komt kijken bij een gezond leven.</p>
            <a href="#blog" class="btn btn-outline feature-btn">Blog lezen</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA banner ── -->
    <section class="cta-banner">
      <div class="cta-banner-blob" aria-hidden="true"></div>
      <div class="container cta-inner">
        <span class="section-label section-label--white">Samenwerken?</span>
        <h2>Klaar om te beginnen?</h2>
        <p>Stuur me een bericht en ik help je graag op weg naar een gezondere leefstijl.</p>
        <a href="#contact" class="btn btn-primary cta-btn">Neem contact op</a>
      </div>
    </section>
  `
}
