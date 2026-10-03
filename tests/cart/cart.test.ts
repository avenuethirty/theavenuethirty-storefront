import { describe, expect, it } from 'vitest'
import { addCartLine, readCart, setCartQuantity } from '../../src/features/cart/model'
describe('variant-keyed cart', () => {
  it('merges matching SKUs and keeps different variants separate', () => {
    let cart = addCartLine([], 'RED-S', 1)
    cart = addCartLine(cart, 'RED-S', 2)
    cart = addCartLine(cart, 'BLUE-L', 1)
    expect(cart).toEqual([{ sku: 'RED-S', quantity: 3 }, { sku: 'BLUE-L', quantity: 1 }])
  })
  it('rejects invalid quantities instead of creating corrupt cart lines', () => {
    for (const quantity of [-1, 0, 1.2, Infinity, 100]) expect(() => addCartLine([], 'SKU', quantity)).toThrow()
    expect(setCartQuantity([{ sku: 'SKU', quantity: 1 }], 'SKU', 0)).toEqual([])
  })
  it('discards corrupt and incompatible persisted data', () => {
    for (const raw of ['bad json', '{"version":0,"lines":[]}', '{"version":1,"lines":[{"sku":"SKU","quantity":-2}]}']) expect(readCart(raw)).toEqual([])
    expect(readCart('{"version":1,"lines":[{"sku":"SKU","quantity":2,"price":1}]}')).toEqual([{ sku: 'SKU', quantity: 2 }])
  })
})
