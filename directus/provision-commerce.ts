import 'dotenv/config'
import pg from 'pg'
import {randomBytes} from 'node:crypto'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw new Error('Development target required')
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}))
const tables=['locations','inventory_balances','stock_movements','customers','customer_addresses','orders','order_lines','inventory_reservations','reservation_allocations','order_events']
try {
 await mkdir('.local',{recursive:true})
 let state:{password:string;secret:string}
 try{state=JSON.parse(await readFile('.local/commerce-access.json','utf8'))}catch{state={password:randomBytes(32).toString('hex'),secret:randomBytes(32).toString('hex')};await writeFile('.local/commerce-access.json',JSON.stringify(state),{mode:0o600})}
 const role='avenue_commerce_runtime'
 const existing=await pool.query('select 1 from pg_roles where rolname=$1',[role])
 if(!existing.rowCount){const sql=await pool.query("select format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT', $1::text,$2::text) as sql",[role,state.password]);await pool.query(sql.rows[0].sql)}
 await pool.query(`GRANT USAGE ON SCHEMA avenue_private TO ${role}`)
 await pool.query(`GRANT EXECUTE ON FUNCTION avenue_private.place_order(uuid,text,text,text,text,jsonb,jsonb,text,uuid), avenue_private.order_receipt(text), avenue_private.cancel_order(uuid,uuid) TO ${role}`)
 const url=new URL(process.env.COMMERCE_DATABASE_URL!)
 const suffix=decodeURIComponent(url.username).split('.').slice(1).join('.')
 url.username=role+(suffix?'.'+suffix:'');url.password=state.password
 let env=await readFile('.env','utf8')
 for(const [key,value] of Object.entries({COMMERCE_RUNTIME_DATABASE_URL:url.toString(),COMMERCE_RECEIPT_SECRET:state.secret})){
  env=env.replace(new RegExp(`^${key}=.*\\n?`,'gm'),'');env+=`\n${key}=${JSON.stringify(value)}\n`
 }
 await writeFile('.env',env,{mode:0o600})
 const runtime=new pg.Pool(commerceConnectionConfig(url.toString(),undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
 try{await runtime.query("select avenue_private.order_receipt('not-a-receipt')");let denied=false;try{await runtime.query('select * from public.orders')}catch{denied=true}if(!denied)throw new Error('Runtime table access unexpectedly allowed')}finally{await runtime.end()}
 console.log('Restricted commerce account verified')
 for(const table of tables){
  const {data}=await request<{data:{collection:string;meta:unknown}[]}>(`/collections`)
  const present=data.find(c=>c.collection===table)
  const meta={icon:table==='orders'?'shopping_bag':'inventory_2',note:'Development commerce. Test data only. Inventory and order state changes must use commerce commands.',display_template:table==='orders'?'{{order_number}}':undefined,hidden:false}
  if(present)await request(`/collections/${table}`,{method:'PATCH',body:JSON.stringify({meta})})
  else await request('/collections',{method:'POST',body:JSON.stringify({collection:table,meta,schema:{}})})
  const {data:fields}=await request<{data:{field:string}[]}>(`/fields/${table}`)
  for(const field of fields)await request(`/fields/${table}/${field.field}`,{method:'PATCH',body:JSON.stringify({meta:{readonly:true,hidden:['fingerprint','receipt_hash','idempotency_key'].includes(field.field)}})})
  console.log(`Registered CMS collection ${table}`)
 }
 const client=await pool.connect()
 try{await client.query('BEGIN');const location=await client.query("insert into public.locations(name,code) values('Sample warehouse','SAMPLE-WAREHOUSE') on conflict(code) do update set code=excluded.code returning id")
 for(const [sku,quantity] of [['SAMPLE-PRL-SHIRT-NAVY-S',5],['SAMPLE-PRL-SHIRT-NAVY-M',3],['SAMPLE-PRL-SHIRT-WHITE-S',1],['SAMPLE-PRL-SHIRT-WHITE-M',0],['SAMPLE-PRL-CAP-DEFAULT',8]]){
 const balance=await client.query('insert into public.inventory_balances(variant_id,location_id,on_hand) select id,$1,$2 from public.product_variants where sku=$3 on conflict(variant_id,location_id) do nothing returning id',[location.rows[0].id,quantity,sku])
 if(balance.rowCount)await client.query("insert into public.stock_movements(balance_id,quantity_delta,reason,reference)values($1,$2,'Sample opening stock',$3)",[balance.rows[0].id,quantity,`sample-opening:${sku}`])
 }await client.query('COMMIT');console.log('Sample opening inventory recorded')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}catch(error){console.error(`Commerce provisioning failed (${(error as {code?:string}).code||(error as Error).message}). Credentials withheld.`);process.exitCode=1}finally{await pool.end()}
