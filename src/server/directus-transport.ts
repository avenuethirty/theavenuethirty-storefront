import type { ServerEnv } from './env-validation'
export function createDirectusTransport(env: ServerEnv, fetcher: typeof fetch = fetch, timeoutMs=10000) {
  return async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let decoded: string
    try { decoded = decodeURIComponent(path) } catch { throw new Error('Invalid API path') }
    if (!/^\/[a-z]/i.test(path) || decoded.includes('..') || decoded.includes('\\') || decoded.startsWith('//')) throw new Error('Invalid API path')
    const headers = new Headers(init?.headers)
    headers.set('Authorization', `Bearer ${env.directusToken}`)
    headers.set('Content-Type', 'application/json')
    let response: Response
    try {
      response = await fetcher(env.directusUrl + path, { ...init, headers, redirect: 'error', signal: AbortSignal.timeout(Math.min(30000,Math.max(1000,timeoutMs))) })
    } catch { throw new Error('Catalogue service unavailable') }
    if (!response.ok) throw new Error(`Catalogue service unavailable (${response.status})`)
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }
}
