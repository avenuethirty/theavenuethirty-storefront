import {expect,it} from 'vitest'
import {canonicalOrder,orderInput} from '../../src/features/commerce/model'
const input={name:'Sample Buyer',phone:'+923001234567',address:{line1:'Test address',city:'Lahore',postalCode:'',country:'PK'},lines:[{sku:'B',quantity:1},{sku:'A',quantity:2}]}
it('rejects client prices, invalid quantities and duplicate SKUs',()=>{expect(orderInput.safeParse({...input,totalMinor:1}).success).toBe(false);expect(orderInput.safeParse({...input,lines:[{sku:'A',quantity:0}]}).success).toBe(false);expect(orderInput.safeParse({...input,lines:[{sku:'A',quantity:1},{sku:'A',quantity:2}]}).success).toBe(false)})
it('uses stable line ordering for request fingerprints',()=>{const parsed=orderInput.parse(input);expect(canonicalOrder(parsed)).toBe(canonicalOrder({...parsed,lines:[...parsed.lines].reverse()}))})
it('preserves older retry fingerprints when optional email is empty and rejects invalid email',()=>{const parsed=orderInput.parse(input);expect(canonicalOrder({...parsed,address:{...parsed.address,email:''}})).toBe(canonicalOrder(parsed));expect(orderInput.safeParse({...input,address:{...input.address,email:'not-an-email'}}).success).toBe(false)})
