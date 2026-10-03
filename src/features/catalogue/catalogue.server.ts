import '@tanstack/react-start/server-only'
import { directusRequest } from '../../server/directus'
import { cataloguePage, findPublishedProduct } from './model'
import type { CatalogueQuery, Department, ProductDetail } from './types'
import { fixtureDepartments, fixtureProducts } from './fixtures'
import { z } from 'zod'
import { decodeVariants } from './variant-decoder'

// Explicitly opt in locally. Production must never silently serve sample data.
function fixturesEnabled() {
  if (process.env.CATALOGUE_SOURCE !== 'fixtures') return false
  if (process.env.NODE_ENV === 'production') throw new Error('Fixtures cannot run in production')
  return true
}
const entity = z.object({ id: z.string() }).passthrough()
type Row = z.infer<typeof entity>
async function rows(collection: string, filter?: object): Promise<Row[]> {
  const all: Row[] = []
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ limit: '100', page: String(page), sort: 'id' })
    if (filter) query.set('filter', JSON.stringify(filter))
    const payload = await directusRequest<{ data: unknown[] }>(`/items/${collection}?${query}`)
    const batch = z.array(entity).parse(payload.data)
    all.push(...batch)
    if (batch.length < 100) return all
    if (page >= 100) throw new Error('Catalogue exceeds current snapshot limit; configure indexed queries before scaling')
  }
}
const published = { status: { _eq: 'published' } }
const string = (row: Row, field: string) => z.string().parse(row[field])
const number = (row: Row, field: string) => z.number().int().nonnegative().parse(row[field])
const find = (items: Row[], id: unknown) => items.find(item => item.id === id)
export async function listDepartments(): Promise<Department[]> {
  if (fixturesEnabled()) return fixtureDepartments
  return (await rows('departments', published)).map(r => ({ slug: string(r, 'slug'), name: string(r, 'name'), description: typeof r.description === 'string' ? r.description : '', sort: number(r, 'sort') })).sort((a, b) => a.sort - b.sort)
}
export async function getDepartment(slug: string) { return (await listDepartments()).find(d => d.slug === slug) ?? null }
export async function allProducts(): Promise<ProductDetail[]> {
  if (fixturesEnabled()) return fixtureProducts.filter(p => p.status === 'published')
  const tables = ['products', 'brands', 'categories', 'product_types', 'departments', 'product_variants', 'product_departments', 'product_options', 'option_values', 'variant_option_values', 'attribute_definitions', 'attribute_values', 'product_attribute_values', 'media_assets', 'product_media'] as const
  const data = Object.fromEntries(await Promise.all(tables.map(async table => [table, await rows(table, ['products', 'brands', 'categories', 'product_types', 'departments'].includes(table) ? published : undefined)]))) as Record<typeof tables[number], Row[]>
  return data.products.flatMap(p => {
    const brand = find(data.brands, p.brand_id), category = find(data.categories, p.category_id), type = find(data.product_types, p.product_type_id)
    if (!brand || !category || !type) return []
    const options = data.product_options.filter(o => o.product_id === p.id)
    const variants = decodeVariants(options, data.option_values, data.variant_option_values, data.product_variants.filter(v => v.product_id === p.id))
    if (!variants.length) return []
    const attributes = Object.fromEntries(data.product_attribute_values.filter(a => a.product_id === p.id).flatMap(a => {
      const value = find(data.attribute_values, a.attribute_value_id), def = value && find(data.attribute_definitions, value.attribute_id)
      return value && def ? [[string(def, 'name'), string(value, 'value')]] : []
    }))
    return [{ id: p.id, slug: string(p, 'slug'), name: string(p, 'name'), brand: string(brand, 'name'), category: string(category, 'slug'), productType: string(type, 'slug'), status: 'published' as const, description: typeof p.description === 'string' ? p.description : '', variants, attributes,
      departments: data.product_departments.filter(link => link.product_id === p.id).flatMap(link => { const d = find(data.departments, link.department_id); return d ? [string(d, 'slug')] : [] }),
      options: Object.fromEntries(options.map(o => [string(o, 'name'), data.option_values.filter(v => v.option_id === o.id).map(v => string(v, 'value'))])),
      media: data.product_media.filter(m => m.product_id === p.id).sort((a,b) => number(a,'sort')-number(b,'sort')).flatMap(link => { const m = find(data.media_assets, link.media_id); return m ? [{ path: string(m, 'path'), alt: string(m, 'alt'), width: number(m, 'width'), height: number(m, 'height') }] : [] }),
    }]
  })
}
export async function listProducts(query: CatalogueQuery) { return cataloguePage(await allProducts(), query) }
export async function getProduct(slug: string) { return findPublishedProduct(await allProducts(), slug) }
export function imageEndpoint() { return process.env.IMAGEKIT_URL_ENDPOINT ?? process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? '' }
export function isFixturePreview() { return fixturesEnabled() }
