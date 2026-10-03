import 'dotenv/config'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {readFile,writeFile} from 'node:fs/promises'
import {chromium,expect} from '@playwright/test'
import {InvoiceDocument} from '../src/features/commerce/InvoiceDocument'
import {invoicePreview} from '../src/features/commerce/invoice-preview'
import {createDirectusTransport} from '../src/server/directus-transport'
import {parseServerEnv} from '../src/server/env-validation'
const request=createDirectusTransport(parseServerEnv({...process.env,DIRECTUS_RUNTIME_TOKEN:process.env.DIRECTUS_STATIC_TOKEN}),fetch,30000)
const {id}=JSON.parse(await readFile('.local/sample-order.json','utf8'))
const [{data:order},{data:settings}]=await Promise.all([request<{data:unknown}>(`/items/orders/${id}?fields=order_number,status,currency,subtotal_minor,shipping_minor,total_minor,address_id.recipient_name,address_id.line1,address_id.city,address_id.postal_code,address_id.country,lines.sku,lines.product_name,lines.variant_name,lines.quantity,lines.unit_price_minor,lines.line_total_minor`),request<{data:unknown[]}>('/items/store_settings?fields=legal_business_name,billing_address,tax_registration,tax_treatment&limit=1&sort=id')])
const draft=invoicePreview(order,settings[0]),css=await readFile('src/styles/tokens.css','utf8'),html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Development draft invoice</title><style>${css}</style></head><body>${renderToStaticMarkup(<InvoiceDocument draft={draft} controls={false}/>)}</body></html>`
await writeFile('.local/sample-invoice-draft.html',html,{mode:0o600})
const browser=await chromium.launch()
try{const page=await browser.newPage({viewport:{width:1100,height:1000}});await page.setContent(html);await expect(page.getByText('Paris Road Street Number 4 (51310) Sialkot, Pakistan')).toBeVisible();await expect(page.getByRole('heading',{name:'Draft invoice preview'})).toBeVisible();await page.screenshot({path:'.local/sample-invoice-draft.png',fullPage:true});await page.pdf({path:'.local/sample-invoice-draft.pdf',format:'A4',printBackground:true,margin:{top:'15mm',bottom:'15mm',left:'15mm',right:'15mm'}});await page.goto(`http://127.0.0.1:3002/staff/invoices/${id}`);await expect(page.getByRole('heading',{name:'Invoice preview unavailable'})).toBeVisible();await expect(page.getByText('Sample checkout buyer')).toHaveCount(0);console.log('CMS business configuration, sample draft rendering and anonymous invoice denial verified. No invoice issued.')}finally{await browser.close()}
