-- Row Level Security (Requirement 14)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users: own row
CREATE POLICY users_select_own ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Shops: public read active; owner full access
CREATE POLICY shops_public_read ON public.shops FOR SELECT
  USING (is_active = TRUE OR owner_id = auth.uid());

CREATE POLICY shops_owner_write ON public.shops FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Products: public read active; seller writes own shop's products
CREATE POLICY products_public_read ON public.products FOR SELECT
  USING (
    is_active = TRUE
    OR shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY products_owner_write ON public.products FOR INSERT
  WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY products_owner_update ON public.products FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY products_owner_delete ON public.products FOR DELETE
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

-- Orders: buyer sees own; seller sees orders for their shop
CREATE POLICY orders_buyer_read ON public.orders FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY orders_seller_read ON public.orders FOR SELECT
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY orders_buyer_insert ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY orders_buyer_update ON public.orders FOR UPDATE
  USING (buyer_id = auth.uid());

CREATE POLICY orders_seller_update ON public.orders FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

-- Runner: read dispatched orders in same delivery zone as buyer
CREATE POLICY orders_runner_select ON public.orders FOR SELECT
  USING (
    status = 'DISPATCHED'
    AND EXISTS (
      SELECT 1
      FROM public.users ru
      JOIN public.users bu ON bu.id = buyer_id
      WHERE ru.id = auth.uid()
        AND ru.role = 'runner'
        AND ru.delivery_zone IS NOT NULL
        AND bu.delivery_zone = ru.delivery_zone
    )
  );

CREATE POLICY orders_runner_update ON public.orders FOR UPDATE
  USING (
    status IN ('DISPATCHED', 'LOCKED')
    AND EXISTS (
      SELECT 1
      FROM public.users ru
      JOIN public.users bu ON bu.id = buyer_id
      WHERE ru.id = auth.uid()
        AND ru.role = 'runner'
        AND ru.delivery_zone IS NOT NULL
        AND bu.delivery_zone = ru.delivery_zone
    )
  );

-- Carts: buyer only
CREATE POLICY carts_own ON public.carts FOR ALL
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Server-led tables: block direct client access (service role bypasses RLS)
CREATE POLICY payment_logs_deny ON public.payment_logs FOR ALL USING (FALSE);
CREATE POLICY shop_tx_deny ON public.shop_transactions FOR ALL USING (FALSE);
CREATE POLICY admin_audit_deny ON public.admin_audit_logs FOR ALL USING (FALSE);
