import 'dotenv/config'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
import {randomUUID} from 'node:crypto'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw new Error('Confirmed development target required')
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}),fetch,30000)
const {data:settings}=await request<{data:{id:string}[]}>('/items/store_settings?fields=id&sort=id&limit=2')
if(settings.length>1)throw new Error('Multiple store settings records require resolution')
const value={legal_business_name:'The Avenue Thirty',billing_address:'Paris Road Street Number 4 (51310) Sialkot, Pakistan',tax_registration:'Pending setup',tax_treatment:'pending'}
if(settings.length)await request(`/items/store_settings/${settings[0].id}`,{method:'PATCH',body:JSON.stringify(value)})
else await request('/items/store_settings',{method:'POST',body:JSON.stringify({id:randomUUID(),name:'The Avenue Thirty',currency:'PKR',contact_email:'',contact_phone:'',footer_text:'The destination for fashion, tech and living.',...value})})
console.log('Invoice preview business settings saved. Tax registration and treatment remain pending.')
