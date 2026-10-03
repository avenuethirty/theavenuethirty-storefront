import 'dotenv/config'
import pg from 'pg'
import {readFile,writeFile} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}))
try{
 const orders=await pool.query("select id,order_number,channel from public.orders where order_number in ('DEV-100004','DEV-100018') order by order_number")
 for(const order of orders.rows){const {data}=await request<{data:{lines:unknown[];reservations:unknown[];events:unknown[]}}>(`/items/orders/${order.id}?fields=id,lines.id,reservations.id,events.id`);if(data.lines.length!==1||data.reservations.length!==1||data.events.length!==1)throw new Error('CMS order links failed')}
 const stock=await pool.query("select v.sku,b.on_hand,b.reserved,b.on_hand-b.reserved available from public.inventory_balances b join public.product_variants v on v.id=b.variant_id join public.locations l on l.id=b.location_id where l.code='SAMPLE-WAREHOUSE' order by v.sku")
 let guide=await readFile('docs/sample-brand-guide.md','utf8');guide=guide.split('\n## Development orders and inventory')[0]
 guide+='\n## Development orders and inventory\n\nThe sample brand journey now includes persisted test COD orders and atomic stock reservations. No payment, notification or shipment is initiated. Phone numbers are unverified. These records do not represent real supplier contracts or merchandise.\n\n'
 for(const order of orders.rows)guide+=`- [${order.order_number}: ${order.channel}](${process.env.DIRECTUS_URL}/admin/content/orders/${order.id})\n`
 guide+='\nOpen each order to inspect its lines, address, reservations and events. Orders and inventory fields are read-only in CMS. The authenticated staff command currently supports Directus administrators; a staff order entry screen is a later step.\n\n| SKU | On hand | Reserved | Available |\n| --- | ---: | ---: | ---: |\n'
 for(const row of stock.rows)guide+=`| ${row.sku} | ${row.on_hand} | ${row.reserved} | ${row.available} |\n`
 guide+='\nBalances are recorded per variant and location. Reservation reduces available stock, while on-hand remains unchanged until fulfilment. Cancellation releases the reservation once. Repeat seeding never resets stock.\n\nLocal development checkout: http://127.0.0.1:3002/checkout. Production and fixture checkout remain disabled.\n\nStaff command: `node --import tsx directus/staff-order.ts place input.json <idempotency-uuid>`. Configure a private `DIRECTUS_STAFF_TOKEN` for a Directus administrator. The input contains `channel` (`staff_phone` or `staff_whatsapp`) and `input` (name, phone, address, SKU lines). The actor is derived from the authenticated token. Cancellation: `node --import tsx directus/staff-order.ts cancel <order-uuid> confirm`.\n\nLocal TLS certificate verification is disabled only through the explicit development flag authorised by the user. Production refuses that flag and requires verified TLS.\n'
 await writeFile('docs/sample-brand-guide.md',guide)
 console.log('Both sample orders and their relations verified through CMS API. Guide updated.')
}finally{await pool.end()}
