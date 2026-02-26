export function renderAbout(): string {
  return `
    <section class="section about-section">
      <div class="about-bg-shape" aria-hidden="true"></div>
      <div class="container">
        <div class="section-title">
          <span class="section-label">Even voorstellen</span>
          <h2>Hoi, ik ben <em class="text-pink">Shyla!</em></h2>
          <p>Voedingscoach, foodlover en jouw gids naar een gezonder leven</p>
        </div>

        <div class="about-grid">
          <div class="about-image-wrap">
            <div class="about-image-decoration" aria-hidden="true"></div>
            <img src="/shyla.JPG" alt="Shyla, voedingscoach" class="about-image" />
            <div class="about-image-badge">
              <span>🌿</span>
              <span>Gecertificeerd voedingscoach</span>
            </div>
            <div class="about-image-stat">
              <span class="about-stat-number">3+</span>
              <span class="about-stat-label">jaar ervaring</span>
            </div>
          </div>

          <div class="about-content">
            <div class="about-block">
              <h3>Mijn verhaal</h3>
              <p>
                Gezond eten voelde voor mij lange tijd als een opgave. Saai, duur,
                ingewikkeld — dat waren de woorden die ik associeerde met "gezond leven".
                Tot ik ontdekte dat het echt anders kan.
              </p>
              <p>
                Ik ben Shyla, voedingscoach en foodlover. Na mijn eigen transformatie
                besloot ik mijn kennis en recepten te delen. Want een gezond en lekker
                leven is voor iedereen weggelegd — ook voor jou.
              </p>
            </div>

            <div class="about-block">
              <h3>Mijn aanpak</h3>
              <p>
                Geen strikte diëten. Geen verboden voedsel. Wel: bewuste keuzes maken,
                genieten van eten én je goed voelen in je lijf. Ik werk altijd vanuit
                balans en realisme — want het gaat om een levensstijl, niet een dieet.
              </p>
            </div>

            <div class="about-values">
              <div class="value-chip"><span>🥦</span> Duurzame verandering</div>
              <div class="value-chip"><span>💪</span> Zonder verboden</div>
              <div class="value-chip"><span>❤️</span> Plezier in eten</div>
              <div class="value-chip"><span>🌱</span> Op jouw tempo</div>
            </div>

            <div class="about-cta-row">
              <a href="#contact" class="btn btn-primary">Werk met mij samen</a>
              <a href="#recepten" class="btn btn-outline">Bekijk mijn recepten</a>
            </div>
          </div>
        </div>

        <!-- Approach cards -->
        <div class="about-approach">
          <div class="section-title" style="margin-top: 5rem;">
            <span class="section-label">Werkwijze</span>
            <h2>Hoe ik werk</h2>
          </div>
          <div class="grid-3 approach-grid">
            <div class="approach-card">
              <div class="approach-number">01</div>
              <h3>Kennismaking</h3>
              <p>We starten met een gratis kennismakingsgesprek om jouw doelen en leefstijl te begrijpen.</p>
            </div>
            <div class="approach-card approach-card--accent">
              <div class="approach-number">02</div>
              <h3>Persoonlijk plan</h3>
              <p>Op basis van jouw situatie stel ik een realistisch en lekker voedingsplan voor je op.</p>
            </div>
            <div class="approach-card">
              <div class="approach-number">03</div>
              <h3>Begeleiding</h3>
              <p>Ik blijf je begeleiden, aanmoedigen en bijsturen — totdat het een natuurlijk onderdeel van je leven is.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}
