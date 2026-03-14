# Recipe Detail Page Design

**Datum:** 2026-03-14
**Status:** Goedgekeurd

## Probleem

- Receptafbeeldingen worden te veel ingezoomd op cards
- Recepten zijn niet klikbaar — er is geen detail-pagina
- Geen ingrediënten of bereidingsstappen beschikbaar

## Referentie

Gebaseerd op [leukerecepten.nl](https://www.leukerecepten.nl):
- Cards: grote foto, titel, bereidingstijd — clean design
- Detail: hero-foto, metadata, ingrediëntenlijst, genummerde stappen, voedingsinfo

## Beslissingen

- **Aanpak:** Alles in `recipes.json` (enkele bron van waarheid)
- **Afbeeldingen:** Eén afbeelding per recept (card + hero)
- **URL-structuur:** `#recept/{slug}` (leesbaar, deelbaar)
- **Terug-knop:** Ja, bovenaan detail-pagina
- **Admin:** Formulier uitbreiden met nieuwe velden

## 1. Datamodel

Het `Recipe` interface wordt uitgebreid:

```typescript
interface Recipe {
  // Bestaand
  id: number
  title: string
  category: RecipeCategory
  image: string | null
  emoji: string
  time: string
  calories: string
  description: string
  // Nieuw
  slug: string                    // bijv. "muscle-meat-mexicano"
  servings: string                // bijv. "4 personen"
  ingredients: Ingredient[]
  steps: string[]                 // bereidingsstappen als tekst
  nutrition: Nutrition
}

interface Ingredient {
  amount: string    // "200g", "2 eetlepels", "1"
  name: string      // "kipfilet", "olijfolie"
}

interface Nutrition {
  kcal: number
  protein: number   // gram
  carbs: number     // gram
  fat: number       // gram
}
```

Bestaande recepten krijgen lege arrays/defaults zodat alles backward-compatible blijft.

## 2. Recipe Cards (verbeterd)

- Hele card wordt klikbaar (link naar `#recept/{slug}`)
- Afbeelding: vaste hoogte (200px), `object-fit: cover` — geen ingezoomde foto's meer
- Inhoud: titel, beschrijving, categorie-badge, bereidingstijd, calorieën
- Hover: bestaande lift-animatie, cursor pointer

## 3. Recipe Detail-pagina

Layout van boven naar beneden:

### Terug-knop
- "← Terug naar recepten" link, linkt naar `#recepten`

### Hero afbeelding
- Volledige breedte (max 1200px), aspect ratio 16:9, `object-fit: cover`
- Bij geen afbeelding: emoji fallback met gradient

### Titel + metadata
- Titel: h1, Playfair Display
- Metadata-rij: categorie-badge, bereidingstijd, porties
- Description als korte intro-tekst

### Twee-koloms layout (desktop)
- **Links (smal):** Ingrediëntenlijst met hoeveelheid + naam
- **Rechts (breed):** Genummerde bereidingsstappen

### Voedingsinfo
- Compact blokje onderaan: kcal, eiwitten, koolhydraten, vetten
- Vier items naast elkaar in een rij

### Responsive
- Op mobiel (<768px): kolommen gestapeld, eerst ingrediënten dan bereiding

## 4. Routing

- Nieuwe route: `#recept/{slug}` → `renderRecipeDetail(slug)`
- Router uitbreiden met parameter-parsing voor `#recept/` prefix
- Slug wordt uit de hash geparsed

## 5. Admin-pagina

Extra velden in het recept-formulier:

- **Slug:** auto-gegenereerd uit titel, handmatig aanpasbaar
- **Porties:** tekstveld
- **Ingrediënten:** dynamische lijst met "+ Ingredient" knop (amount + name per rij)
- **Bereidingsstappen:** dynamische lijst met "+ Stap" knop
- **Voedingsinfo:** vier numerieke velden (kcal, eiwit, koolhydraten, vet)
