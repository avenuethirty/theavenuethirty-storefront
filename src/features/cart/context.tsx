import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { addCartLine, readCart, setCartQuantity, type Cart } from './model'
const key = 'avenue-cart-v1'
const Context = createContext<{ lines: Cart; add: (sku: string, quantity?: number) => void; setQuantity: (sku: string, quantity: number) => void } | null>(null)
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Cart>([]), [ready, setReady] = useState(false)
  useEffect(() => { try { setLines(readCart(localStorage.getItem(key))) } catch {} setReady(true) }, [])
  useEffect(() => { if (ready) { try { localStorage.setItem(key, JSON.stringify({ version: 1, lines })) } catch {} } }, [lines, ready])
  return <Context.Provider value={{ lines, add: (sku, quantity = 1) => setLines(old => addCartLine(old, sku, quantity)), setQuantity: (sku, quantity) => setLines(old => setCartQuantity(old, sku, quantity)) }}>{children}</Context.Provider>
}
export function useCart() { const context = useContext(Context); if (!context) throw new Error('Cart provider missing'); return context }
