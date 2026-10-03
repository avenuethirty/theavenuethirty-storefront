import { z } from 'zod'
const quantity = z.number().int().min(1).max(99)
const lineSchema = z.object({ sku: z.string().trim().min(1).max(100), quantity })
export type Cart = z.infer<typeof lineSchema>[]
export function addCartLine(cart: Cart, sku: string, count: number): Cart {
  const line = lineSchema.parse({ sku, quantity: count })
  const existing = cart.find(item => item.sku === line.sku)
  if (!existing) return [...cart, line]
  const total = quantity.parse(existing.quantity + count)
  return cart.map(item => item.sku === line.sku ? { ...item, quantity: total } : item)
}
export function setCartQuantity(cart: Cart, sku: string, count: number): Cart {
  if (count === 0) return cart.filter(item => item.sku !== sku)
  quantity.parse(count)
  return cart.map(item => item.sku === sku ? { ...item, quantity: count } : item)
}
export function readCart(raw: string | null): Cart {
  try {
    const data = z.object({ version: z.literal(1), lines: z.array(lineSchema).max(100) }).parse(JSON.parse(raw ?? 'null'))
    return data.lines.reduce((cart, line) => addCartLine(cart, line.sku, line.quantity), [] as Cart)
  } catch { return [] }
}
