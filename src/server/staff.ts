import '@tanstack/react-start/server-only'
import {getCookie,setCookie,deleteCookie,setResponseHeader} from '@tanstack/react-start/server'
import {z} from 'zod'
import {StaffSessions,assertStaffOwner,type StaffIdentity} from './staff-access'
import {createDirectusTransport} from './directus-transport'
import {parseServerEnv} from './env-validation'
import {checkoutEnabled,database} from './commerce'
import {placeOrder} from './commerce-service'
import type {OrderInput} from '../features/commerce/model'
const cookie='avenue-staff-session'
function request(token:string){return createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:token}))}
const sessions=new StaffSessions(async(email,password)=>{
 const env=parseServerEnv(process.env),response=await fetch(`${env.directusUrl}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,mode:'json'}),redirect:'error',signal:AbortSignal.timeout(10000)})
 if(!response.ok)throw new Error('Login failed');const parsed=z.object({data:z.object({access_token:z.string().min(1),expires:z.number().positive()})}).parse(await response.json());return {token:parsed.data.access_token,expiresMs:parsed.data.expires}
},async token=>(await request(token)<{data:StaffIdentity}>('/users/me?fields=id,status,role.policies.policy.admin_access,policies.policy.admin_access')).data)
function gate(){setResponseHeader('Cache-Control','private, no-store');if(!checkoutEnabled())throw new Error('Staff development workspace unavailable')}
async function staff(){gate();return sessions.authorise(getCookie(cookie))}
export async function staffLogin(email:string,password:string){gate();try{const id=await sessions.login(email,password);setCookie(cookie,id,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:900});return {ok:true as const}}catch{return {ok:false as const,message:'Sign-in failed or temporarily limited. Use an active Directus administrator account.'}}}
export async function staffLogout(){sessions.logout(getCookie(cookie));deleteCookie(cookie,{path:'/'});return {ok:true}}
export async function staffDashboard(){gate();try{const auth=await staff(),{data:orders}=await request(auth.token)<{data:{id:string;order_number:string;channel:string;status:string;total_minor:number;date_created:string}[]}>('/items/orders?fields=id,order_number,channel,status,total_minor,date_created&sort=-date_created&limit=20');return {authenticated:true as const,actor:auth.actor,orders}}catch{return {authenticated:false as const,actor:null,orders:[]}}}
export async function staffPlace(input:OrderInput,key:string,channel:'staff_phone'|'staff_whatsapp',expectedOwner:string){try{const auth=await staff();assertStaffOwner(auth.actor,expectedOwner);const result=await placeOrder(await database(),process.env.COMMERCE_RECEIPT_SECRET!,input,key,channel,auth.actor);return {ok:true as const,orderNumber:result.orderNumber}}catch(error){return {ok:false as const,authenticationRequired:(error as Error).message==='Staff authentication required',message:(error as Error).message==='Staff authentication required'?'Your session expired. Sign in with the same account to recover this attempt.':'Order was not confirmed. Retry the saved attempt or check availability.'}}}
export async function staffCancel(id:string){try{const auth=await staff();await (await database()).query('select avenue_private.cancel_order($1,$2)',[id,auth.actor]);return {ok:true as const}}catch{return {ok:false as const,message:'Cancellation was not confirmed. Sign in and retry.'}}}

export async function staffInvoice(id:string){const auth=await staff(),query=request(auth.token)
 const [{data:order},{data:settings}]=await Promise.all([query<{data:unknown}>(`/items/orders/${id}?fields=order_number,status,currency,subtotal_minor,shipping_minor,total_minor,address_id.recipient_name,address_id.line1,address_id.city,address_id.postal_code,address_id.country,lines.sku,lines.product_name,lines.variant_name,lines.quantity,lines.unit_price_minor,lines.line_total_minor`),query<{data:unknown[]}>('/items/store_settings?fields=legal_business_name,billing_address,tax_registration,tax_treatment&limit=1&sort=id')])
 const {invoicePreview}=await import('../features/commerce/invoice-preview');return invoicePreview(order,settings[0])
}
