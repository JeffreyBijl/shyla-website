# Design: Astro SSG + SEO/GEO Migratie

**Datum:** 21 maart 2026
**Aanpak:** Big bang migratie op feature branch

## Doel

Migratie van Vite SPA (hash-routing, client-rendered) naar Astro SSG (clean URLs, statische HTML) met volledige SEO en GEO optimalisatie. Maximale vindbaarheid in Google, AI Overviews, ChatGPT, Perplexity en Claude.

## Beslissingen

| Beslissing | Keuze | Reden |
|---|---|---|
| Migratie-aanpak | Big bang (één keer alles) | Site is klein genoeg, geen hybride complexiteit |
| Admin aanpak | Standalone SPA bundle | Admin is complex, hoeft niet SSG, minder risico |
| Bestaande velden | Ongewijzigd | Geen onnodige breaking changes |
| BlogPost.date | ISO 8601 format, frontend formatteert | Machine-readable voor schema's |
| prepTime/cookTime | Parse bestaand `time` veld bij build | Geen datamodel-wijziging nodig |
| FAQ/Samenwerkingen | Technisch klaar, placeholder content | Shyla levert content later aan |
| Related content | Automatisch op basis van categorie + keywords | Geen handmatig werk voor Shyla |
| Instagram | Niet in scope | API gegevens nog niet beschikbaar |
| Domein | Configureerbaar via astro.config | Eigen domein komt later |

## Architectuur

### Bestandsstructuur

```
src/
├── layouts/
│   ├── BaseLayout.astro              # HTML shell + SEOHead + SchemaOrg (Website)
│   ├── RecipeLayout.astro            # Extends Base + Recipe JSON-LD + Breadcrumb
│   └── BlogLayout.astro              # Extends Base + Article JSON-LD + Breadcrumb
├── components/
│   ├── Header.astro                  # Navigatie (statisch, clean URLs)
│   ├── Footer.astro                  # Footer (statisch)
│   ├── RecipeCard.astro              # Receptkaartje voor overzichtspagina
│   ├── BlogCard.astro                # Blogkaartje voor overzichtspagina
│   ├── SEOHead.astro                 # Meta tags, OG, canonical, hreflang
│   ├── SchemaOrg.astro               # JSON-LD injection (generic)
│   ├── RelatedContent.astro          # Automatische interne links
│   └── Breadcrumb.astro              # Breadcrumb navigatie + schema
├── pages/
│   ├── index.astro                   # Homepage
│   ├── over-mij.astro                # Over Shyla
│   ├── contact.astro                 # Contact
│   ├── faq.astro                     # FAQ (placeholder content)
│   ├── samenwerkingen.astro          # Samenwerkingen (placeholder content)
│   ├── recepten/
│   │   ├── index.astro               # Recepten overzicht met filters
│   │   └── [slug].astro              # Dynamisch uit recipes.json
│   ├── blog/
│   │   ├── index.astro               # Blog overzicht
│   │   └── [slug].astro              # Dynamisch uit blog.json
│   ├── admin-shyla.astro             # Standalone admin SPA
│   └── 404.astro                     # 404 pagina
├── data/
│   ├── types.ts                      # Interfaces (uitgebreid met SEO velden)
│   ├── recipes.json                  # Bestaande data
│   └── blog.json                     # Bestaande data (date → ISO)
├── admin/                            # Bestaande admin code (standalone SPA)
│   ├── main.ts                       # Entry point
│   └── (alle bestaande modules)
├── styles/
│   └── global.css                    # Bestaande CSS (1-op-1)
└── utils/
    ├── seo.ts                        # SEO helpers
    ├── formatting.ts                 # Datum formatting
    └── utils.ts                      # Bestaande escapeHtml()
```

### Data flow

```
JSON bestanden → Astro Content Collections → Statische HTML bij build
Admin edit → GitHub API commit → GitHub Actions rebuild → Nieuwe HTML
```

### Admin als standalone SPA

- `src/admin/main.ts` als apart Vite entry point
- Bestaande modules grotendeels intact (pad-referenties updaten)
- Geladen als `<script>` in `admin-shyla.astro`
- Uitgesloten van sitemap en robots.txt
- Geen SEO-metadata

## Datamodel wijzigingen

### Recipe — nieuwe velden

```typescript
// Toevoegingen (optioneel):
datePublished?: string    // ISO 8601
dateModified?: string     // ISO 8601, auto-set bij admin edit
keywords?: string[]       // Zoektermen
tips?: string             // Extra tips/variaties
```

### BlogPost — wijzigingen

```typescript
// Gewijzigd:
date: string              // Was NL string → wordt ISO 8601

// Toevoegingen (optioneel):
dateModified?: string     // ISO 8601, auto-set bij admin edit
keywords?: string[]       // Zoektermen
```

## SEO implementatie

### Per pagina

- Unieke `<title>` en `<meta description>`
- Canonical URL (leest uit astro.config)
- Open Graph + Twitter Card tags
- `hreflang="nl"`, `og:locale="nl_NL"`
- `noindex` op admin en 404

### Structured Data (JSON-LD)

| Pagina | Schema's |
|---|---|
| Alle pagina's | WebSite + Person |
| Recepten | Recipe + BreadcrumbList |
| Blog | Article + BreadcrumbList |
| FAQ | FAQPage + BreadcrumbList |
| Overzichten | BreadcrumbList |

### Recipe schema mapping

- `name` ← `title`
- `recipeIngredient` ← `ingredients[]` als strings
- `recipeInstructions` ← `steps[]` als HowToStep
- `prepTime` ← `time` geparsed naar ISO 8601
- `nutrition.calories` ← `nutrition.kcal` + " kcal"
- `recipeYield` ← `servings` + " porties"
- `recipeCategory` ← `category`
- `keywords` ← `keywords[]`
- `datePublished` ← `datePublished`

### Infra

- `@astrojs/sitemap` met admin uitgesloten
- `robots.txt` in `public/` — alle crawlers welkom, admin geblokkeerd
- 404.html automatisch door Astro

## GEO implementatie

- Semantische HTML (`<article>`, `<main>`, `<nav>`, `<time>`)
- Eén `<h1>` per pagina, logische heading-hiërarchie
- Description/samenvatting direct na `<h1>`
- `last-modified` meta tag
- Auteur-info consistent via Person schema
- Alle AI-crawlers toegestaan in robots.txt

## Related Content

Automatische interne links onderaan recepten en blogposts:
- Receptpagina → 2-3 gerelateerde blogposts (categorie match)
- Blogpagina → 2-3 gerelateerde recepten (categorie match)
- Tiebreaker: keywords overlap

## Buiten scope

- Instagram integratie (API gegevens niet beschikbaar)
- Content voor FAQ en Samenwerkingen (Shyla levert aan)
- Headings herformuleren als vragen (content-werk)
- Eigen domein configureren (nog niet bekend)

## Deploy

- Feature branch `feat/astro-migration`
- GitHub Actions: `astro build` i.p.v. `tsc && vite build`
- Output: `dist/` (zelfde als nu)
- Eén merge naar main als alles werkt
