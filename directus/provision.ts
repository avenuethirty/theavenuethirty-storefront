import 'dotenv/config'
import {readFile,writeFile,chmod} from 'node:fs/promises'
import {randomBytes,randomUUID} from 'node:crypto'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
import {cataloguePermissions,supplierPermissions,supplierReviewPermissions} from './permissions'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true') throw new Error('Confirm development target before provisioning')
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}))
const statePath='.local/access-state.json'
type Entry={role:string;policy:string;user:string;token:string}
let state:Record<string,Entry>={}
try {state=JSON.parse(await readFile(statePath,'utf8'))} catch(error) {if((error as NodeJS.ErrnoException).code!=='ENOENT') throw error}
const definitions=[{key:'catalogue',name:'Avenue Catalogue Service',env:'DIRECTUS_RUNTIME_TOKEN',permissions:cataloguePermissions},{key:'supplier',name:'Avenue Supplier Service',env:'DIRECTUS_SUPPLIER_TOKEN',permissions:supplierPermissions},{key:'review',name:'Avenue Supplier Review',env:null,permissions:supplierReviewPermissions}]
let env=await readFile('.env','utf8')
for(const definition of definitions) {
 const saved=state[definition.key] ?? {role:randomUUID(),policy:randomUUID(),user:randomUUID(),token:randomBytes(32).toString('hex')}
 state[definition.key]=saved
 await writeFile(statePath,JSON.stringify(state),{mode:0o600});await chmod(statePath,0o600)
 const roles=await request<{data:{id:string}[]}>(`/roles?filter[id][_eq]=${saved.role}&fields=id`)
 if(!roles.data.length) await request('/roles',{method:'POST',body:JSON.stringify({id:saved.role,name:definition.name,description:'Managed foundation role. Development instance only.'})})
 const policies=await request<{data:{id:string}[]}>(`/policies?filter[id][_eq]=${saved.policy}&fields=id`)
 if(!policies.data.length) await request('/policies',{method:'POST',body:JSON.stringify({id:saved.policy,name:definition.name,admin_access:false,app_access:definition.key==='review',roles:[{role:saved.role}],permissions:definition.permissions})})
 if(definition.env) {
  const users=await request<{data:{id:string}[]}>(`/users?filter[id][_eq]=${saved.user}&fields=id`)
  if(!users.data.length) await request('/users',{method:'POST',body:JSON.stringify({id:saved.user,first_name:definition.name,role:saved.role,status:'active',token:saved.token,provider:'default'})})
  const line=`${definition.env}=${saved.token}`
  env=new RegExp(`^${definition.env}=.*$`,'m').test(env)?env.replace(new RegExp(`^${definition.env}=.*$`,'m'),line):`${env.trimEnd()}\n${line}\n`
 }
 console.log(`${definition.name}: configured`)
}
await writeFile('.env',env,{mode:0o600});await chmod('.env',0o600)
console.log('Scoped service credentials saved privately. No public policy or existing user roles changed.')
