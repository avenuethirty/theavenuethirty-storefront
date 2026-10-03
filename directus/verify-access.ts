import 'dotenv/config'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {randomUUID,randomBytes} from 'node:crypto'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
import {cataloguePermissions} from './permissions'
import {createApplicationStore} from '../src/features/suppliers/repository'
import {submitApplication} from '../src/features/suppliers/service'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true') throw new Error('Development target confirmation required')
const request=(token:string|undefined)=>createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:token}))
const admin=request(process.env.DIRECTUS_STATIC_TOKEN),catalogue=request(process.env.DIRECTUS_RUNTIME_TOKEN),supplier=request(process.env.DIRECTUS_SUPPLIER_TOKEN)
async function denied(action:()=>Promise<unknown>) {await assert.rejects(action, /\((401|403)\)/)}
for(const permission of cataloguePermissions) await catalogue(`/items/${permission.collection}?limit=1`)
await denied(()=>catalogue('/items/supplier_applications?limit=1'))
await denied(()=>catalogue('/items/submission_limits?limit=1'))
await denied(()=>catalogue('/items/departments',{method:'POST',body:JSON.stringify({name:'Denied write',slug:randomUUID()})}))
console.log('Catalogue account: required reads allowed, private reads and writes denied.')
const key=randomUUID(),email=`development-test-${key}@example.invalid`,input={businessName:'Development test only',contactName:'Fictitious supplier',email,phone:'+923000000000',categories:['Development test'],website:'',message:'Disposable permission verification record.',consent:true as const}
const store=createApplicationStore(supplier)
let staffId:string|undefined
try {
 const first=await submitApplication(input,key,store),again=await submitApplication(input,key,store)
 assert.equal(first.reference,again.reference)
 await assert.rejects(()=>submitApplication({...input,businessName:'Different'},key,store))
 const query=new URLSearchParams({filter:JSON.stringify({idempotency_key:{_eq:key}}),fields:'id,status',limit:'2'})
 const {data}=await admin<{data:{id:string;status:string}[]}>(`/items/supplier_applications?${query}`)
 assert.equal(data.length,1)
 await denied(()=>supplier(`/items/supplier_applications/${data[0].id}`,{method:'PATCH',body:JSON.stringify({status:'accepted'})}))
 await denied(()=>supplier('/items/products?limit=1'))
 const access=JSON.parse(await readFile('.local/access-state.json','utf8'))
 staffId=randomUUID();const token=randomBytes(32).toString('hex')
 await admin('/users',{method:'POST',body:JSON.stringify({id:staffId,first_name:'Disposable access verification',role:access.review.role,status:'active',token})})
 const staff=request(token)
 await staff(`/items/supplier_applications/${data[0].id}`)
 await staff(`/items/supplier_applications/${data[0].id}`,{method:'PATCH',body:JSON.stringify({status:'under_review',staff_notes:'Disposable verification.'})})
 await denied(()=>staff(`/items/supplier_applications/${data[0].id}`,{method:'PATCH',body:JSON.stringify({email:'changed@example.invalid'})}))
 console.log('Supplier and staff: idempotency verified; supplier cannot review, staff review fields allowed and applicant-field edits denied.')
} finally {
 for(const [collection,filter] of [['supplier_applications',{idempotency_key:{_eq:key}}],['submission_limits',{request_key:{_eq:key}}]] as const) {
  const query=new URLSearchParams({filter:JSON.stringify(filter),fields:'id',limit:'100'})
  const {data}=await admin<{data:{id:string}[]}>(`/items/${collection}?${query}`)
  for(const record of data) await admin(`/items/${collection}/${record.id}`,{method:'DELETE'})
 }
 if(staffId) await admin(`/users/${staffId}`,{method:'DELETE'})
 console.log('Disposable development records and temporary test account cleaned up.')
}
