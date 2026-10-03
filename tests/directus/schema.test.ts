import { expect, it } from 'vitest'
import { collections, relations, planSchemaChanges } from '../../directus/schema'
it('creates only missing structures and leaves unknown existing data alone', () => {
  const plan = planSchemaChanges([{ collection: 'products' }, { collection: 'unrelated' }], [{ collection: 'products', field: 'id' }])
  expect(plan.collections.some(c => c.collection === 'products')).toBe(false)
  expect(plan.fields.some(f => f.collection === 'products' && f.field === 'id')).toBe(false)
  expect(plan.fields.some(f => f.collection === 'products' && f.field === 'slug')).toBe(true)
  expect(plan.collections.some(c => c.collection === 'unrelated')).toBe(false)
})
it('keeps variant SKUs unique and department membership relational', () => {
  const variants = collections.find(c => c.collection === 'product_variants')!
  expect(variants.fields.find(f => f.field === 'sku')?.schema?.is_unique).toBe(true)
  expect(relations.find(r => r.collection === 'product_departments' && r.field === 'product_id')?.related_collection).toBe('products')
  expect(variants.fields.some(f => f.field === 'inventory_quantity')).toBe(false)
})
it('is idempotent after the desired schema exists', () => {
  const plan = planSchemaChanges(collections, collections.flatMap(c => c.fields.map(f => ({ ...f, collection: c.collection }))))
  expect(plan.collections).toEqual([])
  expect(plan.fields).toEqual([])
})
it('provides product and page editors with explicit related-item fields', () => {
  expect(collections.find(c=>c.collection==='products')?.fields.find(f=>f.field==='variants')?.type).toBe('alias')
  expect(relations.find(r=>r.collection==='product_variants'&&r.field==='product_id')?.meta.one_field).toBe('variants')
  expect(collections.find(c=>c.collection==='pages')?.fields.some(f=>f.field==='sections')).toBe(true)
})
