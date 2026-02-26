# fit.foodbyshyla Website — Design Document

**Datum:** 2026-02-26
**Project:** Shyla voedingscoach website
**Stack:** Vite + Vanilla TypeScript

---

## Doel

Een moderne multi-page website voor Shyla, voedingscoach onder de naam *fit.foodbyshyla*. De website introduceert Shyla, deelt recepten en blogtips, en biedt een contactmogelijkheid. Er zijn links naar haar Instagram en eigen app.

---

## Architectuur

**Routing:** Hash-based client-side routing via vanilla TypeScript. `main.ts` luistert naar `hashchange` events en rendert het juiste pagina-component in een `#app` container, omringd door een vaste header en footer.

### Bestandsstructuur

```
src/
  main.ts              ← entry point + router setup
  router.ts            ← hash routing logica
  style.css            ← globale stijlen + CSS variabelen
  components/
    header.ts          ← sticky navbar met logo + navigatie
    footer.ts          ← footer met socials + app link
  pages/
    home.ts            ← hero sectie + feature blokken + CTA
    about.ts           ← over mij sectie met foto + verhaal
    recipes.ts         ← recepten grid met categorie filter
    blog.ts            ← blog artikelen grid
    contact.ts         ← contactformulier (console.log output)
  data/
    recipes.ts         ← placeholder recepten data (6 items)
    blog.ts            ← placeholder blog data (4 items)
```

---

## Kleurpalet

Afgeleid van het logo (`public/logo.jpeg`):

| CSS Variabele        | Hex       | Gebruik                        |
|----------------------|-----------|--------------------------------|
| `--color-pink`       | `#F06B8A` | Primair, buttons, accenten     |
| `--color-gray`       | `#4A4A4A` | Tekst, headings                |
| `--color-green`      | `#7ABF6E` | Badges, highlights             |
| `--color-pink-light` | `#FDE8EF` | Card achtergronden             |
| `--color-bg`         | `#FFF8F5` | Pagina achtergrond             |

---

## Typografie

- **Headings:** Playfair Display (Google Fonts) — elegant, serif
- **Body:** Inter (Google Fonts) — leesbaar, modern sans-serif

---

## Pagina's

### Home (`#` of leeg)
- Hero sectie met `public/shyla.JPG`, tagline "Eet lekker. Leef gezond."
- Twee CTA-buttons: "Bekijk recepten" (`#recepten`) en "Over mij" (`#about`)
- Drie feature-blokken: Recepten / Blog / Coaching

### Over Mij (`#about`)
- Foto naast tekst-kolom layout
- Placeholder intro, verhaal, aanpak als voedingscoach

### Recepten (`#recepten`)
- Categorie filter: Alles / Ontbijt / Lunch / Diner / Snack
- Grid van kaarten (3-2-1 kolommen responsive)
- Kaart: emoji placeholder afbeelding, titel, categorie-badge, bereidingstijd
- 6 placeholder recepten

### Blog (`#blog`)
- Grid van artikelkaarten (3-2-1 kolommen responsive)
- Kaart: datum, categorie, titel, korte samenvatting
- 4 placeholder artikelen

### Contact (`#contact`)
- Formulier: naam, e-mail, bericht + verstuur-knop
- Form submit: `console.log` van formulierdata (geen backend)
- Instagram-button (placeholder link)
- App-download-button (placeholder link)

---

## UI/Design Principes

- **Cards:** Roze achtergrond (`#FDE8EF`), afgeronde hoeken, hover lift-animatie
- **Buttons:** Primair pill-vorm roze; secundair outline-stijl
- **Header:** Sticky, wit, lichte schaduw bij scrollen; hamburger menu op mobiel
- **Animaties:** Subtiele fade-in bij pagina-wisseling, smooth hover states
- **Responsive:** Mobile-first, CSS Grid met media queries

---

## Data Modellen

```typescript
interface Recipe {
  id: number
  title: string
  category: 'ontbijt' | 'lunch' | 'diner' | 'snack'
  emoji: string
  time: string
  description: string
}

interface BlogPost {
  id: number
  title: string
  date: string
  category: string
  excerpt: string
}
```

---

## Buiten Scope (voor nu)

- Daadwerkelijk e-mail versturen vanuit contactformulier
- CMS / content beheer systeem
- Recepten/blog detail pagina's
- Zoekfunctionaliteit
- Authenticatie of gebruikersaccounts
