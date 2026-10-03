import 'dotenv/config'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw new Error('Development target required')
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}))
const links=[['order_lines','order_id','orders','lines'],['inventory_reservations','order_id','orders','reservations'],['order_events','order_id','orders','events'],['inventory_balances','variant_id','product_variants','inventory'],['inventory_balances','location_id','locations','balances'],['stock_movements','balance_id','inventory_balances','movements'],['reservation_allocations','reservation_id','inventory_reservations','allocations']] as const
for(const [many,field,one,alias] of links){
 const {data:fields}=await request<{data:{field:string}[]}>(`/fields/${one}`)
 if(!fields.some(f=>f.field===alias))await request(`/fields/${one}`,{method:'POST',body:JSON.stringify({field:alias,type:'alias',meta:{special:['o2m'],interface:'list-o2m',readonly:true,options:{enableCreate:false,enableSelect:false},width:'full'}})})
 const {data:relations}=await request<{data:{collection:string;field:string}[]}>('/relations')
 const body={collection:many,field,related_collection:one,meta:{one_field:alias,one_deselect_action:'nullify'},schema:{}}
 if(relations.some(r=>r.collection===many&&r.field===field))await request(`/relations/${many}/${field}`,{method:'PATCH',body:JSON.stringify(body)})
 else await request('/relations',{method:'POST',body:JSON.stringify(body)})
 console.log(`Linked ${one}.${alias}`)
}
for(const [many,field,one] of [['orders','address_id','customer_addresses'],['order_lines','variant_id','product_variants'],['reservation_allocations','balance_id','inventory_balances']] as const){await request(`/fields/${many}/${field}`,{method:'PATCH',body:JSON.stringify({meta:{special:['m2o'],interface:'select-dropdown-m2o',readonly:true}})})}
