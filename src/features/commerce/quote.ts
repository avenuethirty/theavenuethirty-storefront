import {z} from 'zod'
const money=z.number().int().nonnegative().safe()
const schema=z.object({quoteId:z.string().regex(/^[a-f0-9]{64}$/),subtotalMinor:money,shippingMinor:money,totalMinor:money,depositMinor:money,manualReview:z.boolean(),shippingQuoteRequired:z.boolean(),holdMinutes:z.number().int().min(1).max(1440)}).refine(q=>q.subtotalMinor+q.shippingMinor===q.totalMinor&&q.depositMinor<=q.totalMinor,'Invalid quote totals')
export type CommerceQuote=z.infer<typeof schema>
export function parseQuote(value:unknown){return schema.parse(value)}
