import {expect,it} from 'vitest'
import {Webhook} from 'svix'
import {handleEmailWebhook} from '../../src/server/email-webhook'
const secret='whsec_'+Buffer.alloc(32,7).toString('base64'),id='msg_test_delivery',timestamp=new Date(),provider='11111111-1111-4111-8111-111111111111'
const body=JSON.stringify({type:'email.delivered',created_at:timestamp.toISOString(),data:{email_id:provider,to:['private@example.com']}})
function request(payload=body,signed=body,date=timestamp){return new Request('http://localhost/webhooks/resend',{method:'POST',headers:{'svix-id':id,'svix-timestamp':String(Math.floor(date.getTime()/1000)),'svix-signature':new Webhook(secret).sign(id,date,signed)},body:payload})}
it('verifies raw signatures and passes only minimal delivery evidence to storage',async()=>{let args:unknown[]=[];const r=await handleEmailWebhook(request(),secret,async(...values)=>{args=values});expect(r.status).toBe(204);expect(args).toEqual([id,provider,'delivered',timestamp.toISOString()]);expect(JSON.stringify(args)).not.toContain('private@example.com')})
it('rejects tampering and old signatures without database access',async()=>{let calls=0;const save=async()=>{calls++};expect((await handleEmailWebhook(request(body+' ',body),secret,save)).status).toBe(400);expect((await handleEmailWebhook(request(body,body,new Date(Date.now()-600000)),secret,save)).status).toBe(400);expect(calls).toBe(0)})
it('returns retryable failure when persistence fails and rejects oversized body',async()=>{expect((await handleEmailWebhook(request(),secret,async()=>{throw new Error('private connection')})).status).toBe(503);expect((await handleEmailWebhook(request('x'.repeat(70000)),secret,async()=>{})).status).toBe(413)})
