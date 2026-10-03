import { expect, it } from 'vitest'
import { submitApplication, type ApplicationStore, type SavedApplication } from '../../src/features/suppliers/service'
const input = { businessName: 'Example Brand', contactName: 'Sample Person', email: 'hello@example.com', phone: '+923001234567', categories: ['Fashion'], website: '', message: 'We would like to supply our catalogue.', consent: true as const }
function store(): ApplicationStore {
  const entries = new Map<string, SavedApplication>()
  return { find: async key => entries.get(key) ?? null, reserve: async () => true, create: async value => { if(entries.has(value.key)) throw new Error('Duplicate'); entries.set(value.key,value); return value } }
}
it('returns the existing receipt on retry without creating another application', async () => {
  const repository=store(), key='d7b921db-fc94-4550-b8a0-96acdf9b1d00'
  const first=await submitApplication(input,key,repository)
  expect(await submitApplication(input,key,repository)).toEqual(first)
})
it('rejects reusing a submission key with a different application', async () => {
  const repository=store(), key='d7b921db-fc94-4550-b8a0-96acdf9b1d00'
  await submitApplication(input,key,repository)
  await expect(submitApplication({...input,businessName:'Different Brand'},key,repository)).rejects.toThrow('Submission key already used')
})
it('handles concurrent duplicate submissions as one receipt', async () => {
  const repository=store(), key='d7b921db-fc94-4550-b8a0-96acdf9b1d00'
  const results=await Promise.all([submitApplication(input,key,repository),submitApplication(input,key,repository)])
  expect(results[0]).toEqual(results[1])
})
it('rejects excess submissions before creating records', async () => {
  const repository=store();repository.reserve=async()=>false
  await expect(submitApplication(input,'d7b921db-fc94-4550-b8a0-96acdf9b1d00',repository)).rejects.toThrow('Please try again later')
})
