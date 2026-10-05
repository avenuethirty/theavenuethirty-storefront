import 'dotenv/config'
import pg from 'pg'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
import {placeOrder,quoteOrder,readReceipt} from '../src/server/commerce-service'
if(process.env.NODE_ENV==='production'||process.env.DIRECTUS_DEVELOPMENT_TARGET_CONFIRMED!=='true')throw Error('Development target required')
const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,ca,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
const client=await pool.connect(),transaction={query:client.query.bind(client)} as unknown as pg.Pool
const sku='SAMPLE-PRL-CAP-DEFAULT',lines=[{sku,quantity:1}],input={name:'Policy verification',phone:'+923000000069',address:{line1:'Development verification only',city:'Sialkot',postalCode:'',country:'PK' as const},lines}
async function reset(){await client.query('ROLLBACK');await client.query('BEGIN');await client.query("update public.store_commerce_settings set standard_shipping_fee=25000,free_shipping_threshold=500000,enable_free_shipping=true,deposits_enabled=false,deposit_type='fixed_amount',deposit_value=25000,deposit_percentage_basis_points=2000,deposit_calculation_base='merchandise_subtotal',min_order_amount_for_deposit=1000000,regional_deposit_trigger=true where id=1");await client.query("update public.products set shipping_quote_required=false,advance_payment_review_required=false where slug='sample-cotton-cap'")}
try{
 const actor=(await client.query("select u.id from public.directus_users u join public.directus_access a on a.\"user\"=u.id or a.role=u.role join public.directus_policies p on p.id=a.policy where u.status='active' and p.admin_access limit 1")).rows[0].id
 await reset()
 for(const [price,wantedShipping]of [[499999,25000],[500000,0],[500001,0]]){await client.query('update public.product_variants set price_minor=$1 where sku=$2',[price,sku]);const quote=await quoteOrder(transaction,lines,'Sialkot');assert.equal(quote.shippingMinor,wantedShipping);assert.equal(quote.totalMinor,price+wantedShipping)}
 await client.query('update public.store_commerce_settings set enable_free_shipping=false where id=1');assert.equal((await quoteOrder(transaction,lines,'Sialkot')).shippingMinor,25000)
 console.log('Verified shipping threshold boundaries and promotion switch.')
 await reset();await client.query('update public.store_commerce_settings set deposits_enabled=true where id=1')
 await client.query('update public.product_variants set price_minor=1000000 where sku=$1',[sku]);assert.equal((await quoteOrder(transaction,lines,'Sialkot')).depositMinor,0)
 await client.query('update public.product_variants set price_minor=1000001 where sku=$1',[sku]);assert.equal((await quoteOrder(transaction,lines,'Sialkot')).depositMinor,25000)
 await client.query("update public.store_commerce_settings set deposit_type='percentage' where id=1");assert.equal((await quoteOrder(transaction,lines,'Sialkot')).depositMinor,200001)
 await client.query('update public.product_variants set price_minor=450000 where sku=$1',[sku]);assert.equal((await quoteOrder(transaction,lines,'  SIALKOT  ')).depositMinor,0);assert.equal((await quoteOrder(transaction,lines,'Remote test city')).depositMinor,90000)
 await client.query("update public.store_commerce_settings set deposit_type='shipping_cost_only' where id=1");assert.equal((await quoteOrder(transaction,lines,'Remote test city')).depositMinor,25000)
 console.log('Verified deposit threshold, percentage rounding, regional triggers and shipping-only advance.')
 await reset();const key=randomUUID(),quote=await quoteOrder(transaction,lines,'Sialkot'),order=await placeOrder(transaction,'test-secret',{...input,quoteId:quote.quoteId},key)
 const id=(await client.query('select id from public.orders where idempotency_key=$1',[key])).rows[0].id
 const receipt=await readReceipt(transaction,order.receipt);assert.equal(receipt!.shippingMinor,25000);assert.equal(receipt!.totalMinor,475000)
 await client.query('update public.store_commerce_settings set standard_shipping_fee=30000 where id=1');assert.equal((await readReceipt(transaction,order.receipt))!.shippingMinor,25000)
 await client.query('SAVEPOINT immutable');await assert.rejects(()=>client.query('update public.orders set policy_snapshot=NULL where id=$1',[id]),/ORDER_POLICY_IMMUTABLE/);await client.query('ROLLBACK TO SAVEPOINT immutable')
 assert.equal((await placeOrder(transaction,'test-secret',{...input,quoteId:quote.quoteId},key)).orderNumber,order.orderNumber)
 const before=(await client.query('select reserved from public.inventory_balances b join public.product_variants v on v.id=b.variant_id where v.sku=$1',[sku])).rows[0].reserved
 await client.query('update public.inventory_reservations set expires_at=now()-interval \'1 minute\' where order_id=$1',[id]);assert.equal((await client.query('select avenue_private.expire_order_reservations(1) n')).rows[0].n,1);assert.equal((await client.query('select avenue_private.expire_order_reservations(1) n')).rows[0].n,0)
 assert.equal((await client.query('select reserved from public.inventory_balances b join public.product_variants v on v.id=b.variant_id where v.sku=$1',[sku])).rows[0].reserved,before-1)
 assert.equal((await readReceipt(transaction,order.receipt))!.status,'cancelled')
 console.log('Verified immutable shipping snapshot, idempotent retry and exactly-once expiry release.')
 await reset();const fresh=await quoteOrder(transaction,lines,'Sialkot');await client.query('update public.store_commerce_settings set standard_shipping_fee=30000 where id=1');await client.query('SAVEPOINT stale')
 await assert.rejects(()=>placeOrder(transaction,'test-secret',{...input,quoteId:fresh.quoteId},randomUUID()),/QUOTE_CHANGED/);await client.query('ROLLBACK TO SAVEPOINT stale')
 await client.query("update public.products set shipping_quote_required=true where slug='sample-cotton-cap'");assert.equal((await quoteOrder(transaction,lines,'Sialkot')).shippingQuoteRequired,true);await client.query('SAVEPOINT bulky');await assert.rejects(()=>placeOrder(transaction,'test-secret',input,randomUUID()),/SHIPPING_QUOTE_REQUIRED/);await client.query('ROLLBACK TO SAVEPOINT bulky')
 console.log('Verified stale-quote rejection and bulky-item checkout blocking.')
 await reset();const confirmedKey=randomUUID();await placeOrder(transaction,'test-secret',input,confirmedKey);const confirmed=(await client.query('select id from public.orders where idempotency_key=$1',[confirmedKey])).rows[0].id
 await client.query('select avenue_private.confirm_cod_order($1,$2)',[confirmed,actor]);await client.query('select avenue_private.confirm_cod_order($1,$2)',[confirmed,actor]);assert.equal((await client.query('select avenue_private.expire_order_reservations(1) n')).rows[0].n,0);assert.equal((await client.query('select expires_at from public.inventory_reservations where order_id=$1',[confirmed])).rows[0].expires_at,null)
 await reset();await client.query("update public.products set advance_payment_review_required=true where slug='sample-cotton-cap'");const reviewKey=randomUUID();await placeOrder(transaction,'test-secret',input,reviewKey);const reviewId=(await client.query('select id from public.orders where idempotency_key=$1',[reviewKey])).rows[0].id;await client.query('SAVEPOINT review');await assert.rejects(()=>client.query('select avenue_private.confirm_cod_order($1,$2)',[reviewId,actor]),/ADVANCE_PAYMENT_REQUIRED/);await client.query('ROLLBACK TO SAVEPOINT review')
 console.log('Verified staff confirmation protection and advance-review blocking. All verification data rolled back.')
}catch(error){console.error(`Policy verification incomplete: ${(error as Error).message.startsWith('Expected')?'assertion failed':(error as {code?:string}).code||'CHECK_FAILED'}. Private details withheld.`);process.exitCode=1}finally{await client.query('ROLLBACK');client.release();await pool.end()}
