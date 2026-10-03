import 'dotenv/config'
import {randomUUID} from 'node:crypto'
import {readFile,writeFile} from 'node:fs/promises'
let state:{key:string}
try{state=JSON.parse(await readFile('.local/sample-staff-key.json','utf8'))}catch{state={key:randomUUID()};await writeFile('.local/sample-staff-key.json',JSON.stringify(state),{mode:0o600})}
await writeFile('.local/sample-staff-input.json',JSON.stringify({channel:'staff_whatsapp',input:{name:'Sample staff buyer',phone:'+923000000077',address:{line1:'Development staff test address',city:'Lahore',postalCode:'',country:'PK'},lines:[{sku:'SAMPLE-PRL-SHIRT-NAVY-M',quantity:1}]}}),{mode:0o600})
process.env.DIRECTUS_STAFF_TOKEN=process.env.DIRECTUS_STATIC_TOKEN
process.argv=[process.argv[0],process.argv[1],'place','.local/sample-staff-input.json',state.key]
await import('./staff-order')
