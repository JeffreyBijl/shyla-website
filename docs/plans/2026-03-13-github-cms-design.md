# Design: GitHub-based CMS voor fit.foodbyshyla

**Datum:** 13 maart 2026
**Status:** Goedgekeurd

## Context

Shyla is een voedingscoach/food blogger. Ze moet recepten en blogposts kunnen toevoegen via een simpel admin-formulier op een geheime URL (`#admin-shyla`), zonder code aan te raken. Alle content wordt opgeslagen als JSON-bestanden in de GitHub repo, afbeeldingen als JPEG-bestanden in `public/images/`.

## Kernbeslissingen

| Onderwerp | Beslissing | Reden |
|---|---|---|
| Data-import | Compile-time (JSON import via Vite) | Rebuild is toch nodig voor afbeeldingen, houdt router synchroon |
| Afbeeldingen serveren | Via GitHub Pages (in `public/`) | Sneller dan raw.githubusercontent.com, geen cache-busting nodig |
| Data-formaat | `.json` bestanden met `resolveJsonModule` | Robuuster dan `.ts` genereren vanuit admin |
| Token-opslag | `localStorage` | Shyla hoeft token maar 1x in te voeren |
| Build-notificatie | Polling GitHub Actions API op admin-pagina | Simpelst, geen externe dienst nodig |
| Admin-route | `#admin-shyla` | Niet in navigatie, URL gedeeld via WhatsApp |

## Architectuur

```
Shyla opent admin (#admin-shyla)
    ↓
Voert GitHub token in (1x, opgeslagen in localStorage)
    ↓
Vult formulier in + kiest foto
    ↓
Admin doet 2 GitHub API calls:
  1. Commit afbeelding → public/images/recipes/slug-timestamp.jpg
  2. Leest huidige JSON, voegt item toe, commit update → public/data/recipes.json
    ↓
GitHub Actions triggered automatisch (rebuild + deploy, ~1-2 min)
    ↓
Admin-pagina pollt Actions API → toont "Publiceren..." → "Live!"
```

## Data

### Types (`src/data/types.ts`)

```typescript
export type RecipeCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack'

export interface Recipe {
  id: number
  title: string
  category: RecipeCategory
  image: string
  time: string
  calories: string
  description: string
}

export interface BlogPost {
  id: number
  title: string
  date: string
  category: string
  image: string | null
  excerpt: string
  readTime: string
}
```

### JSON-bestanden

- `public/data/recipes.json` — array van Recipe objecten
- `public/data/blog.json` — array van BlogPost objecten

Image-paden relatief aan `public/`, bijv. `images/recipes/overnight-oats-1710345600.jpg`. In HTML gerendered met `${import.meta.env.BASE_URL}` prefix.

### Imports in pagina's

```typescript
import recipesData from '../../public/data/recipes.json'
import type { Recipe } from '../data/types.js'
const recipes: Recipe[] = recipesData
```

## Publieke pagina's

### Recipe cards

`.recipe-emoji-wrap` met emoji wordt vervangen door `.recipe-image-wrap` met `<img>`:
- Desktop: full-width, hoogte 200px, `object-fit: cover`
- Mobiel (< 600px): hoogte 180px
- `border-radius` boven passend bij card
- `loading="lazy"`, `alt` = titel

### Blog cards

`.blog-card-visual` krijgt een `<img>` als `image` niet null is:
- Desktop: hoogte 180px, `object-fit: cover`
- Mobiel (< 600px): hoogte 160px
- `image: null` → bestaande gradient + emoji fallback
- `loading="lazy"`, `alt` = titel

## Image compressie (`src/lib/image.ts`)

Client-side resize en compressie vóór upload:
- Max 1200×1200px, behoud aspect ratio
- Min 400px breed → foutmelding
- Max 10 MB bronbestand → foutmelding
- Output: JPEG, quality 0.80
- `createImageBitmap()` voor EXIF-rotatie, fallback naar `new Image()`
- HEIC/HEIF niet ondersteund → foutmelding "Probeer een JPEG of PNG"

```typescript
interface CompressedImage {
  blob: Blob
  width: number
  height: number
  base64: string
}

async function compressImage(file: File): Promise<CompressedImage>
```

## GitHub API helpers (`src/lib/github.ts`)

### Configuratie

```typescript
const CONFIG = {
  REPO_OWNER: 'jeffreybijl',
  REPO_NAME: 'shyla-website',
  BRANCH: 'main',
  RECIPES_PATH: 'public/data/recipes.json',
  BLOG_PATH: 'public/data/blog.json',
  RECIPE_IMAGES_DIR: 'public/images/recipes',
  BLOG_IMAGES_DIR: 'public/images/blog',
}
```

### Functies

```typescript
function getToken(): string | null
function saveToken(token: string): void
async function readFile<T>(path: string): Promise<{ content: T, sha: string }>
async function writeFile(path: string, content: string, message: string, sha: string): Promise<void>
async function uploadImage(dir: string, filename: string, base64: string): Promise<string>
async function deleteFile(path: string, sha: string, message: string): Promise<void>
async function getLatestDeployStatus(): Promise<'queued' | 'in_progress' | 'completed' | 'failed'>
function slugify(title: string): string
```

### Foutafhandeling

- 409 Conflict → "Data is ondertussen gewijzigd, ververs de pagina en probeer opnieuw"
- 401 Unauthorized → "Token is ongeldig of verlopen"
- 403 Forbidden → "Token heeft niet de juiste rechten (repo scope nodig)"
- Netwerk-errors → "Geen internetverbinding"

## Admin pagina (`src/pages/admin.ts`)

### Route

`#admin-shyla` — toegevoegd aan router, geen link in header/footer/navigatie.

### Token-invoer

- Tekstveld + uitleg bij eerste bezoek
- Validatie via `GET /user` API call
- Opgeslagen in `localStorage`
- Waarschuwing: "Deel dit token met niemand"

### Dashboard

Tab-interface met twee secties: Recepten en Blog.

Per sectie:
- Formulier om nieuw item toe te voegen
- Deploy-statusbalk
- Lijst van bestaande items met thumbnail + delete-knop

### Recept-formulier

| Veld | Type | Verplicht |
|---|---|---|
| Foto | `<input type="file" accept="image/*">` | ja |
| Titel | text | ja |
| Categorie | select (ontbijt/lunch/diner/snack) | ja |
| Bereidingstijd | text | ja |
| Calorieën | text | ja |
| Beschrijving | textarea | ja |

ID = hoogste bestaande id + 1.

### Blog-formulier

| Veld | Type | Verplicht |
|---|---|---|
| Foto | `<input type="file" accept="image/*">` | nee |
| Titel | text | ja |
| Categorie | select (Voeding/Educatie/Lifestyle) | ja |
| Samenvatting | textarea | ja |
| Leestijd | text | ja |

Datum = automatisch (vandaag, geformatteerd als "15 februari 2026").

### Opslaan-flow

1. Valideer velden
2. Comprimeer afbeelding → "Foto verkleinen..."
3. Upload afbeelding naar repo → "Foto uploaden..."
4. Lees huidige JSON (incl. SHA)
5. Voeg item toe, commit JSON → "Gegevens opslaan..."
6. Success: "Recept opgeslagen! Wordt binnen 1-2 minuten gepubliceerd."
7. Start polling → "Publiceren..." → "Live!"

### Verwijderen

1. Bevestigingsdialoog
2. Verwijder afbeelding uit repo
3. Filter item uit JSON, commit
4. Start deploy-polling

### Deploy-status polling

- Wacht 3 sec na commit, dan poll elke 10 sec
- `queued` → "Wachtrij..."
- `in_progress` → "Publiceren..."
- `completed` + `success` → "Live!" (verdwijnt na 10 sec)
- `completed` + `failure` → "Publicatie mislukt"
- Stop bij `completed`, stil falen bij netwerk-errors

### Mobiel (< 768px)

- Tabs volledige breedte
- Formuliervelden gestapeld
- "Kies foto" minimaal 44×44px
- Preview full-width, max-height 200px
- Item-lijst: thumbnail 60×60px + titel + delete
- Alle buttons minimaal 44px hoog

## Stijl

Hergebruik bestaande CSS variabelen en componenten (`.btn`, `.btn-primary`, `.card`, `.form-group`). Admin-specifieke styles toegevoegd aan `style.css` (mobile-first).

## Bestandsstructuur na wijzigingen

```
project/
├── public/
│   ├── data/
│   │   ├── recipes.json          ← NIEUW
│   │   └── blog.json             ← NIEUW
│   ├── images/
│   │   ├── recipes/              ← NIEUW
│   │   └── blog/                 ← NIEUW
│   ├── logo.jpeg
│   └── shyla.JPG
├── src/
│   ├── main.ts
│   ├── style.css                 ← image + admin styling
│   ├── router.ts                 ← admin-route toevoegen
│   ├── data/
│   │   ├── types.ts              ← NIEUW: type-definities
│   │   ├── recipes.ts            ← VERWIJDERD
│   │   └── blog.ts              ← VERWIJDERD
│   ├── pages/
│   │   ├── home.ts
│   │   ├── about.ts
│   │   ├── recipes.ts            ← img i.p.v. emoji
│   │   ├── blog.ts              ← img of fallback
│   │   ├── contact.ts
│   │   └── admin.ts             ← NIEUW
│   ├── components/
│   │   ├── header.ts
│   │   └── footer.ts
│   └── lib/
│       ├── github.ts            ← NIEUW
│       └── image.ts             ← NIEUW
├── tsconfig.json                 ← resolveJsonModule: true
```

## Edge cases

- Lege JSON → admin toont lege lijst, geen crash
- SHA-conflict → melding, ververs en probeer opnieuw
- Afbeelding-upload slaagt maar JSON faalt → foutmelding, wees-afbeelding acceptabel
- HEIC niet ondersteund → "Probeer JPEG of PNG"
- EXIF-rotatie → `createImageBitmap()` handelt af
- Ongeldig/verlopen token → melding, vraag opnieuw
