import type { CataloguePage, CatalogueQuery, ProductDetail, Variant } from './types'
export const minPrice = (p: ProductDetail) => Math.min(...p.variants.map(v => v.priceMinor))
export function findPublishedProduct(products: ProductDetail[], slug: string) { return products.find(p => p.slug === slug && p.status === 'published') ?? null }
export function resolveVariant(product: ProductDetail, selection: Record<string, string>): Variant | null {
  const keys = Object.keys(product.options)
  if (Object.keys(selection).some(key => !keys.includes(key)) || keys.some(key => !selection[key])) return null
  return product.variants.find(v => v.available && keys.every(key => v.options[key] === selection[key])) ?? null
}
function matches(product: ProductDetail, filters: Record<string, string[]>) {
  const entries = Object.entries(filters).filter(([, values]) => values.length)
  const attributes = entries.filter(([key]) => !Object.hasOwn(product.options, key))
  if (!attributes.every(([key, values]) => values.includes(key === 'Brand' ? product.brand : product.attributes[key]))) return false
  const options = entries.filter(([key]) => Object.hasOwn(product.options, key))
  return !options.length || product.variants.some(v => v.available && options.every(([key, values]) => values.includes(v.options[key])))
}
export function cataloguePage(products: ProductDetail[], query: CatalogueQuery): CataloguePage {
  const filters = query.filters ?? {}
  const base = products.filter(p => p.status === 'published' && p.variants.length && (!query.department || p.departments.includes(query.department)) && (!query.category || p.category === query.category) && (!query.q || `${p.name} ${p.brand}`.toLowerCase().includes(query.q.toLowerCase())))
  const keys = new Set(base.flatMap(p => ['Brand', ...Object.keys(p.options), ...Object.keys(p.attributes)]))
  const facets: CataloguePage['facets'] = {}
  for (const key of keys) {
    const remaining = Object.fromEntries(Object.entries(filters).filter(([k]) => k !== key))
    const counts = new Map<string, number>()
    for (const p of base) {
      if (!matches(p, remaining)) continue
      const values = Object.hasOwn(p.options, key)
        ? p.variants.filter(v => v.available && Object.entries(remaining).every(([k, choices]) => !choices.length || !Object.hasOwn(p.options, k) || choices.includes(v.options[k]))).map(v => v.options[key])
        : [key === 'Brand' ? p.brand : p.attributes[key]]
      for (const value of new Set(values.filter(Boolean))) counts.set(value, (counts.get(value) ?? 0) + 1)
    }
    if (counts.size) facets[key] = [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([value, count]) => ({ value, count }))
  }
  const result = base.filter(p => matches(p, filters)).sort((a, b) => {
    const difference = query.sort === 'price-asc' ? minPrice(a) - minPrice(b) : query.sort === 'price-desc' ? minPrice(b) - minPrice(a) : 0
    return difference || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  })
  const pageSize = Number.isInteger(query.pageSize) && query.pageSize! > 0 ? Math.min(48, query.pageSize!) : 12
  const page = Number.isInteger(query.page) && query.page! > 0 ? query.page! : 1
  return { items: result.slice((page - 1) * pageSize, page * pageSize), total: result.length, page, pageSize, facets }
}
export function formatMoney(minor: number) { return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: minor % 100 ? 2 : 0 }).format(minor / 100) }
