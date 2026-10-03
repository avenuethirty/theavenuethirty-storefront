import type { ApplicationStore, SavedApplication } from './service'
type Request = <T>(path:string, init?:RequestInit)=>Promise<T>
export function createApplicationStore(request:Request, now=()=>new Date()):ApplicationStore {
  return {
    async find(key) {
      const query=new URLSearchParams({filter:JSON.stringify({idempotency_key:{_eq:key}}),limit:'1',fields:'reference,idempotency_key,fingerprint,business_name,contact_name,email,phone,categories,website,message,consent'})
      const {data}=await request<{data:Record<string,unknown>[]}>(`/items/supplier_applications?${query}`)
      const row=data[0]; if(!row) return null
      return {key:String(row.idempotency_key),fingerprint:String(row.fingerprint),reference:String(row.reference),input:{businessName:String(row.business_name),contactName:String(row.contact_name),email:String(row.email),phone:String(row.phone),categories:JSON.parse(String(row.categories)),website:String(row.website ?? ''),message:String(row.message),consent:true}}
    },
    async reserve(identity, requestKey) {
      const key=`supplier:${now().toISOString().slice(0,10)}:${identity}`
      try {await request('/items/submission_limits',{method:'POST',body:JSON.stringify({key,request_key:requestKey})});return true} catch {
        try {const query=new URLSearchParams({filter:JSON.stringify({key:{_eq:key}}),fields:'request_key',limit:'1'}); const {data}=await request<{data:{request_key:string}[]}>(`/items/submission_limits?${query}`);return data[0]?.request_key===requestKey} catch {return false}
      }
    },
    async create(value:SavedApplication) {
      const i=value.input
      await request('/items/supplier_applications',{method:'POST',body:JSON.stringify({reference:value.reference,idempotency_key:value.key,fingerprint:value.fingerprint,business_name:i.businessName,contact_name:i.contactName,email:i.email,phone:i.phone,categories:JSON.stringify(i.categories),website:i.website,message:i.message,consent:i.consent,status:'received'})})
      return value
    },
  }
}
