# fit.foodbyshyla Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a modern multi-page vanilla TypeScript website for Shyla's nutrition coaching business with hash-based routing, recipes, blog, and contact form.

**Architecture:** Single `index.html` with a `#app` container. TypeScript hash router listens to `hashchange` events and swaps page content. Shared header/footer wrap every page render. All content is placeholder data embedded in TypeScript data files.

**Tech Stack:** Vite 7, TypeScript 5, vanilla DOM, Google Fonts (Playfair Display + Inter), CSS custom properties for theming.

**Design reference:** `docs/plans/2026-02-26-fit-foodbyshyla-website-design.md`
**Frontend design skill:** Use `frontend-design:frontend-design` skill for each page implementation for high-quality UI.

---

### Task 1: Clean up boilerplate & scaffold folder structure

**Files:**
- Delete: `src/counter.ts`
- Delete: `src/typescript.svg`
- Modify: `src/main.ts` (replace all content)
- Modify: `src/style.css` (replace all content)
- Modify: `index.html` (update title + meta)
- Create: `src/router.ts`
- Create: `src/components/header.ts`
- Create: `src/components/footer.ts`
- Create: `src/pages/home.ts`
- Create: `src/pages/about.ts`
- Create: `src/pages/recipes.ts`
- Create: `src/pages/blog.ts`
- Create: `src/pages/contact.ts`
- Create: `src/data/recipes.ts`
- Create: `src/data/blog.ts`

**Step 1: Remove boilerplate files**

```bash
rm src/counter.ts src/typescript.svg
```

**Step 2: Update index.html**

Replace full contents of `index.html`:

```html
<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/jpeg" href="/logo.jpeg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="fit.foodbyshyla — voedingscoach Shyla helpt jou gezond en lekker eten." />
    <title>fit.foodbyshyla</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root">
      <header id="site-header"></header>
      <main id="app"></main>
      <footer id="site-footer"></footer>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**Step 3: Create all empty stub files**

Create each file listed above (except index.html) with just an `export {}` line so TypeScript doesn't error.

```bash
mkdir -p src/components src/pages src/data
```

Create `src/router.ts`:
```typescript
export {}
```

Repeat for all other new files.

**Step 4: Verify build doesn't error**

Run: `npm run build`
Expected: Build succeeds (or only "unused variable" warnings, no errors)

**Step 5: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold folder structure, remove boilerplate"
```

---

### Task 2: Global styles & CSS custom properties

**Files:**
- Modify: `src/style.css` (replace all content)

**Step 1: Write global stylesheet**

Replace full contents of `src/style.css`:

```css
/* ── Fonts ─────────────────────────────────────────── */
/* Loaded via Google Fonts in index.html */

/* ── Custom properties ──────────────────────────────── */
:root {
  --color-pink:       #F06B8A;
  --color-pink-hover: #d9556f;
  --color-pink-light: #FDE8EF;
  --color-gray:       #4A4A4A;
  --color-gray-light: #7A7A7A;
  --color-green:      #7ABF6E;
  --color-bg:         #FFF8F5;
  --color-white:      #FFFFFF;
  --color-border:     #F0D8E0;

  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body:    'Inter', system-ui, sans-serif;

  --radius-sm:  8px;
  --radius-md:  16px;
  --radius-lg:  24px;
  --radius-pill: 50px;

  --shadow-sm: 0 2px 8px rgba(240, 107, 138, 0.12);
  --shadow-md: 0 4px 20px rgba(240, 107, 138, 0.18);
  --shadow-lg: 0 8px 40px rgba(240, 107, 138, 0.22);

  --transition: 0.25s ease;
  --max-width: 1200px;
}

/* ── Reset ──────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: var(--font-body);
  background-color: var(--color-bg);
  color: var(--color-gray);
  line-height: 1.6;
  min-height: 100vh;
}

img { display: block; max-width: 100%; }

a { color: inherit; text-decoration: none; }

/* ── Typography ─────────────────────────────────────── */
h1, h2, h3, h4 {
  font-family: var(--font-heading);
  color: var(--color-gray);
  line-height: 1.2;
}

h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
h2 { font-size: clamp(1.5rem, 3vw, 2.2rem); }
h3 { font-size: clamp(1.1rem, 2vw, 1.4rem); }

p { color: var(--color-gray-light); line-height: 1.75; }

/* ── Layout utilities ───────────────────────────────── */
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section {
  padding: 5rem 0;
}

.section-title {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title h2 { margin-bottom: 0.5rem; }
.section-title p  { font-size: 1.1rem; }

/* ── Buttons ─────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all var(--transition);
  text-decoration: none;
}

.btn-primary {
  background: var(--color-pink);
  color: var(--color-white);
  border-color: var(--color-pink);
}
.btn-primary:hover {
  background: var(--color-pink-hover);
  border-color: var(--color-pink-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-outline {
  background: transparent;
  color: var(--color-pink);
  border-color: var(--color-pink);
}
.btn-outline:hover {
  background: var(--color-pink-light);
  transform: translateY(-2px);
}

/* ── Badge ───────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.badge-pink  { background: var(--color-pink-light); color: var(--color-pink); }
.badge-green { background: #E8F5E4; color: #4A9B3F; }

/* ── Cards ───────────────────────────────────────────── */
.card {
  background: var(--color-white);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
}
.card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}

/* ── Grid ────────────────────────────────────────────── */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

/* ── Page fade-in ────────────────────────────────────── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter {
  animation: fadeIn 0.35s ease forwards;
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 900px) {
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .grid-3, .grid-2 { grid-template-columns: 1fr; }
  .section { padding: 3rem 0; }
}
```

**Step 2: Verify dev server renders unstyled page (no CSS errors)**

Run: `npm run dev`
Open browser at `http://localhost:5173` — expect blank/white page, no console errors.

**Step 3: Commit**

```bash
git add src/style.css
git commit -m "style: add global CSS variables, reset, utilities, responsive grid"
```

---

### Task 3: Data layer — recipes & blog posts

**Files:**
- Modify: `src/data/recipes.ts`
- Modify: `src/data/blog.ts`

**Step 1: Write recipe data**

Replace `src/data/recipes.ts`:

```typescript
export type RecipeCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack'

export interface Recipe {
  id: number
  title: string
  category: RecipeCategory
  emoji: string
  time: string
  calories: string
  description: string
}

export const recipes: Recipe[] = [
  {
    id: 1,
    title: 'Overnight oats met aardbei',
    category: 'ontbijt',
    emoji: '🍓',
    time: '10 min',
    calories: '320 kcal',
    description: 'Romige haver met verse aardbeien en een vleugje honing. Bereid de avond van tevoren voor een zorgeloos ochtend.',
  },
  {
    id: 2,
    title: 'Avocado toast met ei',
    category: 'ontbijt',
    emoji: '🥑',
    time: '15 min',
    calories: '380 kcal',
    description: 'Knapperig volkorenbrood met gecremede avocado, een gepocheerd ei en chilivlokken.',
  },
  {
    id: 3,
    title: 'Griekse salade bowl',
    category: 'lunch',
    emoji: '🥗',
    time: '20 min',
    calories: '290 kcal',
    description: 'Frisse bowl met komkommer, tomaat, olijven, feta en een citroen-olijfolie dressing.',
  },
  {
    id: 4,
    title: 'Kip teriyaki met quinoa',
    category: 'diner',
    emoji: '🍗',
    time: '35 min',
    calories: '520 kcal',
    description: 'Sappige kipfilet in een zoet-zoute teriyaki saus, geserveerd op luchtige quinoa met broccolini.',
  },
  {
    id: 5,
    title: 'Zalm met geroosterde groenten',
    category: 'diner',
    emoji: '🐟',
    time: '40 min',
    calories: '480 kcal',
    description: 'Oven gebakken zalmfilet met kleurrijke geroosterde paprika, courgette en zoete aardappel.',
  },
  {
    id: 6,
    title: 'Proteïne smoothie',
    category: 'snack',
    emoji: '🥤',
    time: '5 min',
    calories: '210 kcal',
    description: 'Roze smoothie met banaan, aardbei, Griekse yoghurt en een schepje proteïnepoeder.',
  },
]
```

**Step 2: Write blog data**

Replace `src/data/blog.ts`:

```typescript
export interface BlogPost {
  id: number
  title: string
  date: string
  category: string
  excerpt: string
  readTime: string
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: '5 tips voor een gezond ontbijt dat je de hele ochtend volhoudt',
    date: '15 februari 2026',
    category: 'Voeding',
    excerpt: 'Een goed ontbijt is de basis van een productieve dag. Ontdek welke voedingsstoffen je niet mag overslaan en hoe je ze makkelijk in je ochtend verwerkt.',
    readTime: '4 min',
  },
  {
    id: 2,
    title: 'Waarom proteïne zo belangrijk is voor vrouwen',
    date: '8 februari 2026',
    category: 'Educatie',
    excerpt: 'Proteïne is meer dan spierherstel. Leer hoe het je hormoonbalans, huid en energieniveau ondersteunt — en hoeveel je eigenlijk nodig hebt.',
    readTime: '6 min',
  },
  {
    id: 3,
    title: 'Meal prep in 1 uur: zo plan je een hele week voor',
    date: '1 februari 2026',
    category: 'Lifestyle',
    excerpt: 'Met de juiste aanpak kun je in één uur alle maaltijden voor de week voorbereiden. Mijn stap-voor-stap methode voor beginners.',
    readTime: '5 min',
  },
  {
    id: 4,
    title: 'De waarheid over "gezonde" snacks uit de supermarkt',
    date: '22 januari 2026',
    category: 'Voeding',
    excerpt: 'Veel producten met een gezond imago bevatten verrassend veel suiker of additieven. Ik leer je hoe je een etiketten leest als een pro.',
    readTime: '7 min',
  },
]
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: Build succeeds with no type errors.

**Step 4: Commit**

```bash
git add src/data/recipes.ts src/data/blog.ts
git commit -m "feat: add placeholder recipe and blog data with TypeScript interfaces"
```

---

### Task 4: Header component

**Files:**
- Modify: `src/components/header.ts`

**Step 1: Implement header**

> Use `frontend-design:frontend-design` skill when implementing for high-quality UI details.

Replace `src/components/header.ts`:

```typescript
export function renderHeader(): string {
  return `
    <nav class="header-nav" id="header-nav">
      <div class="container header-inner">
        <a href="#home" class="header-logo" aria-label="fit.foodbyshyla home">
          <img src="/logo.jpeg" alt="fit.foodbyshyla logo" class="header-logo-img" />
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
  const nav = document.getElementById('header-nav')
  const hamburger = document.getElementById('hamburger')
  const links = document.getElementById('header-links')

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
```

**Step 2: Add header styles to `src/style.css`** (append to end of file)

```css
/* ── Header ─────────────────────────────────────────── */
.header-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-white);
  border-bottom: 1px solid transparent;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.header-scrolled {
  border-color: var(--color-border);
  box-shadow: 0 2px 16px rgba(240, 107, 138, 0.08);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.header-logo-img {
  height: 48px;
  width: auto;
  object-fit: contain;
}
.header-links {
  display: flex;
  align-items: center;
  gap: 2rem;
  list-style: none;
}
.header-link {
  font-weight: 500;
  color: var(--color-gray);
  transition: color var(--transition);
  position: relative;
}
.header-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-pink);
  transition: width var(--transition);
}
.header-link:hover { color: var(--color-pink); }
.header-link:hover::after,
.header-link--active::after { width: 100%; }
.header-link--active { color: var(--color-pink); }
.header-cta { padding: 0.5rem 1.25rem; }
.header-cta::after { display: none; }

.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
}
.hamburger span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--color-gray);
  border-radius: 2px;
  transition: all var(--transition);
}
.hamburger--open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger--open span:nth-child(2) { opacity: 0; }
.hamburger--open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

@media (max-width: 768px) {
  .hamburger { display: flex; }
  .header-links {
    display: none;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-white);
    padding: 1rem 1.5rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
  .header-links--open { display: flex; }
  .header-link { padding: 0.75rem 0; width: 100%; border-bottom: 1px solid var(--color-border); }
  .header-link:last-child { border: none; }
  .header-cta { margin-top: 0.5rem; }
}
```

**Step 3: Commit**

```bash
git add src/components/header.ts src/style.css
git commit -m "feat: add sticky responsive header with hamburger menu and active link highlight"
```

---

### Task 5: Footer component

**Files:**
- Modify: `src/components/footer.ts`

**Step 1: Implement footer**

Replace `src/components/footer.ts`:

```typescript
export function renderFooter(): string {
  const year = new Date().getFullYear()
  return `
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <img src="/logo.jpeg" alt="fit.foodbyshyla" class="footer-logo" />
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
```

**Step 2: Add footer styles to `src/style.css`** (append)

```css
/* ── Footer ─────────────────────────────────────────── */
.footer {
  background: var(--color-gray);
  color: rgba(255,255,255,0.75);
  padding-top: 4rem;
}
.footer-inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr;
  gap: 3rem;
  padding-bottom: 3rem;
}
.footer-brand .footer-logo { height: 48px; width: auto; margin-bottom: 1rem; filter: brightness(0) invert(1); }
.footer-brand p { font-size: 0.95rem; line-height: 1.7; }
.footer-links h4, .footer-social h4 {
  font-family: var(--font-heading);
  color: var(--color-white);
  margin-bottom: 1rem;
  font-size: 1rem;
}
.footer-links ul { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.footer-links a { transition: color var(--transition); font-size: 0.95rem; }
.footer-links a:hover { color: var(--color-pink); }
.footer-social { display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; }
.social-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-pill);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition);
  color: var(--color-white);
}
.social-btn--instagram { background: linear-gradient(135deg, #E1306C, #C13584); }
.social-btn--instagram:hover { opacity: 0.85; transform: translateY(-2px); }
.social-btn--app { background: var(--color-pink); }
.social-btn--app:hover { background: var(--color-pink-hover); transform: translateY(-2px); }
.footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  text-align: center;
  padding: 1.25rem 0;
  font-size: 0.875rem;
}
@media (max-width: 768px) {
  .footer-inner { grid-template-columns: 1fr 1fr; }
  .footer-brand { grid-column: 1 / -1; }
}
@media (max-width: 480px) {
  .footer-inner { grid-template-columns: 1fr; }
}
```

**Step 3: Commit**

```bash
git add src/components/footer.ts src/style.css
git commit -m "feat: add footer with nav links, Instagram and app buttons"
```

---

### Task 6: Router

**Files:**
- Modify: `src/router.ts`

**Step 1: Implement router**

Replace `src/router.ts`:

```typescript
import { renderHome }    from './pages/home.js'
import { renderAbout }   from './pages/about.js'
import { renderRecipes, setupRecipes } from './pages/recipes.js'
import { renderBlog }    from './pages/blog.js'
import { renderContact, setupContact } from './pages/contact.js'

type PageSetup = () => void

interface Route {
  render: () => string
  setup?: PageSetup
}

const routes: Record<string, Route> = {
  '#home':     { render: renderHome },
  '#about':    { render: renderAbout },
  '#recepten': { render: renderRecipes, setup: setupRecipes },
  '#blog':     { render: renderBlog },
  '#contact':  { render: renderContact, setup: setupContact },
}

export function navigate(): void {
  const hash  = window.location.hash || '#home'
  const route = routes[hash] ?? routes['#home']
  const app   = document.getElementById('app')
  if (!app) return

  app.innerHTML = `<div class="page-enter">${route.render()}</div>`
  route.setup?.()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function setupRouter(): void {
  window.addEventListener('hashchange', navigate)
  navigate()
}
```

**Step 2: Commit**

```bash
git add src/router.ts
git commit -m "feat: add hash-based router with page setup callbacks"
```

---

### Task 7: Main entry point

**Files:**
- Modify: `src/main.ts`

**Step 1: Wire everything together**

Replace `src/main.ts`:

```typescript
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
```

**Step 2: Verify dev server runs without errors**

Run: `npm run dev`
Expected: Page loads at `http://localhost:5173`, header and footer visible, no console errors.

**Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire header, footer and router in main entry point"
```

---

### Task 8: Home page

> **Use `frontend-design:frontend-design` skill for this task.**

**Files:**
- Modify: `src/pages/home.ts`

**Step 1: Implement home page**

Replace `src/pages/home.ts`:

```typescript
export function renderHome(): string {
  return `
    <!-- Hero -->
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-content">
          <span class="badge badge-pink hero-badge">✨ Voedingscoach</span>
          <h1 class="hero-title">Eet lekker.<br><em>Leef gezond.</em></h1>
          <p class="hero-subtitle">
            Hoi, ik ben Shyla! Ik help jou om op een duurzame en lekkere manier
            gezonder te eten — zonder strikte diëten of saai eten.
          </p>
          <div class="hero-actions">
            <a href="#recepten" class="btn btn-primary">Bekijk recepten</a>
            <a href="#about"    class="btn btn-outline">Over mij</a>
          </div>
        </div>
        <div class="hero-image-wrap">
          <div class="hero-image-bg"></div>
          <img src="/shyla.JPG" alt="Shyla, voedingscoach" class="hero-image" />
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="section features-section">
      <div class="container">
        <div class="section-title">
          <h2>Wat vind je hier?</h2>
          <p>Alles wat je nodig hebt voor een gezonde leefstijl</p>
        </div>
        <div class="grid-3 features-grid">
          <div class="feature-card card">
            <div class="feature-icon">🥗</div>
            <h3>Recepten</h3>
            <p>Heerlijke en voedzame recepten voor ontbijt, lunch, diner en snacks. Lekker en gezond hoeft niet moeilijk te zijn.</p>
            <a href="#recepten" class="btn btn-outline feature-btn">Recepten bekijken</a>
          </div>
          <div class="feature-card card feature-card--highlight">
            <div class="feature-icon">📱</div>
            <h3>Mijn app</h3>
            <p>Alle recepten, maaltijdplannen en tips in één handige app. Download nu en begin vandaag nog.</p>
            <a href="#" class="btn btn-primary feature-btn">Download de app</a>
          </div>
          <div class="feature-card card">
            <div class="feature-icon">📖</div>
            <h3>Blog</h3>
            <p>Lees mijn artikelen over voeding, leefstijl en alles wat er komt kijken bij een gezond leven.</p>
            <a href="#blog" class="btn btn-outline feature-btn">Blog lezen</a>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA banner -->
    <section class="cta-banner">
      <div class="container cta-inner">
        <h2>Klaar om te beginnen?</h2>
        <p>Stuur me een bericht en ik help je graag op weg.</p>
        <a href="#contact" class="btn btn-primary">Neem contact op</a>
      </div>
    </section>
  `
}
```

**Step 2: Add home page styles to `src/style.css`** (append)

```css
/* ── Hero ───────────────────────────────────────────── */
.hero {
  background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-pink-light) 100%);
  padding: 5rem 0 4rem;
  overflow: hidden;
}
.hero-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}
.hero-badge { margin-bottom: 1.25rem; font-size: 0.85rem; }
.hero-title { margin-bottom: 1.25rem; }
.hero-title em { color: var(--color-pink); font-style: normal; }
.hero-subtitle { font-size: 1.15rem; margin-bottom: 2rem; max-width: 480px; }
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
.hero-image-wrap {
  position: relative;
  display: flex;
  justify-content: center;
}
.hero-image-bg {
  position: absolute;
  inset: 10% 5%;
  background: var(--color-pink-light);
  border-radius: 50% 40% 60% 30% / 40% 50% 50% 60%;
  z-index: 0;
}
.hero-image {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  height: 480px;
  object-fit: cover;
  object-position: top;
  border-radius: 40% 60% 60% 40% / 50% 40% 60% 50%;
  box-shadow: var(--shadow-lg);
}

/* ── Features ───────────────────────────────────────── */
.features-section { background: var(--color-white); }
.feature-card {
  padding: 2rem;
  text-align: center;
  border: 1px solid var(--color-border);
}
.feature-card--highlight {
  background: var(--color-pink-light);
  border-color: var(--color-pink);
}
.feature-icon { font-size: 2.5rem; margin-bottom: 1rem; }
.feature-card h3 { margin-bottom: 0.75rem; }
.feature-card p  { margin-bottom: 1.5rem; font-size: 0.95rem; }
.feature-btn { width: 100%; justify-content: center; }

/* ── CTA banner ─────────────────────────────────────── */
.cta-banner {
  background: linear-gradient(135deg, var(--color-pink) 0%, #d9556f 100%);
  padding: 5rem 0;
  text-align: center;
}
.cta-inner h2 { color: var(--color-white); margin-bottom: 1rem; }
.cta-inner p  { color: rgba(255,255,255,0.85); margin-bottom: 2rem; font-size: 1.1rem; }
.cta-inner .btn-primary {
  background: var(--color-white);
  color: var(--color-pink);
  border-color: var(--color-white);
}
.cta-inner .btn-primary:hover { background: var(--color-pink-light); }

@media (max-width: 768px) {
  .hero-inner {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-image-wrap { order: -1; }
  .hero-image { max-width: 280px; height: 320px; }
  .hero-actions { justify-content: center; }
  .hero-subtitle { margin: 0 auto 2rem; }
}
```

**Step 3: Verify in browser**

Navigate to `http://localhost:5173/#home` — hero, features, and CTA should render with correct styling.

**Step 4: Commit**

```bash
git add src/pages/home.ts src/style.css
git commit -m "feat: add home page with hero, features grid and CTA banner"
```

---

### Task 9: About page

> **Use `frontend-design:frontend-design` skill for this task.**

**Files:**
- Modify: `src/pages/about.ts`

**Step 1: Implement about page**

Replace `src/pages/about.ts`:

```typescript
export function renderAbout(): string {
  return `
    <section class="section about-hero">
      <div class="container">
        <div class="section-title">
          <span class="badge badge-pink">Even voorstellen</span>
          <h2>Hoi, ik ben Shyla!</h2>
          <p>Voedingscoach, foodlover en jouw gids naar een gezonder leven</p>
        </div>
        <div class="about-grid">
          <div class="about-image-wrap">
            <img src="/shyla.JPG" alt="Shyla, voedingscoach" class="about-image" />
            <div class="about-image-badge">
              <span>🌿</span>
              <span>Gecertificeerd voedingscoach</span>
            </div>
          </div>
          <div class="about-content">
            <h3>Mijn verhaal</h3>
            <p>
              Gezond eten voelde voor mij lange tijd als een opgave. Saai, duur,
              ingewikkeld — dat waren de woorden die ik associeerde met "gezond leven".
              Tot ik ontdekte dat het echt anders kan.
            </p>
            <p>
              Ik ben Shyla, voedingscoach en foodlover. Na mijn eigen transformatie
              besloot ik mijn kennis en recepten te delen. Want een gezond en lekker
              leven is voor iedereen weggelegd.
            </p>
            <h3>Mijn aanpak</h3>
            <p>
              Geen strikte diëten. Geen verboden voedsel. Wel: bewuste keuzes maken,
              genieten van eten én je goed voelen in je lijf. Ik werk altijd vanuit
              balans en realisme — want het gaat om een levensstijl, niet een dieet.
            </p>
            <div class="about-values">
              <div class="value-chip"><span>🥦</span> Duurzame verandering</div>
              <div class="value-chip"><span>💪</span> Zonder verboden</div>
              <div class="value-chip"><span>❤️</span> Plezier in eten</div>
              <div class="value-chip"><span>🌱</span> Op jouw tempo</div>
            </div>
            <a href="#contact" class="btn btn-primary">Werk met mij samen</a>
          </div>
        </div>
      </div>
    </section>
  `
}
```

**Step 2: Add about styles to `src/style.css`** (append)

```css
/* ── About ──────────────────────────────────────────── */
.about-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 5rem;
  align-items: start;
  margin-top: 3rem;
}
.about-image-wrap { position: relative; }
.about-image {
  width: 100%;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  aspect-ratio: 3/4;
  object-fit: cover;
  object-position: top;
}
.about-image-badge {
  position: absolute;
  bottom: 1.5rem;
  left: -1rem;
  background: var(--color-white);
  border-radius: var(--radius-pill);
  padding: 0.6rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: var(--shadow-md);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray);
}
.about-content h3 { margin: 1.5rem 0 0.75rem; color: var(--color-pink); }
.about-content h3:first-child { margin-top: 0; }
.about-content p { margin-bottom: 1rem; }
.about-values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.75rem 0;
}
.value-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--color-pink-light);
  color: var(--color-pink);
  padding: 0.4rem 1rem;
  border-radius: var(--radius-pill);
  font-size: 0.875rem;
  font-weight: 500;
}
@media (max-width: 768px) {
  .about-grid { grid-template-columns: 1fr; gap: 2rem; }
  .about-image { aspect-ratio: 4/3; }
}
```

**Step 3: Commit**

```bash
git add src/pages/about.ts src/style.css
git commit -m "feat: add about page with photo, story, values and CTA"
```

---

### Task 10: Recipes page

> **Use `frontend-design:frontend-design` skill for this task.**

**Files:**
- Modify: `src/pages/recipes.ts`

**Step 1: Implement recipes page**

Replace `src/pages/recipes.ts`:

```typescript
import { recipes, type RecipeCategory } from '../data/recipes.js'

function recipeCard(recipe: typeof recipes[0]): string {
  return `
    <article class="card recipe-card" data-category="${recipe.category}">
      <div class="recipe-emoji">${recipe.emoji}</div>
      <div class="recipe-body">
        <div class="recipe-meta">
          <span class="badge badge-pink">${recipe.category}</span>
          <span class="recipe-time">⏱ ${recipe.time}</span>
        </div>
        <h3 class="recipe-title">${recipe.title}</h3>
        <p>${recipe.description}</p>
        <div class="recipe-footer">
          <span class="recipe-calories">🔥 ${recipe.calories}</span>
        </div>
      </div>
    </article>
  `
}

export function renderRecipes(): string {
  const categories: Array<'alle' | RecipeCategory> = ['alle', 'ontbijt', 'lunch', 'diner', 'snack']
  const filterHTML = categories.map(cat => `
    <button class="filter-btn ${cat === 'alle' ? 'filter-btn--active' : ''}" data-filter="${cat}">
      ${cat.charAt(0).toUpperCase() + cat.slice(1)}
    </button>
  `).join('')

  return `
    <section class="section">
      <div class="container">
        <div class="section-title">
          <span class="badge badge-green">Voeding</span>
          <h2>Recepten</h2>
          <p>Heerlijke en voedzame recepten voor elke dag</p>
        </div>
        <div class="filter-bar">${filterHTML}</div>
        <div class="grid-3 recipes-grid" id="recipes-grid">
          ${recipes.map(recipeCard).join('')}
        </div>
      </div>
    </section>
  `
}

export function setupRecipes(): void {
  const grid    = document.getElementById('recipes-grid')
  const buttons = document.querySelectorAll<HTMLButtonElement>('.filter-btn')

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter as 'alle' | RecipeCategory

      buttons.forEach(b => b.classList.remove('filter-btn--active'))
      btn.classList.add('filter-btn--active')

      grid?.querySelectorAll<HTMLElement>('.recipe-card').forEach(card => {
        const show = filter === 'alle' || card.dataset.category === filter
        card.style.display = show ? '' : 'none'
      })
    })
  })
}
```

**Step 2: Add recipes styles to `src/style.css`** (append)

```css
/* ── Filter bar ──────────────────────────────────────── */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 3rem;
}
.filter-btn {
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-pill);
  border: 2px solid var(--color-border);
  background: var(--color-white);
  color: var(--color-gray-light);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}
.filter-btn:hover { border-color: var(--color-pink); color: var(--color-pink); }
.filter-btn--active {
  background: var(--color-pink);
  border-color: var(--color-pink);
  color: var(--color-white);
}

/* ── Recipe card ─────────────────────────────────────── */
.recipe-card { border: 1px solid var(--color-border); }
.recipe-emoji {
  background: var(--color-pink-light);
  font-size: 4rem;
  text-align: center;
  padding: 2rem;
  line-height: 1;
}
.recipe-body { padding: 1.5rem; }
.recipe-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.recipe-time { font-size: 0.85rem; color: var(--color-gray-light); }
.recipe-title { margin-bottom: 0.5rem; font-size: 1.1rem; }
.recipe-body p { font-size: 0.9rem; margin-bottom: 1rem; }
.recipe-footer { padding-top: 1rem; border-top: 1px solid var(--color-border); }
.recipe-calories { font-size: 0.85rem; font-weight: 500; color: var(--color-gray); }
```

**Step 3: Commit**

```bash
git add src/pages/recipes.ts src/style.css
git commit -m "feat: add recipes page with category filter and recipe cards"
```

---

### Task 11: Blog page

> **Use `frontend-design:frontend-design` skill for this task.**

**Files:**
- Modify: `src/pages/blog.ts`

**Step 1: Implement blog page**

Replace `src/pages/blog.ts`:

```typescript
import { blogPosts } from '../data/blog.js'

function blogCard(post: typeof blogPosts[0]): string {
  return `
    <article class="card blog-card">
      <div class="blog-card-color"></div>
      <div class="blog-body">
        <div class="blog-meta">
          <span class="badge badge-pink">${post.category}</span>
          <span class="blog-read-time">📖 ${post.readTime} leestijd</span>
        </div>
        <h3 class="blog-title">${post.title}</h3>
        <p>${post.excerpt}</p>
        <div class="blog-footer">
          <span class="blog-date">${post.date}</span>
          <a href="#" class="blog-read-btn">Lees meer →</a>
        </div>
      </div>
    </article>
  `
}

export function renderBlog(): string {
  return `
    <section class="section">
      <div class="container">
        <div class="section-title">
          <span class="badge badge-green">Inspiratie</span>
          <h2>Blog</h2>
          <p>Tips, kennis en verhalen over voeding en leefstijl</p>
        </div>
        <div class="grid-3 blog-grid">
          ${blogPosts.map(blogCard).join('')}
        </div>
      </div>
    </section>
  `
}
```

**Step 2: Add blog styles to `src/style.css`** (append)

```css
/* ── Blog card ───────────────────────────────────────── */
.blog-card { border: 1px solid var(--color-border); }
.blog-card-color {
  height: 6px;
  background: linear-gradient(90deg, var(--color-pink), var(--color-green));
}
.blog-body { padding: 1.5rem; }
.blog-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.blog-read-time { font-size: 0.8rem; color: var(--color-gray-light); }
.blog-title { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.4; }
.blog-body p { font-size: 0.9rem; margin-bottom: 1.25rem; }
.blog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.blog-date { font-size: 0.8rem; color: var(--color-gray-light); }
.blog-read-btn {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-pink);
  transition: gap var(--transition);
}
.blog-read-btn:hover { opacity: 0.75; }
```

**Step 3: Commit**

```bash
git add src/pages/blog.ts src/style.css
git commit -m "feat: add blog page with article cards"
```

---

### Task 12: Contact page

> **Use `frontend-design:frontend-design` skill for this task.**

**Files:**
- Modify: `src/pages/contact.ts`

**Step 1: Implement contact page**

Replace `src/pages/contact.ts`:

```typescript
export function renderContact(): string {
  return `
    <section class="section">
      <div class="container contact-wrapper">
        <div class="section-title">
          <span class="badge badge-pink">Samenwerken?</span>
          <h2>Neem contact op</h2>
          <p>Heb je een vraag of wil je graag samenwerken? Stuur me een bericht!</p>
        </div>
        <div class="contact-grid">
          <form class="contact-form" id="contact-form" novalidate>
            <div class="form-group">
              <label for="name">Naam</label>
              <input type="text" id="name" name="name" placeholder="Jouw naam" required />
            </div>
            <div class="form-group">
              <label for="email">E-mailadres</label>
              <input type="email" id="email" name="email" placeholder="jouw@email.nl" required />
            </div>
            <div class="form-group">
              <label for="message">Bericht</label>
              <textarea id="message" name="message" rows="5" placeholder="Schrijf hier je bericht..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary contact-submit">
              Verstuur bericht ✉️
            </button>
            <div class="form-feedback" id="form-feedback" hidden></div>
          </form>
          <aside class="contact-aside">
            <div class="contact-info-card card">
              <h3>Volg Shyla</h3>
              <p>Blijf op de hoogte van nieuwe recepten, tips en meer!</p>
              <a href="https://instagram.com" target="_blank" rel="noopener" class="social-btn social-btn--instagram contact-social">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
                @fit.foodbyshyla
              </a>
              <h3 style="margin-top:1.5rem">Download de app</h3>
              <p>Al mijn recepten en maaltijdplannen in één app.</p>
              <a href="#" class="social-btn social-btn--app contact-social">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.37c1.57.07 2.65.83 3.56.87 1.36-.28 2.66-1.06 4.12-.91 1.74.19 3.04.89 3.88 2.28-3.47 2.17-2.68 6.88.44 8.51-.7 1.72-1.63 3.41-4 4.16zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Download nu
              </a>
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

  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = {
      name:    (form.elements.namedItem('name')    as HTMLInputElement).value,
      email:   (form.elements.namedItem('email')   as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }
    console.log('📬 Contactformulier ontvangen:', data)

    if (feedback) {
      feedback.textContent = '✅ Bedankt! Je bericht is ontvangen (zie console).'
      feedback.hidden = false
      feedback.className = 'form-feedback form-feedback--success'
    }
    form.reset()
  })
}
```

**Step 2: Add contact styles to `src/style.css`** (append)

```css
/* ── Contact ─────────────────────────────────────────── */
.contact-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 4rem;
  align-items: start;
  margin-top: 3rem;
}
.contact-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-weight: 600; font-size: 0.9rem; color: var(--color-gray); }
.form-group input,
.form-group textarea {
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--color-gray);
  background: var(--color-white);
  transition: border-color var(--transition);
  resize: vertical;
}
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-pink);
  box-shadow: 0 0 0 3px rgba(240,107,138,0.15);
}
.contact-submit { align-self: flex-start; margin-top: 0.5rem; }
.form-feedback {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
}
.form-feedback--success { background: #E8F5E4; color: #2E7D23; }
.contact-info-card { padding: 2rem; border: 1px solid var(--color-border); }
.contact-info-card h3 { margin-bottom: 0.5rem; font-size: 1.1rem; }
.contact-info-card p { font-size: 0.9rem; margin-bottom: 1rem; }
.contact-social { width: 100%; justify-content: center; }
@media (max-width: 768px) {
  .contact-grid { grid-template-columns: 1fr; }
}
```

**Step 3: Commit**

```bash
git add src/pages/contact.ts src/style.css
git commit -m "feat: add contact page with form (console.log), Instagram and app links"
```

---

### Task 13: Final verification & polish

**Step 1: Build for production**

Run: `npm run build`
Expected: Build succeeds, no TypeScript errors, no warnings about missing imports.

**Step 2: Preview production build**

Run: `npm run preview`
Open `http://localhost:4173` in browser.

Check each page manually:
- `#home` — hero, features, CTA render correctly
- `#about` — photo and text layout correct
- `#recepten` — 6 cards, category filter works
- `#blog` — 4 article cards render
- `#contact` — fill form, submit, check browser console for `📬 Contactformulier ontvangen:` log
- Header navigation links all work, active link highlights
- Footer Instagram + app buttons visible
- Responsive: resize window to mobile width, hamburger menu appears

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: complete fit.foodbyshyla website — all pages, routing, responsive"
```
