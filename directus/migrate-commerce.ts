import 'dotenv/config'
import pg from 'pg'
import {readFile} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
if(process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw new Error('Development target required')
const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,ca,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
try {
 const catalogue=await pool.query("select count(*)::int as count from public.products where slug in ('sample-cotton-oxford-shirt','sample-cotton-cap')")
 if(catalogue.rows[0].count!==2)throw new Error('Unexpected database target')
 for(const path of ['migrations/001-commerce.sql','migrations/003-notification-outbox.sql','migrations/004-email-delivery.sql','migrations/002-order-commands.sql','migrations/005-email-events.sql','migrations/006-safepay-sandbox.sql','migrations/007-commerce-policies.sql']) {await pool.query(await readFile(path,'utf8'));console.log(`Applied ${path}`)}
} catch(error) {console.error(`Commerce migration failed (${(error as {code?:string}).code || 'CONFIGURATION'}). No credentials printed.`);process.exitCode=1} finally{await pool.end()}
