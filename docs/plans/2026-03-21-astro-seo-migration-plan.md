# Astro SSG + SEO/GEO Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate fit.foodbyshyla from Vite SPA to Astro SSG with full SEO/GEO optimization.

**Architecture:** Big bang migration on feature branch. Astro generates static HTML per page with clean URLs. Admin stays as standalone client-side SPA bundle. Existing CSS and design preserved 1-on-1. JSON data loaded via Astro at build time.

**Tech Stack:** Astro 5, TypeScript, @astrojs/sitemap, existing CSS (no framework)

**Design doc:** `docs/plans/2026-03-21-astro-seo-migration-design.md`

---

### Task 1: Create feature branch and initialize Astro project

**Files:**
- Create: `astro.config.mjs`
- Create: `src/env.d.ts`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Delete: `vite.config.ts`
- Delete: `index.html`

**Step 1: Create feature branch**

```bash
git checkout -b feat/astro-migration
```

**Step 2: Install Astro and sitemap integration**

```bash
npm install astro @astrojs/sitemap
```

**Step 3: Create `astro.config.mjs`**

```javascript
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://jeffreybijl.github.io',
  base: '/shyla-website',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('admin-shyla'),
    }),
  ],
})
```

**Step 4: Update `package.json` scripts**

Replace the scripts section:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

Move `typescript` and `vite` from devDependencies — Astro bundles its own Vite. Keep `typescript` as devDependency.

**Step 5: Update `tsconfig.json`**

Replace with Astro-compatible config:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

**Step 6: Create `src/env.d.ts`**

```typescript
/// <reference types="astro/client" />
```

**Step 7: Delete old entry files**

```bash
rm vite.config.ts index.html
```

**Step 8: Move CSS**

```bash
mv src/style.css src/styles/global.css
```

**Step 9: Create `public/robots.txt`**

```
# robots.txt — fit.foodbyshyla
# Strategie: maximale vindbaarheid in Google + AI-zoeksystemen

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: *
Allow: /
Disallow: /admin-shyla

Sitemap: https://jeffreybijl.github.io/shyla-website/sitemap-index.xml
```

**Step 10: Verify Astro starts**

```bash
npm run dev
```

Expected: Astro dev server starts (no pages yet, but no errors).

**Step 11: Commit**

```bash
git add -A
git commit -m "feat: initialize Astro project with sitemap integration"
```

---

### Task 2: Create SEO components (SEOHead, SchemaOrg, Breadcrumb)

**Files:**
- Create: `src/components/SEOHead.astro`
- Create: `src/components/SchemaOrg.astro`
- Create: `src/components/Breadcrumb.astro`

**Step 1: Create `src/components/SEOHead.astro`**

```astro
---
interface Props {
  title: string
  description: string
  canonical?: string
  image?: string
  type?: 'website' | 'article'
  publishedDate?: string
  noindex?: boolean
}

const {
  title,
  description,
  canonical = Astro.url.href,
  image = new URL('/shyla-website/shyla.JPG', Astro.site).href,
  type = 'website',
  publishedDate,
  noindex = false,
} = Astro.props

const siteName = 'fit.foodbyshyla'
const fullTitle = `${title} | ${siteName}`
---

<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
{noindex && <meta name="robots" content="noindex, nofollow" />}

<meta property="og:locale" content="nl_NL" />
<link rel="alternate" hreflang="nl" href={canonical} />

<meta property="og:type" content={type} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image" content={image} />
<meta property="og:url" content={canonical} />
<meta property="og:site_name" content={siteName} />
{publishedDate && <meta property="article:published_time" content={publishedDate} />}

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={image} />

<meta name="last-modified" content={new Date().toISOString()} />
```

**Step 2: Create `src/components/SchemaOrg.astro`**

```astro
---
interface Props {
  schema: Record<string, unknown> | Record<string, unknown>[]
}

const { schema } = Astro.props
const schemas = Array.isArray(schema) ? schema : [schema]
---

{schemas.map((s) => (
  <script type="application/ld+json" set:html={JSON.stringify(s)} />
))}
```

**Step 3: Create `src/components/Breadcrumb.astro`**

```astro
---
interface BreadcrumbItem {
  name: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
}

const { items } = Astro.props
const base = import.meta.env.BASE_URL

const schemaItems = items.map((item, i) => ({
  '@type': 'ListItem' as const,
  position: i + 1,
  ...(item.href
    ? { name: item.name, item: new URL(base + item.href, Astro.site).href }
    : { name: item.name }),
}))

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: schemaItems,
}
---

<nav aria-label="Breadcrumb" class="breadcrumb">
  <ol>
    {items.map((item, i) => (
      <li>
        {item.href ? (
          <a href={`${base}${item.href}`}>{item.name}</a>
        ) : (
          <span aria-current="page">{item.name}</span>
        )}
        {i < items.length - 1 && <span class="breadcrumb-sep" aria-hidden="true">/</span>}
      </li>
    ))}
  </ol>
</nav>

<script type="application/ld+json" set:html={JSON.stringify(breadcrumbSchema)} />
```

**Step 4: Commit**

```bash
git add src/components/SEOHead.astro src/components/SchemaOrg.astro src/components/Breadcrumb.astro
git commit -m "feat: add SEO components (SEOHead, SchemaOrg, Breadcrumb)"
```

---

### Task 3: Create BaseLayout with Header and Footer

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`

**Step 1: Create `src/components/Header.astro`**

Migrate from `src/components/header.ts`. Convert the HTML string to Astro template. Replace hash links with clean URLs. Keep the client-side JS for hamburger menu and scroll shadow.

```astro
---
const base = import.meta.env.BASE_URL
---

<nav class="header-nav" id="header-nav">
  <div class="container header-inner">
    <a href={base} class="header-logo" aria-label="fit.foodbyshyla home">
      <img src={`${base}logo.jpeg`} alt="fit.foodbyshyla logo" class="header-logo-img" />
    </a>
    <ul class="header-links" id="header-links" role="list">
      <li><a href={base} class="header-link">Home</a></li>
      <li><a href={`${base}over-mij`} class="header-link">Over mij</a></li>
      <li><a href={`${base}recepten`} class="header-link">Recepten</a></li>
      <li><a href={`${base}blog`} class="header-link">Blog</a></li>
      <li><a href={`${base}contact`} class="header-link btn btn-primary header-cta">Contact</a></li>
    </ul>
    <button class="hamburger" id="hamburger" aria-label="Menu openen" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<script>
  const nav = document.getElementById('header-nav')
  const hamburger = document.getElementById('hamburger')
  const links = document.getElementById('header-links')

  window.addEventListener('scroll', () => {
    nav?.classList.toggle('header-scrolled', window.scrollY > 10)
  })

  hamburger?.addEventListener('click', () => {
    const isOpen = links?.classList.toggle('header-links--open')
    hamburger.setAttribute('aria-expanded', String(isOpen))
    hamburger.classList.toggle('hamburger--open', isOpen ?? false)
  })

  links?.querySelectorAll('.header-link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('header-links--open')
      hamburger?.classList.remove('hamburger--open')
      hamburger?.setAttribute('aria-expanded', 'false')
    })
  })

  // Highlight active link based on current path
  function updateActiveLink(): void {
    const path = window.location.pathname
    links?.querySelectorAll('.header-link').forEach(link => {
      const href = link.getAttribute('href')
      if (!href) return
      const isActive = path === href || (href !== import.meta.env.BASE_URL && path.startsWith(href))
      link.classList.toggle('header-link--active', isActive)
    })
  }
  updateActiveLink()
</script>
```

**Step 2: Create `src/components/Footer.astro`**

Migrate from `src/components/footer.ts`. Replace hash links with clean URLs.

```astro
---
const base = import.meta.env.BASE_URL
const year = new Date().getFullYear()
---

<footer class="footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <p>Eet lekker. Leef gezond.<br>Jouw voedingscoach voor een duurzame leefstijl.</p>
    </div>
    <div class="footer-links">
      <h4>Pagina's</h4>
      <ul role="list">
        <li><a href={base}>Home</a></li>
        <li><a href={`${base}over-mij`}>Over mij</a></li>
        <li><a href={`${base}recepten`}>Recepten</a></li>
        <li><a href={`${base}blog`}>Blog</a></li>
        <li><a href={`${base}contact`}>Contact</a></li>
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
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; {year} fit.foodbyshyla — met &#10084;&#65039; gemaakt</p>
  </div>
</footer>
```

**Step 3: Create `src/layouts/BaseLayout.astro`**

```astro
---
import SEOHead from '../components/SEOHead.astro'
import SchemaOrg from '../components/SchemaOrg.astro'
import Header from '../components/Header.astro'
import Footer from '../components/Footer.astro'
import '../styles/global.css'

interface Props {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
  publishedDate?: string
  noindex?: boolean
  extraSchemas?: Record<string, unknown>[]
}

const { title, description, image, type, publishedDate, noindex, extraSchemas = [] } = Astro.props
const base = import.meta.env.BASE_URL

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'fit.foodbyshyla',
  url: new URL(base, Astro.site).href,
  description: 'Gezonde recepten en voedingstips door voedingscoach Shyla',
  inLanguage: 'nl',
  author: {
    '@type': 'Person',
    name: 'Shyla',
    jobTitle: 'Voedingscoach',
    url: new URL(base + 'over-mij', Astro.site).href,
  },
}
---

<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/jpeg" href={`${base}logo.jpeg`} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
    <SEOHead
      title={title}
      description={description}
      image={image}
      type={type}
      publishedDate={publishedDate}
      noindex={noindex}
    />
    <SchemaOrg schema={[websiteSchema, ...extraSchemas]} />
  </head>
  <body>
    <div id="root">
      <header id="site-header">
        <Header />
      </header>
      <main id="app">
        <slot />
      </main>
      <Footer />
    </div>
  </body>
</html>
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds (no pages yet, but layout compiles).

**Step 5: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/Header.astro src/components/Footer.astro
git commit -m "feat: add BaseLayout with Header and Footer components"
```

---

### Task 4: Create utility modules

**Files:**
- Create: `src/utils/seo.ts`
- Create: `src/utils/formatting.ts`
- Keep: `src/utils.ts` → move to `src/utils/utils.ts`

**Step 1: Move existing utils**

```bash
mv src/utils.ts src/utils/utils.ts
```

Note: The existing `escapeHtml` uses `document.createElement` which isn't available at build time in Astro. Replace with a string-based implementation:

```typescript
// src/utils/utils.ts
const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch])
}
```

**Step 2: Create `src/utils/formatting.ts`**

```typescript
const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

/** Convert ISO date string (2026-02-15) to Dutch display format (15 februari 2026) */
export function formatDateDutch(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${day} ${DUTCH_MONTHS[month - 1]} ${year}`
}

/** Parse time string like "30 min" to ISO 8601 duration "PT30M" */
export function parseTimeToISO(time: string): string {
  const match = time.match(/(\d+)\s*(?:min|minuten)/)
  if (!match) return 'PT0M'
  return `PT${match[1]}M`
}

/** Format ingredient as readable string: "80g havermout" or "1 stuk(s) ui" */
export function formatIngredient(amount: number | null, unit: string, name: string): string {
  const parts: string[] = []
  if (amount !== null) {
    parts.push(formatAmount(amount))
    if (unit) parts.push(unit)
  }
  parts.push(name)
  return parts.join(' ')
}

function formatAmount(amount: number): string {
  if (amount === 0.25) return '¼'
  if (amount === 0.5) return '½'
  if (amount === 0.75) return '¾'
  if (Number.isInteger(amount)) return String(amount)
  const rounded = Math.round(amount * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',')
}
```

**Step 3: Create `src/utils/seo.ts`**

```typescript
import type { Recipe } from '../data/types.ts'
import { parseTimeToISO, formatIngredient } from './formatting.ts'

export function buildRecipeSchema(recipe: Recipe, pageUrl: string, siteUrl: string, base: string) {
  const imageUrl = recipe.image
    ? new URL(base + recipe.image, siteUrl).href
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    ...(imageUrl && { image: imageUrl }),
    author: { '@type': 'Person', name: 'Shyla', jobTitle: 'Voedingscoach' },
    description: recipe.description,
    prepTime: parseTimeToISO(recipe.time),
    totalTime: parseTimeToISO(recipe.time),
    recipeCategory: recipe.category,
    recipeCuisine: 'Nederlands',
    recipeYield: `${recipe.servings} ${recipe.servings === 1 ? 'portie' : 'porties'}`,
    recipeIngredient: recipe.ingredients.map(i => formatIngredient(i.amount, i.unit, i.name)),
    recipeInstructions: recipe.steps.map(step => ({
      '@type': 'HowToStep',
      text: step,
    })),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${recipe.nutrition.kcal} kcal`,
      proteinContent: `${recipe.nutrition.protein}g`,
      carbohydrateContent: `${recipe.nutrition.carbs}g`,
      fatContent: `${recipe.nutrition.fat}g`,
    },
    ...((recipe as Record<string, unknown>).datePublished && {
      datePublished: (recipe as Record<string, unknown>).datePublished,
    }),
    ...((recipe as Record<string, unknown>).keywords && {
      keywords: ((recipe as Record<string, unknown>).keywords as string[]).join(', '),
    }),
  }
}

export function buildArticleSchema(
  title: string,
  description: string,
  date: string,
  imageUrl: string | undefined,
  dateModified?: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    ...(imageUrl && { image: imageUrl }),
    author: { '@type': 'Person', name: 'Shyla', jobTitle: 'Voedingscoach' },
    datePublished: date,
    ...(dateModified && { dateModified }),
    description,
    inLanguage: 'nl',
    publisher: { '@type': 'Organization', name: 'fit.foodbyshyla' },
  }
}
```

**Step 4: Commit**

```bash
git add src/utils/
git commit -m "feat: add utility modules (seo, formatting, escapeHtml)"
```

---

### Task 5: Update data types and migrate blog dates

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/data/blog.json`
- Modify: `src/data/recipes.json` (add datePublished to existing recipes)

**Step 1: Add SEO fields to types**

Add to the `Recipe` interface:

```typescript
export interface Recipe {
  id: number
  title: string
  slug: string
  category: RecipeCategory
  image: string | null
  emoji: string
  time: string
  description: string
  servings: number
  ingredients: Ingredient[]
  steps: string[]
  nutrition: Nutrition
  // SEO fields
  datePublished?: string
  dateModified?: string
  keywords?: string[]
  tips?: string
}
```

Add to the `BlogPost` interface:

```typescript
export interface BlogPost {
  id: number
  title: string
  slug: string
  date: string              // ISO 8601 format (2026-02-15)
  category: BlogCategory
  image: string | null
  shortDescription: string
  readTime: string
  content: string
  // SEO fields
  dateModified?: string
  keywords?: string[]
}
```

**Step 2: Convert blog.json dates to ISO 8601**

Convert each date manually. The current dates in blog.json:
- "15 februari 2026" → "2026-02-15"
- "8 februari 2026" → "2026-02-08"
- "22 januari 2026" → "2026-01-22"
- (check all entries and convert)

**Step 3: Add datePublished to recipes.json**

Add `"datePublished": "2026-03-21"` (today's date) to each existing recipe that doesn't have one. This is a reasonable default — exact dates aren't critical for existing content.

**Step 4: Verify types compile**

```bash
npx astro check
```

Expected: No type errors.

**Step 5: Commit**

```bash
git add src/data/types.ts src/data/blog.json src/data/recipes.json
git commit -m "feat: add SEO fields to data types, convert blog dates to ISO 8601"
```

---

### Task 6: Create Homepage

**Files:**
- Create: `src/pages/index.astro`

**Step 1: Create `src/pages/index.astro`**

Migrate from `src/pages/home.ts`. Convert the HTML string to Astro template. Replace hash links with clean URLs. Use `import.meta.env.BASE_URL` for asset paths.

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'

const base = import.meta.env.BASE_URL
---

<BaseLayout
  title="Voedingscoach Shyla — Gezond & lekker eten"
  description="Shyla helpt jou op een duurzame en lekkere manier gezonder te eten. Ontdek recepten, tips en persoonlijke begeleiding."
>
  <!-- Hero -->
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
          <a href={`${base}recepten`} class="btn btn-primary">Bekijk recepten</a>
          <a href={`${base}over-mij`} class="btn btn-outline">Over mij</a>
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
            <span class="hero-stat-number">5&#9733;</span>
            <span class="hero-stat-label">Beoordeling</span>
          </div>
        </div>
      </div>
      <div class="hero-image-wrap">
        <div class="hero-ring hero-ring--outer" aria-hidden="true"></div>
        <div class="hero-ring hero-ring--inner" aria-hidden="true"></div>
        <div class="hero-image-bg" aria-hidden="true"></div>
        <img src={`${base}shyla.JPG`} alt="Shyla, voedingscoach" class="hero-image" />
        <div class="hero-badge-float hero-badge-float--top" aria-hidden="true">
          <span>&#127807;</span> Gecertificeerd coach
        </div>
        <div class="hero-badge-float hero-badge-float--bottom" aria-hidden="true">
          <span>&#128170;</span> Gezond &amp; lekker
        </div>
      </div>
    </div>
  </section>

  <!-- Wavy divider -->
  <div class="wave-divider" aria-hidden="true">
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="var(--color-white)"/>
    </svg>
  </div>

  <!-- Features -->
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
            <span class="feature-icon">&#129367;</span>
          </div>
          <h3>Recepten</h3>
          <p>Heerlijke en voedzame recepten voor ontbijt, lunch, diner en snacks. Lekker en gezond hoeft niet moeilijk te zijn.</p>
          <a href={`${base}recepten`} class="btn btn-outline feature-btn">Recepten bekijken</a>
        </div>
        <div class="feature-card card feature-card--highlight">
          <div class="feature-card-glow" aria-hidden="true"></div>
          <div class="feature-icon-wrap feature-icon-wrap--pink">
            <span class="feature-icon">&#128241;</span>
          </div>
          <h3>Mijn app</h3>
          <p>Alle recepten, maaltijdplannen en tips in één handige app. Download nu en begin vandaag nog.</p>
          <a href="#" class="btn btn-primary feature-btn">Download de app</a>
        </div>
        <div class="feature-card card">
          <div class="feature-icon-wrap feature-icon-wrap--green">
            <span class="feature-icon">&#128214;</span>
          </div>
          <h3>Blog</h3>
          <p>Lees mijn artikelen over voeding, leefstijl en alles wat er komt kijken bij een gezond leven.</p>
          <a href={`${base}blog`} class="btn btn-outline feature-btn">Blog lezen</a>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA banner -->
  <section class="cta-banner">
    <div class="cta-banner-blob" aria-hidden="true"></div>
    <div class="container cta-inner">
      <span class="section-label section-label--white">Samenwerken?</span>
      <h2>Klaar om te beginnen?</h2>
      <p>Stuur me een bericht en ik help je graag op weg naar een gezondere leefstijl.</p>
      <a href={`${base}contact`} class="btn btn-primary cta-btn">Neem contact op</a>
    </div>
  </section>
</BaseLayout>
```

**Step 2: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321/shyla-website/` — verify homepage renders correctly with same design.

**Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: add homepage (index.astro)"
```

---

### Task 7: Create static pages (Over mij, Contact, FAQ, Samenwerkingen, 404)

**Files:**
- Create: `src/pages/over-mij.astro`
- Create: `src/pages/contact.astro`
- Create: `src/pages/faq.astro`
- Create: `src/pages/samenwerkingen.astro`
- Create: `src/pages/404.astro`

**Step 1: Create `src/pages/over-mij.astro`**

Migrate from `src/pages/about.ts`. Same content, Astro template, clean URLs. Wrap in BaseLayout. Add Breadcrumb.

Use same HTML structure as the current `renderAbout()` — replace all `#hash` links with `${base}path` equivalents and `${import.meta.env.BASE_URL}` for assets.

**Step 2: Create `src/pages/contact.astro`**

Migrate from `src/pages/contact.ts`. Keep contact form JS as a `<script>` tag. Add Breadcrumb.

**Step 3: Create `src/pages/faq.astro`**

New page with placeholder FAQ content. Use FAQPage schema. Include 3-5 placeholder questions that Shyla can replace later. Add Breadcrumb.

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Breadcrumb from '../components/Breadcrumb.astro'
import SchemaOrg from '../components/SchemaOrg.astro'

const faqs = [
  { question: 'Wat doet een voedingscoach?', answer: 'Een voedingscoach helpt je om gezondere eetgewoonten te ontwikkelen op een manier die past bij jouw leefstijl. Geen strenge diëten, maar duurzame verandering.' },
  { question: 'Wat kost een traject?', answer: 'Dit bespreken we tijdens een gratis kennismakingsgesprek. Neem gerust contact op!' },
  { question: 'Werken we online of op locatie?', answer: 'Beide is mogelijk. Ik werk veel online via video, maar kom ook bij jou in de buurt.' },
  { question: 'Hoe lang duurt een traject?', answer: 'Een standaard traject duurt 3 maanden, maar dit is volledig aanpasbaar aan jouw situatie.' },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
}
---

<BaseLayout
  title="Veelgestelde Vragen"
  description="Antwoorden op veelgestelde vragen over voeding, gezond eten en samenwerking met voedingscoach Shyla."
  extraSchemas={[faqSchema]}
>
  <Breadcrumb items={[{ name: 'Home', href: '' }, { name: 'Veelgestelde vragen' }]} />
  <section class="section">
    <div class="container">
      <div class="section-title">
        <span class="section-label">FAQ</span>
        <h1>Veelgestelde <em class="text-pink">vragen</em></h1>
        <p>Antwoorden op de meest gestelde vragen</p>
      </div>
      <div class="faq-list">
        {faqs.map(faq => (
          <details class="faq-item">
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
</BaseLayout>
```

**Step 4: Create `src/pages/samenwerkingen.astro`**

Placeholder page with Breadcrumb. Simple layout with a message that content is coming.

**Step 5: Create `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'

const base = import.meta.env.BASE_URL
---

<BaseLayout title="Pagina niet gevonden" description="Deze pagina bestaat niet." noindex={true}>
  <section class="section">
    <div class="container" style="text-align: center; padding: 4rem 0;">
      <h1>Pagina niet gevonden</h1>
      <p>Deze pagina bestaat niet of is verplaatst.</p>
      <a href={base} class="btn btn-primary" style="margin-top: 2rem;">Terug naar home</a>
    </div>
  </section>
</BaseLayout>
```

**Step 6: Verify all pages in browser**

```bash
npm run dev
```

Visit each page: `/shyla-website/over-mij`, `/shyla-website/contact`, `/shyla-website/faq`, `/shyla-website/samenwerkingen`.

**Step 7: Commit**

```bash
git add src/pages/over-mij.astro src/pages/contact.astro src/pages/faq.astro src/pages/samenwerkingen.astro src/pages/404.astro
git commit -m "feat: add static pages (over-mij, contact, faq, samenwerkingen, 404)"
```

---

### Task 8: Create RecipeCard and BlogCard components

**Files:**
- Create: `src/components/RecipeCard.astro`
- Create: `src/components/BlogCard.astro`

**Step 1: Create `src/components/RecipeCard.astro`**

Migrate from the `recipeCard()` function in `src/pages/recipes.ts`. Replace hash link with clean URL.

```astro
---
import type { Recipe } from '../data/types.ts'

interface Props {
  recipe: Recipe
}

const { recipe } = Astro.props
const base = import.meta.env.BASE_URL
---

<a href={`${base}recepten/${recipe.slug}`} class="recipe-card-link" data-category={recipe.category}>
  <article class="card recipe-card">
    <div class={`recipe-image-wrap ${recipe.image ? '' : 'recipe-image-wrap--fallback'}`}>
      {recipe.image ? (
        <img src={`${base}${recipe.image}`} alt={recipe.title} loading="lazy" />
      ) : (
        <span class="recipe-emoji">{recipe.emoji}</span>
      )}
      <span class="recipe-category-badge badge badge-pink">{recipe.category}</span>
    </div>
    <div class="recipe-body">
      <h3 class="recipe-title">{recipe.title}</h3>
      <p>{recipe.description}</p>
      <div class="recipe-meta-row">
        <span class="recipe-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {recipe.time}
        </span>
        <span class="recipe-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          {recipe.nutrition.kcal} kcal
        </span>
      </div>
    </div>
  </article>
</a>
```

**Step 2: Create `src/components/BlogCard.astro`**

Migrate from the `blogCard()` function in `src/pages/blog.ts`. Replace hash link with clean URL. Format date from ISO.

```astro
---
import type { BlogPost, BlogCategory } from '../data/types.ts'
import { BLOG_CATEGORY_EMOJIS } from '../data/types.ts'
import { formatDateDutch } from '../utils/formatting.ts'

interface Props {
  post: BlogPost
  index: number
}

const { post, index } = Astro.props
const base = import.meta.env.BASE_URL

const categoryColors: Record<string, string> = {
  Voeding: 'badge-pink',
  Educatie: 'badge-green',
  Lifestyle: 'badge-purple',
}
const colorClass = categoryColors[post.category] ?? 'badge-pink'
const emoji = BLOG_CATEGORY_EMOJIS[post.category as BlogCategory] ?? '📖'
const accentHue = index % 2 === 0 ? 'blog-card-accent--pink' : 'blog-card-accent--green'
---

<article class="card blog-card">
  {post.image ? (
    <div class="blog-card-visual">
      <img src={`${base}${post.image}`} alt={post.title} loading="lazy" />
    </div>
  ) : (
    <div class={`blog-card-visual ${accentHue}`}>
      <span class="blog-card-emoji">{emoji}</span>
    </div>
  )}
  <div class="blog-body">
    <div class="blog-meta">
      <span class={`badge ${colorClass}`}>{post.category}</span>
      <span class="blog-read-time">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {post.readTime} leestijd
      </span>
    </div>
    <h3 class="blog-title">{post.title}</h3>
    <p>{post.shortDescription}</p>
    <div class="blog-footer">
      <span class="blog-date">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {formatDateDutch(post.date)}
      </span>
      <a href={`${base}blog/${post.slug}`} class="blog-read-btn">
        Lees meer
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </a>
    </div>
  </div>
</article>
```

**Step 3: Commit**

```bash
git add src/components/RecipeCard.astro src/components/BlogCard.astro
git commit -m "feat: add RecipeCard and BlogCard components"
```

---

### Task 9: Create Recepten pages (overview + detail)

**Files:**
- Create: `src/pages/recepten/index.astro`
- Create: `src/pages/recepten/[slug].astro`
- Create: `src/components/RelatedContent.astro`

**Step 1: Create `src/pages/recepten/index.astro`**

Migrate from `src/pages/recipes.ts`. Use `RecipeCard` component. Keep client-side filter JS.

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import Breadcrumb from '../../components/Breadcrumb.astro'
import RecipeCard from '../../components/RecipeCard.astro'
import recipesData from '../../data/recipes.json'
import type { Recipe, RecipeCategory } from '../../data/types.ts'
import { RECIPE_CATEGORY_EMOJIS } from '../../data/types.ts'

const recipes = recipesData as Recipe[]
const categories: Array<'alle' | RecipeCategory> = ['alle', 'ontbijt', 'lunch', 'diner', 'snack', 'dessert']
---

<BaseLayout
  title="Gezonde Recepten"
  description="Heerlijke en voedzame recepten voor ontbijt, lunch, diner en snacks. Makkelijk, gezond en lekker."
>
  <Breadcrumb items={[{ name: 'Home', href: '' }, { name: 'Recepten' }]} />

  <section class="section recipes-section">
    <div class="container">
      <div class="section-title">
        <span class="section-label">Voeding</span>
        <h1>Heerlijke <em class="text-pink">recepten</em></h1>
        <p>Voedzaam, lekker en klaar in een handomdraai</p>
      </div>
      <div class="filter-bar">
        {categories.map(cat => (
          <button class={`filter-btn ${cat === 'alle' ? 'filter-btn--active' : ''}`} data-filter={cat}>
            {RECIPE_CATEGORY_EMOJIS[cat]}
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <div class="grid-3 recipes-grid" id="recipes-grid">
        {recipes.map(recipe => <RecipeCard recipe={recipe} />)}
      </div>
      <div class="recipes-empty" id="recipes-empty" hidden>
        <span>&#128532;</span>
        <p>Geen recepten gevonden in deze categorie.</p>
      </div>
    </div>
  </section>
</BaseLayout>

<script>
  // Client-side category filter (same logic as current SPA)
  const grid = document.getElementById('recipes-grid')
  const empty = document.getElementById('recipes-empty')
  const buttons = document.querySelectorAll<HTMLButtonElement>('.filter-btn')

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter

      buttons.forEach(b => b.classList.remove('filter-btn--active'))
      btn.classList.add('filter-btn--active')

      let visibleCount = 0
      grid?.querySelectorAll<HTMLElement>('.recipe-card-link').forEach(link => {
        const show = filter === 'alle' || link.dataset.category === filter
        link.style.display = show ? '' : 'none'
        if (show) visibleCount++
      })

      if (empty) empty.hidden = visibleCount > 0
    })
  })
</script>
```

**Step 2: Create `src/components/RelatedContent.astro`**

```astro
---
import type { Recipe, BlogPost } from '../data/types.ts'
import recipesData from '../data/recipes.json'
import blogData from '../data/blog.json'

interface Props {
  type: 'recipe' | 'blog'
  currentSlug: string
  currentCategory: string
}

const { type, currentSlug, currentCategory } = Astro.props
const base = import.meta.env.BASE_URL
const recipes = recipesData as Recipe[]
const blogPosts = blogData as BlogPost[]

// Recipe pages show related blog posts; blog pages show related recipes
let items: Array<{ title: string; href: string; description: string }> = []

if (type === 'recipe') {
  // Show related blog posts
  const related = blogPosts
    .filter(p => p.slug !== currentSlug)
    .slice(0, 3)
  items = related.map(p => ({
    title: p.title,
    href: `${base}blog/${p.slug}`,
    description: p.shortDescription,
  }))
} else {
  // Show related recipes — prefer same category
  const categoryMap: Record<string, string[]> = {
    Voeding: ['ontbijt', 'lunch', 'diner', 'snack', 'dessert'],
    Educatie: ['ontbijt', 'lunch', 'diner'],
    Lifestyle: ['ontbijt', 'snack', 'dessert'],
  }
  const preferredCategories = categoryMap[currentCategory] ?? []
  const sorted = [...recipes].sort((a, b) => {
    const aMatch = preferredCategories.includes(a.category) ? 1 : 0
    const bMatch = preferredCategories.includes(b.category) ? 1 : 0
    return bMatch - aMatch
  })
  items = sorted.slice(0, 3).map(r => ({
    title: r.title,
    href: `${base}recepten/${r.slug}`,
    description: r.description,
  }))
}
---

{items.length > 0 && (
  <section class="section related-content">
    <div class="container">
      <h2>{type === 'recipe' ? 'Gerelateerde artikelen' : 'Misschien vind je deze recepten ook lekker'}</h2>
      <div class="grid-3">
        {items.map(item => (
          <a href={item.href} class="card" style="display: block; padding: 1.5rem; text-decoration: none;">
            <h3 style="margin-bottom: 0.5rem;">{item.title}</h3>
            <p>{item.description}</p>
          </a>
        ))}
      </div>
    </div>
  </section>
)}
```

**Step 3: Create `src/pages/recepten/[slug].astro`**

Migrate from `src/pages/recipe-detail.ts`. Use Astro's `getStaticPaths`. Add Recipe schema. Add Breadcrumb. Add RelatedContent. Keep servings switcher as client-side JS.

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import Breadcrumb from '../../components/Breadcrumb.astro'
import RelatedContent from '../../components/RelatedContent.astro'
import recipesData from '../../data/recipes.json'
import type { Recipe } from '../../data/types.ts'
import { UNIT_PLURALS } from '../../data/types.ts'
import { buildRecipeSchema } from '../../utils/seo.ts'

const recipes = recipesData as Recipe[]

export function getStaticPaths() {
  const recipes = (recipesData as Recipe[])
  return recipes.map(recipe => ({
    params: { slug: recipe.slug },
    props: { recipe },
  }))
}

const { recipe } = Astro.props
const base = import.meta.env.BASE_URL
const recipeSchema = buildRecipeSchema(
  recipe,
  Astro.url.href,
  Astro.site?.href ?? '',
  base,
)
const imageUrl = recipe.image
  ? new URL(base + recipe.image, Astro.site).href
  : undefined

function formatAmount(amount: number): string {
  if (amount === 0.25) return '¼'
  if (amount === 0.5) return '½'
  if (amount === 0.75) return '¾'
  if (Number.isInteger(amount)) return String(amount)
  const rounded = Math.round(amount * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',')
}

function pluralizeUnit(unit: string, amount: number | null): string {
  if (!unit || amount === null || amount <= 1) return unit
  return UNIT_PLURALS[unit] ?? unit
}
---

<BaseLayout
  title={`${recipe.title} — Recept`}
  description={`${recipe.description} Bekijk het volledige recept met ingrediënten en bereidingswijze.`}
  image={imageUrl}
  extraSchemas={[recipeSchema]}
>
  <Breadcrumb items={[
    { name: 'Home', href: '' },
    { name: 'Recepten', href: 'recepten' },
    { name: recipe.title },
  ]} />

  <section class="section recipe-detail-section">
    <div class="container">
      <a href={`${base}recepten`} class="recipe-detail-back">&larr; Terug naar recepten</a>

      {recipe.image ? (
        <div class="recipe-detail-hero">
          <img src={`${base}${recipe.image}`} alt={recipe.title} />
        </div>
      ) : (
        <div class="recipe-detail-hero recipe-detail-hero--fallback">
          <span class="recipe-detail-emoji">{recipe.emoji}</span>
        </div>
      )}

      <div class="recipe-detail-header">
        <span class="badge badge-pink">{recipe.category}</span>
        <h1>{recipe.title}</h1>
        <div class="recipe-detail-meta">
          <span class="recipe-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {recipe.time}
          </span>
          {recipe.servings && (
            <span class="recipe-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              {recipe.servings} personen
            </span>
          )}
        </div>
        <p class="recipe-detail-description">{recipe.description}</p>
      </div>

      {(recipe.ingredients.length > 0 || recipe.steps.length > 0) && (
        <div class="recipe-detail-content">
          {recipe.ingredients.length > 0 && (
            <div class="recipe-detail-ingredients">
              <h2>Ingrediënten</h2>
              <div class="servings-switcher">
                <button class="servings-btn servings-decrease" aria-label="Minder personen">&minus;</button>
                <span class="servings-count" data-original={String(recipe.servings)}>{recipe.servings}</span>
                <span class="servings-label">personen</span>
                <button class="servings-btn servings-increase" aria-label="Meer personen">+</button>
              </div>
              <ul>
                {recipe.ingredients.map(ing => {
                  const amountStr = ing.amount !== null ? formatAmount(ing.amount) : ''
                  const unit = pluralizeUnit(ing.unit, ing.amount)
                  const unitStr = unit ? ` ${unit}` : ''
                  return (
                    <li data-original-amount={ing.amount !== null ? String(ing.amount) : ''} data-unit={ing.unit}>
                      <span class="ingredient-amount">{amountStr}{unitStr}</span> {ing.name}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {recipe.steps.length > 0 && (
            <div class="recipe-detail-steps">
              <h2>Bereiding</h2>
              <ol>
                {recipe.steps.map(step => <li>{step}</li>)}
              </ol>
            </div>
          )}
        </div>
      )}

      {recipe.nutrition && recipe.nutrition.kcal > 0 && (
        <div class="recipe-detail-nutrition">
          <h2>Voedingswaarde</h2>
          <div class="nutrition-grid">
            <div class="nutrition-item">
              <span class="nutrition-value">{recipe.nutrition.kcal}</span>
              <span class="nutrition-label">kcal</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-value">{recipe.nutrition.protein}g</span>
              <span class="nutrition-label">eiwit</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-value">{recipe.nutrition.carbs}g</span>
              <span class="nutrition-label">koolhydraten</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-value">{recipe.nutrition.fat}g</span>
              <span class="nutrition-label">vet</span>
            </div>
          </div>
        </div>
      )}

      <RelatedContent type="recipe" currentSlug={recipe.slug} currentCategory={recipe.category} />
    </div>
  </section>
</BaseLayout>

<script>
  // Servings switcher (client-side)
  const UNIT_PLURALS: Record<string, string> = {
    snufje: 'snufjes', handje: 'handjes', scheutje: 'scheutjes',
    takje: 'takjes', teen: 'tenen', plak: 'plakken',
    snee: 'sneetjes', 'stuk(s)': 'stuk(s)',
  }

  function formatAmount(amount: number): string {
    if (amount === 0.25) return '¼'
    if (amount === 0.5) return '½'
    if (amount === 0.75) return '¾'
    if (Number.isInteger(amount)) return String(amount)
    const rounded = Math.round(amount * 10) / 10
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',')
  }

  function pluralizeUnit(unit: string, amount: number | null): string {
    if (!unit || amount === null || amount <= 1) return unit
    return UNIT_PLURALS[unit] ?? unit
  }

  const decreaseBtn = document.querySelector('.servings-decrease')
  const increaseBtn = document.querySelector('.servings-increase')
  const countEl = document.querySelector('.servings-count')

  if (decreaseBtn && increaseBtn && countEl) {
    const originalServings = Number(countEl.getAttribute('data-original'))

    function updateIngredients(newServings: number): void {
      countEl!.textContent = String(newServings)
      document.querySelectorAll('.recipe-detail-ingredients li').forEach(li => {
        const el = li as HTMLElement
        const originalAmount = el.dataset.originalAmount
        const unit = el.dataset.unit || ''
        const amountSpan = el.querySelector('.ingredient-amount')
        if (!amountSpan || !originalAmount) return
        const scaled = (Number(originalAmount) / originalServings) * newServings
        const plural = pluralizeUnit(unit, scaled)
        const unitStr = plural ? ` ${plural}` : ''
        amountSpan.textContent = `${formatAmount(scaled)}${unitStr}`
      })
    }

    decreaseBtn.addEventListener('click', () => {
      const current = Number(countEl.textContent)
      if (current > 1) updateIngredients(current - 1)
    })

    increaseBtn.addEventListener('click', () => {
      const current = Number(countEl.textContent)
      if (current < 20) updateIngredients(current + 1)
    })
  }
</script>
```

**Step 4: Verify in browser**

```bash
npm run dev
```

Visit `/shyla-website/recepten/` and click through to a recipe detail page. Verify:
- Recipe list renders with category filters working
- Recipe detail page shows all content (image, ingredients, steps, nutrition)
- Servings switcher works
- Related content shows at bottom
- Back link works

**Step 5: Commit**

```bash
git add src/pages/recepten/ src/components/RelatedContent.astro
git commit -m "feat: add recepten pages (overview, detail, related content)"
```

---

### Task 10: Create Blog pages (overview + detail)

**Files:**
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[slug].astro`

**Step 1: Create `src/pages/blog/index.astro`**

Migrate from `src/pages/blog.ts`. Use `BlogCard` component.

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import Breadcrumb from '../../components/Breadcrumb.astro'
import BlogCard from '../../components/BlogCard.astro'
import blogData from '../../data/blog.json'
import type { BlogPost } from '../../data/types.ts'

const blogPosts = blogData as BlogPost[]
---

<BaseLayout
  title="Blog over Voeding & Gezondheid"
  description="Artikelen over voeding, leefstijl en gezond leven door voedingscoach Shyla."
>
  <Breadcrumb items={[{ name: 'Home', href: '' }, { name: 'Blog' }]} />

  <section class="section blog-section">
    <div class="container">
      <div class="section-title">
        <span class="section-label">Inspiratie</span>
        <h1>Van de <em class="text-pink">blog</em></h1>
        <p>Tips, kennis en verhalen over voeding en leefstijl</p>
      </div>
      <div class="grid-3 blog-grid" id="blog-grid">
        {blogPosts.map((post, i) => <BlogCard post={post} index={i} />)}
      </div>
      <div class="blog-cta">
        <p>Meer artikelen komen binnenkort!</p>
        <a href={`${import.meta.env.BASE_URL}contact`} class="btn btn-outline">Schrijf je in voor updates</a>
      </div>
    </div>
  </section>
</BaseLayout>
```

**Step 2: Create `src/pages/blog/[slug].astro`**

Migrate from `src/pages/blog-detail.ts`. Add Article schema. Add Breadcrumb. Add RelatedContent. Render HTML content with `set:html`.

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import Breadcrumb from '../../components/Breadcrumb.astro'
import RelatedContent from '../../components/RelatedContent.astro'
import blogData from '../../data/blog.json'
import type { BlogPost } from '../../data/types.ts'
import { buildArticleSchema } from '../../utils/seo.ts'
import { formatDateDutch } from '../../utils/formatting.ts'

const blogPosts = blogData as BlogPost[]

export function getStaticPaths() {
  const posts = blogData as BlogPost[]
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }))
}

const { post } = Astro.props
const base = import.meta.env.BASE_URL

const imageUrl = post.image
  ? new URL(base + post.image, Astro.site).href
  : undefined

const articleSchema = buildArticleSchema(
  post.title,
  post.shortDescription,
  post.date,
  imageUrl,
  (post as Record<string, unknown>).dateModified as string | undefined,
)
---

<BaseLayout
  title={`${post.title} — Blog`}
  description={post.shortDescription}
  image={imageUrl}
  type="article"
  publishedDate={post.date}
  extraSchemas={[articleSchema]}
>
  <Breadcrumb items={[
    { name: 'Home', href: '' },
    { name: 'Blog', href: 'blog' },
    { name: post.title },
  ]} />

  <section class="section blog-detail-section">
    <div class="container">
      <a href={`${base}blog`} class="recipe-detail-back">&larr; Terug naar blog</a>

      {post.image && (
        <div class="recipe-detail-hero">
          <img src={`${base}${post.image}`} alt={post.title} />
        </div>
      )}

      <div class="blog-detail-header">
        <span class="badge badge-pink">{post.category}</span>
        <h1>{post.title}</h1>
        <div class="blog-detail-meta">
          <time datetime={post.date}>{formatDateDutch(post.date)}</time>
          <span>{post.readTime} leestijd</span>
        </div>
      </div>

      <article class="blog-detail-content" set:html={post.content} />

      <RelatedContent type="blog" currentSlug={post.slug} currentCategory={post.category} />
    </div>
  </section>
</BaseLayout>
```

**Step 3: Verify in browser**

```bash
npm run dev
```

Visit `/shyla-website/blog/` and click through to a blog detail. Verify dates display correctly in Dutch format.

**Step 4: Commit**

```bash
git add src/pages/blog/
git commit -m "feat: add blog pages (overview, detail with Article schema)"
```

---

### Task 11: Migrate Admin CMS as standalone SPA

**Files:**
- Create: `src/pages/admin-shyla.astro`
- Create: `src/admin/main.ts`
- Modify: `src/admin/page.ts` (update mount target)
- Modify: various admin modules (update import paths if needed)

**Step 1: Create `src/admin/main.ts`**

This is the entry point for the standalone admin SPA. It imports the existing admin modules and mounts to `#admin-app`.

```typescript
import '../styles/global.css'
import { renderAdmin, setupAdmin } from './page.js'

function init(): void {
  const app = document.getElementById('admin-app')
  if (!app) return
  app.innerHTML = renderAdmin()
  setupAdmin()
}

init()
```

**Step 2: Update `src/admin/page.ts`**

Change the mount target from `#app` to `#admin-app`:

```typescript
// In setupAdmin(), change:
const app = document.getElementById('app')
// To:
const app = document.getElementById('admin-app')
```

**Step 3: Update admin modules — fix import paths**

Check all admin modules for imports that reference `../data/types.js`, `../components/toast.js`, etc. These paths remain valid since the admin folder is still under `src/`. But verify:
- `../data/types.js` → still valid
- `../components/toast.js` → the toast module needs to work client-side

**Important:** The toast component (`src/components/toast.ts`) is a client-side module used by admin. It must NOT be converted to an Astro component. Keep it as `.ts`. The admin SPA will import it directly.

**Step 4: Create `src/pages/admin-shyla.astro`**

```astro
---
// Admin page — client-side only, excluded from sitemap and robots.txt
---

<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Admin — fit.foodbyshyla</title>
    <link rel="icon" type="image/jpeg" href={`${import.meta.env.BASE_URL}logo.jpeg`} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root">
      <div id="admin-app"></div>
    </div>
    <script src="../admin/main.ts"></script>
  </body>
</html>
```

Note: Astro will bundle the `main.ts` script via Vite automatically.

**Step 5: Update GitHub paths in admin/github.ts**

The `RECIPES_PATH` and `BLOG_PATH` in the GitHub config stay the same (`src/data/recipes.json`, `src/data/blog.json`) since the data files don't move. Image paths also stay the same (`public/images/recipes`, `public/images/blog`).

**Step 6: Verify admin works**

```bash
npm run dev
```

Visit `/shyla-website/admin-shyla`. Verify:
- Token form appears
- After auth, dashboard loads
- Recipe and blog tabs work
- Test creating/editing (with a valid GitHub token)

**Step 7: Commit**

```bash
git add src/pages/admin-shyla.astro src/admin/main.ts src/admin/page.ts
git commit -m "feat: migrate admin CMS as standalone SPA page"
```

---

### Task 12: Add breadcrumb CSS and related content CSS

**Files:**
- Modify: `src/styles/global.css`

**Step 1: Add breadcrumb styles**

Append to `src/styles/global.css`:

```css
/* ── Breadcrumb ─────────────────────────────────────── */
.breadcrumb {
  padding: 1rem 0;
  max-width: var(--max-width);
  margin: 0 auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.breadcrumb ol {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  list-style: none;
  font-size: 0.875rem;
  color: var(--color-gray-light);
}

.breadcrumb a {
  color: var(--color-pink);
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb-sep {
  margin: 0 0.25rem;
}

/* ── Related content ────────────────────────────────── */
.related-content {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.related-content h2 {
  margin-bottom: 1.5rem;
}

.related-content .card h3 {
  font-size: 1rem;
}

.related-content .card p {
  font-size: 0.875rem;
  color: var(--color-gray-light);
}
```

**Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add breadcrumb and related content CSS"
```

---

### Task 13: Update admin CMS forms for new SEO fields

**Files:**
- Modify: `src/admin/recipes.ts` (add keywords, tips fields)
- Modify: `src/admin/blog.ts` (add keywords field, date picker)

**Step 1: Update recipe form in `src/admin/recipes.ts`**

Add form fields for:
- `keywords` — text input (comma-separated), converted to `string[]` on save
- `tips` — textarea
- `datePublished` — date input (auto-filled with today if empty)
- `dateModified` — auto-set to today on every save

Read the existing `renderRecipeForm()` and `setupRecipes()` to understand the form structure, then add the new fields after the existing ones.

**Step 2: Update blog form in `src/admin/blog.ts`**

- Change `date` field from text input to `<input type="date">` with ISO format
- Add `keywords` text input (comma-separated)
- Auto-set `dateModified` on every save

**Step 3: Verify admin forms**

```bash
npm run dev
```

Visit admin, test that new fields appear and save correctly.

**Step 4: Commit**

```bash
git add src/admin/recipes.ts src/admin/blog.ts
git commit -m "feat: add SEO fields to admin CMS forms (keywords, tips, dates)"
```

---

### Task 14: Update GitHub Actions for Astro build

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Step 1: Update deploy workflow**

The build command is already `npm run build` which now maps to `astro build`. The output is still `dist/`. Only change needed: bump Node version if needed and add the Astro-specific GitHub Pages config.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
        with:
          enablement: true
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

This is identical to current — no changes needed since `npm run build` outputs to `dist/`.

**Step 2: Commit (only if changes were made)**

```bash
git add .github/workflows/deploy.yml
git commit -m "chore: verify GitHub Actions compatible with Astro build"
```

---

### Task 15: Clean up old SPA files

**Files:**
- Delete: `src/main.ts`
- Delete: `src/router.ts`
- Delete: `src/pages/home.ts`
- Delete: `src/pages/about.ts`
- Delete: `src/pages/recipes.ts`
- Delete: `src/pages/recipe-detail.ts`
- Delete: `src/pages/blog.ts`
- Delete: `src/pages/blog-detail.ts`
- Delete: `src/pages/contact.ts`
- Delete: `src/components/header.ts`
- Delete: `src/components/footer.ts`
- Keep: `src/components/toast.ts` (used by admin SPA)
- Keep: `src/admin/*` (used by admin SPA)
- Delete: `src/utils.ts` (moved to `src/utils/utils.ts` in Task 4)

**Step 1: Delete old files**

```bash
rm src/main.ts src/router.ts
rm src/pages/home.ts src/pages/about.ts src/pages/recipes.ts src/pages/recipe-detail.ts
rm src/pages/blog.ts src/pages/blog-detail.ts src/pages/contact.ts
rm src/components/header.ts src/components/footer.ts
```

**Step 2: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds. All pages generate correctly.

**Step 3: Verify no broken imports in admin**

Check that admin modules don't import from deleted files. The admin imports `../components/toast.js` (kept) and `../data/types.js` (kept). Should be fine.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old SPA files (router, pages, components)"
```

---

### Task 16: Full build verification and HTML audit

**Step 1: Run production build**

```bash
npm run build
```

Expected: Build succeeds. Check output:

```bash
ls dist/
ls dist/recepten/
ls dist/blog/
```

Verify:
- `dist/index.html` exists
- `dist/over-mij/index.html` exists
- `dist/contact/index.html` exists
- `dist/faq/index.html` exists
- `dist/samenwerkingen/index.html` exists
- `dist/recepten/index.html` exists
- `dist/recepten/[each-slug]/index.html` exists for every recipe
- `dist/blog/index.html` exists
- `dist/blog/[each-slug]/index.html` exists for every blog post
- `dist/admin-shyla/index.html` exists
- `dist/404.html` exists
- `dist/sitemap-index.xml` exists
- `dist/robots.txt` exists

**Step 2: Verify HTML contains structured data**

```bash
grep -l "application/ld+json" dist/recepten/*/index.html | head -3
grep "Recipe" dist/recepten/*/index.html | head -3
grep "Article" dist/blog/*/index.html | head -3
```

Expected: JSON-LD script tags present with correct schema types.

**Step 3: Verify sitemap excludes admin**

```bash
cat dist/sitemap-*.xml | grep -c admin
```

Expected: 0 (admin not in sitemap).

**Step 4: Verify meta tags**

```bash
grep '<title>' dist/recepten/*/index.html | head -3
grep 'og:title' dist/index.html
grep 'description' dist/index.html
```

Expected: Unique titles and descriptions per page.

**Step 5: Preview locally**

```bash
npm run preview
```

Browse through all pages. Verify design matches the current SPA 1-on-1.

**Step 6: Commit any fixes**

If any issues found, fix and commit.

---

### Task 17: Final commit and merge preparation

**Step 1: Review all changes**

```bash
git log --oneline feat/astro-migration
git diff main..feat/astro-migration --stat
```

**Step 2: Verify clean build one final time**

```bash
npm run build
```

**Step 3: Update `.gitignore` if needed**

Astro may generate `.astro/` directory. Ensure it's in `.gitignore`.

```bash
echo ".astro/" >> .gitignore
git add .gitignore
git commit -m "chore: add .astro/ to gitignore"
```

**Step 4: Ready for merge**

The branch is ready. Ask the user whether to merge to main or create a PR.

---

## Summary of commits

1. `feat: initialize Astro project with sitemap integration`
2. `feat: add SEO components (SEOHead, SchemaOrg, Breadcrumb)`
3. `feat: add BaseLayout with Header and Footer components`
4. `feat: add utility modules (seo, formatting, escapeHtml)`
5. `feat: add SEO fields to data types, convert blog dates to ISO 8601`
6. `feat: add homepage (index.astro)`
7. `feat: add static pages (over-mij, contact, faq, samenwerkingen, 404)`
8. `feat: add RecipeCard and BlogCard components`
9. `feat: add recepten pages (overview, detail, related content)`
10. `feat: add blog pages (overview, detail with Article schema)`
11. `feat: migrate admin CMS as standalone SPA page`
12. `feat: add breadcrumb and related content CSS`
13. `feat: add SEO fields to admin CMS forms (keywords, tips, dates)`
14. `chore: verify GitHub Actions compatible with Astro build`
15. `chore: remove old SPA files (router, pages, components)`
16. (verification, fixes if needed)
17. `chore: add .astro/ to gitignore`
