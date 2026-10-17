-- Migration: Stock deduction on sale and stock restoration on sale delete
-- Ensures stocked products (Cihaz / Telefon / Tablet / positive stock items) automatically decrement stock on sale
-- and restore stock when a sale is deleted. Supports manual lookup by name, barcode, or IMEI.

CREATE OR REPLACE FUNCTION add_sale_atomic(sale_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id text;
  v_date text;
  v_cari_id text;
  v_total_amount numeric;
  v_payment_method text;
  v_notes text;
  v_item jsonb;
  v_product_id text;
  v_price numeric;
  v_quantity int;
  v_prod_type text;
  v_prod_category text;
  v_prod_stock numeric;
  v_cari_balance numeric;
  v_tx_id text;
BEGIN
  v_sale_id := 's_' || (extract(epoch from now()) * 1000)::bigint::text;
  v_date := COALESCE(sale_data->>'date', to_char(now(), 'YYYY-MM-DD'));
  v_cari_id := COALESCE(sale_data->>'cari_id', 'pesin');
  v_total_amount := (sale_data->>'total_amount')::numeric;
  v_payment_method := COALESCE(sale_data->>'payment_method', 'Nakit');
  v_notes := COALESCE(sale_data->>'notes', '');

  INSERT INTO sales (id, date, cari_id, total_amount, payment_method, notes)
  VALUES (v_sale_id, v_date, v_cari_id, v_total_amount, v_payment_method, v_notes);

  FOR v_item IN SELECT * FROM jsonb_array_elements(sale_data->'items')
  LOOP
    v_product_id := v_item->>'product_id';
    v_price := (v_item->>'price')::numeric;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);

    -- If product_id is missing or 'manual', attempt to match existing product by exact name, barcode or imei
    IF v_product_id IS NULL OR v_product_id = 'manual' OR v_product_id = '' THEN
      SELECT id, type, category, stock INTO v_product_id, v_prod_type, v_prod_category, v_prod_stock 
      FROM products 
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(v_item->>'name'))
         OR (barcode IS NOT NULL AND barcode = TRIM(v_item->>'name'))
         OR (imei IS NOT NULL AND imei = TRIM(v_item->>'name'))
      LIMIT 1;
    ELSE
      SELECT type, category, stock INTO v_prod_type, v_prod_category, v_prod_stock 
      FROM products 
      WHERE id = v_product_id;
    END IF;

    -- Insert into sale_items with resolved product_id
    INSERT INTO sale_items (sale_id, product_id, name, price, quantity)
    VALUES (v_sale_id, COALESCE(v_product_id, 'manual'), v_item->>'name', v_price, v_quantity);

    -- Decrement stock if stocked product (Cihaz, Telefon, Tablet or item with positive stock)
    IF v_product_id IS NOT NULL AND v_product_id != 'manual' THEN
      IF v_prod_type = 'Cihaz' 
         OR v_prod_category IN ('Telefon', 'Tablet') 
         OR (v_prod_type = 'Ürün' AND v_prod_stock IS NOT NULL AND v_prod_stock > 0) THEN
        UPDATE products 
        SET stock = GREATEST(0, stock - v_quantity) 
        WHERE id = v_product_id;
      END IF;
    END IF;
  END LOOP;

  -- Cari balance update
  IF v_cari_id != 'pesin' THEN
    SELECT balance INTO v_cari_balance FROM cariler WHERE id = v_cari_id;
    IF FOUND THEN
      UPDATE cariler SET balance = v_cari_balance + v_total_amount WHERE id = v_cari_id;
      v_tx_id := 'tx_' || (extract(epoch from now()) * 1000)::bigint::text || '_' || floor(random() * 1000)::text;
      INSERT INTO cari_transactions (id, cari_id, date, type, amount, description)
      VALUES (v_tx_id, v_cari_id, v_date, 'Borç', v_total_amount, 'Satış İşlemi');
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_sale_id);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '%', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION delete_sale_atomic(p_sale_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cari_id text;
  v_total_amount numeric;
  v_item record;
  v_prod_type text;
  v_prod_category text;
BEGIN
  SELECT cari_id, total_amount INTO v_cari_id, v_total_amount FROM sales WHERE id = p_sale_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Satış bulunamadı!';
  END IF;

  -- Revert stock for all items that reduced stock
  FOR v_item IN SELECT product_id, quantity FROM sale_items WHERE sale_id = p_sale_id
  LOOP
    IF v_item.product_id IS NOT NULL AND v_item.product_id != 'manual' THEN
      SELECT type, category INTO v_prod_type, v_prod_category FROM products WHERE id = v_item.product_id;
      IF FOUND THEN
        IF v_prod_type = 'Cihaz' OR v_prod_category IN ('Telefon', 'Tablet') OR v_prod_type = 'Ürün' THEN
          UPDATE products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
        END IF;
      END IF;
    END IF;
  END LOOP;

  IF v_cari_id != 'pesin' THEN
    UPDATE cariler SET balance = GREATEST(0, balance - v_total_amount) WHERE id = v_cari_id;
    DELETE FROM cari_transactions WHERE cari_id = v_cari_id AND (description = 'Satış İşlemi' OR description = 'Satis Islemi') AND amount = v_total_amount;
  END IF;

  DELETE FROM sale_items WHERE sale_id = p_sale_id;
  DELETE FROM sales WHERE id = p_sale_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '%', SQLERRM;
END;
$$;
