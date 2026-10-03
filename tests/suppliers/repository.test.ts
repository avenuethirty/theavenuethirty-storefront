import { expect, it } from 'vitest'
import { createApplicationStore } from '../../src/features/suppliers/repository'
it('reserves a durable unique daily identity without storing raw contact details', async () => {
  const calls: {path:string;init?:RequestInit}[]=[]
  const store=createApplicationStore(async <T>(path:string,init?:RequestInit) => {calls.push({path,init}); return {data:{}} as T},()=>new Date('2026-10-03T12:00:00Z'))
  expect(await store.reserve('hashed-identity','request')).toBe(true)
  expect(JSON.parse(calls[0].init!.body as string)).toEqual({key:'supplier:2026-10-03:hashed-identity',request_key:'request'})
})
it('fails closed when reservation storage is unavailable', async () => {
  const store=createApplicationStore(async()=>{throw new Error('unavailable')})
  expect(await store.reserve('identity','request')).toBe(false)
})
it('lets the same submission retry after a reservation succeeds but the application write times out', async()=>{
 const store=createApplicationStore(async<T>(_path:string,init?:RequestInit)=>{if(init?.method==='POST') throw new Error('duplicate'); return {data:[{request_key:'same-request'}]} as T})
 expect(await store.reserve('identity','same-request')).toBe(true)
 expect(await store.reserve('identity','different-request')).toBe(false)
})
