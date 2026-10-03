import 'dotenv/config'
import {createHash} from 'node:crypto'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true') throw new Error('Development target required')
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}))
function id(key:string) {const hex=createHash('sha256').update(`avenue-sample-prl-v1:${key}`).digest('hex');return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`}
const manifest:{collection:string;id:string;label:string}[]=[]
async function create(collection:string,key:string,value:Record<string,unknown>,label=key) {
 const uuid=id(key),query=new URLSearchParams({filter:JSON.stringify({id:{_eq:uuid}}),fields:'id',limit:'1'})
 const existing=await request<{data:{id:string}[]}>(`/items/${collection}?${query}`)
 if(!existing.data.length) await request(`/items/${collection}`,{method:'POST',body:JSON.stringify({id:uuid,...value})})
 manifest.push({collection,id:uuid,label});return uuid
}
const source='https://www.ounass.ae/men/designers/polo-ralph-lauren'
const application=await create('supplier_applications','application',{reference:'SAMPLE-PRL-001',idempotency_key:id('application-key'),fingerprint:createHash('sha256').update('sample-onboarding').digest('hex'),business_name:'Polo Ralph Lauren (Sample onboarding)',contact_name:'Fictitious supplier contact',email:'sample-supplier@example.invalid',phone:'+923000000000',categories:JSON.stringify(['Shirts','Caps']),website:source,message:'Development example only. No real supplier application or commercial relationship.',consent:true,status:'received',staff_notes:'Sample journey only. Reference brand from Ounass. Catalogue and stock figures are invented.'})
const brand=await create('brands','brand',{name:'Polo Ralph Lauren (Sample)',slug:'sample-polo-ralph-lauren',status:'draft',sort:0,description:`Development reference only. No real partnership or authenticity claim. Supplier application: ${application}. Reference: ${source}`})
// Apply the sample lifecycle only on the first run, preserving later staff edits.
const {data:applicationState}=await request<{data:{status:string}}>(`/items/supplier_applications/${application}?fields=status`)
if(applicationState.status==='received') {
 await request(`/items/supplier_applications/${application}`,{method:'PATCH',body:JSON.stringify({status:'under_review',staff_notes:`Development sample reviewed. Two sample categories, Shirts and Caps. Brand record: ${brand}. No genuine supplier approved.`})})
 await request(`/items/supplier_applications/${application}`,{method:'PATCH',body:JSON.stringify({status:'accepted',staff_notes:`Sample onboarding accepted for development testing only. Brand record: ${brand}. Website ${source}. No real partnership.`})})
}
const men=await create('departments','men',{name:'Men',slug:'men',status:'published',sort:0,description:'Sample catalogue for testing brand onboarding, variants and the shopping journey.'})
const clothing=await create('categories','clothing',{name:'Clothing',slug:'clothing',status:'published',sort:0})
const shirts=await create('categories','shirts',{name:'Shirts',slug:'shirts',parent_id:clothing,status:'published',sort:0})
const accessories=await create('categories','accessories',{name:'Accessories',slug:'accessories',status:'published',sort:1})
const caps=await create('categories','caps',{name:'Caps',slug:'caps',parent_id:accessories,status:'published',sort:0})
const shirtType=await create('product_types','shirt-type',{name:'Shirt',slug:'shirt',status:'published',sort:0,description:'Colour and size options. Material and fit are descriptive specifications.'})
const capType=await create('product_types','cap-type',{name:'Cap',slug:'cap',status:'published',sort:1,description:'A simple product with one default SKU. One size is a specification.'})
const material=await create('attribute_definitions','material',{name:'Material',key:'material',data_type:'text',filterable:true})
const fit=await create('attribute_definitions','fit',{name:'Fit',key:'fit',data_type:'text',filterable:true})
const sizing=await create('attribute_definitions','sizing',{name:'Sizing',key:'sizing',data_type:'text',filterable:false})
const cotton=await create('attribute_values','cotton',{attribute_id:material,value:'Cotton (sample specification)'})
const regular=await create('attribute_values','regular',{attribute_id:fit,value:'Regular (sample specification)'})
const oneSize=await create('attribute_values','one-size',{attribute_id:sizing,value:'One size, adjustable (sample specification)'})
for(const [type,attribute,key] of [[shirtType,material,'shirt-material'],[shirtType,fit,'shirt-fit'],[capType,material,'cap-material'],[capType,sizing,'cap-sizing']]) await create('product_type_attributes',key,{product_type_id:type,attribute_id:attribute,required:true,sort:0})
const shirt=await create('products','shirt',{name:'Sample cotton Oxford shirt',slug:'sample-cotton-oxford-shirt',brand_id:brand,product_type_id:shirtType,category_id:shirts,status:'draft',sort:0,description:'Development sample inspired by the shirt category on Ounass. Colour/size combinations and PKR prices are invented for testing. This is not a real offer or stock promise.',seo_title:'Sample cotton Oxford shirt',seo_description:'Development sample product only.'})
const cap=await create('products','cap',{name:'Sample cotton cap',slug:'sample-cotton-cap',brand_id:brand,product_type_id:capType,category_id:caps,status:'draft',sort:1,description:'Development sample inspired by the cotton cap category on Ounass. Specifications and PKR price are illustrative. This is not a real offer or stock promise.',seo_title:'Sample cotton cap',seo_description:'Development sample product only.'})
for(const [product,key] of [[shirt,'shirt-department'],[cap,'cap-department']]) await create('product_departments',key,{product_id:product,department_id:men})
for(const [product,value,key] of [[shirt,cotton,'shirt-cotton'],[shirt,regular,'shirt-regular'],[cap,cotton,'cap-cotton'],[cap,oneSize,'cap-one-size']]) await create('product_attribute_values',key,{product_id:product,attribute_value_id:value})
const colour=await create('product_options','colour',{product_id:shirt,name:'Colour',sort:0})
const size=await create('product_options','size',{product_id:shirt,name:'Size',sort:1})
const optionIds:Record<string,string>={}
for(const value of ['Navy','White']) optionIds[value]=await create('option_values',value,{option_id:colour,value,sort:value==='Navy'?0:1})
for(const value of ['S','M']) optionIds[value]=await create('option_values',value,{option_id:size,value,sort:value==='S'?0:1})
for(const [c,s,stock] of [['Navy','S',5],['Navy','M',3],['White','S',1],['White','M',0]] as const) {
 const key=`shirt-${c}-${s}`,options={Colour:c,Size:s}
 const variant=await create('product_variants',key,{product_id:shirt,name:`${c} / ${s}`,sku:`SAMPLE-PRL-SHIRT-${c.toUpperCase()}-${s}`,option_key:`${shirt}:${JSON.stringify(Object.entries(options).sort())}`,price_minor:1250000,compare_at_minor:0,currency:'PKR',available:stock>0,sort:c==='Navy'?(s==='S'?0:1):(s==='S'?2:3)})
 for(const value of [c,s]) await create('variant_option_values',`${key}-${value}`,{variant_id:variant,option_value_id:optionIds[value]})
}
await create('product_variants','cap-default',{product_id:cap,name:'Default',sku:'SAMPLE-PRL-CAP-DEFAULT',option_key:`${cap}:[]`,price_minor:450000,compare_at_minor:0,currency:'PKR',available:true,sort:0})
const collection=await create('collections','collection',{name:'Sample brand edit',slug:'sample-brand-edit',status:'published',sort:0,description:'Sample Polo Ralph Lauren catalogue journey. No real merchandise.'})
for(const [product,key,sort] of [[shirt,'collection-shirt',0],[cap,'collection-cap',1]] as const) await create('collection_products',key,{collection_id:collection,product_id:product,sort})
const page=await create('pages','men-home',{name:'Men sample landing',slug:'men-home',department_id:men,status:'published',sort:0,description:'Development catalogue pattern.'})
await create('page_sections','hero',{page_id:page,kind:'hero',heading:'A sample brand journey',body:'Explore the sample catalogue. Brand reference: Polo Ralph Lauren. Prices and availability are for development testing only.',status:'published',sort:0,autoplay:false})
await create('page_sections','rail',{page_id:page,kind:'product_rail',heading:'Sample brand edit',collection_id:collection,status:'published',sort:1,autoplay:false})
const menu=await create('navigation_menus','men-menu',{name:'Men sample navigation',department_id:men,status:'published'})
await create('navigation_items','shirts-link',{menu_id:menu,label:'Shirts',path:'/men/shop?category=shirts',sort:0})
await create('navigation_items','caps-link',{menu_id:menu,label:'Caps',path:'/men/shop?category=caps',sort:1})
// Publication follows complete relation creation. Commerce availability is configured separately.
for(const [collection,uuid] of [['brands',brand],['products',shirt],['products',cap]]) {
 const {data}=await request<{data:{status:string}}>(`/items/${collection}/${uuid}?fields=status`)
 if(data.status==='draft') await request(`/items/${collection}/${uuid}`,{method:'PATCH',body:JSON.stringify({status:'published'})})
}
await mkdir('.local',{recursive:true,mode:0o700})
let prior:{inventoryPending?:boolean;developmentCheckoutReady?:boolean}={}
try{prior=JSON.parse(await readFile('.local/sample-brand-manifest.json','utf8'))}catch{}
await writeFile('.local/sample-brand-manifest.json',JSON.stringify({source,brand,application,products:[shirt,cap],records:manifest,inventoryPending:prior.inventoryPending??true,developmentCheckoutReady:prior.developmentCheckoutReady??false},null,2),{mode:0o600})
console.log(`Sample journey created or reused: ${manifest.length} records, 1 brand, 2 leaf categories, 2 products, 5 variants. Inventory is provisioned separately without resetting existing balances.`)
