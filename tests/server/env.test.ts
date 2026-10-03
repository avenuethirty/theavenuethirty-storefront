import { describe, expect, it } from 'vitest'
import { parseServerEnv } from '../../src/server/env-validation'
import { createDirectusTransport } from '../../src/server/directus-transport'

describe('private server configuration', () => {
  it('requires a scoped runtime credential instead of silently using the admin token', () => {
    expect(() => parseServerEnv({ DIRECTUS_URL: 'https://cms.example.test', DIRECTUS_STATIC_TOKEN: 'admin-secret' })).toThrow(/runtime/i)
  })
  it('rejects credential-bearing or insecure URLs without reflecting secrets', () => {
    for (const url of ['http://cms.example.test', 'https://user:secret@cms.example.test', 'not a url']) {
      expect(() => parseServerEnv({ DIRECTUS_URL: url, DIRECTUS_RUNTIME_TOKEN: 'token-secret' })).toThrow('Invalid Directus URL')
    }
  })
  it('normalises the base URL and never includes the private token in errors', () => {
    expect(parseServerEnv({ DIRECTUS_URL: 'https://cms.example.test/', DIRECTUS_RUNTIME_TOKEN: 'private' }).directusUrl).toBe('https://cms.example.test')
  })
})

describe('Directus transport', () => {
  it('does not forward credentials through redirects or expose server error bodies', async () => {
    const transport = createDirectusTransport({ directusUrl: 'https://cms.example.test', directusToken: 'private' }, async (_input, init) => {
      expect(init?.redirect).toBe('error')
      return new Response('private server details', { status: 403 })
    })
    await expect(transport('/items/products')).rejects.toThrow('Catalogue service unavailable (403)')
  })
  it('rejects absolute paths and traversal before contacting any server', async () => {
    const transport = createDirectusTransport({ directusUrl: 'https://cms.example.test', directusToken: 'private' }, async () => { throw new Error('Must not fetch') })
    for (const path of ['https://evil.test', '//evil.test', '/../users', '/items/%2e%2e/users']) {
      await expect(transport(path)).rejects.toThrow('Invalid API path')
    }
  })
})
