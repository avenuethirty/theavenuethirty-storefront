import 'dotenv/config'
import {collections} from './schema'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
if(process.env.NODE_ENV==='production'||process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw Error('Development target required')
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}),fetch,30000)
let phase='collection discovery'
try{
 const definition=collections.find(c=>c.collection==='store_commerce_settings')!
 const {data:existing}=await request<{data:{collection:string}[]}>('/collections')
 const body={meta:definition.meta};phase='commerce collection registration'
 if(existing.some(c=>c.collection===definition.collection))await request(`/collections/${definition.collection}`,{method:'PATCH',body:JSON.stringify(body)})
 else await request('/collections',{method:'POST',body:JSON.stringify({collection:definition.collection,schema:{},...body})})
 const readonly=new Set(['online_hold_minutes','cod_hold_hours','fault_reporting_hours','return_handover_days','return_processing_min_days','return_processing_max_days'])
 for(const field of definition.fields){phase=`commerce field ${field.field}`;await request(`/fields/${definition.collection}/${field.field}`,{method:'PATCH',body:JSON.stringify({meta:{...field.meta,readonly:readonly.has(field.field),note:readonly.has(field.field)?'Agreed policy. Requires an explicit reviewed policy change.':field.meta?.note}})})}
 for(const field of ['shipping_quote_required','advance_payment_review_required'])await request(`/fields/products/${field}`,{method:'PATCH',body:JSON.stringify({meta:{interface:'boolean',note:field==='shipping_quote_required'?'Blocks ordinary checkout until a shipping quote is agreed. Use for bulky items.':'Requires advance-payment review before confirmation. Use for mobile phones or staff-reviewed items.'}})})
 for(const table of ['orders','inventory_reservations']){
  const fields=table==='orders'?['policy_snapshot','required_deposit_minor','manual_review_required','confirmation_status','cancellation_reason','shipping_minor','payment_method']:['expires_at']
  for(const field of fields)await request(`/fields/${table}/${field}`,{method:'PATCH',body:JSON.stringify({meta:{readonly:true,interface:field==='policy_snapshot'?'input-code':undefined,note:field==='required_deposit_minor'?'Required advance amount in paisa. This is not evidence of payment.':'Managed through commerce commands.'}})})
 }
 console.log('Private Commerce Settings and read-only order policy fields registered in Directus.')
}catch(error){console.error(`CMS policy setup incomplete at ${phase}: ${(error as Error).message}. Private details withheld.`);process.exitCode=1}
