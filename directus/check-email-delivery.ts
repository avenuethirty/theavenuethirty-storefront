import 'dotenv/config'
import pg from 'pg'
import {readFile} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw new Error('Development target required')
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
const statuses=new Set(['sent','delivered','delivery_delayed','bounced','complained','failed','suppressed'])
try{const state=JSON.parse(await readFile('.local/email-order-verification.json','utf8'));const jobs=await pool.query('select event_type,provider_id from public.notification_outbox where order_id=$1 and status=$2',[state.orderId,'accepted']);for(const job of jobs.rows){const response=await fetch(`https://api.resend.com/emails/${encodeURIComponent(job.provider_id)}`,{headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`},redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error();const status=(await response.json()).last_event;if(!statuses.has(status))throw new Error();await pool.query('select avenue_private.record_email_delivery($1,$2,$3,now())',[`poll_${job.provider_id}_${status}`,job.provider_id,status]);console.log(`Development ${job.event_type} email provider status: ${status}. Mail-server delivery is distinct from inbox visibility.`)}}catch{console.error('Delivery status check incomplete; private details withheld.');process.exitCode=1}finally{await pool.end()}
