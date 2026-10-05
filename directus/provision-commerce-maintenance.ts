import 'dotenv/config'
import pg from 'pg'
import {randomBytes} from 'node:crypto'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
if(process.env.NODE_ENV==='production'||process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw Error('Development target required')
const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined
const config=(url:string|undefined)=>commerceConnectionConfig(url,ca,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'),pool=new pg.Pool(config(process.env.COMMERCE_DATABASE_URL))
try{
 await mkdir('.local',{recursive:true});let password:string
 try{password=JSON.parse(await readFile('.local/maintenance-access.json','utf8')).password}catch{password=randomBytes(32).toString('hex');await writeFile('.local/maintenance-access.json',JSON.stringify({password}),{mode:0o600})}
 const role='avenue_maintenance_runtime',exists=await pool.query('select 1 from pg_roles where rolname=$1',[role])
 if(!exists.rowCount){const sql=await pool.query("select format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT',$1::text,$2::text)sql",[role,password]);await pool.query(sql.rows[0].sql)}
 await pool.query(`GRANT USAGE ON SCHEMA avenue_private TO ${role}`);await pool.query(`GRANT EXECUTE ON FUNCTION avenue_private.expire_order_reservations(integer) TO ${role}`)
 const url=new URL(process.env.COMMERCE_DATABASE_URL!),suffix=decodeURIComponent(url.username).split('.').slice(1).join('.');url.username=role+(suffix?'.'+suffix:'');url.password=password
 const runtime=new pg.Pool(config(url.toString()))
 try{const {assertMaintenanceAccess}=await import('../src/server/maintenance-access');await assertMaintenanceAccess(runtime);const client=await runtime.connect();try{await client.query('BEGIN');await client.query('select avenue_private.expire_order_reservations(1)');await client.query('ROLLBACK')}finally{await client.query('ROLLBACK');client.release()}}finally{await runtime.end()}
 let env=await readFile('.env','utf8');env=env.replace(/^COMMERCE_MAINTENANCE_DATABASE_URL=.*\n?/gm,'');await writeFile('.env',env+`\nCOMMERCE_MAINTENANCE_DATABASE_URL=${JSON.stringify(url.toString())}\n`,{mode:0o600})
 console.log('Maintenance account verified: expiry command only, no direct order or inventory access.')
}catch{console.error('Maintenance provisioning incomplete; private details withheld.');process.exitCode=1}finally{await pool.end()}
