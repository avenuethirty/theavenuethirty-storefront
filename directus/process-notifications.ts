import 'dotenv/config'
import pg from 'pg'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {deliverNotification} from '../src/server/notification-delivery'
import {processNotificationBatch} from '../src/server/notification-worker'
if(process.env.NOTIFICATIONS_ENABLED!=='true'||process.env.NODE_ENV==='production')throw new Error('Explicit development notification enablement required')
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_NOTIFY_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
try{await processNotificationBatch(pool,process.env.RESEND_API_KEY,(job,key)=>deliverNotification(job,key,fetch,process.env.NOTIFICATIONS_TEST_RECIPIENT))}catch{console.error('Notification processing failed; credentials and customer details withheld.');process.exitCode=1}finally{await pool.end()}
