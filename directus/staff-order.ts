import 'dotenv/config'
import {readFile} from 'node:fs/promises'
import pg from 'pg'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {placeOrder} from '../src/server/commerce-service'
import {orderInput} from '../src/features/commerce/model'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
const [action,file,key]=process.argv.slice(2)
if(!['place','cancel'].includes(action)||!file||!key)throw new Error('Usage: staff-order.ts place input.json idempotency-uuid OR cancel order-uuid confirmation')
const token=process.env.DIRECTUS_STAFF_TOKEN
if(!token)throw new Error('Configure a server-only DIRECTUS_STAFF_TOKEN for a Directus administrator')
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:token}))
const {data:me}=await request<{data:{id:string;status:string;role:{policies:{policy:{admin_access:boolean}}[]} | null;policies:{policy:{admin_access:boolean}}[]}}>(`/users/me?fields=id,status,role.policies.policy.admin_access,policies.policy.admin_access`)
if(me.status!=='active'||![...(me.policies||[]),...(me.role?.policies||[])].some(p=>p.policy.admin_access))throw new Error('Authorised administrator required')
if(process.env.COMMERCE_DEVELOPMENT_ENABLED!=='true'||process.env.NODE_ENV==='production')throw new Error('Development commerce required')
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_RUNTIME_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
try{if(action==='place'){const body=JSON.parse(await readFile(file,'utf8'));if(!['staff_phone','staff_whatsapp'].includes(body.channel))throw new Error('Staff channel required');const result=await placeOrder(pool,process.env.COMMERCE_RECEIPT_SECRET!,orderInput.parse(body.input),key,body.channel,me.id);console.log(`Saved test staff order ${result.orderNumber}`)}else{if(key!=='confirm')throw new Error('Cancellation confirmation required');await pool.query('select avenue_private.cancel_order($1,$2)',[file,me.id]);console.log('Test order cancelled and reservation released')}}catch{console.error('Staff commerce command failed. Credentials and customer details withheld.');process.exitCode=1}finally{await pool.end()}
