import {Webhook} from 'svix'
import {z} from 'zod'
const eventSchema=z.object({type:z.enum(['email.sent','email.delivered','email.delivery_delayed','email.bounced','email.complained','email.failed','email.suppressed']),created_at:z.iso.datetime({offset:true}),data:z.object({email_id:z.uuid()})})
export async function handleEmailWebhook(request:Request,secret:string|undefined,save:(id:string,provider:string,status:string,created:string)=>Promise<unknown>){
 const response=(status:number)=>new Response(null,{status,headers:{'Cache-Control':'no-store'}})
 if(!secret)return response(503)
 let raw=''
 try{
  const reader=request.body?.getReader();if(!reader)return response(400)
  let bytes=0;const chunks:Uint8Array[]=[]
  while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>65536){await reader.cancel();return response(413)}chunks.push(part.value)}
  raw=Buffer.concat(chunks).toString('utf8')
 }catch{return response(400)}
 let event:z.infer<typeof eventSchema>,id:string
 try{
  id=z.string().min(1).max(200).parse(request.headers.get('svix-id'))
  const verified=new Webhook(secret).verify(raw,{'svix-id':id,'svix-timestamp':request.headers.get('svix-timestamp')||'','svix-signature':request.headers.get('svix-signature')||''})
  event=eventSchema.parse(verified ?? JSON.parse(raw))
 }catch{return response(400)}
 try{await save(id,event.data.email_id,event.type.slice(6),event.created_at);return response(204)}catch{return response(503)}
}
