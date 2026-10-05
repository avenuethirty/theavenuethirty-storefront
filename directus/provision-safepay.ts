import 'dotenv/config'
import pg from 'pg'
import {randomBytes,randomUUID} from 'node:crypto'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {assertSafepayAccess} from '../src/server/safepay-access'
if(process.env.NODE_ENV==='production'||process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw Error('Development database required')
const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined
const config=(url:string|undefined)=>commerceConnectionConfig(url,ca,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true')
const pool=new pg.Pool(config(process.env.COMMERCE_DATABASE_URL))
try{
 const target=await pool.query("select count(*)::int n from public.products where slug in ('sample-cotton-oxford-shirt','sample-cotton-cap')")
 if(target.rows[0].n!==2)throw Error('Unexpected target')
 await pool.query(await readFile('migrations/006-safepay-sandbox.sql','utf8'))
 await mkdir('.local',{recursive:true});let password:string
 try{password=JSON.parse(await readFile('.local/safepay-access.json','utf8')).password}catch{password=randomBytes(32).toString('hex');await writeFile('.local/safepay-access.json',JSON.stringify({password}),{mode:0o600})}
 const role='avenue_safepay_sandbox',exists=await pool.query('select 1 from pg_roles where rolname=$1',[role])
 if(!exists.rowCount){const sql=await pool.query("select format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT',$1::text,$2::text)sql",[role,password]);await pool.query(sql.rows[0].sql)}
 await pool.query(`GRANT USAGE ON SCHEMA avenue_private TO ${role}`)
 await pool.query(`GRANT EXECUTE ON FUNCTION avenue_private.record_safepay_sandbox_event(jsonb) TO ${role}`)
 const url=new URL(process.env.COMMERCE_DATABASE_URL!),suffix=decodeURIComponent(url.username).split('.').slice(1).join('.');url.username=role+(suffix?'.'+suffix:'');url.password=password
 const runtime=new pg.Pool(config(url.toString()))
 try{
  await assertSafepayAccess(runtime)
  const client=await runtime.connect();try{
   await client.query('BEGIN');const event={id:`evt_${randomUUID()}`,type:'payment.succeeded',tracker:'track_test',createdSeconds:1791200000}
   await client.query('select avenue_private.record_safepay_sandbox_event($1::jsonb)',[JSON.stringify(event)])
   await client.query('select avenue_private.record_safepay_sandbox_event($1::jsonb)',[JSON.stringify(event)])
   await client.query('SAVEPOINT conflict');let rejected=false
   try{await client.query('select avenue_private.record_safepay_sandbox_event($1::jsonb)',[JSON.stringify({...event,tracker:'track_conflict'})])}catch{rejected=true;await client.query('ROLLBACK TO SAVEPOINT conflict')}
   if(!rejected)throw Error('Conflicting duplicate accepted')
   await client.query('ROLLBACK')
  }finally{await client.query('ROLLBACK');client.release()}
 }finally{await runtime.end()}
 let env=await readFile('.env','utf8');env=env.replace(/^SAFEPAY_EVENTS_DATABASE_URL=.*\n?/gm,'');await writeFile('.env',env+`\nSAFEPAY_EVENTS_DATABASE_URL=${JSON.stringify(url.toString())}\n`,{mode:0o600})
 console.log('Safepay sandbox inbox provisioned. Restricted account, duplicate handling and conflict rejection verified; test events rolled back.')
}catch{console.error('Sandbox inbox provisioning incomplete; private details withheld.');process.exitCode=1}finally{await pool.end()}
