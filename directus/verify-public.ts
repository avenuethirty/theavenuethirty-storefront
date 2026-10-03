import 'dotenv/config'
import {collections} from './schema'
const base=new URL(process.env.DIRECTUS_URL || '')
if(base.protocol!=='https:') throw new Error('Invalid development endpoint')
for(const collection of collections) {
 const response=await fetch(`${base.origin}/items/${collection.collection}?limit=1`,{redirect:'error',signal:AbortSignal.timeout(10000)})
 if(![401,403].includes(response.status)) throw new Error(`Public access is not denied for ${collection.collection} (${response.status})`)
}
console.log(`Verified public access denied for all ${collections.length} foundation collections.`)
