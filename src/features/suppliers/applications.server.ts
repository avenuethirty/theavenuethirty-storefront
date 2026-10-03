import '@tanstack/react-start/server-only'
import { createDirectusTransport } from '../../server/directus-transport'
import { parseServerEnv } from '../../server/env-validation'
import { submitApplication } from './service'
import { createApplicationStore } from './repository'
export function applicationsEnabled() { return process.env.SUPPLIER_APPLICATIONS_ENABLED === 'true' && Boolean(process.env.DIRECTUS_SUPPLIER_TOKEN) && process.env.CATALOGUE_SOURCE !== 'fixtures' }
export async function acceptApplication(input:unknown,key:string) {
  if(!applicationsEnabled()) return {ok:false as const,message:'Applications are not open yet.'}
  try {
    const transport=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_SUPPLIER_TOKEN}))
    const receipt=await submitApplication(input,key,createApplicationStore(transport))
    return {ok:true as const,reference:receipt.reference}
  } catch {return {ok:false as const,message:'We could not save your application. Please keep your details and try again later.'}}
}
