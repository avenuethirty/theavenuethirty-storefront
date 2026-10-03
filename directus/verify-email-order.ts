import 'dotenv/config'
import pg from 'pg'
import {randomUUID} from 'node:crypto'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {placeOrder} from '../src/server/commerce-service'
import {processNotificationBatch} from '../src/server/notification-worker'
import {deliverNotification} from '../src/server/notification-delivery'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true'||process.env.NODE_ENV==='production')throw new Error('Development target required')
const recipient='orders@theavenuethirty.com'
const commerce=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_RUNTIME_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
const worker=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_NOTIFY_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
const admin=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
const path='.local/email-order-verification.json'
try{
 await mkdir('.local',{recursive:true});let state:{key:string,orderId?:string,orderNumber?:string,cancelled?:boolean}
 try{state=JSON.parse(await readFile(path,'utf8'))}catch{state={key:randomUUID()};await writeFile(path,JSON.stringify(state),{mode:0o600})}
 if(!state.orderId){const input={name:'Development Email Test',phone:'+923000000066',address:{line1:'Development test only',city:'Sialkot',postalCode:'',country:'PK' as const,email:recipient},lines:[{sku:'SAMPLE-PRL-CAP-DEFAULT',quantity:1}]};const result=await placeOrder(commerce,process.env.COMMERCE_RECEIPT_SECRET!,input,state.key);const order=(await admin.query('select id from public.orders where idempotency_key=$1',[state.key])).rows[0];state.orderId=order.id;state.orderNumber=result.orderNumber;await writeFile(path,JSON.stringify(state),{mode:0o600})}
 await processNotificationBatch(worker,process.env.RESEND_API_KEY,(job,key)=>deliverNotification(job,key,fetch,recipient))
 const accepted=(await admin.query("select status from public.notification_outbox where order_id=$1 and event_type='placed'",[state.orderId])).rows[0]?.status
 if(accepted!=='accepted')throw new Error('Order confirmation not accepted')
 console.log(`Development order confirmation accepted for ${state.orderNumber}.`)
}catch{console.error('Email order verification incomplete; private details withheld.');process.exitCode=1}
finally{
 try{const state=JSON.parse(await readFile(path,'utf8'));if(state.orderId){const actor=(await admin.query('select id from public.directus_users where token=$1',[process.env.DIRECTUS_STATIC_TOKEN])).rows[0]?.id;if(!actor)throw new Error();await commerce.query('select avenue_private.cancel_order($1,$2)',[state.orderId,actor]);state.cancelled=true;await writeFile(path,JSON.stringify(state),{mode:0o600});await processNotificationBatch(worker,process.env.RESEND_API_KEY,(job,key)=>deliverNotification(job,key,fetch,recipient));console.log('Development verification order cancelled and stock released. Cancellation notification processed.')}}catch{console.error('Verification order cleanup needs inspection; private details withheld.');process.exitCode=1}
 await Promise.all([commerce.end(),worker.end(),admin.end()])
}
