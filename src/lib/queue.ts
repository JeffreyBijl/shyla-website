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
  private completed = 0
  private total = 0
  private currentLabel: string | null = null
  private error: string | null = null
  private statusCallback: StatusCallback | null = null

  setStatusCallback(cb: StatusCallback): void {
    this.statusCallback = cb
  }

  enqueue(op: QueuedOperation): void {
    this.queue.push(op)
    this.total++
    this.notifyStatus()

    if (!this.processing) {
      this.processNext()
    }
  }

  get isProcessing(): boolean {
    return this.processing
  }

  get pendingCount(): number {
    return this.queue.length
  }

  retry(): void {
    if (this.error === null) return
    this.error = null
    this.notifyStatus()
    this.processNext()
  }

  clear(): void {
    this.queue = []
    this.processing = false
    this.completed = 0
    this.total = 0
    this.currentLabel = null
    this.error = null
    this.notifyStatus()
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false
      this.currentLabel = null
      // Notify with final completed/total so UI can show "Alle acties verwerkt!"
      this.notifyStatus()
      // Reset counters after a delay so the success message has time to display
      const t = this.total
      if (t > 0) {
        setTimeout(() => {
          if (this.completed === t && this.queue.length === 0) {
            this.completed = 0
            this.total = 0
          }
        }, 5000)
      }
      return
    }

    this.processing = true
    const op = this.queue[0]
    this.currentLabel = op.label
    this.notifyStatus()

    try {
      await op.execute()
      this.queue.shift()
      this.completed++
      this.notifyStatus()
      await this.processNext()
    } catch (err) {
      this.processing = false
      this.error = err instanceof Error ? err.message : String(err)
      this.currentLabel = null
      this.notifyStatus()
    }
  }

  private notifyStatus(): void {
    if (!this.statusCallback) return
    this.statusCallback({
      total: this.total,
      completed: this.completed,
      current: this.currentLabel,
      error: this.error,
    })
  }
}
