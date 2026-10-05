import {createHash,createHmac,timingSafeEqual} from 'node:crypto'
import {z} from 'zod'
export interface SafepayEvent {id:string;type:string;tracker:string;state?:string;amount?:number;currency?:string;createdSeconds:number;fingerprint:string}
function canonical(value:unknown):string {if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value!==null&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>JSON.stringify(key)+':'+canonical(item)).join(',')+'}';return JSON.stringify(value)}
const schema=z.object({token:z.string().regex(/^evt_[A-Za-z0-9-]{1,150}$/),version:z.literal('2.0.0'),merchant_api_key:z.string(),type:z.enum(['payment.succeeded','payment.failed','payment.refunded','authorization.succeeded','authorization.reversed','void.succeeded']),data:z.object({tracker:z.string().regex(/^track_[A-Za-z0-9-]{1,150}$/),state:z.string().max(100).optional(),amount:z.number().int().nonnegative().safe().optional(),currency:z.string().length(3).optional()}),created_at:z.object({seconds:z.number().int().nonnegative().safe()})})
export async function handleSafepayWebhook(request:Request,secret:string|undefined,merchant:string|undefined,save:(event:SafepayEvent)=>Promise<unknown>){
 const response=(status:number)=>new Response(null,{status,headers:{'Cache-Control':'no-store'}})
 if(!secret?.trim()||!merchant?.trim())return response(503)
 if(request.method!=='POST')return response(405)
 let raw:Buffer
 try{const reader=request.body?.getReader();if(!reader)return response(400);const chunks:Uint8Array[]=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>65536){await reader.cancel();return response(413)}chunks.push(part.value)}raw=Buffer.concat(chunks)}catch{return response(400)}
 let event:SafepayEvent
 try{
  const signature=request.headers.get('X-SFPY-SIGNATURE')||''
  if(!/^[a-fA-F0-9]{128}$/.test(signature))return response(400)
  const expected=createHmac('sha512',secret).update(raw).digest()
  if(!timingSafeEqual(expected,Buffer.from(signature,'hex')))return response(400)
  const original=JSON.parse(raw.toString('utf8')),payload=schema.parse(original)
  if(payload.merchant_api_key!==merchant)return response(400)
  const fingerprint=createHash('sha256').update(canonical({token:original.token,version:original.version,merchant_api_key:original.merchant_api_key,type:original.type,data:original.data,created_at:original.created_at})).digest('hex')
  event={id:payload.token,type:payload.type,tracker:payload.data.tracker,...(payload.data.state?{state:payload.data.state}:{}),...(payload.data.amount!==undefined?{amount:payload.data.amount}:{}),...(payload.data.currency?{currency:payload.data.currency}:{}),createdSeconds:payload.created_at.seconds,fingerprint}
 }catch{return response(400)}
 try{await save(event);return response(200)}catch{return response(503)}
}
