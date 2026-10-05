import 'dotenv/config'
import pg from 'pg'
import {randomUUID} from 'node:crypto'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {placeOrder} from '../src/server/commerce-service'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true'||process.env.NODE_ENV==='production')throw new Error('Development target required')
const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined
const config=(url:string|undefined)=>commerceConnectionConfig(url,ca,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true')
const runtime=new pg.Pool(config(process.env.COMMERCE_RUNTIME_DATABASE_URL))
const admin=new pg.Pool(config(process.env.COMMERCE_DATABASE_URL))
const path='.local/hosted-maintenance-verification.json'
let state:{key:string,orderId?:string,orderNumber?:string}|undefined
try{
 await mkdir('.local',{recursive:true})
 try{state=JSON.parse(await readFile(path,'utf8'))}catch{state={key:randomUUID()};await writeFile(path,JSON.stringify(state),{mode:0o600})}
 if(!state)throw new Error()
 if(!state.orderId){
  const result=await placeOrder(runtime,process.env.COMMERCE_RECEIPT_SECRET!,{name:'Hosted Maintenance Development Test',phone:'+923000000070',address:{line1:'Development verification only',city:'Sialkot',postalCode:'',country:'PK'},lines:[{sku:'SAMPLE-PRL-CAP-DEFAULT',quantity:1}]},state.key)
  state.orderId=(await admin.query('select id from public.orders where idempotency_key=$1',[state.key])).rows[0].id
  state.orderNumber=result.orderNumber
  await writeFile(path,JSON.stringify(state),{mode:0o600})
 }
 await admin.query("update public.inventory_reservations set expires_at=now()-interval '1 minute' where order_id=$1 and status='active'",[state.orderId])
 console.log(`Waiting for hosted expiry of ${state.orderNumber}; no local expiry command is used.`)
 for(let i=0;i<19;i++){
  const result=(await admin.query("select status,cancellation_reason,(select count(*)::int from public.inventory_reservations where order_id=o.id and status='active') active,(select count(*)::int from public.order_events where order_id=o.id and kind='reservation_expired') events from public.orders o where id=$1",[state.orderId])).rows[0]
  if(result.status==='cancelled'&&result.cancellation_reason==='confirmation_timeout'&&result.active===0&&result.events===1){console.log('Hosted reservation expiry verified: order cancelled, reservation released, one expiry event.');break}
  if(i===18)throw new Error()
  await new Promise(resolve=>setTimeout(resolve,5000))
 }
}catch{console.error('Hosted maintenance verification incomplete; private details withheld.');process.exitCode=1}
finally{
 try{if(state?.orderId){const actor=(await admin.query('select id from public.directus_users where token=$1',[process.env.DIRECTUS_STATIC_TOKEN])).rows[0]?.id;if(!actor)throw new Error();await runtime.query('select avenue_private.cancel_order($1,$2)',[state.orderId,actor])}}
 catch{console.error('Development order cleanup needs inspection.');process.exitCode=1}
 await Promise.all([runtime.end(),admin.end()])
}
