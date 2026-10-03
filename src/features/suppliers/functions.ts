import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { supplierInput } from './schema'
import { acceptApplication, applicationsEnabled } from './applications.server'
export const applicationAvailability=createServerFn({method:'GET'}).handler(()=>applicationsEnabled())
export const submitSupplierApplication=createServerFn({method:'POST'}).validator(z.object({input:supplierInput,key:z.uuid(),websiteCheck:z.literal('')})).handler(({data})=>acceptApplication(data.input,data.key))
