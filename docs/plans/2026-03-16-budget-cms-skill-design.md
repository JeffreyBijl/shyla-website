# Budget CMS Skill — Design Document

## Overview

A Claude Code skill (`budget-cms`) that scaffolds a GitHub-powered CMS into any existing web project. It uses GitHub as the backend: content is stored as JSON files in the repo, images are committed as assets, and changes trigger automatic deploys via GitHub Actions. The admin UI lives as a hash-route in the existing app.

This is the pattern used in the Shyla-website project, extracted into a reusable skill.

## Trigger

When a user wants to add a CMS/admin panel to an existing project, or asks for content management via GitHub.

## Skill Flow

### 1. Inventarisatie (project detection)

The skill detects:
- Source directory structure (where src/ lives)
- Build tool and commands (from package.json scripts)
- Output directory (from build tool config: dist, build, out, etc.)
- TypeScript or JavaScript (presence of tsconfig.json)
- CSS approach (plain CSS, CSS modules, Tailwind, SCSS, etc.)
- Existing router setup

### 2. Configuratie (user input)

The skill asks the user:
- **Project name** — used for admin route `#admin-<name>` and localStorage key `<name>-admin-token`
- **GitHub repo** — `owner/repo` format
- **Content types** — for each type:
  - Name (e.g., "recipes", "blogs", "products")
  - Fields with name, type, and required flag
  - Whether this type has images
- **Images needed?** — global toggle, then per content type

### 3. Generatie (scaffolding)

Files are generated in this order:

#### Core modules (always generated)

| File | Purpose |
|------|---------|
| `admin/auth.ts` | GitHub PAT input, validation, localStorage |
| `admin/github.ts` | Read/write files, readModifyWrite with 409 retry, deploy polling |
| `admin/queue.ts` | OperationQueue class for sequential processing |
| `admin/validation.ts` | Required/file field validation, blur events, error display |
| `admin/shared.ts` | Delete modal, deploy polling UI, toast system |
| `.github/workflows/deploy.yml` | Build + deploy to GitHub Pages on push to main |

#### Conditionally generated

| File | Condition |
|------|-----------|
| `admin/image.ts` | Images enabled — compression (1200px max, JPEG 0.80), base64, slug naming |

#### Dynamically generated (per content type)

| File | Purpose |
|------|---------|
| `data/types.ts` | Interfaces per content type |
| `data/<type>.json` | Empty JSON array per content type |
| `admin/<type>.ts` | Form rendering, CRUD, optimistic UI, queue operations |
| `admin/page.ts` | Tab coordinator, token form/dashboard, queue status |

### 4. Verificatie

Run the project build to confirm everything compiles.

## Content Type Field Types

| Type | TypeScript | Admin UI |
|------|-----------|----------|
| `text` | `string` | Text input |
| `number` | `number` | Number input |
| `richtext` | `string` | Quill editor (loaded from CDN) |
| `select` | `string` | Dropdown (user provides options) |
| `image` | `string` | File input + preview + compression |
| `array` | Nested type | Dynamic rows with add/remove |
| `date` | `string` | Date input |

## Core Patterns

### GitHub API Integration (`github.ts`)

- Config at top: `REPO`, `BRANCH`, file paths per content type, image paths
- `readFile()` — read JSON from repo
- `writeFile()` — write with SHA-based conflict detection
- `readModifyWrite()` — atomic read-modify-write, max 5 retries on 409, exponential backoff (2s, 4s, 6s, 8s)
- `uploadImage()` — base64 upload (when images enabled)
- `deleteFile()` — remove file from repo
- `getLatestDeployStatus()` — poll GitHub Actions API
- `startDeployPolling()` — continuous polling with status updates

### Operation Queue (`queue.ts`)

- Sequential processing of GitHub operations
- Progress tracking (total, completed, current label)
- Error handling with retry
- UI notification callbacks
- Auto-reset counters after 5 seconds

### Optimistic UI

All content changes appear immediately in the admin UI. GitHub persistence happens in the background via the queue.

### Admin Route

Hash-based route: `#admin-<projectname>`. Integrated into the existing router.

## Tech Stack Adaptation

The skill does NOT ask about tech stack — it detects from the existing project:

- **Build command**: read from `package.json` scripts
- **Output dir**: detected from build tool config
- **TypeScript/JavaScript**: presence of `tsconfig.json` determines `.ts` vs `.js` output
- **CSS format**: detected from existing files, admin styles generated in the same format

## Conditional: Images

When enabled:
- `admin/image.ts` generated with compression pipeline
- Max dimension: 1200px, min width: 400px, max file size: 10MB
- JPEG quality: 0.80
- `public/images/<contenttype>/` directories created
- Image upload + preview in relevant forms

When disabled:
- No image.ts
- No image-related code in forms or github.ts

## Out of Scope

- Custom design/styling beyond matching existing CSS conventions
- User management or roles — purely GitHub token auth
- Content migration from other systems
- Live preview before deploy
- Multi-branch / staging / draft workflow
- Server-side components — purely client-side admin
