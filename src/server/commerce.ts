import '@tanstack/react-start/server-only'
import pg from 'pg'
import {readFile} from 'node:fs/promises'
import {commerceConnectionConfig} from './commerce-connection'
import {placeOrder,readReceipt,quoteOrder} from './commerce-service'
import type {OrderInput} from '../features/commerce/model'
export function checkoutEnabled(){return process.env.COMMERCE_DEVELOPMENT_ENABLED==='true'&&process.env.NODE_ENV!=='production'&&process.env.CATALOGUE_SOURCE!=='fixtures'&&!!process.env.COMMERCE_RUNTIME_DATABASE_URL&&!!process.env.COMMERCE_RECEIPT_SECRET}
let pool:pg.Pool|undefined
export async function database(){if(!checkoutEnabled())throw new Error('Checkout unavailable');if(!pool){const ca=process.env.COMMERCE_DATABASE_CA_FILE?await readFile(process.env.COMMERCE_DATABASE_CA_FILE,'utf8'):undefined;pool=new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_RUNTIME_DATABASE_URL,ca,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true'))}return pool}
export async function submitOrder(input:OrderInput,key:string){try{return {ok:true as const,...await placeOrder(await database(),process.env.COMMERCE_RECEIPT_SECRET!,input,key)}}catch(error){const message=(error as Error).message;return {ok:false as const,message:message==='QUOTE_CHANGED'?'Prices or delivery terms changed. Clear this attempt and review a fresh quote.':message==='SHIPPING_QUOTE_REQUIRED'?'This item needs a shipping quote from our team before ordering.':message==='INSUFFICIENT_STOCK'?'An item no longer has enough stock. Update your bag.':message==='IDEMPOTENCY_CONFLICT'?'The previous attempt used different details. Return to your bag before starting again.':'We could not place this test order. Please try again.'}}}
export async function checkoutQuote(lines:OrderInput['lines'],city:string){try{return {ok:true as const,quote:await quoteOrder(await database(),lines,city)}}catch{return {ok:false as const,message:'We could not confirm prices and delivery terms. Please try again.'}}}
export async function receipt(token:string){return readReceipt(await database(),token)}
