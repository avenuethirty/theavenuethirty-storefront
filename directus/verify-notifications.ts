import 'dotenv/config'
import pg from 'pg'
import {randomUUID} from 'node:crypto'
import {strict as assert} from 'node:assert'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {deliverNotification} from '../src/server/notification-delivery'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw new Error('Development target required')
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
try{
 const client=await pool.connect()
 try{await client.query('BEGIN');await client.query("update public.notification_outbox set status='awaiting_recipient' where status in('queued','processing')")
 const order=(await client.query("select id,address_id from public.orders where order_number='DEV-100004' and is_test=true")).rows[0];assert(order)
 await client.query("update public.customer_addresses set email='delivered@resend.dev' where id=$1",[order.address_id])
 const event=randomUUID();await client.query("insert into public.order_events(id,order_id,kind) values($1,$2,'placed')",[event,order.id])
 const claim=async()=> (await client.query('select avenue_private.claim_notifications(1) jobs')).rows[0].jobs
 const first=(await claim())[0];assert(first);assert.equal(first.recipient,'delivered@resend.dev');assert.deepEqual(await claim(),[])
 assert.equal((await client.query('select avenue_private.complete_notification($1,$2,$3) ok',[first.id,randomUUID(),'fake-provider-id'])).rows[0].ok,false)
 await client.query("update public.notification_outbox set lease_until=now()-interval '1 minute' where id=$1",[first.id]);const second=(await claim())[0];assert.equal(second.id,first.id);assert.notEqual(second.leaseToken,first.leaseToken)
 assert.equal((await client.query('select avenue_private.retry_notification($1,$2,true,$3) ok',[second.id,second.leaseToken,'TEMPORARY_FAILURE'])).rows[0].ok,true);assert.deepEqual(await claim(),[])
 await client.query('update public.notification_outbox set available_at=now() where id=$1',[first.id]);const third=(await claim())[0];const provider=randomUUID(),deliveryEvent=`msg_${randomUUID()}`;await client.query("select avenue_private.record_email_delivery($1,$2,'delivered',now())",[deliveryEvent,provider]);assert.equal((await client.query('select avenue_private.complete_notification($1,$2,$3) ok',[third.id,third.leaseToken,provider])).rows[0].ok,true);assert.deepEqual(await claim(),[])
 await client.query("select avenue_private.record_email_delivery($1,$2,'sent',now())",[`msg_${randomUUID()}`,provider]);await client.query("select avenue_private.record_email_delivery($1,$2,'delivered',now())",[deliveryEvent,provider]);assert.equal((await client.query('select delivery_status from public.notification_outbox where id=$1',[first.id])).rows[0].delivery_status,'delivered');assert.equal((await client.query('select count(*)::int n from avenue_private.email_delivery_events where id=$1',[deliveryEvent])).rows[0].n,1)
 await client.query("update public.notification_outbox set status='processing',attempts=5,lease_until=now()-interval '1 minute' where id=$1",[first.id]);assert.deepEqual(await claim(),[]);assert.equal((await client.query('select status from public.notification_outbox where id=$1',[first.id])).rows[0].status,'manual_review')
 console.log('Notification transaction verified: contact capture, exclusive lease, stale acknowledgement rejection, retry delay, acceptance and exhausted retry review. Test changes rolled back.')
 }finally{await client.query('ROLLBACK');client.release()}
 if(process.argv.includes('--resend')){
 await mkdir('.local',{recursive:true});const verificationPath=process.env.NOTIFICATIONS_TEST_RECIPIENT?'.local/resend-inbox-verification.json':'.local/resend-verification.json';let job;try{job=JSON.parse(await readFile(verificationPath,'utf8')).job}catch{job={id:randomUUID(),leaseToken:randomUUID(),recipient:process.env.NOTIFICATIONS_TEST_RECIPIENT||'delivered@resend.dev',event:'placed',orderNumber:'DEV-100004',totalMinor:450000,isTest:true};await writeFile(verificationPath,JSON.stringify({job}),{mode:0o600})}

 const provider=await deliverNotification(job,process.env.RESEND_API_KEY,fetch,process.env.NOTIFICATIONS_TEST_RECIPIENT);await writeFile(verificationPath,JSON.stringify({job,provider,acceptedAt:new Date().toISOString()}),{mode:0o600});console.log('Resend accepted the development test message. Directus SMTP and inbox receipt still need separate verification.')
 }
}catch{console.error('Notification verification failed; credentials and provider responses withheld.');process.exitCode=1}finally{await pool.end()}
