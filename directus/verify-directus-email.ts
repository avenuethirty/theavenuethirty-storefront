import 'dotenv/config'
import {randomUUID} from 'node:crypto'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw new Error('Development target required')
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}),fetch,30000)
const inbox=process.argv.includes('--inbox');const recipient=inbox?'orders@theavenuethirty.com':'delivered@resend.dev'
const statePath=inbox?'.local/directus-smtp-inbox-verification.json':'.local/directus-smtp-verification.json'
async function emails(){const r=await fetch('https://api.resend.com/emails',{headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`},redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok){console.log(`Resend observation API returned ${r.status}; sending-key permissions may not include reading emails.`);throw new Error('Email observation access unavailable')};return (await r.json()).data as {id:string,subject:string,last_event:string,from:string}[]}
let flow:string|undefined
try{
 await emails();await mkdir('.local',{recursive:true})
 let state:{subject:string,attempted?:boolean,verified?:boolean,providerId?:string,lastEvent?:string}
 try{state=JSON.parse(await readFile(statePath,'utf8'))}catch{state={subject:`Directus SMTP development verification ${randomUUID()}`}}
 if(!state.attempted){
 const created=await request<{data:{id:string}}>('/flows',{method:'POST',body:JSON.stringify({name:'Temporary SMTP verification',status:'active',trigger:'manual',accountability:'$trigger',options:{collections:['orders'],requireSelection:false}})});flow=created.data.id
 const operation=await request<{data:{id:string}}>('/operations',{method:'POST',body:JSON.stringify({name:'Send simulator test',key:'smtp_test',type:'mail',flow,position_x:0,position_y:0,options:{to:recipient,fromName:'The Avenue Thirty',type:'markdown',subject:state.subject,body:'Directus SMTP development test. No customer order, payment or shipment.'}})})
 await request(`/flows/${flow}`,{method:'PATCH',body:JSON.stringify({operation:operation.data.id})})
 state.attempted=true;await writeFile(statePath,JSON.stringify({...state,flow}),{mode:0o600})
 await request(`/flows/trigger/${flow}`,{method:'POST',body:JSON.stringify({})})
 }
 for(let attempt=0;attempt<12;attempt++){
 const observed=(await emails()).find(email=>email.subject===state.subject)
 if(observed){state.verified=true;state.providerId=observed.id;state.lastEvent=observed.last_event;await writeFile(statePath,JSON.stringify(state),{mode:0o600});console.log(`Directus SMTP message independently observed in Resend (${observed.last_event}). Approved development recipient only.`);break}
 await new Promise(resolve=>setTimeout(resolve,3000))
 }
 if(!state.verified)throw new Error('SMTP message not observed')
}catch{console.error('Directus SMTP verification incomplete; private details withheld. Check SMTP configuration and provider access. No automatic resend.');process.exitCode=1}finally{if(flow)await request(`/flows/${flow}`,{method:'DELETE'}).catch(()=>console.error('Temporary verification flow cleanup needs retry.'))}
