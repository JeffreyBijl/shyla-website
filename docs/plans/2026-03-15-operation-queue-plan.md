# Operation Queue Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent 409 Conflict errors when performing multiple admin operations in sequence by queuing them and processing sequentially with fresh SHAs.

**Architecture:** A new `OperationQueue` class processes async operations one at a time (FIFO). Each operation receives a fresh SHA before writing. The UI updates optimistically so the user doesn't wait. A status bar shows queue progress.

**Tech Stack:** TypeScript, vanilla DOM, GitHub Contents API

---

### Task 1: Create OperationQueue class

**Files:**
- Create: `src/lib/queue.ts`

**Step 1: Create the queue module**

```typescript
export interface QueuedOperation {
  label: string
  execute: () => Promise<void>
}

type QueueStatus = {
  total: number
  completed: number
  current: string | null
  error: string | null
}

type StatusCallback = (status: QueueStatus) => void

export class OperationQueue {
  private queue: QueuedOperation[] = []
  private processing = false
  private completedCount = 0
  private totalCount = 0
  private onStatus: StatusCallback | null = null
  private error: string | null = null

  setStatusCallback(cb: StatusCallback): void {
    this.onStatus = cb
  }

  enqueue(op: QueuedOperation): void {
    this.queue.push(op)
    this.totalCount++
    this.emitStatus(op.label)
    if (!this.processing) this.processNext()
  }

  get isProcessing(): boolean {
    return this.processing
  }

  get pendingCount(): number {
    return this.queue.length
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false
      this.emitStatus(null)
      // Reset counters after all done
      this.completedCount = 0
      this.totalCount = 0
      this.error = null
      return
    }

    this.processing = true
    const op = this.queue.shift()!
    this.emitStatus(op.label)

    try {
      await op.execute()
      this.completedCount++
      this.processNext()
    } catch (err) {
      this.processing = false
      this.error = err instanceof Error ? err.message : 'Onbekende fout'
      this.emitStatus(op.label)
      // Keep remaining items in queue for retry
    }
  }

  retry(): void {
    if (this.processing) return
    this.error = null
    this.processNext()
  }

  clear(): void {
    this.queue = []
    this.processing = false
    this.completedCount = 0
    this.totalCount = 0
    this.error = null
    this.emitStatus(null)
  }

  private emitStatus(currentLabel: string | null): void {
    this.onStatus?.({
      total: this.totalCount,
      completed: this.completedCount,
      current: currentLabel,
      error: this.error,
    })
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/queue.ts
git commit -m "feat: add OperationQueue class for sequential admin operations"
```

---

### Task 2: Add queue status UI to admin dashboard

**Files:**
- Modify: `src/pages/admin.ts:48-99` (renderDashboard)
- Modify: `src/style.css` (add queue status styles)

**Step 1: Add queue status bar HTML**

In `renderDashboard()`, add after the deploy banner (line 61):

```html
<div class="admin-queue-status" id="queue-status">
  <div class="admin-queue-status-text" id="queue-status-text"></div>
  <button class="btn btn-sm btn-outline" id="queue-retry" style="display:none;">Opnieuw proberen</button>
  <button class="btn btn-sm btn-outline" id="queue-clear" style="display:none;">Annuleren</button>
</div>
```

**Step 2: Add CSS for queue status bar**

Add to `src/style.css`:

```css
.admin-queue-status {
  display: none;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  background: var(--color-cream);
  border: 1px solid var(--color-sage);
  font-size: 0.9rem;
}

.admin-queue-status.visible {
  display: flex;
}

.admin-queue-status.admin-queue-status--error {
  border-color: #e74c3c;
  background: #fdf0ef;
}

.admin-queue-status-text {
  flex: 1;
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/pages/admin.ts src/style.css
git commit -m "feat: add queue status bar UI to admin dashboard"
```

---

### Task 3: Integrate queue into admin — delete operations

**Files:**
- Modify: `src/pages/admin.ts`

This is the most impactful change. We replace the direct GitHub API calls in `handleDelete` with queue-based operations.

**Step 1: Import and instantiate the queue**

At the top of `admin.ts` (after existing imports, line 8):

```typescript
import { OperationQueue } from '../lib/queue.js'
```

After the state variables (line 19), add:

```typescript
const operationQueue = new OperationQueue()
```

**Step 2: Add queue status rendering function**

Add a new function after `setupDashboard()`:

```typescript
function setupQueueStatus(): void {
  operationQueue.setStatusCallback((status) => {
    const el = document.getElementById('queue-status')
    const textEl = document.getElementById('queue-status-text')
    const retryBtn = document.getElementById('queue-retry')
    const clearBtn = document.getElementById('queue-clear')
    if (!el || !textEl || !retryBtn || !clearBtn) return

    if (status.total === 0 && !status.error) {
      el.classList.remove('visible', 'admin-queue-status--error')
      return
    }

    el.classList.add('visible')

    if (status.error) {
      el.classList.add('admin-queue-status--error')
      textEl.textContent = `Fout: ${status.error}`
      retryBtn.style.display = ''
      clearBtn.style.display = ''
    } else {
      el.classList.remove('admin-queue-status--error')
      textEl.textContent = `Verwerken: ${status.completed + 1} van ${status.total} acties — ${status.current}`
      retryBtn.style.display = 'none'
      clearBtn.style.display = 'none'
    }

    if (status.completed === status.total && !status.error) {
      textEl.textContent = 'Alle acties verwerkt!'
      setTimeout(() => el.classList.remove('visible'), 4000)
    }
  })
}
```

**Step 3: Wire up queue status in setupDashboard**

In `setupDashboard()`, add at the end (before the closing `}`):

```typescript
  setupQueueStatus()

  document.getElementById('queue-retry')?.addEventListener('click', () => {
    operationQueue.retry()
  })
  document.getElementById('queue-clear')?.addEventListener('click', () => {
    operationQueue.clear()
    loadData() // Reload fresh data since we cancelled pending operations
  })
```

**Step 4: Refactor handleDelete to use queue**

Replace `handleDelete` (lines 798-851) with a version that:
1. Shows the delete modal (still synchronous/blocking for user confirmation)
2. Removes the item from the in-memory array immediately (optimistic update)
3. Re-renders the list immediately
4. Enqueues the actual GitHub API operation

```typescript
async function handleDelete(id: number, type: 'recipe' | 'blog'): Promise<void> {
  const item = type === 'recipe'
    ? recipes.find(r => r.id === id)
    : blogPosts.find(p => p.id === id)

  if (!item) return

  const confirmed = await showDeleteModal(item.title)
  if (!confirmed) return

  // Optimistic UI update — remove from in-memory state and re-render immediately
  if (type === 'recipe') {
    recipes = recipes.filter(r => r.id !== id)
    renderRecipeItems()
  } else {
    blogPosts = blogPosts.filter(p => p.id !== id)
    renderBlogItems()
  }

  const feedbackId = type === 'recipe' ? 'feedback-recipes' : 'feedback-blog'
  const feedback = document.getElementById(feedbackId)
  showFeedback(feedback, `"${escapeHtml(item.title)}" wordt verwijderd...`, 'success')

  // Enqueue the actual GitHub operation
  operationQueue.enqueue({
    label: `Verwijder: ${item.title}`,
    execute: async () => {
      // Delete image file if exists
      if (item.image) {
        await deleteFile(`public/${item.image}`, `Verwijder afbeelding: ${item.title}`)
      }

      // Read fresh data + SHA, apply deletion, write back
      if (type === 'recipe') {
        const latest = await readFile<Recipe[]>(CONFIG.RECIPES_PATH)
        const updated = latest.content.filter(r => r.id !== id)
        await writeFile(
          CONFIG.RECIPES_PATH,
          JSON.stringify(updated, null, 2),
          `Verwijder recept: ${item.title}`,
          latest.sha
        )
        recipes = updated
        recipesSha = '' // Will be refreshed on next operation
      } else {
        const latest = await readFile<BlogPost[]>(CONFIG.BLOG_PATH)
        const updated = latest.content.filter(p => p.id !== id)
        await writeFile(
          CONFIG.BLOG_PATH,
          JSON.stringify(updated, null, 2),
          `Verwijder blogpost: ${item.title}`,
          latest.sha
        )
        blogPosts = updated
        blogSha = '' // Will be refreshed on next operation
      }

      showFeedback(feedback, `"${escapeHtml(item.title)}" verwijderd`, 'success')
      pollDeploy(type === 'recipe' ? 'deploy-status-recipes' : 'deploy-status-blog')
    },
  })
}
```

**Step 5: Remove the waitForDeployFinish call and function**

The `waitForDeployFinish()` function (lines 853-856) and `deployFinishResolvers` state variable (line 19) are no longer needed — the queue handles sequencing. Remove them.

Also remove `isDeploying` checks from handleDelete since the queue handles ordering.

**Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/pages/admin.ts
git commit -m "feat: integrate operation queue into delete flow with optimistic UI"
```

---

### Task 4: Integrate queue into admin — create/edit operations

**Files:**
- Modify: `src/pages/admin.ts`

**Step 1: Refactor handleRecipeSubmit to use queue**

The key change: form validation and image compression happen immediately (synchronous), but the GitHub write is enqueued. The recipe is added to the in-memory array immediately for optimistic UI.

Replace `handleRecipeSubmit` (lines 535-669). The structure becomes:

1. Validate form fields (same as before)
2. Compress image if present (same as before — this is CPU work, not a GitHub write)
3. Add/update recipe in in-memory `recipes` array (optimistic)
4. Re-render list immediately
5. Clear form
6. Enqueue: upload image + read fresh SHA + write JSON

```typescript
async function handleRecipeSubmit(): Promise<void> {
  // ... (validation stays the same: lines 536-582) ...

  const submitBtn = document.getElementById('recipe-submit') as HTMLButtonElement
  submitBtn.disabled = true

  const feedback = document.getElementById('feedback-recipes')
  hideFeedback(feedback)

  try {
    // Compress image before enqueuing (CPU work, not a GitHub write)
    let compressed: { base64: string } | null = null
    if (file) {
      showProgress(progress, progressText, 'Foto verkleinen...')
      compressed = await compressImage(file)
      hideProgress(progress)
    }

    const isEditing = editingRecipeId !== null
    const tempImagePath = imagePath placeholder // will be set by queue

    // Optimistic UI update
    if (isEditing) {
      const index = recipes.findIndex(r => r.id === editingRecipeId)
      if (index !== -1) {
        recipes[index] = { ...recipes[index], title, slug: slugify(title), category, time, calories, description, servings, ingredients, steps, nutrition: { kcal, protein, carbs, fat } }
      }
    } else {
      const newId = recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) + 1 : 1
      recipes.push({
        id: newId, title, slug: slugify(title), category,
        image: '', emoji: '', time, calories, description,
        servings, ingredients, steps, nutrition: { kcal, protein, carbs, fat },
      })
    }
    renderRecipeItems()
    cancelRecipeEdit()

    const editId = editingRecipeId
    const commitMsg = isEditing ? `Recept bijgewerkt: ${title}` : `Nieuw recept: ${title}`

    showFeedback(feedback, isEditing ? 'Recept wordt bijgewerkt...' : 'Recept wordt opgeslagen...', 'success')

    // Enqueue the actual GitHub operation
    operationQueue.enqueue({
      label: commitMsg,
      execute: async () => {
        let imagePath: string | undefined

        // Upload image if compressed
        if (compressed) {
          const filename = `${slugify(title)}-${Date.now()}.jpg`
          const uploadedPath = await uploadImage(CONFIG.RECIPE_IMAGES_DIR, filename, compressed.base64)
          imagePath = uploadedPath.replace(/^public\//, '')
        }

        // Read fresh data + SHA
        const latest = await readFile<Recipe[]>(CONFIG.RECIPES_PATH)

        if (isEditing && editId !== null) {
          const index = latest.content.findIndex(r => r.id === editId)
          if (index === -1) throw new Error('Recept niet gevonden')
          const existing = latest.content[index]
          latest.content[index] = {
            ...existing,
            title, slug: slugify(title), category,
            image: imagePath ?? existing.image,
            time, calories, description, servings,
            ingredients, steps, nutrition: { kcal, protein, carbs, fat },
          }
        } else {
          const newId = latest.content.length > 0 ? Math.max(...latest.content.map(r => r.id)) + 1 : 1
          latest.content.push({
            id: newId, title, slug: slugify(title), category,
            image: imagePath!, emoji: '', time, calories, description,
            servings, ingredients, steps, nutrition: { kcal, protein, carbs, fat },
          })
        }

        await writeFile(
          CONFIG.RECIPES_PATH,
          JSON.stringify(latest.content, null, 2),
          commitMsg,
          latest.sha
        )

        recipes = latest.content
        recipesSha = ''
        renderRecipeItems()
        showFeedback(feedback, isEditing ? 'Recept bijgewerkt!' : 'Recept opgeslagen!', 'success')
        pollDeploy('deploy-status-recipes')
      },
    })
  } catch (err) {
    hideProgress(progress)
    const msg = err instanceof Error ? err.message : 'Er ging iets mis'
    showFeedback(feedback, msg, 'error')
  } finally {
    submitBtn.disabled = false
  }
}
```

**Step 2: Refactor handleBlogSubmit similarly**

Same pattern: validate, compress image, optimistic update, enqueue GitHub write.

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/pages/admin.ts
git commit -m "feat: integrate operation queue into create/edit flows"
```

---

### Task 5: Handle error rollback and edge cases

**Files:**
- Modify: `src/pages/admin.ts`

**Step 1: Add rollback on queue error**

When an operation fails, reload fresh data from GitHub to replace the optimistic state:

In the queue status callback, when there's an error, trigger a reload:

```typescript
if (status.error) {
  // Reload data from GitHub to undo optimistic updates
  loadData()
}
```

**Step 2: Prevent form submission while queue has errors**

Add a check at the top of `handleRecipeSubmit` and `handleBlogSubmit`:

```typescript
if (operationQueue.isProcessing) {
  showFeedback(feedback, 'Wacht tot de huidige acties verwerkt zijn...', 'error')
  // Actually don't block — the queue handles sequencing. Remove this check.
}
```

Actually, we should NOT block submissions — the queue handles ordering. But we should ensure forms can still be submitted and operations will just queue up. No blocking needed.

**Step 3: Clean up unused code**

Remove `waitForDeployFinish()` function and `deployFinishResolvers` array if not done in Task 3. Remove the `isDeploying` guard from `handleDelete` (queue handles this).

Keep `isDeploying` and `deployFinishResolvers` only if they're used elsewhere (deploy polling still uses `isDeploying`).

**Step 4: Verify TypeScript compiles and test manually**

Run: `npx tsc --noEmit`
Run: `npm run build`
Expected: Both succeed without errors

**Step 5: Commit**

```bash
git add src/pages/admin.ts
git commit -m "feat: add error rollback and clean up unused deploy-wait code"
```

---

### Task 6: Manual testing checklist

Test the following scenarios in the browser:

1. **Single delete** — delete one recipe, verify it disappears immediately and commit succeeds
2. **Double delete** — delete two recipes quickly, verify both disappear immediately and both commits succeed without 409 errors
3. **Create then delete** — create a recipe, then immediately delete another, verify both succeed
4. **Error handling** — disconnect internet, try a delete, verify error shows and data reloads on rollback
5. **Queue retry** — after an error, click "Opnieuw proberen", verify it retries
6. **Queue cancel** — after an error, click "Annuleren", verify queue clears and data reloads

**Step 1: Run dev server and test**

Run: `npm run dev`
Test each scenario above in the browser.

**Step 2: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
