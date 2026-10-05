import {expect,it} from 'vitest'
import {parseQuote} from '../../src/features/commerce/quote'
const quote={quoteId:'a'.repeat(64),subtotalMinor:450000,shippingMinor:25000,totalMinor:475000,depositMinor:0,manualReview:false,shippingQuoteRequired:false,holdMinutes:1440}
it('accepts a server quote with a consistent shipping total',()=>{expect(parseQuote(quote)).toEqual(quote)})
it('rejects inconsistent totals and deposits larger than the total',()=>{expect(()=>parseQuote({...quote,totalMinor:450000})).toThrow();expect(()=>parseQuote({...quote,depositMinor:500000})).toThrow()})
it('rejects fractional, negative and unsafe money',()=>{for(const shippingMinor of [-1,0.5,Number.MAX_SAFE_INTEGER+1])expect(()=>parseQuote({...quote,shippingMinor})).toThrow()})
