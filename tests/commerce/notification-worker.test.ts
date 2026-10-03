import {expect,it} from 'vitest'
import {randomUUID} from 'node:crypto'
import type {Pool} from 'pg'
import {processNotificationBatch} from '../../src/server/notification-worker'
it('claims immediately before delivery and quarantines malformed jobs without stopping the batch',async()=>{
 const invalid={id:randomUUID(),leaseToken:randomUUID(),recipient:'broken'},valid={id:randomUUID(),leaseToken:randomUUID(),recipient:'delivered@resend.dev',event:'placed',orderNumber:'DEV-100004',totalMinor:100,isTest:true}
 const jobs=[invalid,valid],calls:string[]=[],codes:unknown[]=[]
 const pool={query:async(sql:string,values?:unknown[])=>{calls.push(sql);if(sql.includes('claim_notifications'))return {rows:[{jobs:jobs.length?[jobs.shift()]:[]}]};if(sql.includes('retry_notification')){codes.push(values?.[3]);return {rows:[{retained:true}]}}return {rows:[{complete:true}]}}}as unknown as Pick<Pool,'query'>
 let sends=0;expect(await processNotificationBatch(pool,'re_test',async()=>{sends++;calls.push('send');return 'provider-id'},()=>{})).toBe(2);expect(sends).toBe(1);expect(codes).toEqual(['INVALID_JOB']);expect(calls.filter(c=>c.includes('claim_notifications')).every(c=>c.includes('(1)'))).toBe(true);expect(calls.indexOf('send')).toBe(3)
})
