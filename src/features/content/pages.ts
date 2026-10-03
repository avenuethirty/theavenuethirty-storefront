import { publicSettings, visibleSections, type PageSection } from './model'
export interface ContentPage { slug: string; name: string; department: string | null; sections: PageSection[] }
export interface SiteContent { pages: ContentPage[]; navigation: { label: string; path: string; department: string | null }[]; settings: ReturnType<typeof publicSettings> }
type Row = Record<string, unknown>
export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\s%]/.test(value)) return null
  try { const url = new URL(value, 'https://store.invalid'); return url.origin === 'https://store.invalid' ? value : null } catch { return null }
}
export function decodeContent(data: Record<string, Row[]>, now = new Date()): SiteContent {
  const department = (id: unknown) => id == null ? null : data.departments?.find(d => d.id === id && d.status === 'published')?.slug
  const validDepartment = (id: unknown) => id == null || typeof department(id) === 'string'
  const pages = (data.pages ?? []).filter(p => p.status === 'published' && typeof p.slug === 'string' && typeof p.name === 'string' && validDepartment(p.department_id)).map(p => ({ slug: p.slug as string, name: p.name as string, department: department(p.department_id) as string | null, sections: visibleSections((data.page_sections ?? []).filter(s => s.page_id === p.id).map(s=>({...s,product_ids:(data.collection_products ?? []).filter(link=>link.collection_id===s.collection_id && s.collection_id != null).map(link=>link.product_id)})), now) }))
  const menus = (data.navigation_menus ?? []).filter(m => m.status === 'published' && validDepartment(m.department_id))
  const navigation = [...(data.navigation_items ?? [])].sort((a,b) => Number(a.sort ?? 0)-Number(b.sort ?? 0)).flatMap(item => {
    const menu = menus.find(m => m.id === item.menu_id), path = safeInternalPath(item.path)
    return menu && path && typeof item.label === 'string' ? [{label:item.label,path,department:department(menu.department_id) as string | null}] : []
  })
  const raw = data.store_settings?.[0]
  return {pages,navigation,settings:publicSettings({name:raw?.name ?? 'The Avenue Thirty',contact_email:raw?.contact_email ?? '',footer_text:raw?.footer_text ?? ''})}
}
