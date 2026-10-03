import 'dotenv/config'
import pg from 'pg'
import {randomBytes} from 'node:crypto'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw new Error('Development target required')
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
try{await mkdir('.local',{recursive:true});let password:string;try{password=JSON.parse(await readFile('.local/notification-access.json','utf8')).password}catch{password=randomBytes(32).toString('hex');await writeFile('.local/notification-access.json',JSON.stringify({password}),{mode:0o600})}
 const role='avenue_notifications_runtime',exists=await pool.query('select 1 from pg_roles where rolname=$1',[role]);if(!exists.rowCount){const sql=await pool.query("select format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT',$1::text,$2::text)sql",[role,password]);await pool.query(sql.rows[0].sql)}
 await pool.query(`GRANT USAGE ON SCHEMA avenue_private TO ${role}`);await pool.query(`GRANT EXECUTE ON FUNCTION avenue_private.claim_notifications(integer),avenue_private.complete_notification(uuid,uuid,text),avenue_private.retry_notification(uuid,uuid,boolean,text),avenue_private.record_email_delivery(text,uuid,text,timestamptz) TO ${role}`)
 const url=new URL(process.env.COMMERCE_DATABASE_URL!),suffix=decodeURIComponent(url.username).split('.').slice(1).join('.');url.username=role+(suffix?'.'+suffix:'');url.password=password
 const runtime=new pg.Pool(commerceConnectionConfig(url.toString(),undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
 try{const permissions=await runtime.query("select has_function_privilege(current_user,'avenue_private.claim_notifications(integer)','EXECUTE') allowed,has_table_privilege(current_user,'public.orders','SELECT') reads_orders,has_function_privilege(current_user,'avenue_private.place_order(uuid,text,text,text,text,jsonb,jsonb,text,uuid)','EXECUTE') places_orders");if(!permissions.rows[0].allowed||permissions.rows[0].reads_orders||permissions.rows[0].places_orders)throw new Error('Unexpected worker privileges')}finally{await runtime.end()}
 let env=await readFile('.env','utf8');env=env.replace(/^COMMERCE_NOTIFY_DATABASE_URL=.*\n?/gm,'');await writeFile('.env',env+`\nCOMMERCE_NOTIFY_DATABASE_URL=${JSON.stringify(url.toString())}\n`,{mode:0o600});console.log('Notification worker account verified: notification commands only, no order table reads or order placement.')
}catch(error){console.error(`Notification provisioning failed (${(error as {code?:string}).code||'CONFIGURATION'}); credentials withheld.`);process.exitCode=1}finally{await pool.end()}
