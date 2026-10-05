import 'dotenv/config'
import pg from 'pg'
import {readFile} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
if(process.env.NODE_ENV==='production'||process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw Error('Development target required')
const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,ca,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
try{const target=await pool.query("select count(*)::int n from public.products where slug in ('sample-cotton-cap','sample-cotton-oxford-shirt')");if(target.rows[0].n!==2)throw Error();await pool.query(await readFile('migrations/007-commerce-policies.sql','utf8'));console.log('Development commerce policies applied. Existing orders retain their original terms.')}catch{console.error('Policy migration incomplete; private details withheld.');process.exitCode=1}finally{await pool.end()}
