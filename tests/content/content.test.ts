import { expect, it } from 'vitest'
import { imageUrl, publicSettings, visibleSections } from '../../src/features/content/model'
it('only exposes approved public settings fields', () => {
  expect(publicSettings({ name: 'The Avenue Thirty', contact_email: 'help@example.com', token: 'secret', private_notes: 'private' })).toEqual({ name: 'The Avenue Thirty', contactEmail: 'help@example.com', footerText: '' })
})
it('excludes drafts and sections outside their publishing interval', () => {
  const now = new Date('2026-10-03T12:00:00Z')
  expect(visibleSections([{ id: 'a', kind: 'text', status: 'published', heading: 'Hello', sort: 1 }, { id: 'b', kind: 'unknown', status: 'published' }, { id: 'c', kind: 'text', status: 'draft' }, { id: 'd', kind: 'text', status: 'published', starts_at: '2027-01-01T00:00:00Z' }], now).map(s => s.id)).toEqual(['a'])
})
it('encodes media paths and rejects paths that could change the delivery host', () => {
  expect(imageUrl('https://ik.imagekit.io/example', { path: '/products/red shirt.jpg', alt: 'Shirt', width: 800, height: 1000 }, 'card')).toBe('https://ik.imagekit.io/example/products/red%20shirt.jpg?tr=w-640,f-auto,q-80')
  expect(() => imageUrl('https://ik.imagekit.io/example', { path: '../private', alt: '', width: 1, height: 1 }, 'card')).toThrow()
})
