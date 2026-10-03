BEGIN;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'unconfirmed' CHECK(delivery_status IN('unconfirmed','sent','delivery_delayed','delivered','failed','suppressed','bounced','complained'));
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS delivery_updated_at timestamptz;
CREATE TABLE IF NOT EXISTS avenue_private.email_delivery_events(id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),provider_id uuid NOT NULL,status text NOT NULL CHECK(status IN('sent','delivery_delayed','delivered','failed','suppressed','bounced','complained')),occurred_at timestamptz NOT NULL,date_received timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS email_delivery_provider_idx ON avenue_private.email_delivery_events(provider_id);
ALTER TABLE avenue_private.email_delivery_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON avenue_private.email_delivery_events FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION avenue_private.reconcile_email_delivery(p_provider text)RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 UPDATE public.notification_outbox n SET delivery_status=e.status,delivery_updated_at=e.occurred_at FROM(
 SELECT status,occurred_at FROM avenue_private.email_delivery_events WHERE provider_id::text=p_provider ORDER BY CASE status WHEN 'complained' THEN 7 WHEN 'bounced' THEN 6 WHEN 'suppressed' THEN 5 WHEN 'failed' THEN 4 WHEN 'delivered' THEN 3 WHEN 'delivery_delayed' THEN 2 WHEN 'sent' THEN 1 END DESC,occurred_at DESC,id DESC LIMIT 1
 )e WHERE n.provider_id=p_provider;
END $$;
CREATE OR REPLACE FUNCTION avenue_private.record_email_delivery(p_id text,p_provider uuid,p_status text,p_occurred timestamptz)RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF p_id IS NULL OR p_provider IS NULL OR p_status IS NULL OR p_occurred IS NULL OR length(p_id) NOT BETWEEN 1 AND 200 OR p_status NOT IN('sent','delivery_delayed','delivered','failed','suppressed','bounced','complained') THEN RAISE EXCEPTION 'INVALID_EVENT';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_provider::text,3));
 INSERT INTO avenue_private.email_delivery_events(id,provider_id,status,occurred_at)VALUES(p_id,p_provider,p_status,p_occurred)ON CONFLICT(id)DO NOTHING;
 PERFORM avenue_private.reconcile_email_delivery(p_provider::text);
END $$;
CREATE OR REPLACE FUNCTION avenue_private.complete_notification(p_id uuid,p_lease uuid,p_provider text)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE changed boolean;
BEGIN
 IF p_provider IS NULL OR length(p_provider)<1 OR length(p_provider)>200 THEN RAISE EXCEPTION 'INVALID_PROVIDER_ID';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_provider,3));
 UPDATE public.notification_outbox SET status='accepted',provider_id=p_provider,lease_until=NULL,last_error_code=NULL WHERE id=p_id AND lease_token=p_lease AND status='processing';changed=FOUND;
 IF changed THEN PERFORM avenue_private.reconcile_email_delivery(p_provider);END IF;
 RETURN changed;
END $$;
REVOKE ALL ON FUNCTION avenue_private.reconcile_email_delivery(text),avenue_private.record_email_delivery(text,uuid,text,timestamptz)FROM PUBLIC,anon,authenticated;
COMMIT;
