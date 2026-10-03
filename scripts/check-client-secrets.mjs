import { readFile, readdir } from 'node:fs/promises'
import { parse } from 'dotenv'
const env=parse(await readFile('.env','utf8'))
const names=['DIRECTUS_STATIC_TOKEN','DIRECTUS_RUNTIME_TOKEN','DIRECTUS_SUPPLIER_TOKEN','IMAGEKIT_PRIVATE_KEY','COMMERCE_DATABASE_URL','COMMERCE_NOTIFY_DATABASE_URL','COMMERCE_RUNTIME_DATABASE_URL','COMMERCE_RECEIPT_SECRET','RESEND_WEBHOOK_SECRET','RESEND_API_KEY','RENDER_API_KEY','EMAIL_SMTP_PASSWORD']
async function files(directory) {return (await Promise.all((await readdir(directory,{withFileTypes:true})).map(entry=>entry.isDirectory()?files(`${directory}/${entry.name}`):[`${directory}/${entry.name}`]))).flat()}
for(const path of await files('dist/client')) {
 const contents=await readFile(path,'utf8')
 for(const name of names) if(env[name] && contents.includes(env[name])) throw new Error(`Private credential detected in client output: ${name}`)
}
console.log('Client output contains no configured private credentials.')
