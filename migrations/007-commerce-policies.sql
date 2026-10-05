BEGIN;
CREATE TABLE IF NOT EXISTS public.store_commerce_settings (
 id integer PRIMARY KEY DEFAULT 1 CHECK(id=1),
 standard_shipping_fee bigint NOT NULL DEFAULT 25000 CHECK(standard_shipping_fee BETWEEN 0 AND 100000000),
 free_shipping_threshold bigint NOT NULL DEFAULT 500000 CHECK(free_shipping_threshold BETWEEN 0 AND 100000000),
 enable_free_shipping boolean NOT NULL DEFAULT true,
 deposits_enabled boolean NOT NULL DEFAULT false,
 deposit_type text NOT NULL DEFAULT 'fixed_amount' CHECK(deposit_type IN('fixed_amount','percentage','shipping_cost_only')),
 deposit_value bigint NOT NULL DEFAULT 25000 CHECK(deposit_value BETWEEN 0 AND 100000000),
 deposit_percentage_basis_points integer NOT NULL DEFAULT 2000 CHECK(deposit_percentage_basis_points BETWEEN 0 AND 10000),
 deposit_calculation_base text NOT NULL DEFAULT 'merchandise_subtotal' CHECK(deposit_calculation_base IN('merchandise_subtotal','total_including_shipping')),
 min_order_amount_for_deposit bigint NOT NULL DEFAULT 1000000 CHECK(min_order_amount_for_deposit BETWEEN 0 AND 100000000),
 regional_deposit_trigger boolean NOT NULL DEFAULT true,
 primary_cities jsonb NOT NULL DEFAULT '["karachi","lahore","islamabad","rawalpindi","faisalabad","multan","sialkot"]' CHECK(jsonb_typeof(primary_cities)='array'),
 online_hold_minutes integer NOT NULL DEFAULT 15 CHECK(online_hold_minutes=15),
 cod_hold_hours integer NOT NULL DEFAULT 24 CHECK(cod_hold_hours=24),
 fault_reporting_hours integer NOT NULL DEFAULT 48 CHECK(fault_reporting_hours=48),
 return_handover_days integer NOT NULL DEFAULT 7 CHECK(return_handover_days=7),
 return_processing_min_days integer NOT NULL DEFAULT 3 CHECK(return_processing_min_days=3),
 return_processing_max_days integer NOT NULL DEFAULT 7 CHECK(return_processing_max_days=7)
);
INSERT INTO public.store_commerce_settings(id)VALUES(1)ON CONFLICT(id)DO NOTHING;
ALTER TABLE public.store_commerce_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_commerce_settings FROM PUBLIC,anon,authenticated;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_quote_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS advance_payment_review_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_shipping_minor_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_shipping_minor_check CHECK(shipping_minor>=0);
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check CHECK(payment_method IN('cod','card_google_pay','raast_transfer'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS policy_snapshot jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS required_deposit_minor bigint NOT NULL DEFAULT 0 CHECK(required_deposit_minor>=0);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS manual_review_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmation_status text NOT NULL DEFAULT 'legacy' CHECK(confirmation_status IN('legacy','pending','confirmed'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.inventory_reservations ADD COLUMN IF NOT EXISTS expires_at timestamptz;
CREATE INDEX IF NOT EXISTS reservations_due_idx ON public.inventory_reservations(expires_at)WHERE status='active' AND expires_at IS NOT NULL;
CREATE OR REPLACE FUNCTION avenue_private.protect_order_policy()RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF OLD.policy_snapshot IS NOT NULL AND (NEW.policy_snapshot IS DISTINCT FROM OLD.policy_snapshot OR NEW.subtotal_minor IS DISTINCT FROM OLD.subtotal_minor OR NEW.shipping_minor IS DISTINCT FROM OLD.shipping_minor OR NEW.total_minor IS DISTINCT FROM OLD.total_minor OR NEW.required_deposit_minor IS DISTINCT FROM OLD.required_deposit_minor OR NEW.manual_review_required IS DISTINCT FROM OLD.manual_review_required) THEN RAISE EXCEPTION 'ORDER_POLICY_IMMUTABLE';END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION avenue_private.protect_order_policy()FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS avenue_order_policy_immutable ON public.orders;
CREATE TRIGGER avenue_order_policy_immutable BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION avenue_private.protect_order_policy();

CREATE OR REPLACE FUNCTION avenue_private.commerce_quote(p_lines jsonb,p_city text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE settings public.store_commerce_settings%ROWTYPE;item jsonb;variant record;qty integer;subtotal bigint:=0;shipping bigint;deposit bigint:=0;base bigint;bulk boolean:=false;review boolean:=false;details jsonb:='[]';result jsonb;
BEGIN
 IF jsonb_typeof(p_lines) IS DISTINCT FROM 'array' OR jsonb_array_length(p_lines)NOT BETWEEN 1 AND 20 OR p_city IS NULL OR length(trim(p_city))NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
 IF (SELECT count(DISTINCT value->>'sku') FROM jsonb_array_elements(p_lines))<>jsonb_array_length(p_lines)THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
 SELECT * INTO STRICT settings FROM public.store_commerce_settings WHERE id=1 FOR SHARE;
 FOR item IN SELECT value FROM jsonb_array_elements(p_lines)ORDER BY value->>'sku' LOOP
  qty:=(item->>'quantity')::integer;IF qty NOT BETWEEN 1 AND 20 OR qty IS NULL THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
  SELECT v.sku,v.price_minor,v.currency,p.shipping_quote_required,p.advance_payment_review_required INTO variant
  FROM public.product_variants v JOIN public.products p ON p.id=v.product_id JOIN public.brands b ON b.id=p.brand_id JOIN public.categories c ON c.id=p.category_id JOIN public.product_types t ON t.id=p.product_type_id
  WHERE v.sku=item->>'sku' AND p.status='published' AND b.status='published' AND c.status='published' AND t.status='published'
  AND EXISTS(SELECT 1 FROM public.product_departments pd JOIN public.departments d ON d.id=pd.department_id WHERE pd.product_id=p.id AND d.status='published');
  IF NOT FOUND OR variant.currency<>'PKR' THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE';END IF;
  subtotal:=subtotal+variant.price_minor::bigint*qty;bulk:=bulk OR variant.shipping_quote_required;review:=review OR variant.advance_payment_review_required;
  details:=details||jsonb_build_array(jsonb_build_object('sku',variant.sku,'quantity',qty,'price',variant.price_minor,'bulk',variant.shipping_quote_required,'review',variant.advance_payment_review_required));
 END LOOP;
 shipping:=CASE WHEN settings.enable_free_shipping AND subtotal>=settings.free_shipping_threshold THEN 0 ELSE settings.standard_shipping_fee END;
 base:=CASE WHEN settings.deposit_calculation_base='merchandise_subtotal' THEN subtotal ELSE subtotal+shipping END;
 IF settings.deposits_enabled AND (base>settings.min_order_amount_for_deposit OR (settings.regional_deposit_trigger AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(settings.primary_cities) AS city WHERE lower(trim(city))=lower(trim(p_city))))) THEN
  deposit:=CASE settings.deposit_type WHEN 'fixed_amount' THEN settings.deposit_value WHEN 'percentage' THEN (base*settings.deposit_percentage_basis_points+9999)/10000 ELSE shipping END;
 END IF;
 deposit:=least(deposit,subtotal+shipping);
 result:=jsonb_build_object('subtotalMinor',subtotal,'shippingMinor',shipping,'totalMinor',subtotal+shipping,'depositMinor',deposit,'manualReview',review,'shippingQuoteRequired',bulk,'holdMinutes',settings.cod_hold_hours*60);
 RETURN result||jsonb_build_object('quoteId',encode(sha256(convert_to((result||jsonb_build_object('settings',to_jsonb(settings),'lines',details,'city',lower(trim(p_city))))::text,'UTF8')),'hex'));
END;
$$;

DO $$BEGIN
 IF to_regprocedure('avenue_private.place_order_core(uuid,text,text,text,text,jsonb,jsonb,text,uuid)')IS NULL THEN
  ALTER FUNCTION avenue_private.place_order(uuid,text,text,text,text,jsonb,jsonb,text,uuid) RENAME TO place_order_core;
 END IF;
END;$$;
REVOKE ALL ON FUNCTION avenue_private.place_order_core(uuid,text,text,text,text,jsonb,jsonb,text,uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION avenue_private.place_order(p_key uuid,p_fingerprint text,p_receipt_hash text,p_name text,p_phone text,p_address jsonb,p_lines jsonb,p_channel text,p_actor uuid DEFAULT NULL)
RETURNS TABLE(id uuid,order_number text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE created record;quote jsonb;existing boolean;settings public.store_commerce_settings%ROWTYPE;actual_subtotal bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 SELECT EXISTS(SELECT 1 FROM public.orders o WHERE o.idempotency_key=p_key)INTO existing;
 SELECT * INTO created FROM avenue_private.place_order_core(p_key,p_fingerprint,p_receipt_hash,p_name,p_phone,p_address,p_lines,p_channel,p_actor);
 IF existing THEN RETURN QUERY SELECT created.id,created.order_number;RETURN;END IF;
 quote:=avenue_private.commerce_quote(p_lines,p_address->>'city');
 IF (quote->>'shippingQuoteRequired')::boolean THEN RAISE EXCEPTION 'SHIPPING_QUOTE_REQUIRED';END IF;
 IF p_address->>'commerceQuote' IS NULL OR p_address->>'commerceQuote'<>quote->>'quoteId' THEN RAISE EXCEPTION 'QUOTE_CHANGED';END IF;
 SELECT subtotal_minor INTO actual_subtotal FROM public.orders o WHERE o.id=created.id;
 IF actual_subtotal<>(quote->>'subtotalMinor')::bigint THEN RAISE EXCEPTION 'QUOTE_CHANGED';END IF;
 SELECT * INTO STRICT settings FROM public.store_commerce_settings WHERE store_commerce_settings.id=1;
 UPDATE public.orders o SET shipping_minor=(quote->>'shippingMinor')::bigint,total_minor=(quote->>'totalMinor')::bigint,required_deposit_minor=(quote->>'depositMinor')::bigint,manual_review_required=(quote->>'manualReview')::boolean,confirmation_status='pending',policy_snapshot=to_jsonb(settings)||jsonb_build_object('quote',quote)WHERE o.id=created.id;
 UPDATE public.inventory_reservations r SET expires_at=now()+make_interval(hours=>settings.cod_hold_hours)WHERE r.order_id=created.id;
 RETURN QUERY SELECT created.id,created.order_number;
END;
$$;

CREATE OR REPLACE FUNCTION avenue_private.confirm_cod_order(p_order uuid,p_actor uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.orders%ROWTYPE;
BEGIN
 IF p_actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.directus_users u WHERE u.id=p_actor AND u.status='active' AND EXISTS(SELECT 1 FROM public.directus_access a JOIN public.directus_policies p ON p.id=a.policy WHERE (a."user"=u.id OR a.role=u.role)AND p.admin_access))THEN RAISE EXCEPTION 'INVALID_ACTOR';END IF;
 SELECT * INTO STRICT target FROM public.orders WHERE id=p_order FOR UPDATE;
 IF target.status<>'placed' OR target.payment_method<>'cod' THEN RAISE EXCEPTION 'ORDER_NOT_CONFIRMABLE';END IF;
 IF target.confirmation_status='confirmed' THEN RETURN;END IF;
 IF target.required_deposit_minor>0 OR target.manual_review_required THEN RAISE EXCEPTION 'ADVANCE_PAYMENT_REQUIRED';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.inventory_reservations WHERE order_id=p_order AND status='active' AND expires_at>clock_timestamp())THEN RAISE EXCEPTION 'RESERVATION_EXPIRED';END IF;
 UPDATE public.orders SET confirmation_status='confirmed'WHERE id=p_order;
 UPDATE public.inventory_reservations SET expires_at=NULL WHERE order_id=p_order AND status='active';
 INSERT INTO public.order_events(order_id,kind,actor)VALUES(p_order,'cod_confirmed',p_actor);
END;
$$;

CREATE OR REPLACE FUNCTION avenue_private.expire_order_reservations(p_limit integer DEFAULT 1)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target record;allocation record;expired integer:=0;
BEGIN
 IF p_limit IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'INVALID_BATCH';END IF;
 FOR target IN SELECT o.id FROM public.orders o JOIN public.inventory_reservations r ON r.order_id=o.id WHERE o.status='placed' AND o.payment_status='pending' AND o.confirmation_status='pending' AND r.status='active' AND r.expires_at<=clock_timestamp()ORDER BY o.id LIMIT p_limit FOR UPDATE OF o SKIP LOCKED LOOP
  PERFORM v.id FROM public.product_variants v JOIN public.order_lines l ON l.variant_id=v.id WHERE l.order_id=target.id ORDER BY v.sku FOR UPDATE OF v;
  FOR allocation IN SELECT a.balance_id,a.quantity FROM public.reservation_allocations a JOIN public.inventory_reservations r ON r.id=a.reservation_id WHERE r.order_id=target.id AND r.status='active' ORDER BY a.balance_id LOOP
   UPDATE public.inventory_balances SET reserved=reserved-allocation.quantity WHERE id=allocation.balance_id;
  END LOOP;
  UPDATE public.inventory_reservations SET status='released',released_at=now()WHERE order_id=target.id AND status='active';
  UPDATE public.orders SET status='cancelled',cancellation_reason='confirmation_timeout'WHERE id=target.id;
  INSERT INTO public.order_events(order_id,kind)VALUES(target.id,'cancelled'),(target.id,'reservation_expired');
  expired:=expired+1;
 END LOOP;
 RETURN expired;
END;
$$;

CREATE OR REPLACE FUNCTION avenue_private.order_receipt(p_hash text)RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('orderNumber',o.order_number,'status',o.status,'subtotalMinor',o.subtotal_minor,'shippingMinor',o.shipping_minor,'totalMinor',o.total_minor,'depositMinor',o.required_deposit_minor,'confirmationStatus',o.confirmation_status,'manualReview',o.manual_review_required,'expiresAt',(SELECT r.expires_at FROM public.inventory_reservations r WHERE r.order_id=o.id),'currency',o.currency,'paymentMethod',o.payment_method,'lines',coalesce((SELECT jsonb_agg(jsonb_build_object('name',l.product_name,'sku',l.sku,'quantity',l.quantity,'lineTotalMinor',l.line_total_minor))FROM public.order_lines l WHERE l.order_id=o.id),'[]'::jsonb))FROM public.orders o WHERE o.receipt_hash=p_hash;
$$;
REVOKE ALL ON FUNCTION avenue_private.commerce_quote(jsonb,text),avenue_private.place_order(uuid,text,text,text,text,jsonb,jsonb,text,uuid),avenue_private.confirm_cod_order(uuid,uuid),avenue_private.expire_order_reservations(integer) FROM PUBLIC,anon,authenticated;
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='avenue_commerce_runtime')THEN
  REVOKE ALL ON FUNCTION avenue_private.place_order_core(uuid,text,text,text,text,jsonb,jsonb,text,uuid)FROM avenue_commerce_runtime;
  GRANT EXECUTE ON FUNCTION avenue_private.commerce_quote(jsonb,text),avenue_private.place_order(uuid,text,text,text,text,jsonb,jsonb,text,uuid),avenue_private.confirm_cod_order(uuid,uuid) TO avenue_commerce_runtime;
 END IF;
END;$$;
COMMIT;
