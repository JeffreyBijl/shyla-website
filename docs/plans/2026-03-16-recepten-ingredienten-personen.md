# Recepten ingrediënten & personen — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ingrediënten opsplitsen in hoeveelheid/eenheid/naam, personen-switcher toevoegen, categorie dessert toevoegen, dubbel calorieënveld verwijderen.

**Architecture:** Data model uitbreiden met `unit` en `scalable` op Ingredient, `servings` naar number, `calories` verwijderen. Admin formulier aanpassen. Publieke detail-pagina krijgt interactieve personen-switcher die schaalbare ingrediënten herberekent.

**Tech Stack:** TypeScript, Vite, vanilla DOM, JSON data, GitHub API als CMS.

---

### Task 1: Data model & constanten bijwerken

**Files:**
- Modify: `src/data/types.ts`

**Step 1: Update types**

In `src/data/types.ts`, wijzig:

```typescript
export type RecipeCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack' | 'dessert'

export const RECIPE_UNITS = [
  'g', 'kg', 'ml', 'dl', 'l', 'el', 'tl', 'stuk(s)',
  'snufje', 'handje', 'scheutje', 'takje', 'teen', 'plak', 'snee',
] as const

export type RecipeUnit = typeof RECIPE_UNITS[number]

export const NON_SCALABLE_UNITS: ReadonlySet<string> = new Set([
  'snufje', 'handje', 'scheutje', 'takje', 'teen', 'plak', 'snee',
])

export interface Ingredient {
  amount: number | null
  unit: string
  name: string
  scalable: boolean
}

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
}
```

Verwijderd: `calories: string` van Recipe.

**Step 2: Verify build**

Run: `npx vite build`
Expected: Type errors in files that still use the old interface. Dat is ok, we fixen ze in de volgende taken.

**Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat: update Recipe types — split ingredient unit, add dessert, remove calories"
```

---

### Task 2: Migreer bestaande recepten data

**Files:**
- Modify: `src/data/recipes.json`

**Step 1: Migreer recipes.json**

Transformeer de 2 bestaande recepten handmatig:

- `servings` string → number (parse het getal eruit)
- `calories` veld verwijderen
- Elke ingredient `amount` string splitsen naar `amount` (number), `unit` (string), `scalable` (boolean)

Migratieregels:
- `"75 gr"` → `{ "amount": 75, "unit": "g", "name": "sla", "scalable": true }`
- `"1 handje"` → `{ "amount": 1, "unit": "handje", "name": "cashewnoten", "scalable": false }`
- `"1 snufje"` → `{ "amount": 1, "unit": "snufje", "name": "chilipeper", "scalable": false }`
- `"1 teen"` → `{ "amount": 1, "unit": "teen", "name": "knoflook", "scalable": false }`
- `"0.5"` (geen eenheid) → `{ "amount": 0.5, "unit": "stuk(s)", "name": "komkommer", "scalable": true }`
- `"1 eetlepel"` → `{ "amount": 1, "unit": "el", "name": "sojasaus", "scalable": true }`
- `"2 eetlepels"` → `{ "amount": 2, "unit": "el", "name": "olie", "scalable": true }`
- `"1 thee lepel"` → `{ "amount": 1, "unit": "tl", "name": "Italiaanse kruiden", "scalable": true }`
- `"400 ml"` → `{ "amount": 400, "unit": "ml", "name": "tomatenblokjes", "scalable": true }`
- `"snuf"` (geen getal) → `{ "amount": null, "unit": "snufje", "name": "peper en zout", "scalable": false }`
- `"handje"` (geen getal) → `{ "amount": null, "unit": "handje", "name": "verse basilicum", "scalable": false }`
- `"servings": "2"` → `"servings": 2`
- `"servings": "2 personen"` → `"servings": 2`

**Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/recipes.json','utf8')); console.log('OK')"`

**Step 3: Commit**

```bash
git add src/data/recipes.json
git commit -m "feat: migrate recipes data to new ingredient format"
```

---

### Task 3: Admin formulier — ingrediënten met eenheid-dropdown

**Files:**
- Modify: `src/admin/recipes.ts`

**Step 1: Update renderRecipeForm()**

Wijzig het formulier:

1. Verwijder het calorieën veld (de hele `<div class="form-group">` met `recipe-calories`)
2. Wijzig de servings input van `type="text"` naar `type="number"` met `min="1"` en placeholder `"bijv. 4"`; voeg ` personen` label toe na het input
3. Voeg `<option value="dessert">Dessert</option>` toe aan de category select

**Step 2: Update addIngredientRow()**

Wijzig de functie signature en HTML:

```typescript
function addIngredientRow(
  container: HTMLElement,
  amount: number | null = null,
  unit = '',
  name = '',
  scalable = true,
): void {
  const row = document.createElement('div')
  row.className = 'admin-ingredient-row'

  const unitOptions = RECIPE_UNITS.map(u =>
    `<option value="${u}" ${u === unit ? 'selected' : ''}>${u}</option>`
  ).join('')

  row.innerHTML = `
    <input type="number" step="any" placeholder="Aantal" value="${amount !== null ? amount : ''}" class="ingredient-amount-input">
    <select class="ingredient-unit-select">
      <option value="">—</option>
      ${unitOptions}
    </select>
    <input type="text" placeholder="Ingredient" value="${escapeHtml(name)}" class="ingredient-name-input">
    <button type="button" class="admin-row-remove" title="Verwijderen">×</button>
  `

  // Auto-set scalable based on unit
  const select = row.querySelector('.ingredient-unit-select') as HTMLSelectElement
  select.addEventListener('change', () => {
    row.dataset.scalable = String(!NON_SCALABLE_UNITS.has(select.value))
  })
  row.dataset.scalable = String(scalable)

  row.querySelector('.admin-row-remove')?.addEventListener('click', () => row.remove())
  container.appendChild(row)
}
```

Import `RECIPE_UNITS` en `NON_SCALABLE_UNITS` uit `../data/types.js`.

**Step 3: Update handleRecipeSubmit()**

- Verwijder het uitlezen van `calories`
- Wijzig `servings` uitlezen: `const servings = Number(...)` i.p.v. string
- Wijzig ingredients verzameling:

```typescript
const ingredientRows = document.querySelectorAll('.admin-ingredient-row')
const ingredients: Ingredient[] = []
ingredientRows.forEach(row => {
  const amountStr = (row.querySelector('.ingredient-amount-input') as HTMLInputElement)?.value.trim()
  const unit = (row.querySelector('.ingredient-unit-select') as HTMLSelectElement)?.value
  const name = (row.querySelector('.ingredient-name-input') as HTMLInputElement)?.value.trim()
  if (name) {
    const amount = amountStr ? Number(amountStr) : null
    const scalable = row instanceof HTMLElement ? row.dataset.scalable !== 'false' : true
    ingredients.push({ amount, unit, name, scalable })
  }
})
```

- Verwijder alle `calories` referenties uit de optimistic update en de GitHub write callback
- Wijzig `servings` van string naar number in beide plekken

**Step 4: Update populateRecipeForm()**

- Verwijder de `recipe-calories` regel
- Wijzig servings: `String(recipe.servings)` voor de input value
- Wijzig ingredients populate: `addIngredientRow(ingredientsList, ing.amount, ing.unit, ing.name, ing.scalable)`

**Step 5: Update clearRecipeForm()**

- Verwijder de `recipe-calories` clear regel

**Step 6: Verify build**

Run: `npx vite build`
Expected: PASS (of alleen nog errors in de pagina-bestanden, die we hierna fixen)

**Step 7: Commit**

```bash
git add src/admin/recipes.ts
git commit -m "feat: update admin recipe form — unit dropdown, number servings, remove calories"
```

---

### Task 4: Admin CSS — eenheid-dropdown styling

**Files:**
- Modify: `src/style.css`

**Step 1: Update admin ingredient row CSS**

Wijzig de `.admin-ingredient-row` regels:

```css
.admin-ingredient-row input:first-child { flex: 0 0 80px; }
.admin-ingredient-row select { flex: 0 0 100px; }
.admin-ingredient-row input:nth-child(3) { flex: 1; }
```

En in de mobile media query:
```css
@media (max-width: 600px) {
  .admin-ingredient-row input:first-child { flex: 0 0 60px; }
  .admin-ingredient-row select { flex: 0 0 80px; }
}
```

**Step 2: Commit**

```bash
git add src/style.css
git commit -m "style: adjust admin ingredient row for unit dropdown"
```

---

### Task 5: Receptkaarten — calorieën uit nutrition, dessert filter

**Files:**
- Modify: `src/pages/recipes.ts`

**Step 1: Update recipeCard()**

Vervang `${escapeHtml(recipe.calories)}` door `${recipe.nutrition.kcal} kcal`.

**Step 2: Update renderRecipes()**

Voeg `'dessert'` toe aan de categories array:

```typescript
const categories: Array<'alle' | RecipeCategory> = ['alle', 'ontbijt', 'lunch', 'diner', 'snack', 'dessert']
```

Voeg de dessert emoji toe in de filter mapping: `cat === 'dessert' ? '🍰' : '✨'` (verschuif de `✨` naar alleen `alle`).

**Step 3: Verify build**

Run: `npx vite build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/recipes.ts
git commit -m "feat: show kcal from nutrition, add dessert filter"
```

---

### Task 6: Receptdetail — personen-switcher & calorieën fix

**Files:**
- Modify: `src/pages/recipe-detail.ts`

**Step 1: Voeg formatAmount helper toe**

Bovenaan het bestand:

```typescript
function formatAmount(amount: number): string {
  if (amount === 0.25) return '¼'
  if (amount === 0.5) return '½'
  if (amount === 0.75) return '¾'
  if (Number.isInteger(amount)) return String(amount)
  // Rond af op 1 decimaal
  const rounded = Math.round(amount * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',')
}
```

**Step 2: Update ingredientsHTML**

Vervang de huidige ingredientsHTML met personen-switcher:

```typescript
const ingredientsHTML = recipe.ingredients.length > 0
  ? `<div class="recipe-detail-ingredients">
      <h2>Ingrediënten</h2>
      <div class="servings-switcher">
        <button class="servings-btn servings-decrease" aria-label="Minder personen">−</button>
        <span class="servings-count" data-original="${recipe.servings}">${recipe.servings}</span>
        <span class="servings-label">personen</span>
        <button class="servings-btn servings-increase" aria-label="Meer personen">+</button>
      </div>
      <ul>
        ${recipe.ingredients.map(ing => {
          const amountStr = ing.amount !== null ? formatAmount(ing.amount) : ''
          const unitStr = ing.unit ? ` ${ing.unit}` : ''
          return `<li data-original-amount="${ing.amount ?? ''}" data-scalable="${ing.scalable}" data-unit="${escapeHtml(ing.unit)}">
            <span class="ingredient-amount">${amountStr}${unitStr}</span> ${escapeHtml(ing.name)}
          </li>`
        }).join('')}
      </ul>
    </div>`
  : ''
```

**Step 3: Update meta — verwijder calories, fix servings**

In de recipe-detail-meta, verwijder het hele `<span>` blok voor calories (het bliksem-icoontje met `recipe.calories`).

Wijzig de servings span: `${recipe.servings} personen` i.p.v. `${escapeHtml(recipe.servings)}`.

**Step 4: Update setupRecipeDetail()**

```typescript
export function setupRecipeDetail(): void {
  const decreaseBtn = document.querySelector('.servings-decrease')
  const increaseBtn = document.querySelector('.servings-increase')
  const countEl = document.querySelector('.servings-count')

  if (!decreaseBtn || !increaseBtn || !countEl) return

  const originalServings = Number(countEl.getAttribute('data-original'))

  function updateIngredients(newServings: number): void {
    countEl!.textContent = String(newServings)

    document.querySelectorAll('.recipe-detail-ingredients li').forEach(li => {
      const el = li as HTMLElement
      const scalable = el.dataset.scalable === 'true'
      const originalAmount = el.dataset.originalAmount
      const unit = el.dataset.unit || ''
      const amountSpan = el.querySelector('.ingredient-amount')

      if (!amountSpan || !originalAmount) return

      if (scalable && originalAmount) {
        const scaled = (Number(originalAmount) / originalServings) * newServings
        const unitStr = unit ? ` ${unit}` : ''
        amountSpan.textContent = `${formatAmount(scaled)}${unitStr}`
      }
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
```

**Step 5: Verify build**

Run: `npx vite build`
Expected: PASS

**Step 6: Commit**

```bash
git add src/pages/recipe-detail.ts
git commit -m "feat: add servings switcher, show kcal from nutrition, remove calories"
```

---

### Task 7: Personen-switcher CSS

**Files:**
- Modify: `src/style.css`

**Step 1: Voeg styling toe**

Voeg toe na de bestaande `.recipe-detail-ingredients` regels:

```css
.servings-switcher {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

.servings-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid var(--color-pink);
  background: transparent;
  color: var(--color-pink);
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
  line-height: 1;
}
.servings-btn:hover {
  background: var(--color-pink);
  color: #fff;
}

.servings-count {
  font-size: 1.1rem;
  font-weight: 700;
  min-width: 1.5rem;
  text-align: center;
}

.servings-label {
  font-size: 0.95rem;
  color: var(--color-gray-light);
}
```

**Step 2: Commit**

```bash
git add src/style.css
git commit -m "style: add servings switcher styling"
```

---

### Task 8: Eindverificatie

**Step 1: Build**

Run: `npx vite build`
Expected: PASS, geen TypeScript errors.

**Step 2: Handmatig testen**

Run: `npx vite dev`

Controleer:
1. Receptenpagina toont calorieën uit nutrition (niet het oude veld)
2. Dessert filter-knop verschijnt
3. Receptdetail toont personen-switcher
4. Plus/min knoppen werken (1-20 range)
5. Schaalbare ingrediënten herberekenen bij personen-wijziging
6. Niet-schaalbare ingrediënten (snufje, handje, etc.) blijven gelijk
7. Admin formulier: eenheid dropdown werkt
8. Admin: servings is number input
9. Admin: geen calorieën veld meer (alleen bij voedingswaarde)
10. Admin: dessert optie in category dropdown

**Step 3: Final commit (indien nodig)**

Eventuele bugfixes committen.
