import {z} from 'zod'
import type {Variant} from './types'
type Row=Record<string,unknown>
export function decodeVariants(options:Row[],values:Row[],assignments:Row[],rows:Row[]):Variant[] {
 const names=options.map(o=>z.string().min(1).parse(o.name))
 if(new Set(names).size!==names.length) throw new Error('Duplicate product option')
 const combinations=new Set<string>(), skus=new Set<string>()
 return [...rows].sort((a,b)=>Number(a.sort)-Number(b.sort)).map(row=>{
  const selection:Record<string,string>=Object.create(null)
  for(const assignment of assignments.filter(a=>a.variant_id===row.id)) {
   const value=values.find(v=>v.id===assignment.option_value_id),option=value && options.find(o=>o.id===value.option_id)
   if(!value || !option) throw new Error('Invalid variant option assignment')
   const name=z.string().parse(option.name)
   if(Object.hasOwn(selection,name)) throw new Error('Duplicate variant option')
   selection[name]=z.string().parse(value.value)
  }
  if(Object.keys(selection).length!==options.length) throw new Error('Incomplete variant options')
  const canonical=JSON.stringify(Object.entries(selection).sort(([a],[b])=>a.localeCompare(b)))
  if(combinations.has(canonical)) throw new Error('Duplicate variant combination')
  combinations.add(canonical)
  const sku=z.string().min(1).parse(row.sku)
  if(skus.has(sku)) throw new Error('Duplicate SKU')
  skus.add(sku)
  const priceMinor=z.number().int().nonnegative().parse(row.price_minor)
  return {sku,options:{...selection},priceMinor,compareAtMinor:typeof row.compare_at_minor==='number'&&row.compare_at_minor>priceMinor?z.number().int().parse(row.compare_at_minor):undefined,currency:z.literal('PKR').parse(row.currency),available:z.boolean().parse(row.available)}
 })
}
