import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { supplierInput, applicationFingerprint, type SupplierApplicationInput } from './schema'
export interface SavedApplication { key: string; fingerprint: string; reference: string; input: SupplierApplicationInput }
export interface ApplicationStore { find(key: string): Promise<SavedApplication | null>; reserve(identity: string, key: string): Promise<boolean>; create(value: SavedApplication): Promise<SavedApplication> }
export async function submitApplication(raw: unknown, key: string, store: ApplicationStore): Promise<{ reference: string }> {
  z.uuid().parse(key)
  const input = supplierInput.parse(raw), fingerprint = createHash('sha256').update(applicationFingerprint(input)).digest('hex')
  function receipt(record: SavedApplication) { if(record.fingerprint !== fingerprint) throw new Error('Submission key already used'); return { reference: record.reference } }
  const existing = await store.find(key)
  if(existing) return receipt(existing)
  if(!await store.reserve(createHash('sha256').update(input.email).digest('hex'), key)) throw new Error('Please try again later')
  try { return receipt(await store.create({ key, fingerprint, reference: randomUUID(), input })) }
  catch(error) { const saved = await store.find(key); if(saved) return receipt(saved); throw error }
}
