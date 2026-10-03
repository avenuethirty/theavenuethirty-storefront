import {expect,it} from 'vitest'
import {commerceConnectionConfig} from '../../src/server/commerce-connection'
it('requires verified TLS and rejects unsafe URL overrides',()=>{
 const config=commerceConnectionConfig('postgresql://user:secret@db.example.com/postgres?sslmode=disable','trusted-ca')
 expect(config.ssl).toEqual({rejectUnauthorized:true,ca:'trusted-ca'})
 expect(config.connectionString).not.toContain('sslmode')
 expect(()=>commerceConnectionConfig('https://example.com','ca')).toThrow('Invalid database configuration')
})
it('permits the user-authorised local TLS exception but refuses it in production',()=>{
 const previous=process.env.NODE_ENV
 try {
  process.env.NODE_ENV='development'
  expect(commerceConnectionConfig('postgresql://user:secret@db.example.com/postgres',undefined,true).ssl).toEqual({rejectUnauthorized:false})
  process.env.NODE_ENV='production'
  expect(()=>commerceConnectionConfig('postgresql://user:secret@db.example.com/postgres',undefined,true)).toThrow('Invalid database configuration')
 } finally {process.env.NODE_ENV=previous}
})
