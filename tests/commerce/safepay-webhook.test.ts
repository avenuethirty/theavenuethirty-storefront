import {createHmac} from 'node:crypto'
import {describe,it,expect} from 'vitest'
import {handleSafepayWebhook} from '../../src/server/safepay-webhook'
const secret='development-test-secret',merchant='sec_test'
const event={token:'evt_test',version:'2.0.0',merchant_api_key:merchant,type:'payment.succeeded',data:{tracker:'track_test',state:'TRACKER_ENDED',amount:25000,currency:'PKR',customer_email:'private@example.com'},created_at:{seconds:1791200000,nanos:0}}
function request(value:unknown=event,signature?:string){const raw=JSON.stringify(value);return new Request('http://localhost/webhooks/safepay',{method:'POST',headers:{'X-SFPY-SIGNATURE':signature??createHmac('sha512',secret).update(raw).digest('hex')},body:raw})}
describe('Safepay sandbox webhook boundary',()=>{
 it('persists a verified event without customer details before acknowledging',async()=>{const saved:unknown[]=[];expect((await handleSafepayWebhook(request(),secret,merchant,async e=>{saved.push(e)})).status).toBe(200);expect(saved).toEqual([{id:'evt_test',type:'payment.succeeded',tracker:'track_test',state:'TRACKER_ENDED',amount:25000,currency:'PKR',createdSeconds:1791200000,fingerprint:expect.stringMatching(/^[a-f0-9]{64}$/)}]);expect(JSON.stringify(saved)).not.toContain('private@example.com')})
 it('fingerprints discarded fields while ignoring retry counters',async()=>{const hashes:string[]=[];for(const value of [event,{...event,delivery_attempts:2},{...event,created_at:{...event.created_at,nanos:1}}])await handleSafepayWebhook(request(value),secret,merchant,async e=>{hashes.push(e.fingerprint)});expect(hashes[0]).toBe(hashes[1]);expect(hashes[0]).not.toBe(hashes[2])})
 it.each(['','bad','0'.repeat(128)])('rejects invalid signatures without persistence (%s)',async signature=>{let saved=false;expect((await handleSafepayWebhook(request(event,signature),secret,merchant,async()=>{saved=true})).status).toBe(400);expect(saved).toBe(false)})
 it('rejects another merchant even with a valid signature',async()=>{expect((await handleSafepayWebhook(request({...event,merchant_api_key:'other'}),secret,merchant,async()=>{throw Error()})).status).toBe(400)})
 it('fails closed when a secret is missing',async()=>{expect((await handleSafepayWebhook(request(),undefined,merchant,async()=>{})).status).toBe(503)})
 it('asks the provider to retry if durable storage fails',async()=>{expect((await handleSafepayWebhook(request(),secret,merchant,async()=>{throw Error()})).status).toBe(503)})
 it('rejects oversized payloads',async()=>{expect((await handleSafepayWebhook(request({...event,padding:'a'.repeat(65536)}),secret,merchant,async()=>{})).status).toBe(413)})
 it('accepts multiple attempt events on the same tracker',async()=>{const ids:string[]=[];for(const token of ['evt_first','evt_second'])expect((await handleSafepayWebhook(request({...event,token}),secret,merchant,async e=>{ids.push(e.id)})).status).toBe(200);expect(ids).toEqual(['evt_first','evt_second'])})
})
