import 'dotenv/config'
import {createServer} from 'node:http'
import {Readable} from 'node:stream'
import {readFile} from 'node:fs/promises'
import pg from 'pg'
import {z} from 'zod'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {processNotificationBatch} from '../src/server/notification-worker'
import {deliverNotification} from '../src/server/notification-delivery'
import {handleEmailWebhook} from '../src/server/email-webhook'
if(process.env.NODE_ENV==='production'||process.env.EMAIL_SERVICE_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw new Error('This service is restricted to the approved development database')
const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_NOTIFY_DATABASE_URL,ca,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
const recipient=process.env.NOTIFICATIONS_TEST_RECIPIENT?z.email().parse(process.env.NOTIFICATIONS_TEST_RECIPIENT):undefined
const port=z.coerce.number().int().min(1).max(65535).parse(process.env.PORT||3100)
let running=false,stopping=false,lastHealthy=Date.now()
async function tick(){if(running||stopping||process.env.NOTIFICATIONS_ENABLED!=='true')return;running=true;try{await processNotificationBatch(pool,process.env.RESEND_API_KEY,(job,key)=>deliverNotification(job,key,fetch,recipient));lastHealthy=Date.now()}catch{console.error('Email worker failed; private details withheld.')}finally{running=false}}
const server=createServer(async(req,res)=>{
 try{
 if(req.url==='/healthz'&&req.method==='GET'){const healthy=process.env.NOTIFICATIONS_ENABLED!=='true'||Date.now()-lastHealthy<300000;res.writeHead(healthy?200:503,{'Cache-Control':'no-store'});res.end(healthy?'ok':'unavailable');return}
 if(req.url!=='/webhooks/resend'||req.method!=='POST'){res.writeHead(404);res.end();return}
 const request=new Request('http://localhost/webhooks/resend',{method:'POST',headers:new Headers(Object.entries(req.headers).flatMap(([key,value])=>value===undefined?[]:[[key,Array.isArray(value)?value.join(','):value]])),body:Readable.toWeb(req) as ReadableStream,duplex:'half'} as RequestInit)
 const result=await handleEmailWebhook(request,process.env.RESEND_WEBHOOK_SECRET,async(id,provider,status,created)=>{await pool.query('select avenue_private.record_email_delivery($1,$2,$3,$4)',[id,provider,status,created])})
 res.writeHead(result.status,{'Cache-Control':'no-store'});res.end()
 }catch{res.writeHead(503);res.end()}
})
server.requestTimeout=30000;server.headersTimeout=15000;server.maxConnections=100
server.listen(port,'0.0.0.0',()=>console.log('Development email service started. No private configuration printed.'))
const timer=setInterval(()=>{void tick()},60000);void tick()
async function stop(){stopping=true;clearInterval(timer);server.close();while(running)await new Promise(resolve=>setTimeout(resolve,100));await pool.end();process.exit(0)}
process.on('SIGTERM',()=>{void stop()});process.on('SIGINT',()=>{void stop()})
