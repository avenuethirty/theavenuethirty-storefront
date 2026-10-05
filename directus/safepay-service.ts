import 'dotenv/config'
import {createServer} from 'node:http'
import {Readable} from 'node:stream'
import {readFile} from 'node:fs/promises'
import pg from 'pg'
import {z} from 'zod'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {handleSafepayWebhook} from '../src/server/safepay-webhook'
import {assertSafepayAccess} from '../src/server/safepay-access'
if(process.env.NODE_ENV==='production'||process.env.SAFEPAY_ENV!=='sandbox'||process.env.SAFEPAY_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw Error('Sandbox development target required')
const secret=process.env.SAFEPAY_WEBHOOK_SECRET,merchant=process.env.SAFEPAY_API_KEY
if(!secret?.trim()||!merchant?.trim())throw Error('Sandbox webhook configuration missing')
const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined
const pool=new pg.Pool({...commerceConnectionConfig(process.env.SAFEPAY_EVENTS_DATABASE_URL,ca),connectionTimeoutMillis:3000,statement_timeout:3000})
await assertSafepayAccess(pool)
const port=z.coerce.number().int().min(1).max(65535).parse(process.env.PORT||3200)
const server=createServer(async(req,res)=>{
 try{
  if(req.url==='/healthz'&&req.method==='GET'){await pool.query('select 1');res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({status:'ok',environment:'sandbox',webhookConfigured:true,verifiedDatabaseTls:true,orderUpdatesEnabled:false}));return}
  if(req.url!=='/webhooks/safepay'||req.method!=='POST'){res.writeHead(404);res.end();return}
  const request=new Request('http://localhost/webhooks/safepay',{method:'POST',headers:new Headers(Object.entries(req.headers).flatMap(([key,value])=>value===undefined?[]:[[key,Array.isArray(value)?value.join(','):value]])),body:Readable.toWeb(req) as ReadableStream,duplex:'half'} as RequestInit)
  const result=await handleSafepayWebhook(request,secret,merchant,async event=>{await pool.query('select avenue_private.record_safepay_sandbox_event($1::jsonb)',[JSON.stringify(event)])})
  res.writeHead(result.status,{'Cache-Control':'no-store'});res.end()
 }catch{res.writeHead(503);res.end()}
})
server.requestTimeout=9000;server.headersTimeout=8000;server.maxConnections=50
server.listen(port,'0.0.0.0',()=>console.log('Safepay sandbox event receiver started. Order updates disabled.'))
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close(()=>{void pool.end()});setTimeout(()=>process.exit(0),10000).unref()})
