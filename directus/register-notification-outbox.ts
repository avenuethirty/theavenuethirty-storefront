import 'dotenv/config'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw new Error('Development target required')
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}),fetch,30000)
const {data:collections}=await request<{data:{collection:string}[]}>('/collections'),meta={icon:'mark_email_unread',note:'Private transactional email queue. Development sending allows only the Resend test recipient. Accepted means provider acceptance, not verified inbox delivery.',hidden:false,display_template:'{{event_type}}: {{status}}'}
if(collections.some(c=>c.collection==='notification_outbox'))await request('/collections/notification_outbox',{method:'PATCH',body:JSON.stringify({meta})})
else await request('/collections',{method:'POST',body:JSON.stringify({collection:'notification_outbox',meta,schema:{}})})
const {data:fields}=await request<{data:{field:string}[]}>('/fields/notification_outbox')
for(const field of fields)await request(`/fields/notification_outbox/${field.field}`,{method:'PATCH',body:JSON.stringify({meta:{readonly:true}})})
await request('/fields/customer_addresses/email',{method:'PATCH',body:JSON.stringify({meta:{readonly:true,note:'Optional transactional email. Private customer contact information.'}})})
console.log('Private notification outbox metadata registered.')
