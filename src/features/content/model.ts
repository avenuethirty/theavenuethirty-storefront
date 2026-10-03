import { z } from 'zod'
import type { MediaAsset } from '../catalogue/types'
const settingsSchema = z.object({ name: z.string().default('The Avenue Thirty'), contact_email: z.string().default(''), footer_text: z.string().default('') })
export function publicSettings(raw: unknown) { const s = settingsSchema.parse(raw); return { name: s.name, contactEmail: s.contact_email, footerText: s.footer_text } }
const sectionSchema = z.object({ id: z.string(), kind: z.enum(['hero', 'text', 'product_rail', 'brand_rail', 'faq']), status: z.literal('published'), heading: z.string().nullish(), body: z.string().nullish(), sort: z.number().default(0), product_ids: z.array(z.string()).default([]), starts_at: z.string().nullish(), ends_at: z.string().nullish() })
export type PageSection = z.infer<typeof sectionSchema>
export function visibleSections(raw: unknown[], now = new Date()): PageSection[] {
  return raw.flatMap(item => { const result = sectionSchema.safeParse(item); if (!result.success) return []; const s = result.data; if (s.starts_at && !(Date.parse(s.starts_at) <= +now)) return []; if (s.ends_at && !(Date.parse(s.ends_at) > +now)) return []; return [s] }).sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id))
}
export function imageUrl(endpoint: string, asset: MediaAsset, preset: 'card' | 'detail' | 'hero'): string {
  const base = new URL(endpoint)
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('Invalid media endpoint')
  const parts = asset.path.replace(/^\//, '').split('/')
  if (!parts.length || parts.some(p => !p || p === '.' || p === '..' || p.includes('\\') || p.includes(':'))) throw new Error('Invalid media path')
  return `${endpoint.replace(/\/$/, '')}/${parts.map(encodeURIComponent).join('/')}?tr=w-${preset === 'card' ? 640 : preset === 'detail' ? 1200 : 1800},f-auto,q-80`
}
