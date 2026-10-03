BEGIN;
CREATE TABLE IF NOT EXISTS public.notification_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_event_id uuid NOT NULL UNIQUE REFERENCES public.order_events(id) ON DELETE CASCADE,
 order_id uuid NOT NULL REFERENCES public.orders(id), event_type text NOT NULL CHECK(event_type IN('placed','cancelled')),
 status text NOT NULL DEFAULT 'awaiting_configuration' CHECK(status='awaiting_configuration'), date_created timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_outbox FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION avenue_private.enqueue_order_notification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.kind IN('placed','cancelled')THEN
 INSERT INTO public.notification_outbox(order_event_id,order_id,event_type)VALUES(NEW.id,NEW.order_id,NEW.kind) ON CONFLICT(order_event_id)DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION avenue_private.enqueue_order_notification() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS avenue_order_notification ON public.order_events;
CREATE TRIGGER avenue_order_notification AFTER INSERT ON public.order_events FOR EACH ROW EXECUTE FUNCTION avenue_private.enqueue_order_notification();
INSERT INTO public.notification_outbox(order_event_id,order_id,event_type)SELECT id,order_id,kind FROM public.order_events WHERE kind IN('placed','cancelled')ON CONFLICT(order_event_id)DO NOTHING;
COMMIT;
