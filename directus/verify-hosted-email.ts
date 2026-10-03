import 'dotenv/config'
import pg from 'pg'
import {randomUUID} from 'node:crypto'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {placeOrder} from '../src/server/commerce-service'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true'||process.env.NODE_ENV==='production')throw new Error('Development target required')
const runtime=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_RUNTIME_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
const admin=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
const path='.local/hosted-email-verification.json'
let state:{key:string,orderId?:string,orderNumber?:string,cancelled?:boolean}|undefined
try{
 await mkdir('.local',{recursive:true});try{state=JSON.parse(await readFile(path,'utf8'))}catch{state={key:randomUUID()};await writeFile(path,JSON.stringify(state),{mode:0o600})}
 if(!state)throw new Error()
 if(!state.orderId){const result=await placeOrder(runtime,process.env.COMMERCE_RECEIPT_SECRET!,{name:'Hosted Email Development Test',phone:'+923000000067',address:{line1:'Development verification only',city:'Sialkot',postalCode:'',country:'PK',email:'orders@theavenuethirty.com'},lines:[{sku:'SAMPLE-PRL-CAP-DEFAULT',quantity:1}]},state.key);state.orderId=(await admin.query('select id from public.orders where idempotency_key=$1',[state.key])).rows[0].id;state.orderNumber=result.orderNumber;await writeFile(path,JSON.stringify(state),{mode:0o600})}
 console.log(`Queued hosted-worker test ${state.orderNumber}; local dispatch is not used.`)
 for(let i=0;i<18;i++){
 const rows=await admin.query("select n.status,n.delivery_status,(select count(*)::int from avenue_private.email_delivery_events e where e.provider_id::text=n.provider_id and e.id not like 'poll_%') signed_events from public.notification_outbox n where order_id=$1 and event_type='placed'",[state.orderId]);const job=rows.rows[0]
 if(i%6===0)console.log(`Hosted test: ${job.status}; delivery ${job.delivery_status}; signed events ${job.signed_events}.`)
 if(job.status==='accepted'&&job.delivery_status==='delivered'&&job.signed_events>0){console.log('Hosted worker and signed delivery tracking verified.');break}
 if(job.status==='manual_review')throw new Error()
 if(i===17)throw new Error()
 await new Promise(resolve=>setTimeout(resolve,5000))
 }
}catch{console.error('Hosted email verification incomplete; private details withheld.');process.exitCode=1}
finally{
 try{if(state?.orderId){const actor=(await admin.query('select id from public.directus_users where token=$1',[process.env.DIRECTUS_STATIC_TOKEN])).rows[0]?.id;if(!actor)throw new Error();await runtime.query('select avenue_private.cancel_order($1,$2)',[state.orderId,actor]);state.cancelled=true;await writeFile(path,JSON.stringify(state),{mode:0o600});const outstanding=(await admin.query('select count(*)::int n from public.inventory_reservations where order_id=$1 and status=$2',[state.orderId,'active'])).rows[0].n;if(outstanding!==0)throw new Error();console.log('Hosted verification order cancelled; stock reservation released. Cancellation email queued.')}}catch{console.error('Test order cleanup needs inspection; private details withheld.');process.exitCode=1}
 await Promise.all([runtime.end(),admin.end()])
}
