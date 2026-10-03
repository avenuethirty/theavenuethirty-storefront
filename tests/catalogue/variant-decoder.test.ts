import {expect,it} from 'vitest'
import {decodeVariants} from '../../src/features/catalogue/variant-decoder'
const options=[{id:'colour',name:'Colour'}], values=[{id:'red',option_id:'colour',value:'Red'},{id:'blue',option_id:'colour',value:'Blue'}]
const variant=(id:string)=>({id,sku:id,price_minor:100,currency:'PKR',available:true,sort:0})
it('rejects two values assigned to one variant option rather than silently choosing one',()=>{
 expect(()=>decodeVariants(options,values,[{variant_id:'one',option_value_id:'red'},{variant_id:'one',option_value_id:'blue'}],[variant('one')])).toThrow('Duplicate variant option')
})
it('rejects two SKUs with the same complete option combination',()=>{
 expect(()=>decodeVariants(options,values,[{variant_id:'one',option_value_id:'red'},{variant_id:'two',option_value_id:'red'}],[variant('one'),variant('two')])).toThrow('Duplicate variant combination')
})
it('decodes complete relational selections and rejects cross-product assignments',()=>{
 expect(decodeVariants(options,values,[{variant_id:'one',option_value_id:'red'}],[variant('one')])[0].options).toEqual({Colour:'Red'})
 expect(()=>decodeVariants(options,values,[{variant_id:'one',option_value_id:'missing'}],[variant('one')])).toThrow()
})
