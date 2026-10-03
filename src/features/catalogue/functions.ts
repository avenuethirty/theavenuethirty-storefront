import {checkoutEnabled} from '../../server/commerce'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { allProducts, listDepartments, imageEndpoint, isFixturePreview } from './catalogue.server'
import { getSiteContent } from '../content/content.server'
export const getStore = createServerFn({ method: 'GET' }).handler(async () => {
  const [departments, products, content] = await Promise.all([listDepartments(), allProducts(), getSiteContent().catch(() => null)])
  return { departments, products, content, imageEndpoint: imageEndpoint(), fixturePreview: isFixturePreview(), checkoutEnabled:checkoutEnabled() }
})
export const catalogueSearch = z.object({ q: z.string().max(100).optional(), category: z.string().max(100).optional(), sort: z.enum(['featured', 'price-asc', 'price-desc']).default('featured'), page: z.coerce.number().int().min(1).default(1), filters: z.record(z.string().max(80), z.array(z.string().max(100)).max(30)).default({}) })
