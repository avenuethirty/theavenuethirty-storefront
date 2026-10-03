import 'dotenv/config'
import pg from 'pg'
import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
import {commerceConnectionConfig} from '../src/server/commerce-connection'
const pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))
// Remove only an unreferenced variant left by an interrupted test setup.
await pool.query("delete from public.product_variants v where v.name='Concurrency test' and v.sku like 'TEST-%' and not exists(select 1 from public.inventory_balances b where b.variant_id=v.id) and not exists(select 1 from public.order_lines l where l.variant_id=v.id)")
const browser=await chromium.launch(),page=await browser.newPage()
try{
 await page.goto('http://127.0.0.1:3002/products/sample-cotton-cap');await page.getByRole('button',{name:'Add to bag',exact:true}).click();await page.goto('http://127.0.0.1:3002/checkout')
 await page.getByLabel('Full name').fill('Sample checkout buyer');await page.getByLabel('Phone number').fill('+923000000088');await page.getByLabel('Street address').fill('Development test address only');await page.getByLabel('City',{exact:true}).fill('Lahore')
 await page.getByRole('button',{name:'Place test COD order'}).click();await page.getByRole('heading',{name:'Test order saved'}).waitFor({timeout:30000})
 const text=await page.locator('main').innerText(),number=text.match(/DEV-\d+/)?.[0];if(!number)throw new Error('No saved order number')
 const result=await pool.query("select o.id,o.total_minor,r.status,b.reserved from public.orders o join public.inventory_reservations r on r.order_id=o.id join public.order_lines l on l.order_id=o.id join public.inventory_balances b on b.variant_id=l.variant_id where o.order_number=$1",[number])
 if(result.rowCount!==1||Number(result.rows[0].total_minor)!==450000||result.rows[0].status!=='active'||result.rows[0].reserved<1)throw new Error('Reservation verification failed')
 for(const token of [undefined,process.env.DIRECTUS_RUNTIME_TOKEN,process.env.DIRECTUS_SUPPLIER_TOKEN]){const response=await fetch(`${process.env.DIRECTUS_URL}/items/orders`,{headers:token?{Authorization:`Bearer ${token}`}:{}});if(response.ok)throw new Error('Private order access unexpectedly allowed')}
 await writeFile('.local/sample-order.json',JSON.stringify({id:result.rows[0].id,orderNumber:number,sku:'SAMPLE-PRL-CAP-DEFAULT',quantity:1,totalMinor:450000}),{mode:0o600})
 await page.screenshot({path:'.local/sample-checkout.png',fullPage:true})
 console.log(`Website test order ${number} verified: PKR 4,500, one active stock reservation. Private order access denied.`)
}catch(error){console.error((error as Error).message);process.exitCode=1}finally{await browser.close();await pool.end()}
