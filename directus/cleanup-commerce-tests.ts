import 'dotenv/config'
import pg from 'pg'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
try{await pool.query('BEGIN');await pool.query("create temporary table disposable_orders on commit drop as select distinct o.id,o.address_id from public.orders o join public.order_lines l on l.order_id=o.id join public.product_variants v on v.id=l.variant_id where v.name='Concurrency test' and v.sku like 'TEST-%'")
 for(const [table,field] of [['order_events','order_id'],['reservation_allocations','line_id'],['inventory_reservations','order_id'],['order_lines','order_id']] as const){const target=table==='reservation_allocations'?'select id from public.order_lines where order_id in(select id from disposable_orders)':'select id from disposable_orders';await pool.query(`delete from public.${table} where ${field} in(${target})`)}
 await pool.query('delete from public.orders where id in(select id from disposable_orders)');await pool.query('delete from public.customer_addresses where id in(select address_id from disposable_orders)')
 await pool.query("delete from public.inventory_balances where variant_id in(select id from public.product_variants where name='Concurrency test' and sku like 'TEST-%')")
 await pool.query("delete from public.product_variants where name='Concurrency test' and sku like 'TEST-%'")
 for(const table of ['product_options','product_departments'])await pool.query(`delete from public.${table} where product_id in(select id from public.products where name='Temporary test product' and description='Temporary test only')`)
 await pool.query("delete from public.products where name='Temporary test product' and description='Temporary test only'")
 await pool.query("delete from public.locations where name='Temporary test location' and not exists(select 1 from public.inventory_balances b where b.location_id=locations.id)")
 await pool.query('COMMIT');console.log('Interrupted integration fixtures removed; sample catalogue and sample order preserved')
}catch(error){await pool.query('ROLLBACK');console.error(`Test cleanup failed (${(error as {code?:string}).code||'CONFIGURATION'})`);process.exitCode=1}finally{await pool.end()}
