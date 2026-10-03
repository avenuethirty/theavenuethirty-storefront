import {createServerFn} from '@tanstack/react-start'
import {z} from 'zod'
import {orderInput} from './model'
import {staffLogin,staffLogout,staffDashboard,staffPlace,staffCancel,staffInvoice} from '../../server/staff'
export const getStaffDashboard=createServerFn({method:'GET'}).handler(()=>staffDashboard())
export const signInStaff=createServerFn({method:'POST'}).validator(z.object({email:z.email().max(254),password:z.string().min(1).max(256)}).strict()).handler(({data})=>staffLogin(data.email,data.password))
export const signOutStaff=createServerFn({method:'POST'}).handler(()=>staffLogout())
export const placeStaffOrder=createServerFn({method:'POST'}).validator(z.object({input:orderInput,key:z.uuid(),expectedOwner:z.uuid(),channel:z.enum(['staff_phone','staff_whatsapp'])}).strict()).handler(({data})=>staffPlace(data.input,data.key,data.channel,data.expectedOwner))
export const cancelStaffOrder=createServerFn({method:'POST'}).validator(z.uuid()).handler(({data})=>staffCancel(data))

export const getStaffInvoice=createServerFn({method:'GET'}).validator(z.uuid()).handler(({data})=>staffInvoice(data))
