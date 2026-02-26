import { blogPosts } from '../data/blog.js'

const categoryColors: Record<string, string> = {
  Voeding:   'badge-pink',
  Educatie:  'badge-green',
  Lifestyle: 'badge-purple',
}

const categoryEmojis: Record<string, string> = {
  Voeding:   '🥗',
  Educatie:  '📚',
  Lifestyle: '✨',
}

function blogCard(post: typeof blogPosts[0], index: number): string {
  const colorClass = categoryColors[post.category] ?? 'badge-pink'
  const emoji      = categoryEmojis[post.category] ?? '📖'
  const accentHue  = index % 2 === 0 ? 'blog-card-accent--pink' : 'blog-card-accent--green'

  return `
    <article class="card blog-card">
      <div class="blog-card-visual ${accentHue}">
        <span class="blog-card-emoji">${emoji}</span>
      </div>
      <div class="blog-body">
        <div class="blog-meta">
          <span class="badge ${colorClass}">${post.category}</span>
          <span class="blog-read-time">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            ${post.readTime} leestijd
          </span>
        </div>
        <h3 class="blog-title">${post.title}</h3>
        <p>${post.excerpt}</p>
        <div class="blog-footer">
          <span class="blog-date">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            ${post.date}
          </span>
          <a href="#" class="blog-read-btn">
            Lees meer
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      </div>
    </article>
  `
}

export function renderBlog(): string {
  return `
    <section class="section blog-section">
      <div class="container">
        <div class="section-title">
          <span class="section-label">Inspiratie</span>
          <h2>Van de <em class="text-pink">blog</em></h2>
          <p>Tips, kennis en verhalen over voeding en leefstijl</p>
        </div>
        <div class="grid-3 blog-grid" id="blog-grid">
          ${blogPosts.map((post, i) => blogCard(post, i)).join('')}
        </div>
        <div class="blog-cta">
          <p>Meer artikelen komen binnenkort!</p>
          <a href="#contact" class="btn btn-outline">Schrijf je in voor updates</a>
        </div>
      </div>
    </section>
  `
}
