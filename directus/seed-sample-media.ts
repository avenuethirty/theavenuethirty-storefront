import 'dotenv/config'
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true') throw new Error('Development target required')
if(!process.env.IMAGEKIT_PRIVATE_KEY) throw new Error('ImageKit credential missing')
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}))
const manifest=JSON.parse(await readFile('.local/sample-brand-manifest.json','utf8'))
const artwork={shirt:'<path d="M310 220L405 175L455 215L505 175L600 220L690 345L610 405L570 350L570 780L340 780L340 350L300 405L220 345Z" fill="#fdfcf8" stroke="#273449" stroke-width="5"/><path d="M405 175L455 215L430 270L395 230M505 175L455 215L480 270L515 230M455 215V780" fill="none" stroke="#273449" stroke-width="4"/><g fill="#273449"><circle cx="455" cy="320" r="4"/><circle cx="455" cy="420" r="4"/><circle cx="455" cy="520" r="4"/><circle cx="455" cy="620" r="4"/></g>',cap:'<path d="M270 540Q285 310 475 310Q630 310 645 555L270 540Z" fill="#25364c"/><path d="M270 540Q455 590 645 555Q785 620 750 660Q510 760 265 605Z" fill="#344964"/><path d="M475 310Q410 410 420 565M475 310Q560 400 565 566" fill="none" stroke="#d9d1c3" stroke-width="3"/>'}
let assets:Record<string,{fileId:string;filePath:string}>={}
try {assets=JSON.parse(await readFile('.local/sample-imagekit-assets.json','utf8'))} catch(error) {if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error}
for(const kind of ['shirt','cap'] as const) {
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100"><rect width="900" height="1100" fill="#eeeae2"/><text x="450" y="85" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#4d4d4d" letter-spacing="3">SAMPLE ILLUSTRATION</text>${artwork[kind]}<text x="450" y="990" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#4d4d4d">Development catalogue only</text></svg>`
 if(!assets[kind]) {
  const form=new FormData();form.set('file',new Blob([svg],{type:'image/svg+xml'}),`sample-${kind}.svg`);form.set('fileName',`sample-${kind}.svg`);form.set('folder','/development/avenue-sample-prl');form.set('useUniqueFileName','false');form.set('overwriteFile','false');form.set('tags','development,sample')
  const response=await fetch('https://upload.imagekit.io/api/v1/files/upload',{method:'POST',headers:{Authorization:`Basic ${Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY+':').toString('base64')}`},body:form,redirect:'error',signal:AbortSignal.timeout(30000)})
  if(!response.ok)throw new Error(`Sample media upload failed (${response.status})`)
  const result=await response.json() as {fileId:string;filePath:string}
  if(!result.fileId||!result.filePath)throw new Error('Incomplete media upload result')
  assets[kind]={fileId:result.fileId,filePath:result.filePath};await writeFile('.local/sample-imagekit-assets.json',JSON.stringify(assets),{mode:0o600})
 }
 const mediaHash=createHash('sha256').update(`sample-prl-media:${kind}`).digest('hex'),uuid=`${mediaHash.slice(0,8)}-${mediaHash.slice(8,12)}-4${mediaHash.slice(13,16)}-a${mediaHash.slice(17,20)}-${mediaHash.slice(20,32)}`
 const query=new URLSearchParams({filter:JSON.stringify({id:{_eq:uuid}}),fields:'id',limit:'1'})
 const current=await request<{data:{id:string}[]}>(`/items/media_assets?${query}`)
 if(!current.data.length)await request('/items/media_assets',{method:'POST',body:JSON.stringify({id:uuid,name:`Sample ${kind} illustration`,imagekit_id:assets[kind].fileId,path:assets[kind].filePath,alt:`Original illustration of a sample cotton ${kind}. Development placeholder, not manufacturer photography.`,width:900,height:1100})})
 const product=manifest.records.find((r:{label:string})=>r.label===kind).id
 const links=new URLSearchParams({filter:JSON.stringify({product_id:{_eq:product},media_id:{_eq:uuid}}),fields:'id',limit:'1'})
 const existing=await request<{data:{id:string}[]}>(`/items/product_media?${links}`)
 if(!existing.data.length)await request('/items/product_media',{method:'POST',body:JSON.stringify({product_id:product,media_id:uuid,sort:0})})
 console.log(`Sample ${kind} illustration uploaded and linked.`)
}
