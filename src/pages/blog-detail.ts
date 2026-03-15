import blogData from '../data/blog.json'
import type { BlogPost } from '../data/types.js'
import { escapeHtml } from '../utils.js'

const blogPosts: BlogPost[] = blogData as BlogPost[]

export function renderBlogDetail(slug: string): string {
  const post = blogPosts.find(p => p.slug === slug)

  if (!post) {
    return `
      <section class="section">
        <div class="container">
          <a href="#blog" class="recipe-detail-back">← Terug naar blog</a>
          <h1>Blogpost niet gevonden</h1>
          <p>Deze blogpost bestaat niet of is verwijderd.</p>
        </div>
      </section>
    `
  }

  const heroHTML = post.image
    ? `<div class="recipe-detail-hero">
        <img src="${import.meta.env.BASE_URL}${post.image}" alt="${escapeHtml(post.title)}">
      </div>`
    : ''

  return `
    <section class="section blog-detail-section">
      <div class="container">
        <a href="#blog" class="recipe-detail-back">← Terug naar blog</a>
        ${heroHTML}
        <div class="blog-detail-header">
          <span class="badge badge-pink">${escapeHtml(post.category)}</span>
          <h1>${escapeHtml(post.title)}</h1>
          <div class="blog-detail-meta">
            <span>${escapeHtml(post.date)}</span>
            <span>${escapeHtml(post.readTime)} leestijd</span>
          </div>
        </div>
        <div class="blog-detail-content">
          ${post.content}
        </div>
      </div>
    </section>
  `
}

export function setupBlogDetail(): void {
  // No interactive elements needed for now
}
