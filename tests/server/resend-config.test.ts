import {expect,it} from 'vitest'
import {directusResendSettings} from '../../src/server/resend-config'
it('configures the approved sender and certificate verification for Resend STARTTLS',()=>{const config=directusResendSettings('re_sample_key_for_unit_tests');expect(config.EMAIL_FROM).toBe('orders@mail.theavenuethirty.com');expect(config.EMAIL_SMTP_PORT).toBe('587');expect(config.EMAIL_SMTP_SECURE).toBe('false');expect(config.EMAIL_SMTP_IGNORE_TLS).toBe('false');expect(config.EMAIL_SMTP_TLS_REJECT_UNAUTHORIZED).toBe('true')})
it('rejects missing keys instead of silently configuring a broken password',()=>{expect(()=>directusResendSettings(undefined)).toThrow('private Resend API key')})
