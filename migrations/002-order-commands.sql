BEGIN;
CREATE OR REPLACE FUNCTION avenue_private.place_order(p_key uuid,p_fingerprint text,p_receipt_hash text,p_name text,p_phone text,p_address jsonb,p_lines jsonb,p_channel text,p_actor uuid DEFAULT NULL)
RETURNS TABLE(id uuid,order_number text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE existing public.orders%ROWTYPE; order_id uuid; address_id uuid; reservation_id uuid; line_id uuid; item jsonb; variant record; balance record; needed integer; take integer; qty integer; subtotal bigint:=0;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 SELECT o.* INTO existing FROM public.orders o WHERE o.idempotency_key=p_key;
 IF FOUND THEN
  IF existing.fingerprint<>p_fingerprint THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE='P0001'; END IF;
  RETURN QUERY SELECT existing.id,existing.order_number;RETURN;
 END IF;
 IF p_channel NOT IN ('website','staff_whatsapp','staff_phone') OR (p_channel='website' AND p_actor IS NOT NULL) OR (p_channel<>'website' AND p_actor IS NULL) THEN RAISE EXCEPTION 'INVALID_ACTOR';END IF;
 IF p_actor IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.directus_users WHERE directus_users.id=p_actor AND status='active' AND EXISTS(SELECT 1 FROM public.directus_access a JOIN public.directus_policies policy ON policy.id=a.policy WHERE (a."user"=directus_users.id OR a.role=directus_users.role) AND policy.admin_access)) THEN RAISE EXCEPTION 'INVALID_ACTOR';END IF;
 IF length(p_name)<2 OR length(p_name)>100 OR p_phone !~ '^\+[1-9][0-9]{7,14}$' OR (p_address->>'country') IS DISTINCT FROM 'PK' OR length(p_address->>'line1')<5 OR length(p_address->>'city')<2 THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
 IF jsonb_typeof(p_lines)<>'array' OR jsonb_array_length(p_lines)<1 OR jsonb_array_length(p_lines)>20 THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_phone,1));
 IF (SELECT count(*) FROM public.orders o JOIN public.customer_addresses a ON a.id=o.address_id WHERE a.phone=p_phone AND o.date_created>now()-interval '1 day' AND o.status='placed')>=5 THEN RAISE EXCEPTION 'RATE_LIMITED';END IF;
 order_id:=gen_random_uuid();address_id:=gen_random_uuid();reservation_id:=gen_random_uuid();
 INSERT INTO public.customer_addresses(id,recipient_name,phone,line1,city,postal_code,country,email)VALUES(address_id,p_name,p_phone,p_address->>'line1',p_address->>'city',nullif(p_address->>'postalCode',''),'PK',nullif(lower(p_address->>'email'),''));
 INSERT INTO public.orders(id,order_number,idempotency_key,fingerprint,receipt_hash,address_id,channel,staff_actor,subtotal_minor,total_minor)VALUES(order_id,'DEV-'||nextval('public.avenue_order_number'),p_key,p_fingerprint,p_receipt_hash,address_id,p_channel,p_actor,0,0);
 INSERT INTO public.inventory_reservations(id,order_id)VALUES(reservation_id,order_id);
 FOR item IN SELECT value FROM jsonb_array_elements(p_lines)ORDER BY value->>'sku' LOOP
  qty:=(item->>'quantity')::integer;
  IF qty<1 OR qty>20 THEN RAISE EXCEPTION 'INVALID_QUANTITY';END IF;
  SELECT v.id,v.product_id,v.sku,v.name AS variant_name,v.price_minor,v.currency,p.name AS product_name INTO variant
  FROM public.product_variants v JOIN public.products p ON p.id=v.product_id JOIN public.brands b ON b.id=p.brand_id JOIN public.categories c ON c.id=p.category_id JOIN public.product_types t ON t.id=p.product_type_id
  WHERE v.sku=item->>'sku' AND p.status='published' AND b.status='published' AND c.status='published' AND t.status='published'
  AND EXISTS(SELECT 1 FROM public.product_departments pd JOIN public.departments d ON d.id=pd.department_id WHERE pd.product_id=p.id AND d.status='published')
  FOR UPDATE OF v FOR SHARE OF p,b,c,t;
  IF NOT FOUND OR variant.currency<>'PKR' THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE';END IF;
  PERFORM po.id FROM public.product_options po WHERE po.product_id=variant.product_id ORDER BY po.id FOR SHARE;
  PERFORM ov.id FROM public.option_values ov JOIN public.product_options po ON po.id=ov.option_id WHERE po.product_id=variant.product_id ORDER BY ov.id FOR SHARE OF ov;
  PERFORM a.id FROM public.variant_option_values a WHERE a.variant_id=variant.id ORDER BY a.id FOR SHARE;
  IF (SELECT count(*) FROM public.product_options WHERE product_id=variant.product_id)<>
     (SELECT count(*) FROM public.variant_option_values WHERE variant_id=variant.id)
  OR EXISTS(SELECT 1 FROM public.variant_option_values a JOIN public.option_values ov ON ov.id=a.option_value_id JOIN public.product_options po ON po.id=ov.option_id WHERE a.variant_id=variant.id AND po.product_id<>variant.product_id)
  OR EXISTS(SELECT ov.option_id FROM public.variant_option_values a JOIN public.option_values ov ON ov.id=a.option_value_id WHERE a.variant_id=variant.id GROUP BY ov.option_id HAVING count(*)<>1)
  OR (SELECT count(*) FROM public.product_options WHERE product_id=variant.product_id)<>(SELECT count(DISTINCT name) FROM public.product_options WHERE product_id=variant.product_id)
  OR EXISTS(SELECT 1 FROM public.product_variants other WHERE other.product_id=variant.product_id AND other.id<>variant.id AND ARRAY(SELECT jsonb_build_array(po.name,ov.value)::text FROM public.variant_option_values a JOIN public.option_values ov ON ov.id=a.option_value_id JOIN public.product_options po ON po.id=ov.option_id WHERE a.variant_id=other.id ORDER BY po.name,ov.value)=ARRAY(SELECT jsonb_build_array(po.name,ov.value)::text FROM public.variant_option_values a JOIN public.option_values ov ON ov.id=a.option_value_id JOIN public.product_options po ON po.id=ov.option_id WHERE a.variant_id=variant.id ORDER BY po.name,ov.value))
  THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE';END IF;
  PERFORM d.id FROM public.departments d JOIN public.product_departments pd ON pd.department_id=d.id WHERE pd.product_id=variant.product_id ORDER BY d.id FOR SHARE OF d,pd;
  IF NOT EXISTS(SELECT 1 FROM public.product_departments pd JOIN public.departments d ON d.id=pd.department_id WHERE pd.product_id=variant.product_id AND d.status='published')THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE';END IF;
  PERFORM l.id FROM public.locations l JOIN public.inventory_balances b ON b.location_id=l.id WHERE b.variant_id=variant.id ORDER BY l.id FOR SHARE OF l;
  PERFORM pg_advisory_xact_lock(hashtextextended(variant.id::text,2));
  PERFORM b.id FROM public.inventory_balances b JOIN public.locations l ON l.id=b.location_id WHERE b.variant_id=variant.id AND l.active ORDER BY b.id FOR UPDATE OF b;
  IF coalesce((SELECT sum(b.on_hand-b.reserved)FROM public.inventory_balances b JOIN public.locations l ON l.id=b.location_id WHERE b.variant_id=variant.id AND l.active),0)<qty THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK';END IF;
  line_id:=gen_random_uuid();
  INSERT INTO public.order_lines(id,order_id,variant_id,sku,product_name,variant_name,quantity,unit_price_minor,line_total_minor)VALUES(line_id,order_id,variant.id,variant.sku,variant.product_name,variant.variant_name,qty,variant.price_minor,variant.price_minor::bigint*qty);
  subtotal:=subtotal+variant.price_minor::bigint*qty;needed:=qty;
  FOR balance IN SELECT b.id,b.on_hand-b.reserved AS available FROM public.inventory_balances b JOIN public.locations l ON l.id=b.location_id WHERE b.variant_id=variant.id AND l.active AND b.on_hand>b.reserved ORDER BY b.id LOOP
   EXIT WHEN needed=0;take:=least(needed,balance.available);
   UPDATE public.inventory_balances SET reserved=reserved+take WHERE inventory_balances.id=balance.id;
   INSERT INTO public.reservation_allocations(reservation_id,line_id,balance_id,quantity)VALUES(reservation_id,line_id,balance.id,take);needed:=needed-take;
  END LOOP;
  IF needed<>0 THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK';END IF;
 END LOOP;
 UPDATE public.orders SET subtotal_minor=subtotal,total_minor=subtotal WHERE orders.id=order_id;
 INSERT INTO public.order_events(order_id,kind,actor)VALUES(order_id,'placed',p_actor);
 RETURN QUERY SELECT o.id,o.order_number FROM public.orders o WHERE o.id=order_id;
END $$;
CREATE OR REPLACE FUNCTION avenue_private.cancel_order(p_order uuid,p_actor uuid)RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.orders%ROWTYPE; allocation record;
BEGIN
 IF p_actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.directus_users WHERE directus_users.id=p_actor AND status='active' AND EXISTS(SELECT 1 FROM public.directus_access a JOIN public.directus_policies policy ON policy.id=a.policy WHERE (a."user"=directus_users.id OR a.role=directus_users.role) AND policy.admin_access))THEN RAISE EXCEPTION 'INVALID_ACTOR';END IF;
 SELECT * INTO target FROM public.orders WHERE orders.id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND';END IF;
 IF target.status='cancelled' THEN RETURN;END IF;
 PERFORM v.id FROM public.product_variants v JOIN public.order_lines l ON l.variant_id=v.id WHERE l.order_id=p_order ORDER BY v.sku FOR UPDATE OF v;
 FOR allocation IN SELECT a.balance_id,a.quantity FROM public.reservation_allocations a JOIN public.inventory_reservations r ON r.id=a.reservation_id WHERE r.order_id=p_order AND r.status='active' ORDER BY a.balance_id LOOP
  UPDATE public.inventory_balances SET reserved=reserved-allocation.quantity WHERE inventory_balances.id=allocation.balance_id;
 END LOOP;
 UPDATE public.inventory_reservations SET status='released',released_at=now()WHERE order_id=p_order AND status='active';
 UPDATE public.orders SET status='cancelled'WHERE orders.id=p_order;
 INSERT INTO public.order_events(order_id,kind,actor)VALUES(p_order,'cancelled',p_actor);
END $$;
CREATE OR REPLACE FUNCTION avenue_private.order_receipt(p_hash text)RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('orderNumber',o.order_number,'status',o.status,'totalMinor',o.total_minor,'currency',o.currency,'paymentMethod',o.payment_method,'lines',coalesce((SELECT jsonb_agg(jsonb_build_object('name',l.product_name,'sku',l.sku,'quantity',l.quantity,'lineTotalMinor',l.line_total_minor))FROM public.order_lines l WHERE l.order_id=o.id),'[]'::jsonb))FROM public.orders o WHERE o.receipt_hash=p_hash;
$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA avenue_private FROM PUBLIC,anon,authenticated;
COMMIT;
