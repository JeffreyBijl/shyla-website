# Budget CMS Skill — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a Claude Code skill that scaffolds a GitHub-powered CMS into any existing web project.

**Architecture:** A single skill file (`budget-cms.md`) with embedded template code. The skill guides Claude through 4 phases: detect project structure, ask user for content types, generate all files from templates, verify the build. Templates are based on the proven Shyla-website admin implementation.

**Tech Stack:** Claude Code skill (markdown), TypeScript/JavaScript templates

---

### Task 1: Create the skill file with metadata and overview

**Files:**
- Create: `~/.claude/skills/budget-cms.md`

**Step 1: Create the skill file with frontmatter and trigger description**

```markdown
---
name: budget-cms
description: Scaffold a GitHub-powered CMS (admin panel, operation queue, deploy polling) into an existing web project. Use when the user wants to add content management, an admin panel, or a "budget CMS" to a website.
---
```

Add the overview section explaining what the skill does, the 4 phases, and the hard rules (always existing project, admin as hash-route, GitHub Pages deploy).

**Step 2: Commit**

```bash
git add ~/.claude/skills/budget-cms.md
git commit -m "feat: create budget-cms skill with metadata and overview"
```

---

### Task 2: Write Phase 1 — Inventarisatie (project detection)

**Files:**
- Modify: `~/.claude/skills/budget-cms.md`

**Step 1: Add the Inventarisatie section**

This phase instructs Claude to detect:
- Source directory (look for `src/`, `app/`, or root-level source files)
- TypeScript or JavaScript (`tsconfig.json` presence → `.ts`, otherwise `.js`)
- Build tool and commands (read `package.json` scripts for `build` command)
- Output directory (check vite.config, next.config, astro.config, etc. for output dir; default `dist`)
- CSS approach (scan for `.css`, `.scss`, `.module.css`, `tailwind.config`, etc.)
- Existing router (look for `router.ts/js` or framework router)
- Toast/notification system (check if one exists to reuse, otherwise scaffold `components/toast.ts`)

Include the exact commands/file reads Claude should perform.

**Step 2: Commit**

```bash
git commit -am "feat: add Phase 1 — project detection to budget-cms skill"
```

---

### Task 3: Write Phase 2 — Configuratie (user input)

**Files:**
- Modify: `~/.claude/skills/budget-cms.md`

**Step 1: Add the Configuratie section**

This phase instructs Claude to ask the user (one question at a time):

1. **Project name** — for admin route and localStorage key
2. **GitHub repo** — owner/repo format
3. **Content types** — for each type, ask:
   - Name (singular and plural, e.g. "recipe" / "recepten")
   - Fields: ask one by one, for each field ask name, type (`text`, `number`, `richtext`, `select`, `image`, `array`, `date`), and if required
   - For `select` fields: ask for the options
   - For `array` fields: ask for sub-fields
   - Does this type have images?
4. **Images needed?** — if any content type has images, the image module is generated

Include the data structure Claude should build internally:

```typescript
interface CmsConfig {
  projectName: string
  repo: { owner: string; name: string }
  contentTypes: ContentTypeConfig[]
  hasImages: boolean
}

interface ContentTypeConfig {
  name: string           // singular, e.g. "recipe"
  namePlural: string     // plural, e.g. "recipes"
  fields: FieldConfig[]
  hasImage: boolean
}

interface FieldConfig {
  name: string
  type: 'text' | 'number' | 'richtext' | 'select' | 'image' | 'array' | 'date'
  required: boolean
  options?: string[]         // for select
  subFields?: FieldConfig[]  // for array
}
```

**Step 2: Commit**

```bash
git commit -am "feat: add Phase 2 — user configuration to budget-cms skill"
```

---

### Task 4: Write Phase 3 — Core module templates

**Files:**
- Modify: `~/.claude/skills/budget-cms.md`

**Step 1: Add the core module templates**

These are the modules that are generated for every project (with config values substituted). Include the full template code for each, based on the Shyla-website implementation:

#### `admin/github.ts` template
- CONFIG object with placeholders: `{{REPO_OWNER}}`, `{{REPO_NAME}}`, `{{BRANCH}}`, and dynamic paths per content type
- TOKEN_KEY: `{{PROJECT_NAME}}-admin-token`
- All functions: `getToken`, `saveToken`, `clearToken`, `headers`, `apiRequest`, `validateToken`, `readFile`, `writeFile`, `readModifyWrite`, `uploadImage` (conditional), `deleteFile`, `getLatestDeployStatus`, `startDeployPolling`
- Note: `uploadImage` and `deleteFile` only included when `hasImages` is true

#### `admin/queue.ts` template
- Exact copy of Shyla's `OperationQueue` class — this is universal

#### `admin/auth.ts` template
- Import from `./github.js`
- Import from toast (detect existing or use generated)
- `renderTokenForm()` — HTML with project-appropriate labels
- `setupTokenForm()` — token validation and login flow

#### `admin/validation.ts` template
- Exact copy of Shyla's validation module — universal

#### `admin/shared.ts` template
- `setupImagePreview()` — only if `hasImages`
- `showDeleteModal()` — always
- `pollDeploy()` — always
- `handleDelete()` — adapted per content type

#### `admin/state.ts` template
- Dynamic: one array per content type, one `editingId` per content type
- `stopCurrentPolling` and `operationQueue` always present

#### `admin/image.ts` template (conditional)
- Only generated when `hasImages` is true
- `compressImage()`, `loadImage()`, `blobToBase64()`, `compressWithToast()`, `slugify()`

#### `components/toast.ts` template
- Only generated if no existing toast system detected
- Full toast system from Shyla

#### `utils.ts` additions
- `escapeHtml()` — add if not present

#### `.github/workflows/deploy.yml` template
- Build command from detected `package.json` scripts
- Output dir from detected build config
- GitHub Pages deploy

**Step 2: Commit**

```bash
git commit -am "feat: add Phase 3 — core module templates to budget-cms skill"
```

---

### Task 5: Write Phase 3 — Dynamic module templates (per content type)

**Files:**
- Modify: `~/.claude/skills/budget-cms.md`

**Step 1: Add the dynamic module generation instructions**

For each content type in the config, Claude generates:

#### `data/types.ts`
- Instructions for generating TypeScript interfaces from `FieldConfig`
- Type mapping table: `text` → `string`, `number` → `number`, etc.
- For `select` fields: generate union type from options
- For `array` fields: generate sub-interface

#### `data/{{type}}.json`
- Empty JSON array `[]`

#### `admin/{{type}}.ts`
- `renderForm()` — generate HTML form with correct inputs per field:
  - `text` → `<input type="text">`
  - `number` → `<input type="number">`
  - `richtext` → `<div id="{{type}}-editor">` + Quill setup
  - `select` → `<select>` with options
  - `image` → file input + preview container
  - `array` → dynamic rows with add/remove pattern
  - `date` → `<input type="date">`
- `renderItems()` — list existing items with edit/delete buttons
- `setup()` — event listeners, image preview, submit handler, edit/delete delegation
- `handleSubmit()` — validation, image compression, optimistic UI, queue enqueue
- `clearForm()` / `populateForm()` / `setFormMode()` / `cancelEdit()`
- Pattern: follow exact structure of Shyla's `recipes.ts` and `blog.ts`

#### `admin/page.ts`
- Tabs: one per content type
- Dashboard layout with all forms and item lists
- `loadData()` — read all content type JSON files
- `setupDashboard()` — tab switching, delegate to sub-modules, queue toasts

#### Router integration
- Instructions for adding `#admin-{{projectName}}` route
- Import `renderAdmin` and `setupAdmin` from `admin/page.js`

**Step 2: Commit**

```bash
git commit -am "feat: add Phase 3 — dynamic content type templates to budget-cms skill"
```

---

### Task 6: Write Phase 3 — CSS generation instructions

**Files:**
- Modify: `~/.claude/skills/budget-cms.md`

**Step 1: Add CSS generation rules**

Instructions for Claude to generate admin CSS that matches the project's existing approach:

- Detect CSS methodology (plain CSS, CSS modules, Tailwind, SCSS)
- Generate admin styles in the same format
- Required CSS classes/patterns:
  - `.admin-section`, `.admin-header`, `.admin-tabs`, `.admin-tab`, `.admin-tab-content`
  - `.admin-form`, `.admin-form-actions`, `.form-group`
  - `.admin-items-list`, `.admin-item`, `.admin-item-info`, `.admin-item-edit`, `.admin-item-delete`
  - `.admin-modal-overlay`, `.admin-modal`
  - `.admin-image-upload`, `.admin-image-preview`
  - `.admin-ingredient-row` / dynamic row styles (for array fields)
  - `.toast-container`, `.toast` (if generating toast system)
- Use existing project CSS variables/colors if detected
- Keep it functional, not fancy

**Step 2: Commit**

```bash
git commit -am "feat: add Phase 3 — CSS generation instructions to budget-cms skill"
```

---

### Task 7: Write Phase 4 — Verificatie

**Files:**
- Modify: `~/.claude/skills/budget-cms.md`

**Step 1: Add verification phase**

Instructions for Claude after scaffolding is complete:

1. Run the project's build command (`npm run build` or equivalent)
2. If TypeScript errors: fix them
3. If missing imports: fix them
4. Run `npm run dev` and verify:
   - Admin route (`#admin-{{projectName}}`) loads
   - Token form appears
5. List all generated/modified files for the user to review
6. Suggest the user test with a real GitHub token

**Step 2: Commit**

```bash
git commit -am "feat: add Phase 4 — verification to budget-cms skill"
```

---

### Task 8: Add image directory creation instructions

**Files:**
- Modify: `~/.claude/skills/budget-cms.md`

**Step 1: Add directory scaffolding**

When images are enabled, the skill should instruct Claude to:
- Create `public/images/{{type}}/` directories for each content type with images
- Add `.gitkeep` files so the directories are tracked

**Step 2: Commit**

```bash
git commit -am "feat: add image directory scaffolding to budget-cms skill"
```

---

### Task 9: Review and polish the complete skill

**Files:**
- Modify: `~/.claude/skills/budget-cms.md`

**Step 1: Read through the entire skill and verify**

- All template code compiles (no syntax errors in TypeScript snippets)
- All placeholder values are documented (`{{REPO_OWNER}}`, `{{PROJECT_NAME}}`, etc.)
- Instructions are clear enough for Claude to follow without ambiguity
- No missing edge cases (empty content type fields, single content type, no images)
- Phase transitions are clear

**Step 2: Final commit**

```bash
git commit -am "docs: polish budget-cms skill — review and cleanup"
```

---

### Task 10: Test the skill on a dummy project

**Step 1: Create a minimal test project**

```bash
mkdir /tmp/test-budget-cms
cd /tmp/test-budget-cms
npm init -y
npm install vite typescript --save-dev
```

Create minimal `tsconfig.json`, `src/main.ts`, `src/router.ts`, `index.html`.

**Step 2: Invoke the skill and verify it generates correct output**

Run through the skill flow with a simple content type (e.g., "products" with title, price, description) and verify:
- All files are generated
- Build succeeds
- Admin route works

**Step 3: Fix any issues found and commit**

```bash
git commit -am "fix: address issues found during skill testing"
```
