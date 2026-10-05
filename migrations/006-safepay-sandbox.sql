BEGIN;
CREATE TABLE IF NOT EXISTS avenue_private.safepay_sandbox_events (
 id text PRIMARY KEY,
 event jsonb NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE avenue_private.safepay_sandbox_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON avenue_private.safepay_sandbox_events FROM PUBLIC;
CREATE OR REPLACE FUNCTION avenue_private.record_safepay_sandbox_event(payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,avenue_private AS $$
DECLARE previous jsonb;
BEGIN
 IF payload->>'id' IS NULL OR payload->>'tracker' IS NULL OR length(payload::text)>4096 THEN
  RAISE EXCEPTION 'Invalid sandbox event';
 END IF;
 INSERT INTO avenue_private.safepay_sandbox_events(id,event) VALUES(payload->>'id',payload)
 ON CONFLICT(id) DO NOTHING;
 SELECT event INTO previous FROM avenue_private.safepay_sandbox_events WHERE id=payload->>'id';
 IF previous IS DISTINCT FROM payload THEN RAISE EXCEPTION 'Conflicting event identifier'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION avenue_private.record_safepay_sandbox_event(jsonb) FROM PUBLIC;
COMMIT;
