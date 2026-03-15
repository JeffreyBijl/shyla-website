# Admin Refactor: Code Split, Blog CRUD & Formulier Validatie

## Samenvatting

Drie verbeteringen aan de admin pagina:
1. Code opsplitsen in logische modules (UI blijft hetzelfde)
2. Blog krijgt volledige CRUD + inhoudsveld met rich-text editor
3. Formulieren geven per-veld feedback bij ontbrekende verplichte velden

---

## 1. Admin code opsplitsen

Split `admin.ts` (932 regels) op in modules:

| Bestand | Verantwoordelijkheid |
|---------|---------------------|
| `admin.ts` | Hoofdcoordinator: layout, tabs, imports |
| `admin-state.ts` | Gedeeld state object |
| `admin-auth.ts` | Token management, login/logout, localStorage |
| `admin-recipes.ts` | Recept formulier, CRUD, lijst, ingredient/step rows |
| `admin-blog.ts` | Blog formulier, CRUD, lijst, rich-text editor |
| `admin-validation.ts` | Gedeelde validatielogica |

### Gedeelde state

```typescript
export const adminState = {
  recipes: [] as Recipe[],
  blogPosts: [] as BlogPost[],
  editingRecipeId: null as number | null,
  editingBlogId: null as number | null,
  operationQueue: new OperationQueue(),
  stopCurrentPolling: null as (() => void) | null,
}
```

### admin.ts als coordinator

- Rendert basis-layout (tabs, containers)
- Roept setupAuth(), setupRecipes(), setupBlog() aan
- Handelt tab-switching af

---

## 2. Blog edit-functionaliteit + inhoudsveld

### Data model wijziging

```typescript
interface BlogPost {
  id: number
  title: string
  slug: string
  date: string
  category: string
  image: string | null
  shortDescription: string   // was: excerpt
  readTime: string
  content: string            // nieuw: HTML van rich-text editor
}
```

### Rich-text editor

- Library: Quill (via CDN)
- Toolbar: vet, cursief, koppen (H2/H3), lijstjes, links
- Output: HTML string opgeslagen in `content` veld

### Blog edit flow

1. Edit-knop op blogpost -> populateBlogForm(post) vult velden + Quill
2. Form titel wisselt naar "Blog bewerken", knop naar "Opslaan"
3. Bij submit: editingBlogId bepaalt create of update
4. Optimistic UI -> operatie in queue -> deploy polling
5. Na opslaan: form reset, terug naar toevoegen-modus

### Blog detail pagina

- Nieuwe route: `#blog/{slug}`
- Toont titel, datum, categorie, afbeelding, volledige content (HTML)
- "Lees meer" op blog-overzicht linkt naar deze pagina

### Rename

- `excerpt` -> `shortDescription` in blog.json, alle code, en UI labels ("Korte beschrijving")

---

## 3. Formulier validatie

### Verplichte velden

| Formulier | Verplicht |
|-----------|-----------|
| Recept | titel, foto (alleen bij nieuw) |
| Blog | titel |

### Gedrag

- **Bij submit:** alle verplichte velden checken. Per leeg veld: rood randje + "Dit veld is verplicht" eronder. Formulier niet versturen.
- **Bij blur:** leeg verplicht veld -> fout tonen. Gevuld -> fout verwijderen.
- **Bij input/change:** foutmelding verdwijnt zodra gebruiker typt.

### Validatie API

```typescript
validateField(input: HTMLElement, rules: { required?: boolean }): boolean
clearFieldError(input: HTMLElement): void
validateForm(fields: { element: HTMLElement, rules: Rules }[]): boolean
```

### Styling

```css
.field-error { border-color: red; }
.field-error-message { color: red; font-size: 0.85rem; }
```

---

## Beslissingen

- UI admin pagina blijft hetzelfde, alleen code wordt gesplitst
- Quill als rich-text editor (lichtgewicht, CDN, simpele API)
- Minimale verplichte velden: recept = titel + foto, blog = titel
- Per-veld validatie met rood randje + tekst (niet alleen toast)
