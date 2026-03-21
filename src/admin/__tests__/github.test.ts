import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => { storage[key] = val },
  removeItem: (key: string) => { delete storage[key] },
})

// Must import after stubbing localStorage
const { getToken, saveToken, clearToken, validateToken, readFile } = await import('../github')

describe('github.ts', () => {
  beforeEach(() => {
    Object.keys(storage).forEach(k => delete storage[k])
    vi.restoreAllMocks()
  })

  describe('token management', () => {
    it('getToken returns null when no token stored', () => {
      expect(getToken()).toBeNull()
    })

    it('saveToken stores and getToken retrieves', () => {
      saveToken('ghp_abc123')
      expect(getToken()).toBe('ghp_abc123')
    })

    it('clearToken removes stored token', () => {
      saveToken('ghp_abc123')
      clearToken()
      expect(getToken()).toBeNull()
    })
  })

  describe('validateToken', () => {
    it('returns true for valid token', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
      const result = await validateToken('ghp_valid')
      expect(result).toBe(true)
    })

    it('returns false for invalid token', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 401 }))
      const result = await validateToken('bad')
      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'))
      const result = await validateToken('ghp_test')
      expect(result).toBe(false)
    })
  })

  describe('readFile', () => {
    it('decodes Base64 JSON content', async () => {
      saveToken('ghp_test')
      const jsonContent = JSON.stringify([{ id: 1, title: 'Test' }])
      const base64 = btoa(unescape(encodeURIComponent(jsonContent)))

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ content: base64, sha: 'abc123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const result = await readFile<any[]>('src/data/recipes.json')
      expect(result.content).toEqual([{ id: 1, title: 'Test' }])
      expect(result.sha).toBe('abc123')
    })

    it('throws on 401 and clears token', async () => {
      saveToken('ghp_expired')
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('', { status: 401 })
      )

      await expect(readFile('test')).rejects.toThrow('Token is ongeldig')
      expect(getToken()).toBeNull()
    })
  })
})
