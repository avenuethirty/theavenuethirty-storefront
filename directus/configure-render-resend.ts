import 'dotenv/config'
import {mkdir,writeFile} from 'node:fs/promises'
import {directusResendSettings} from '../src/server/resend-config'
const settings=directusResendSettings(process.env.RESEND_API_KEY),service=process.env.RENDER_SERVICE_ID,token=process.env.RENDER_API_KEY
if(!service||!/^srv-[a-z0-9]+$/.test(service)||!token)throw new Error('Private RENDER_API_KEY and Directus RENDER_SERVICE_ID are required')
async function request(path:string,init?:RequestInit){const response=await fetch(`https://api.render.com/v1/services/${service}${path}`,{...init,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`Render configuration request failed (${response.status})`);return response.status===204?null:response.json()}
try{
 await request('');const domains=await request('/custom-domains?limit=100');const target=new URL(process.env.DIRECTUS_URL!).hostname
 if(target!=='admin.theavenuethirty.com'||!Array.isArray(domains)||!domains.some((entry:{customDomain?:{name?:string}})=>entry.customDomain?.name===target))throw new Error('Render service does not match the approved Directus domain')
 console.log(`Matched Directus service. Email settings prepared: ${Object.keys(settings).join(', ')}. Password withheld.`)
 if(process.argv.includes('--apply')){await mkdir('.local',{recursive:true});await writeFile('.local/render-email-configuration-state.json',JSON.stringify({service,started:new Date().toISOString(),keys:Object.keys(settings)}),{mode:0o600});for(const[key,value]of Object.entries(settings))await request(`/env-vars/${key}`,{method:'PUT',body:JSON.stringify({value})});console.log('Directus SMTP environment settings updated individually. Activate through a Render deployment before testing system email. No email sent.')}
 else console.log('Read-only check complete. Run with --apply to update only the prepared email variables.')
}catch(error){console.error((error as Error).message.includes('Render')?(error as Error).message:'Directus email configuration failed; credentials withheld.');process.exitCode=1}
