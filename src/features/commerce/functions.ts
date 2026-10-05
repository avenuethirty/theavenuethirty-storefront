import {createServerFn} from '@tanstack/react-start'
import {setResponseHeader} from '@tanstack/react-start/server'
import {z} from 'zod'
import {orderInput} from './model'
import {checkoutEnabled,submitOrder,receipt,checkoutQuote} from '../../server/commerce'
export const checkoutAvailability=createServerFn({method:'GET'}).handler(()=>checkoutEnabled())
export const createOrder=createServerFn({method:'POST'}).validator(z.object({input:orderInput.refine(value=>!!value.quoteId,'Review a quote first'),key:z.uuid()})).handler(({data})=>submitOrder(data.input,data.key))
export const getCheckoutQuote=createServerFn({method:'POST'}).validator(z.object({lines:z.array(z.object({sku:z.string().min(1).max(100),quantity:z.number().int().min(1).max(20)})).min(1).max(20),city:z.string().trim().min(2).max(100)})).handler(({data})=>checkoutQuote(data.lines,data.city))
export const getReceipt=createServerFn({method:'GET'}).validator(z.string().regex(/^[a-f0-9]{64}$/)).handler(({data})=>{setResponseHeader('Cache-Control','private, no-store');return receipt(data)})
