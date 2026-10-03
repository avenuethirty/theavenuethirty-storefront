import { z } from 'zod'
export const supplierInput = z.object({
  businessName: z.string().trim().min(2).max(150), contactName: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase().max(254), phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  categories: z.array(z.string().trim().min(1).max(80)).min(1).max(10),
  website: z.union([z.literal(''), z.url().refine(value => { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password })]).default(''),
  message: z.string().trim().min(10).max(3000), consent: z.literal(true),
})
export type SupplierApplicationInput = z.infer<typeof supplierInput>
export function applicationFingerprint(input: SupplierApplicationInput): string {
  return JSON.stringify([input.businessName, input.contactName, input.email, input.phone, [...input.categories].sort(), input.website, input.message, input.consent])
}
