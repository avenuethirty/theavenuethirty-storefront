import {z} from 'zod'
import type {Pool} from 'pg'
import {deliverNotification,DeliveryError,notificationJob} from './notification-delivery'
export async function processNotificationBatch(pool:Pick<Pool,'query'>,key:string|undefined,deliver:typeof deliverNotification=deliverNotification,log:(message:string)=>void=console.log){
const leaseIdentity=z.object({id:z.uuid(),leaseToken:z.uuid()})
let processed=0

 for(let index=0;index<10;index++){
  const result=await pool.query('select avenue_private.claim_notifications(1) jobs')
  const raw=result.rows[0].jobs[0];if(!raw)break
  const identity=leaseIdentity.parse(raw)
  processed++
  try{
   const parsed=notificationJob.safeParse(raw)
   if(!parsed.success)throw new DeliveryError('INVALID_JOB',false)
   const provider=await deliver(parsed.data,key)
   const done=await pool.query('select avenue_private.complete_notification($1,$2,$3) complete',[identity.id,identity.leaseToken,provider])
   if(!done.rows[0].complete){log('Notification lease changed after provider acceptance; inspect the private queue.');continue}
   log('Development email accepted by Resend. Inbox delivery has not been independently verified.')
  }catch(error){
   const known=error instanceof DeliveryError?error:new DeliveryError('TEMPORARY_FAILURE',true)
   const retry=await pool.query('select avenue_private.retry_notification($1,$2,$3,$4) retained',[identity.id,identity.leaseToken,known.retryable,known.code])
   if(!retry.rows[0].retained){log('Notification lease changed; inspect the private queue before reconciliation.');continue}
   log(`Notification retained for ${known.retryable?'retry':'manual review'} (${known.code}).`)
  }
 }
 log(`Processed ${processed} notification jobs; no customer details printed.`)
 return processed
}
