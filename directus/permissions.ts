import { collections } from './schema'
export interface Permission {collection:string;action:'read'|'create'|'update';fields:string[];permissions:Record<string,unknown>;validation?:Record<string,unknown>;presets?:Record<string,unknown>}
const published={status:{_eq:'published'}}
const product={product_id:published}
const filters:Record<string,Record<string,unknown>>={products:published,departments:published,categories:published,brands:published,product_types:published,collections:published,pages:published,page_sections:{status:{_eq:'published'},page_id:published},navigation_menus:published,navigation_items:{menu_id:published},product_variants:product,product_departments:product,product_media:product,product_options:product,option_values:{option_id:product},variant_option_values:{variant_id:product},product_attribute_values:product,collection_products:{collection_id:published,product_id:published}}
export const publicPermissions:Permission[]=[]
export const cataloguePermissions:Permission[]=collections.filter(c=>!['supplier_applications','submission_limits'].includes(c.collection)).map(c=>({collection:c.collection,action:'read',fields:c.fields.map(f=>f.field),permissions:filters[c.collection] ?? {}}))
const applicationFields=['id','reference','idempotency_key','fingerprint','business_name','contact_name','email','phone','categories','website','message','consent']
export const supplierPermissions:Permission[]=[
 {collection:'supplier_applications',action:'read',fields:applicationFields,permissions:{}},
 {collection:'supplier_applications',action:'create',fields:[...applicationFields,'status'],permissions:{},validation:{status:{_eq:'received'},consent:{_eq:true}},presets:{status:'received'}},
 {collection:'submission_limits',action:'create',fields:['key','request_key'],permissions:{}},
 {collection:'submission_limits',action:'read',fields:['key','request_key'],permissions:{}},
]
// Assign staff review permissions only to a trusted staff role in Directus.
export const supplierReviewPermissions:Permission[]=[
 {collection:'supplier_applications',action:'read',fields:collections.find(c=>c.collection==='supplier_applications')!.fields.map(f=>f.field),permissions:{}},
 {collection:'supplier_applications',action:'update',fields:['status','staff_notes','assigned_to'],permissions:{},validation:{status:{_in:['received','under_review','further_information','accepted','declined']}}},
]
