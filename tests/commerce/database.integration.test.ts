import 'dotenv/config'
import pg from 'pg'
import {readFile} from 'node:fs/promises'
import {expect,it,afterAll} from 'vitest'
import {commerceConnectionConfig} from '../../src/server/commerce-connection'
const enabled=process.env.RUN_COMMERCE_INTEGRATION==='true'
const pool=enabled?new pg.Pool(commerceConnectionConfig(process.env.COMMERCE_DATABASE_URL,undefined,process.env.COMMERCE_ALLOW_UNVERIFIED_TLS==='true')):null
afterAll(()=>pool?.end())
it.skipIf(!enabled)('has constrained location stock and an atomic order command',async()=>{
 const result=await pool!.query("select to_regclass('public.inventory_balances') as balances, to_regprocedure('avenue_private.place_order(uuid,text,text,text,text,jsonb,jsonb,text,uuid)') as command")
 expect(result.rows[0].balances).not.toBeNull();expect(result.rows[0].command).not.toBeNull()
 const client=await pool!.connect();try{await client.query('BEGIN');await expect(client.query("insert into public.locations(name,code) values ('Rollback test','rollback-test') returning id")).resolves.toBeDefined();await client.query('ROLLBACK');const rows=await client.query("select id from public.locations where code='rollback-test'");expect(rows.rowCount).toBe(0)}finally{client.release()}
})
