import {createHash,createHmac} from 'node:crypto'
import type {Pool} from 'pg'
import {canonicalOrder,orderInput,type OrderInput} from '../features/commerce/model'
export async function placeOrder(pool:Pool,secret:string,input:OrderInput,key:string,channel='website',actor:string|null=null){
 const parsed=orderInput.parse(input),fingerprint=createHash('sha256').update(`${canonicalOrder(parsed)}:${channel}:${actor||''}`).digest('hex')
 const receipt=createHmac('sha256',secret).update(`${key}:${fingerprint}`).digest('hex'),hash=createHash('sha256').update(receipt).digest('hex')
 const result=await pool.query('select * from avenue_private.place_order($1,$2,$3,$4,$5,$6,$7,$8,$9)',[key,fingerprint,hash,parsed.name,parsed.phone,parsed.address,JSON.stringify(parsed.lines),channel,actor])
 return {orderNumber:result.rows[0].order_number as string,receipt}
}
export async function readReceipt(pool:Pool,token:string){const result=await pool.query('select avenue_private.order_receipt($1) as receipt',[createHash('sha256').update(token).digest('hex')]);return result.rows[0].receipt as {orderNumber:string;status:string;totalMinor:number;currency:string;paymentMethod:string;lines:{name:string;sku:string;quantity:number;lineTotalMinor:number}[]}|null}
