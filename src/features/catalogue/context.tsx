import { createContext, useContext, type ReactNode } from 'react'
import type { Department, ProductDetail } from './types'
import type { SiteContent } from '../content/pages'
export interface StoreData { content: SiteContent | null; departments: Department[]; products: ProductDetail[]; imageEndpoint: string; fixturePreview: boolean; checkoutEnabled?:boolean }
const Context = createContext<StoreData | null>(null)
export function StoreProvider({ store, children }: { store: StoreData; children: ReactNode }) { return <Context.Provider value={store}>{children}</Context.Provider> }
export function useStore() { const value = useContext(Context); if (!value) throw new Error('Store data unavailable'); return value }
