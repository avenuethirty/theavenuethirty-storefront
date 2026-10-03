import 'dotenv/config'
import pg from 'pg'
import {readFile} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
let pool:pg.Pool|undefined
try {
 const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined
 pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,ca,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
 const client=await pool.connect()
 const encrypted=(client as unknown as {connection:{stream:{encrypted?:boolean}}}).connection.stream.encrypted
 client.release()
 if(encrypted!==true)throw new Error('TLS_REQUIRED')
 const result=await pool.query("select to_regclass('public.products') is not null as has_catalogue, (select count(*)::int from public.products) as product_count")
 if(!result.rows[0].has_catalogue)throw new Error('WRONG_DATABASE')
 console.log(`Postgres connection verified. Existing catalogue found: ${result.rows[0].product_count} products.`)
} catch(error) {const e=error as {code?:string;message?:string};console.error(`Postgres connection failed: ${e.code || (e.message==='TLS_REQUIRED'?'TLS_REQUIRED':e.message?.includes('certificate')?'TLS_CERTIFICATE_ERROR':'CONNECTION_ERROR')}. Credentials were not printed.`);process.exitCode=1} finally {await pool?.end()}
