import { describe, expect, it } from 'vitest'
import { cataloguePage, findPublishedProduct, resolveVariant } from '../../src/features/catalogue/model'
import { fixtureProducts } from '../../src/features/catalogue/fixtures'

describe('catalogue boundaries', () => {
  it('keeps the same product identity across department appearances', () => {
    const women = cataloguePage(fixtureProducts, { department: 'women' }).items.find(p => p.slug === 'everyday-shirt')!
    const men = cataloguePage(fixtureProducts, { department: 'men' }).items.find(p => p.slug === 'everyday-shirt')!
    expect(women.id).toBe(men.id)
    expect(women.variants[0].sku).toBe('DEMO-SHIRT-RS')
  })
  it('hides draft products even through direct slug lookup', () => {
    expect(findPublishedProduct(fixtureProducts, 'unreleased-shirt')).toBeNull()
    expect(cataloguePage(fixtureProducts, {}).items.some(p => p.status !== 'published')).toBe(false)
  })
  it('requires one available variant to satisfy colour and size together', () => {
    expect(cataloguePage(fixtureProducts, { filters: { Colour: ['Red'], Size: ['L'] } }).total).toBe(0)
    expect(cataloguePage(fixtureProducts, { filters: { Colour: ['Red'], Size: ['S'] } }).total).toBe(1)
  })
  it('uses OR within a filter, AND across filters, and disjunctive facet counts', () => {
    const result = cataloguePage(fixtureProducts, { department: 'women', filters: { Colour: ['Red', 'Blue'], Size: ['S'] } })
    expect(result.total).toBe(1)
    expect(result.facets.Colour).toEqual([{ value: 'Red', count: 1 }])
  })
  it('does not choose a multi-option variant before all selections are valid', () => {
    const product = findPublishedProduct(fixtureProducts, 'everyday-shirt')!
    expect(resolveVariant(product, {})).toBeNull()
    expect(resolveVariant(product, { Colour: 'Red', Size: 'L' })).toBeNull()
    expect(resolveVariant(product, { Colour: 'Blue', Size: 'L' })?.sku).toBe('DEMO-SHIRT-BL')
  })
  it('sorts and paginates deterministically without losing zero prices', () => {
    const sample = fixtureProducts.map(p => ({ ...p, variants: p.variants.map(v => ({ ...v, priceMinor: 0 })) }))
    const result = cataloguePage(sample, { sort: 'price-asc', pageSize: 1, page: 1 })
    expect(result.items).toHaveLength(1)
    expect(result.items[0].variants[0].priceMinor).toBe(0)
    expect(cataloguePage(sample, { pageSize: -1, page: -2 }).page).toBe(1)
  })
})
