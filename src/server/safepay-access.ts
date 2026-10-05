import type pg from 'pg'
export async function assertSafepayAccess(pool:pg.Pool){
 const result=await pool.query(`SELECT
 current_user='avenue_safepay_sandbox' identity_ok,
 has_function_privilege(current_user,'avenue_private.record_safepay_sandbox_event(jsonb)','EXECUTE') allowed,
 EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls OR rolinherit)) elevated,
 EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname=current_user) memberships,
 EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='avenue_private' AND p.oid<>'avenue_private.record_safepay_sandbox_event(jsonb)'::regprocedure
 AND has_function_privilege(current_user,p.oid,'EXECUTE')) other_commands,
 EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname IN ('public','avenue_private') AND c.relkind IN ('r','p')
 AND has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) table_access`)
 const row=result.rows[0]
 if(!row.identity_ok||!row.allowed||row.elevated||row.memberships||row.table_access||row.other_commands)throw Error('Unexpected sandbox receiver privileges')
}
