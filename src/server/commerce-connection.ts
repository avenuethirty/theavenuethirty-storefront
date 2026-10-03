import type {PoolConfig} from 'pg'
export function commerceConnectionConfig(raw:string|undefined,ca?:string,allowUnverified=false):PoolConfig {
 try {
  const url=new URL(raw || '')
  if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||!url.username||!url.password)throw new Error()
  if(allowUnverified && process.env.NODE_ENV==='production') throw new Error()
  for(const key of ['sslmode','sslcert','sslkey','sslrootcert','ssl'])url.searchParams.delete(key)
  return {connectionString:url.toString(),ssl:{rejectUnauthorized:!allowUnverified,...(ca?{ca}:{})},connectionTimeoutMillis:10000,idleTimeoutMillis:30000,max:5,statement_timeout:15000}
 } catch {throw new Error('Invalid database configuration')}
}
