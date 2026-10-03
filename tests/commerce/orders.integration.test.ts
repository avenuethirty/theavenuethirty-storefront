import 'dotenv/config'
import pg from 'pg'
import {randomUUID} from 'node:crypto'
import {chromium} from '@playwright/test'
import {afterAll,expect,it} from 'vitest'
import {commerceConnectionConfig} from '../../src/server/commerce-connection'
import {placeOrder,readReceipt} from '../../src/server/commerce-service'
const enabled=process.env.RUN_COMMERCE_INTEGRATION==='true'
const pool=enabled?new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true')):undefined
const runtime=enabled?new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_RUNTIME_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true')):undefined
it.skipIf(!enabled)('serializes the last unit, retries without double reservations, and cancels once',async()=>{
 const department=randomUUID(),product=randomUUID(),variant=randomUUID(),location=randomUUID(),sku=`TEST-${variant}`,phone='+923000000099'
 await pool!.query("insert into public.products(id,name,slug,brand_id,product_type_id,category_id,status,sort,description) select $1::uuid,'Temporary test product',$1::text,brand_id,product_type_id,category_id,'published',999,'Temporary test only' from public.products where slug='sample-cotton-cap'",[product])
 await pool!.query("insert into public.departments(id,name,slug,status,sort,description) values($1::uuid,'Temporary test department',$1::text,'published',999,'Temporary test only')",[department])
 await pool!.query('insert into public.product_departments(id,product_id,department_id)values(gen_random_uuid(),$1,$2)',[product,department])
 await pool!.query("insert into public.product_variants(id,product_id,name,sku,option_key,price_minor,compare_at_minor,currency,available,sort) select $1,$3,'Concurrency test',$2,$2,100,0,'PKR',true,999 from public.product_variants where sku='SAMPLE-PRL-CAP-DEFAULT'",[variant,sku,product])
 await pool!.query("insert into public.locations(id,name,code) values($1::uuid,'Temporary test location',$1::text)",[location])
 await pool!.query('insert into public.inventory_balances(variant_id,location_id,on_hand)values($1,$2,1)',[variant,location])
 const input={name:'Test customer',phone,address:{line1:'Test address only',city:'Lahore',postalCode:'',email:'delivered@resend.dev',country:'PK' as const},lines:[{sku,quantity:1}]},keys=[randomUUID(),randomUUID()]
 try{
 const actor=(await pool!.query("select u.id from public.directus_users u join public.directus_access a on a.\"user\"=u.id or a.role=u.role join public.directus_policies p on p.id=a.policy where u.status='active' and p.admin_access limit 1")).rows[0].id
 if(process.env.RUN_COMMERCE_BROWSER==='true'){
 const browser=await chromium.launch(),page=await browser.newPage()
 try{await page.addInitScript(sku=>{if(!localStorage.getItem('avenue-cart-v1'))localStorage.setItem('avenue-cart-v1',JSON.stringify({version:1,lines:[{sku,quantity:1}]}))},sku);await page.goto('http://127.0.0.1:3002/checkout');console.log('Recovery test: checkout loaded')
 await page.getByLabel('Full name').fill(input.name);await page.getByLabel('Phone number').fill(phone);await page.getByLabel('Street address').fill(input.address.line1);await page.getByLabel('City',{exact:true}).fill(input.address.city)
 let lost=false;await page.route('**/*',async route=>{if(!lost&&route.request().method()==='POST'){lost=true;await route.fetch();await route.abort('failed')}else await route.continue()})
 console.log('Recovery test: fields filled');await page.getByRole('button',{name:'Place test COD order'}).click();await page.getByRole('alert').waitFor({timeout:30000});console.log('Recovery test: response intentionally lost');await page.unroute('**/*')
 const attempt=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('avenue-pending-order-v2')!));keys.push(attempt.key)
 await page.evaluate(sku=>localStorage.setItem('avenue-cart-v1',JSON.stringify({version:1,lines:[{sku,quantity:1},{sku:'SAMPLE-PRL-CAP-DEFAULT',quantity:2}]})),sku)
 await page.reload();await page.getByRole('button',{name:'Retry previous attempt'}).click();await page.getByRole('heading',{name:'Test order saved'}).waitFor({timeout:30000})
 const recovered=(await pool!.query('select id from public.orders where idempotency_key=$1',[attempt.key])).rows
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('avenue-cart-v1')!).lines)).toEqual([{sku:'SAMPLE-PRL-CAP-DEFAULT',quantity:2}]);expect(recovered).toHaveLength(1);await runtime!.query('select avenue_private.cancel_order($1,$2)',[recovered[0].id,actor])
 }finally{await page.screenshot({path:'.local/recovery-test.png',fullPage:true}).catch(()=>{});await browser.close()}
 }
 const sameKey=randomUUID();keys.push(sameKey)
 const duplicates=await Promise.all([placeOrder(runtime!,'test-secret',input,sameKey),placeOrder(runtime!,'test-secret',input,sameKey)])
 expect(duplicates[0]).toEqual(duplicates[1])
 const duplicateOrder=(await pool!.query('select id from public.orders where idempotency_key=$1',[sameKey])).rows[0].id
 await runtime!.query('select avenue_private.cancel_order($1,$2)',[duplicateOrder,actor])
 const failedKey=randomUUID();keys.push(failedKey)
 await expect(placeOrder(runtime!,'test-secret',{...input,lines:[...input.lines,{sku:'ZZ-NOT-A-PRODUCT',quantity:1}]},failedKey)).rejects.toThrow('PRODUCT_UNAVAILABLE')
 expect((await pool!.query('select reserved from public.inventory_balances where variant_id=$1',[variant])).rows[0].reserved).toBe(0)
 expect((await pool!.query('select count(*)::int n from public.orders where idempotency_key=$1',[failedKey])).rows[0].n).toBe(0)
 await expect(placeOrder(runtime!,'test-secret',input,randomUUID(),'staff_phone',randomUUID())).rejects.toThrow('INVALID_ACTOR')
 expect(await readReceipt(runtime!,'invalid-capability')).toBeNull()
 const results=await Promise.allSettled([placeOrder(runtime!,'test-secret',input,keys[0]),placeOrder(runtime!,'test-secret',input,keys[1],'staff_phone',actor)])
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1)
 const winner=results.findIndex(r=>r.status==='fulfilled'),success=(results[winner] as PromiseFulfilledResult<Awaited<ReturnType<typeof placeOrder>>>).value
 const retry=await placeOrder(runtime!,'test-secret',input,keys[winner],winner===0?'website':'staff_phone',winner===0?null:actor)
 expect(retry).toEqual(success)
 expect((await pool!.query('select count(*)::int n from public.notification_outbox n join public.orders o on o.id=n.order_id where o.idempotency_key=$1',[keys[winner]])).rows[0].n).toBe(1)
 await expect(placeOrder(runtime!,'test-secret',{...input,name:'Changed name'},keys[winner],winner===0?'website':'staff_phone',winner===0?null:actor)).rejects.toThrow('IDEMPOTENCY_CONFLICT')
 const receipt=await readReceipt(runtime!,success.receipt);expect(receipt?.totalMinor).toBe(100);expect(receipt).not.toHaveProperty('phone')
 const order=(await pool!.query('select id from public.orders where idempotency_key=$1',[keys[winner]])).rows[0].id
 expect((await pool!.query('select a.email from public.customer_addresses a join public.orders o on o.address_id=a.id where o.id=$1',[order])).rows[0].email).toBe('delivered@resend.dev')
 expect((await pool!.query('select status,recipient from public.notification_outbox where order_id=$1',[order])).rows[0]).toMatchObject({status:'queued',recipient:'delivered@resend.dev'})
 await runtime!.query('select avenue_private.cancel_order($1,$2)',[order,actor]);await runtime!.query('select avenue_private.cancel_order($1,$2)',[order,actor])
 expect((await pool!.query('select reserved from public.inventory_balances where variant_id=$1',[variant])).rows[0].reserved).toBe(0)
 expect((await pool!.query('select count(*)::int n from public.notification_outbox n join public.orders o on o.id=n.order_id where o.idempotency_key=$1',[keys[winner]])).rows[0].n).toBe(2)
 expect((await pool!.query('select count(*)::int n from public.orders where idempotency_key=ANY($1::uuid[])',[keys])).rows[0].n).toBe(process.env.RUN_COMMERCE_BROWSER==='true'?3:2)
 const client=await pool!.connect();const deactivatedKey=randomUUID();keys.push(deactivatedKey)
 try{await client.query('BEGIN');await client.query('update public.locations set active=false where id=$1',[location]);const attempt=placeOrder(runtime!,'test-secret',input,deactivatedKey);const checked=expect(attempt).rejects.toThrow('INSUFFICIENT_STOCK');await client.query('COMMIT');await checked}finally{client.release()}
 expect((await pool!.query('select count(*)::int n from public.orders where idempotency_key=$1',[deactivatedKey])).rows[0].n).toBe(0)
 await pool!.query('update public.locations set active=true where id=$1',[location])
 const departmentClient=await pool!.connect(),unpublishedKey=randomUUID();keys.push(unpublishedKey)
 try{await departmentClient.query('BEGIN');await departmentClient.query("update public.departments set status='draft' where id=$1",[department]);const attempt=placeOrder(runtime!,'test-secret',input,unpublishedKey);const checked=expect(attempt).rejects.toThrow('PRODUCT_UNAVAILABLE');await departmentClient.query('COMMIT');await checked}finally{departmentClient.release()}
 await pool!.query("update public.departments set status='published' where id=$1",[department])
 await pool!.query("update public.products set status='draft' where id=$1",[product])
 await expect(placeOrder(runtime!,'test-secret',input,randomUUID())).rejects.toThrow('PRODUCT_UNAVAILABLE')
 await pool!.query("update public.products set status='published' where id=$1",[product])
 const option=randomUUID();await pool!.query("insert into public.product_options(id,product_id,name,sort)values($1,$2,'Required size',0)",[option,product])
 await expect(placeOrder(runtime!,'test-secret',input,randomUUID())).rejects.toThrow('PRODUCT_UNAVAILABLE')
 await pool!.query('delete from public.product_options where id=$1',[option])
 }finally{
 await pool!.query('delete from public.reservation_allocations where line_id in(select id from public.order_lines where variant_id=$1)',[variant])
 await pool!.query('delete from public.inventory_reservations where order_id in(select id from public.orders where idempotency_key=ANY($1::uuid[]))',[keys])
 await pool!.query('delete from public.order_events where order_id in(select id from public.orders where idempotency_key=ANY($1::uuid[]))',[keys])
 await pool!.query('delete from public.order_lines where variant_id=$1',[variant])
 const addresses=await pool!.query('delete from public.orders where idempotency_key=ANY($1::uuid[]) returning address_id',[keys])
 for(const row of addresses.rows)await pool!.query('delete from public.customer_addresses where id=$1',[row.address_id])
 await pool!.query('delete from public.inventory_balances where variant_id=$1',[variant]);await pool!.query('delete from public.product_variants where id=$1',[variant]);await pool!.query('delete from public.locations where id=$1',[location]);await pool!.query('delete from public.product_departments where product_id=$1',[product]);await pool!.query('delete from public.products where id=$1',[product]);await pool!.query('delete from public.departments where id=$1',[department])
 }
},60000)
afterAll(async()=>{await pool?.end();await runtime?.end()})
