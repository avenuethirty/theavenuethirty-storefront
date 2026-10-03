BEGIN;
CREATE SCHEMA IF NOT EXISTS avenue_private;
REVOKE ALL ON SCHEMA avenue_private FROM PUBLIC;
CREATE SEQUENCE IF NOT EXISTS public.avenue_order_number START 100001;
CREATE TABLE IF NOT EXISTS public.locations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, code text NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.inventory_balances (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), variant_id uuid NOT NULL REFERENCES public.product_variants(id), location_id uuid NOT NULL REFERENCES public.locations(id),
 on_hand integer NOT NULL DEFAULT 0 CHECK(on_hand>=0), reserved integer NOT NULL DEFAULT 0 CHECK(reserved>=0 AND reserved<=on_hand), UNIQUE(variant_id,location_id)
);
CREATE TABLE IF NOT EXISTS public.stock_movements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), balance_id uuid NOT NULL REFERENCES public.inventory_balances(id), quantity_delta integer NOT NULL, reason text NOT NULL, reference text NOT NULL UNIQUE, date_created timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.customers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, phone text NOT NULL, phone_verified boolean NOT NULL DEFAULT false, date_created timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.customer_addresses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid REFERENCES public.customers(id), recipient_name text NOT NULL, phone text NOT NULL, line1 text NOT NULL, city text NOT NULL, postal_code text, country text NOT NULL CHECK(country='PK')
);
CREATE TABLE IF NOT EXISTS public.orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_number text NOT NULL UNIQUE, idempotency_key uuid NOT NULL UNIQUE, fingerprint text NOT NULL, receipt_hash text NOT NULL UNIQUE,
 customer_id uuid REFERENCES public.customers(id), address_id uuid NOT NULL REFERENCES public.customer_addresses(id), channel text NOT NULL CHECK(channel IN ('website','staff_whatsapp','staff_phone')), staff_actor uuid REFERENCES public.directus_users(id),
 status text NOT NULL DEFAULT 'placed' CHECK(status IN ('placed','cancelled')), payment_method text NOT NULL DEFAULT 'cod' CHECK(payment_method='cod'), payment_status text NOT NULL DEFAULT 'pending' CHECK(payment_status='pending'),
 currency text NOT NULL DEFAULT 'PKR' CHECK(currency='PKR'), subtotal_minor bigint NOT NULL CHECK(subtotal_minor>=0), shipping_minor bigint NOT NULL DEFAULT 0 CHECK(shipping_minor=0), total_minor bigint NOT NULL CHECK(total_minor=subtotal_minor+shipping_minor),
 is_test boolean NOT NULL DEFAULT true CHECK(is_test=true), date_created timestamptz NOT NULL DEFAULT now(), CHECK((channel='website' AND staff_actor IS NULL) OR (channel<>'website' AND staff_actor IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS public.order_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id), variant_id uuid NOT NULL REFERENCES public.product_variants(id), sku text NOT NULL, product_name text NOT NULL, variant_name text NOT NULL,
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 20), unit_price_minor bigint NOT NULL CHECK(unit_price_minor>=0), line_total_minor bigint NOT NULL CHECK(line_total_minor=unit_price_minor*quantity), UNIQUE(order_id,variant_id)
);
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id), status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','released')), date_created timestamptz NOT NULL DEFAULT now(), released_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.reservation_allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reservation_id uuid NOT NULL REFERENCES public.inventory_reservations(id), line_id uuid NOT NULL REFERENCES public.order_lines(id), balance_id uuid NOT NULL REFERENCES public.inventory_balances(id), quantity integer NOT NULL CHECK(quantity>0), UNIQUE(line_id,balance_id)
);
CREATE TABLE IF NOT EXISTS public.order_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id), kind text NOT NULL, actor uuid REFERENCES public.directus_users(id), date_created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_lines_order_idx ON public.order_lines(order_id);
CREATE INDEX IF NOT EXISTS reservation_allocations_reservation_idx ON public.reservation_allocations(reservation_id);
CREATE INDEX IF NOT EXISTS orders_date_idx ON public.orders(date_created);
DO $$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ARRAY['locations','inventory_balances','stock_movements','customers','customer_addresses','orders','order_lines','inventory_reservations','reservation_allocations','order_events'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',name);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',name);
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION avenue_private.sync_availability() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 UPDATE public.product_variants SET available=EXISTS(SELECT 1 FROM public.inventory_balances b JOIN public.locations l ON l.id=b.location_id WHERE b.variant_id=NEW.variant_id AND l.active AND b.on_hand>b.reserved) WHERE id=NEW.variant_id;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS avenue_inventory_availability ON public.inventory_balances;
CREATE TRIGGER avenue_inventory_availability AFTER INSERT OR UPDATE OF on_hand,reserved ON public.inventory_balances FOR EACH ROW EXECUTE FUNCTION avenue_private.sync_availability();
COMMIT;
