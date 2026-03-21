import { describe, it, expect, vi } from 'vitest'
import { OperationQueue } from '../queue'

describe('OperationQueue', () => {
  it('executes operations sequentially', async () => {
    const queue = new OperationQueue()
    const order: number[] = []

    queue.enqueue({
      label: 'First',
      execute: async () => {
        await new Promise(r => setTimeout(r, 10))
        order.push(1)
      },
    })
    queue.enqueue({
      label: 'Second',
      execute: async () => { order.push(2) },
    })

    // Wait for both operations to complete
    await new Promise(r => setTimeout(r, 50))

    expect(order).toEqual([1, 2])
  })

  it('reports status via callback', async () => {
    const queue = new OperationQueue()
    const statuses: string[] = []

    queue.setStatusCallback((s) => {
      if (s.current) statuses.push(`${s.current} ${s.completed}/${s.total}`)
      else if (s.completed === s.total && s.total > 0) statuses.push('done')
    })

    queue.enqueue({
      label: 'Op1',
      execute: async () => {},
    })

    await new Promise(r => setTimeout(r, 50))

    expect(statuses).toContain('Op1 0/1')
    expect(statuses).toContain('done')
  })

  it('stops on error and allows retry', async () => {
    const queue = new OperationQueue()
    let attempts = 0

    queue.enqueue({
      label: 'Failing',
      execute: async () => {
        attempts++
        if (attempts === 1) throw new Error('fail')
      },
    })

    await new Promise(r => setTimeout(r, 50))
    expect(attempts).toBe(1)
    expect(queue.pendingCount).toBe(1)

    queue.retry()
    await new Promise(r => setTimeout(r, 50))

    expect(attempts).toBe(2)
    expect(queue.pendingCount).toBe(0)
  })

  it('clear resets all state', () => {
    const queue = new OperationQueue()
    queue.enqueue({ label: 'A', execute: async () => {} })
    queue.clear()
    expect(queue.pendingCount).toBe(0)
    expect(queue.isProcessing).toBe(false)
  })
})
