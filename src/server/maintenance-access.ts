import type pg from 'pg'
export async function assertMaintenanceAccess(pool:pg.Pool){const result=await pool.query(`SELECT
 current_user='avenue_maintenance_runtime' identity_ok,
 has_function_privilege(current_user,'avenue_private.expire_order_reservations(integer)','EXECUTE') allowed,
 EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls OR rolinherit)) elevated,
 EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname=current_user) memberships,
 EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='avenue_private' AND p.oid<>'avenue_private.expire_order_reservations(integer)'::regprocedure AND has_function_privilege(current_user,p.oid,'EXECUTE')) other_commands,
 EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','avenue_private') AND c.relkind IN('r','p') AND has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) table_access`);const row=result.rows[0];if(!row.identity_ok||!row.allowed||row.elevated||row.memberships||row.other_commands||row.table_access)throw Error('Unexpected maintenance privileges')}
