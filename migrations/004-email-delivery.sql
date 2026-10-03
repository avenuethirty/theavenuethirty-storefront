BEGIN;
ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS email text CHECK(length(email)<=254);
ALTER TABLE public.notification_outbox DROP CONSTRAINT IF EXISTS notification_outbox_status_check;
ALTER TABLE public.notification_outbox ADD CONSTRAINT notification_outbox_status_check CHECK(status IN('awaiting_configuration','awaiting_recipient','queued','processing','accepted','manual_review'));
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS recipient text;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS first_attempt_at timestamptz;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS available_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS lease_until timestamptz;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS lease_token uuid;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS provider_id text;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS last_error_code text;
CREATE INDEX IF NOT EXISTS notification_queue_idx ON public.notification_outbox(status,available_at);
CREATE OR REPLACE FUNCTION avenue_private.enqueue_order_notification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE recipient text;
BEGIN
 IF NEW.kind IN('placed','cancelled')THEN
 SELECT a.email INTO recipient FROM public.customer_addresses a JOIN public.orders o ON o.address_id=a.id WHERE o.id=NEW.order_id;
 INSERT INTO public.notification_outbox(order_event_id,order_id,event_type,recipient,status)VALUES(NEW.id,NEW.order_id,NEW.kind,recipient,CASE WHEN recipient IS NULL THEN 'awaiting_recipient' ELSE 'queued' END)ON CONFLICT(order_event_id)DO NOTHING;
 END IF;RETURN NEW;
END $$;
UPDATE public.notification_outbox SET status='awaiting_recipient' WHERE status='awaiting_configuration';
CREATE OR REPLACE FUNCTION avenue_private.claim_notifications(p_limit integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
 IF p_limit IS NULL OR p_limit<1 OR p_limit>10 THEN RAISE EXCEPTION 'INVALID_LIMIT';END IF;
 UPDATE public.notification_outbox SET status='manual_review',lease_until=NULL,last_error_code='IDEMPOTENCY_WINDOW_EXPIRED' WHERE status IN('queued','processing') AND first_attempt_at<now()-interval '20 hours';
 UPDATE public.notification_outbox SET status='manual_review',lease_until=NULL,last_error_code='RETRY_EXHAUSTED' WHERE attempts>=5 AND (status='queued' OR (status='processing' AND lease_until<now()));
 WITH targets AS (SELECT id FROM public.notification_outbox WHERE attempts<5 AND available_at<=now() AND (status='queued' OR (status='processing' AND lease_until<now())) ORDER BY date_created,id LIMIT p_limit FOR UPDATE SKIP LOCKED), claimed AS (
 UPDATE public.notification_outbox n SET status='processing',attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()),lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid() FROM targets t WHERE n.id=t.id RETURNING n.*)
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',n.id,'leaseToken',n.lease_token,'recipient',n.recipient,'event',n.event_type,'orderNumber',o.order_number,'totalMinor',o.total_minor,'isTest',o.is_test)),'[]'::jsonb)INTO result FROM claimed n JOIN public.orders o ON o.id=n.order_id;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION avenue_private.complete_notification(p_id uuid,p_lease uuid,p_provider text)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF p_provider IS NULL OR length(p_provider)<1 OR length(p_provider)>200 THEN RAISE EXCEPTION 'INVALID_PROVIDER_ID';END IF;
 UPDATE public.notification_outbox SET status='accepted',provider_id=p_provider,lease_until=NULL,last_error_code=NULL WHERE id=p_id AND lease_token=p_lease AND status='processing';RETURN FOUND;
END $$;
CREATE OR REPLACE FUNCTION avenue_private.retry_notification(p_id uuid,p_lease uuid,p_retry boolean,p_code text)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF p_code NOT IN('TEMPORARY_FAILURE','PROVIDER_REJECTED','DEVELOPMENT_RECIPIENT_BLOCKED','INVALID_JOB')THEN RAISE EXCEPTION 'INVALID_ERROR_CODE';END IF;
 UPDATE public.notification_outbox SET status=CASE WHEN p_retry AND attempts<5 THEN 'queued' ELSE 'manual_review' END,available_at=now()+least(interval '1 hour',interval '15 seconds'*power(2,attempts)),lease_until=NULL,last_error_code=p_code WHERE id=p_id AND lease_token=p_lease AND status='processing';RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION avenue_private.claim_notifications(integer),avenue_private.complete_notification(uuid,uuid,text),avenue_private.retry_notification(uuid,uuid,boolean,text)FROM PUBLIC,anon,authenticated;
COMMIT;
