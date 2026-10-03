import {createServerFn} from '@tanstack/react-start'
import {setResponseHeader} from '@tanstack/react-start/server'
import {z} from 'zod'
import {orderInput} from './model'
import {checkoutEnabled,submitOrder,receipt} from '../../server/commerce'
export const checkoutAvailability=createServerFn({method:'GET'}).handler(()=>checkoutEnabled())
export const createOrder=createServerFn({method:'POST'}).validator(z.object({input:orderInput,key:z.uuid()})).handler(({data})=>submitOrder(data.input,data.key))
export const getReceipt=createServerFn({method:'GET'}).validator(z.string().regex(/^[a-f0-9]{64}$/)).handler(({data})=>{setResponseHeader('Cache-Control','private, no-store');return receipt(data)})
