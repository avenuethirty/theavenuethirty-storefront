import { expect, it } from 'vitest'
import { supplierInput, applicationFingerprint } from '../../src/features/suppliers/schema'
const input = { businessName: 'Example Brand', contactName: 'Sample Person', email: 'hello@example.com', phone: '+923001234567', categories: ['Fashion'], website: 'https://example.com', message: 'We would like to supply our catalogue.', consent: true }
it('rejects missing consent, invalid phone and executable catalogue URLs', () => {
  for (const patch of [{ consent: false }, { phone: '123' }, { website: 'javascript:alert(1)' }, { email: 'bad' }]) expect(supplierInput.safeParse({ ...input, ...patch }).success).toBe(false)
})
it('normalises submissions consistently for idempotency comparisons', () => {
  expect(applicationFingerprint(supplierInput.parse(input))).toBe(applicationFingerprint(supplierInput.parse({ ...input, email: 'HELLO@EXAMPLE.COM', businessName: ' Example Brand ' })))
  expect(applicationFingerprint(supplierInput.parse(input))).not.toBe(applicationFingerprint(supplierInput.parse({ ...input, message: 'A different application message.' })))
})
