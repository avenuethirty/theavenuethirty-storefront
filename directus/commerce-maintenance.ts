import 'dotenv/config'
import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import pg from 'pg'
import {z} from 'zod'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {assertMaintenanceAccess} from '../src/server/maintenance-access'
if(process.env.NODE_ENV==='production'||process.env.COMMERCE_MAINTENANCE_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw Error('Development maintenance target required')
const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined
const pool=new pg.Pool({...commerceConnectionConfig(process.env.COMMERCE_MAINTENANCE_DATABASE_URL,ca),connectionTimeoutMillis:5000,statement_timeout:5000})
await assertMaintenanceAccess(pool)
const enabled=process.env.COMMERCE_MAINTENANCE_ENABLED==='true',port=z.coerce.number().int().min(1).max(65535).parse(process.env.PORT||3300)
let busy=false,stopping=false,lastHealthy=Date.now()
async function tick(){if(!enabled||busy||stopping)return;busy=true;try{for(let i=0;i<50&&!stopping;i++){const result=await pool.query('select avenue_private.expire_order_reservations(1) n');if(!result.rows[0].n)break}lastHealthy=Date.now()}catch{console.error('Reservation maintenance failed; private details withheld.')}finally{busy=false}}
const server=createServer((req,res)=>{if(req.method!=='GET'||req.url!=='/healthz'){res.writeHead(404);res.end();return}const healthy=!enabled||Date.now()-lastHealthy<300000;res.writeHead(healthy?200:503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({status:healthy?'ok':'unavailable',maintenanceEnabled:enabled,verifiedDatabaseTls:true,developmentOnly:true}))})
server.headersTimeout=10000;server.requestTimeout=15000
server.listen(port,'0.0.0.0',()=>console.log('Development reservation maintenance started.'))
const timer=setInterval(()=>{void tick()},60000);void tick()
async function stop(){stopping=true;clearInterval(timer);server.close();while(busy)await new Promise(resolve=>setTimeout(resolve,100));await pool.end();process.exit(0)}
process.on('SIGTERM',()=>{void stop()});process.on('SIGINT',()=>{void stop()})
