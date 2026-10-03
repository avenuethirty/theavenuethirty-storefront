import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { createDirectusTransport } from '../src/server/directus-transport'
import { parseServerEnv } from '../src/server/env-validation'
import { collections, relations, planSchemaChanges } from './schema'
const request = createDirectusTransport(parseServerEnv({ ...process.env, DIRECTUS_RUNTIME_TOKEN: process.env.DIRECTUS_STATIC_TOKEN }))
const [current, fields, currentRelations] = await Promise.all([
  request<{ data: { collection: string }[] }>('/collections'),
  request<{ data: { collection: string; field: string }[] }>('/fields'),
  request<{ data: { collection: string; field: string; meta: Record<string,unknown> }[] }>('/relations'),
])
const plan = planSchemaChanges(current.data, fields.data)
const missingRelations = relations.filter(r => !currentRelations.data.some(e => e.collection === r.collection && e.field === r.field))
const editorUpdates=relations.filter(r=>{const existing=currentRelations.data.find(e=>e.collection===r.collection&&e.field===r.field);return existing && ['one_field','junction_field','sort_field','one_deselect_action'].some(key=>existing.meta?.[key] !== r.meta[key as keyof typeof r.meta])})
await mkdir('.local', { recursive: true, mode: 0o700 })
await writeFile(`.local/schema-before-${new Date().toISOString().replaceAll(':','-')}.json`, JSON.stringify({ collections: current.data, fields: fields.data, relations: currentRelations.data }, null, 2), { mode: 0o600 })
await writeFile('.local/schema-plan.json', JSON.stringify({ ...plan, relations: missingRelations, editorUpdates }, null, 2), { mode: 0o600 })
console.log(`Additive plan: ${plan.collections.length} collections, ${plan.fields.length} fields, ${missingRelations.length} relations, ${editorUpdates.length} relation editor updates. No data deletions or existing database-column changes.`)
if (process.argv.includes('--apply')) {
  if (process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED !== 'true') throw new Error('Development target must be explicitly confirmed before applying schema')
  for (const item of plan.collections) { await request('/collections', { method: 'POST', body: JSON.stringify(item) }); console.log(`Created ${item.collection}`) }
  for (const { collection, ...field } of plan.fields) await request(`/fields/${collection}`, { method: 'POST', body: JSON.stringify(field) })
  for (const item of missingRelations) await request('/relations', { method: 'POST', body: JSON.stringify(item) })
  for (const item of editorUpdates) await request(`/relations/${item.collection}/${item.field}`, {method:'PATCH',body:JSON.stringify({meta:item.meta})})
  console.log('Additive schema applied. Runtime/staff permissions still require separate validation before use.')
}
console.log(`Desired schema: ${collections.length} collections. Plan saved privately in .local/schema-plan.json.`)
