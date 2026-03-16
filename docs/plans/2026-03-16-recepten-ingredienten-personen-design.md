# Ontwerp: Recepten ingrediënten & personen

## Samenvatting

Aanpassingen aan de recepten-feature: ingrediënten opsplitsen in hoeveelheid/eenheid/naam, personen-switcher op de publieke site, categorie "dessert" toevoegen, en dubbel calorieënveld verwijderen.

## 1. Data model wijzigingen

### Ingredient interface

```typescript
export interface Ingredient {
  amount: number | null    // getal, null voor "naar smaak"
  unit: string             // uit vaste lijst, of leeg
  name: string
  scalable: boolean        // false voor snufje, handje, etc.
}
```

### Recipe wijzigingen

- `servings`: van `string` naar `number` (altijd personen)
- `calories`: **verwijderd** — komt alleen nog uit `nutrition.kcal`
- `category`: `'dessert'` toegevoegd aan `RecipeCategory`

### Vaste eenheden lijst

g, kg, ml, dl, l, el, tl, stuk(s), snufje, handje, scheutje, takje, teen, plak, snee

### Niet-schaalbare eenheden

snufje, handje, scheutje, takje, teen, plak, snee — worden automatisch als `scalable: false` gemarkeerd bij selectie.

## 2. Admin formulier

- Ingrediënt-rij wordt 3 velden: hoeveelheid (number input) | eenheid (dropdown) | ingrediënt (text input)
- Servings: number input met label "personen" (vervangt het huidige tekstveld)
- Calorieën veld: verwijderd uit het hoofdformulier, alleen nog bij voedingswaarde
- Categorie dropdown: "dessert" toegevoegd (emoji: 🍰)
- Eenheid-dropdown bevat de vaste eenheden lijst

## 3. Publieke site — personen switcher

- Locatie: bij het ingrediënten-blok, boven de ingrediëntenlijst
- UI: `[−] 4 personen [+]` met min/max begrenzing (1-20)
- Gedrag: bij klik herberekenen alle schaalbare ingrediënten proportioneel
- Formule: `nieuw_amount = origineel_amount / origineel_servings * gekozen_servings`
- Afronden: slim afronden (½, ¼ waar logisch, hele getallen waar mogelijk)
- Niet-schaalbare ingrediënten blijven ongewijzigd

## 4. Receptkaarten & detail

- Calorieën op kaarten en detail-pagina tonen vanuit `nutrition.kcal` + " kcal"
- Categorie-badge toont ook "dessert" met 🍰 emoji
- Categorie-filter op receptenpagina krijgt dessert-knop

## 5. Migratie bestaande data

De 2 bestaande recepten in `recipes.json` moeten gemigreerd worden:

- `amount` string ("75 gr") opsplitsen naar `amount: 75`, `unit: "g"`, `scalable: true`
- `servings` string ("4 personen") → `servings: 4`
- `calories` veld verwijderen
