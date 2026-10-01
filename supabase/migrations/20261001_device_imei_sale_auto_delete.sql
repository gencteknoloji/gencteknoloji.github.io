-- 1. Add purchase_price and imei columns to sale_items if they do not exist
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS purchase_price double precision DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS imei text;

-- 2. Update add_sale_atomic to match by IMEI and delete sold devices directly from products
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
  v_prod_purchase_price numeric;
  v_prod_imei text;
  v_prod_name text;
  v_item_name text;
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
    v_item_name := TRIM(v_item->>'name');
    v_prod_type := NULL;
    v_prod_category := NULL;
    v_prod_stock := NULL;
    v_prod_purchase_price := 0;
    v_prod_imei := NULL;
    v_prod_name := NULL;

    -- Match product
    IF v_product_id IS NOT NULL AND v_product_id != 'manual' AND v_product_id != '' THEN
      SELECT type, category, stock, purchase_price, imei, name 
      INTO v_prod_type, v_prod_category, v_prod_stock, v_prod_purchase_price, v_prod_imei, v_prod_name
      FROM products 
      WHERE id = v_product_id;
    END IF;

    -- If not found by product_id, match by IMEI, barcode or exact name
    IF v_prod_type IS NULL THEN
      SELECT id, type, category, stock, purchase_price, imei, name 
      INTO v_product_id, v_prod_type, v_prod_category, v_prod_stock, v_prod_purchase_price, v_prod_imei, v_prod_name
      FROM products 
      WHERE (imei IS NOT NULL AND (imei = v_item_name OR v_item_name LIKE '%' || imei || '%'))
         OR (barcode IS NOT NULL AND barcode = v_item_name)
         OR LOWER(TRIM(name)) = LOWER(v_item_name)
      ORDER BY 
        CASE 
          WHEN imei IS NOT NULL AND (imei = v_item_name OR v_item_name LIKE '%' || imei || '%') THEN 1
          WHEN barcode IS NOT NULL AND barcode = v_item_name THEN 2
          ELSE 3
        END
      LIMIT 1;
    END IF;

    -- Format display name with IMEI if device
    IF v_prod_imei IS NOT NULL AND v_prod_imei != '' AND v_item_name NOT LIKE '%' || v_prod_imei || '%' THEN
      v_item_name := COALESCE(v_prod_name, v_item_name) || ' (IMEI: ' || v_prod_imei || ')';
    END IF;

    -- Insert into sale_items with snapshot of purchase_price and imei
    INSERT INTO sale_items (sale_id, product_id, name, price, quantity, purchase_price, imei)
    VALUES (
      v_sale_id, 
      COALESCE(v_product_id, 'manual'), 
      v_item_name, 
      v_price, 
      v_quantity, 
      COALESCE(v_prod_purchase_price, 0),
      v_prod_imei
    );

    -- Stock operations
    IF v_product_id IS NOT NULL AND v_product_id != 'manual' THEN
      IF v_prod_type = 'Cihaz' OR v_prod_category IN ('Telefon', 'Tablet') OR v_prod_imei IS NOT NULL THEN
        -- Cihaz bazlı satış: IMEI numarasına göre cihaz direkt stoktan tamamen silinir
        DELETE FROM products WHERE id = v_product_id;
      ELSIF v_prod_type = 'Ürün' AND v_prod_stock IS NOT NULL AND v_prod_stock > 0 THEN
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

-- 3. Update delete_sale_atomic to support restoring deleted devices if a sale is cancelled
CREATE OR REPLACE FUNCTION delete_sale_atomic(p_sale_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cari_id text;
  v_total_amount numeric;
  v_item record;
  v_prod_exists boolean;
BEGIN
  SELECT cari_id, total_amount INTO v_cari_id, v_total_amount FROM sales WHERE id = p_sale_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Satış bulunamadı!';
  END IF;

  -- Revert stock or restore deleted devices
  FOR v_item IN SELECT product_id, name, price, quantity, purchase_price, imei FROM sale_items WHERE sale_id = p_sale_id
  LOOP
    IF v_item.product_id IS NOT NULL AND v_item.product_id != 'manual' THEN
      SELECT EXISTS(SELECT 1 FROM products WHERE id = v_item.product_id) INTO v_prod_exists;
      IF v_prod_exists THEN
        UPDATE products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
      ELSIF v_item.imei IS NOT NULL AND v_item.imei != '' THEN
        -- Restore deleted device back to products
        INSERT INTO products (id, type, name, imei, category, stock, purchase_price, sale_price, kdv_ratio, is_no_profit)
        VALUES (
          v_item.product_id, 
          'Cihaz', 
          REPLACE(v_item.name, ' (IMEI: ' || v_item.imei || ')', ''), 
          v_item.imei, 
          'Telefon', 
          1, 
          COALESCE(v_item.purchase_price, 0), 
          v_item.price, 
          20, 
          0
        )
        ON CONFLICT (id) DO NOTHING;
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
