# fit.foodbyshyla

Persoonlijke website voor Shyla — voedingscoach, recepten en blog. Gebouwd als een moderne single-page applicatie met vanilla TypeScript en GitHub als backend.

**Live:** [jeffreybijl.github.io/shyla-website](https://jeffreybijl.github.io/shyla-website/)

## Tech Stack

- **Frontend:** Vanilla TypeScript (geen framework)
- **Build:** Vite 7
- **Styling:** Custom CSS met CSS custom properties
- **Data:** JSON bestanden in de repo (`src/data/`)
- **Backend:** GitHub API (geen server nodig)
- **Rich text:** Quill 2 (CDN, voor blog editor)
- **Hosting:** GitHub Pages via GitHub Actions
- **Fonts:** Playfair Display (headings) + Inter (body)

## Projectstructuur

```
src/
├── main.ts                  # Entry point — header, footer, router
├── router.ts                # Hash-based client-side routing
├── style.css                # Alle styling (~1900 regels)
├── utils.ts                 # Hulpfuncties
│
├── pages/                   # Publieke pagina's
│   ├── home.ts              # Hero sectie met introductie
│   ├── about.ts             # Over Shyla
│   ├── recipes.ts           # Receptenlijst met categoriefilters
│   ├── recipe-detail.ts     # Recept met portie-schaler
│   ├── blog.ts              # Bloglijst
│   ├── blog-detail.ts       # Blogpost
│   └── contact.ts           # Contactformulier
│
├── components/              # Herbruikbare UI componenten
│   ├── header.ts            # Navigatie met hamburger menu
│   ├── footer.ts            # Footer
│   └── toast.ts             # Toast notificaties
│
├── data/                    # Data & types
│   ├── types.ts             # TypeScript interfaces & enums
│   ├── recipes.json         # Receptendata
│   └── blog.json            # Blogdata
│
└── admin/                   # Admin CMS paneel
    ├── page.ts              # Dashboard layout
    ├── auth.ts              # GitHub token authenticatie
    ├── recipes.ts           # Recept CRUD + formulier
    ├── blog.ts              # Blog CRUD + Quill editor
    ├── github.ts            # GitHub API wrapper
    ├── image.ts             # Beeldcompressie & slugs
    ├── validation.ts        # Formuliervalidatie
    ├── state.ts             # Gedeelde admin state
    ├── shared.ts            # Deploy polling & helpers
    └── queue.ts             # Operatie-wachtrij voor API calls

public/
├── logo.jpeg                # Logo
├── shyla.JPG                # Profielfoto
└── images/
    ├── recipes/             # Receptfoto's (via admin geüpload)
    └── blog/                # Blogfoto's (via admin geüpload)
```

## Features

### Publieke website

- **Recepten** — Grid met categoriefilters (Ontbijt, Lunch, Diner, Snack, Dessert)
- **Portie-schaler** — Dynamisch ingrediënten schalen met Nederlandse eenheden en meervoudsvormen
- **Blog** — Posts met categorieën (Voeding, Educatie, Lifestyle) en rich text content
- **Contact** — Contactformulier met e-mail integratie
- **Responsive** — Mobile-first design met hamburger menu

### Admin paneel (`#admin-shyla`)

- **Receptenbeheer** — Toevoegen, bewerken en verwijderen van recepten
  - Afbeelding upload met automatische compressie (max 1200px, JPEG 80%)
  - Dynamische ingrediëntenlijst met hoeveelheid, eenheid en naam
  - Stappen, voedingswaarden per portie (kcal, eiwit, koolhydraten, vet)
- **Blogbeheer** — Posts met Quill rich text editor en optionele afbeelding
- **GitHub integratie** — Alle wijzigingen worden direct via de GitHub API opgeslagen
  - Automatische conflict-detectie en retry bij gelijktijdige bewerkingen
  - Deploy status polling (monitort GitHub Actions)
- **Beeldverwerking** — Automatische compressie, HEIC/HEIF ondersteuning, slug-generatie

## Data-architectuur

Geen backend server nodig. Het admin paneel communiceert rechtstreeks met de GitHub API:

1. Admin bewerkt content via het webformulier
2. Wijzigingen worden als commits naar `main` gepusht via de GitHub API
3. GitHub Actions bouwt de site automatisch en deployt naar GitHub Pages

**Databestanden:**
- `src/data/recipes.json` — Array van receptobjecten
- `src/data/blog.json` — Array van blogpost-objecten
- `public/images/` — Geüploade afbeeldingen

## Development

```bash
# Installeer dependencies
npm install

# Start dev server
npm run dev

# Build voor productie
npm run build

# Preview productie-build
npm run preview
```

## Deployment

Deployment gebeurt automatisch via GitHub Actions bij elke push naar `main`. De workflow (`.github/workflows/deploy.yml`) voert `npm run build` uit en deployt de `dist/` map naar GitHub Pages.

## Design

- **Kleuren:** Roze (`#F06B8A`) als primaire kleur, warm wit (`#FFF8F5`) achtergrond, groen (`#7ABF6E`) als accent
- **Typografie:** Playfair Display (elegant serif) voor koppen, Inter (modern sans-serif) voor body
- **Schaduwen:** Subtiele roze tint voor diepte
- **Layout:** Max 1200px container, responsive grid voor kaarten

## Foto's

Foto's worden automatisch verwerkt bij het uploaden:

| Instelling | Waarde |
|---|---|
| Max dimensie | 1200px |
| Min breedte | 400px |
| Formaat | JPEG |
| Kwaliteit | 80% |
| Max upload | 10 MB |

iPhone foto's werken direct — het systeem schaalt en comprimeert automatisch. Landscape (liggend) werkt het beste voor de kaart- en hero-weergaven.
