import { db } from '@/lib/db/client';
import { sha256 } from '@/lib/db/crypto';
import { getSupabaseClient } from '@/lib/supabase';
import { toInt, toNum } from '@/lib/utils/numbers';
import type {
  AuthUser,
  Cari,
  CariInput,
  CariTransaction,
  ChartPoint,
  DailyClosing,
  DashboardData,
  Expense,
  Product,
  ExpenseInput,
  ProductInput,
  Sale,
  SaleInput,
  SaleItem,
  TurkcellDeviceInput,
  TurkcellPremiumInput,
  TurkcellDevice,
  TurkcellPremium,
  User,
} from '@/types/database';

export const dbService = {
  async getCustomers(): Promise<Cari[]> {
    return db.all<Cari>('SELECT * FROM cariler ORDER BY id DESC');
  },

  async addCustomer(cari: CariInput): Promise<Cari> {
    const newCari = {
      id: 'c_' + Date.now(),
      name: cari.name,
      phone: cari.phone || '',
      email: cari.email || '',
      address: cari.address || '',
      balance: toNum(cari.balance) || 0.0,
      cari_type: cari.cari_type || 'Bireysel',
      tax_office: cari.tax_office || '',
      tax_number: cari.tax_number || '',
      tc_number: cari.tc_number || ''
    };

    await db.run('BEGIN TRANSACTION');
    try {
      await db.run(
        `INSERT INTO cariler (id, name, phone, email, address, balance, cari_type, tax_office, tax_number, tc_number) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newCari.id, newCari.name, newCari.phone, newCari.email, newCari.address, newCari.balance, newCari.cari_type, newCari.tax_office, newCari.tax_number, newCari.tc_number]
      );
      
      if (newCari.balance !== 0) {
        const txId = 't_' + Date.now();
        await db.run(
          `INSERT INTO cari_transactions (id, cari_id, date, type, amount, description) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [txId, newCari.id, new Date().toLocaleDateString('sv-SE'), 'Borç', Math.abs(newCari.balance), 'Açılış Bakiyesi']
        );
      }
      await db.run('COMMIT');
      return newCari;
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  },

  async logPayment(id: string, action: string, amount: number | string, description: string, date: string) {
    const parsedAmount = toNum(amount) || 0;
    await db.run('BEGIN TRANSACTION');
    try {
      const currentCari = await db.get<{ balance: number }>('SELECT balance FROM cariler WHERE id = ?', [id]);
      if (!currentCari) throw new Error('Cari bulunamadı!');
      
      let newBal = currentCari.balance;
      let txType = 'Tahsilat';
      
      if (action === 'tahsilat' || action === 'odeme') {
        newBal = newBal - parsedAmount;
        txType = 'Tahsilat';
      } else if (action === 'borc_ekle') {
        newBal = newBal + parsedAmount;
        txType = 'Borç';
      }
      
      await db.run('UPDATE cariler SET balance = ? WHERE id = ?', [newBal, id]);
      
      const txId = 't_' + Date.now();
      await db.run(
        `INSERT INTO cari_transactions (id, cari_id, date, type, amount, description) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [txId, id, date, txType, parsedAmount, description]
      );
      
      await db.run('COMMIT');
      return { success: true };
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  },

  async deleteCariTransaction(transactionId: string) {
    await db.run('BEGIN TRANSACTION');
    try {
      const tx = await db.get<CariTransaction>('SELECT * FROM cari_transactions WHERE id = ?', [transactionId]);
      if (!tx) throw new Error('İşlem bulunamadı!');
      
      const cari = await db.get<{ balance: number }>('SELECT balance FROM cariler WHERE id = ?', [tx.cari_id]);
      if (!cari) throw new Error('Cari bulunamadı!');
      
      let newBal = cari.balance;
      if (tx.type === 'Tahsilat') {
        newBal = newBal + tx.amount;
      } else if (tx.type === 'Borç') {
        newBal = newBal - tx.amount;
      }
      
      await db.run('UPDATE cariler SET balance = ? WHERE id = ?', [newBal, tx.cari_id]);
      await db.run('DELETE FROM cari_transactions WHERE id = ?', [transactionId]);
      await db.run('COMMIT');
      return { success: true };
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  },

  async updateCariTransaction(transactionId: string, amount: number | string, description: string, date: string) {
    const parsedAmount = toNum(amount) || 0;
    await db.run('BEGIN TRANSACTION');
    try {
      const tx = await db.get<CariTransaction>('SELECT * FROM cari_transactions WHERE id = ?', [transactionId]);
      if (!tx) throw new Error('İşlem bulunamadı!');
      
      const cari = await db.get<{ balance: number }>('SELECT balance FROM cariler WHERE id = ?', [tx.cari_id]);
      if (!cari) throw new Error('Cari bulunamadı!');
      
      let intermediateBal = cari.balance;
      if (tx.type === 'Tahsilat') {
        intermediateBal = intermediateBal + tx.amount;
      } else if (tx.type === 'Borç') {
        intermediateBal = intermediateBal - tx.amount;
      }
      
      let newBal = intermediateBal;
      if (tx.type === 'Tahsilat') {
        newBal = newBal - parsedAmount;
      } else if (tx.type === 'Borç') {
        newBal = newBal + parsedAmount;
      }
      
      await db.run('UPDATE cariler SET balance = ? WHERE id = ?', [newBal, tx.cari_id]);
      await db.run(
        `UPDATE cari_transactions 
         SET amount = ?, description = ?, date = ? 
         WHERE id = ?`,
        [parsedAmount, description, date, transactionId]
      );
      
      await db.run('COMMIT');
      return { success: true };
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  },

  async getCariTransactions(cariId: string): Promise<CariTransaction[]> {
    return db.all<CariTransaction>('SELECT * FROM cari_transactions WHERE cari_id = ? ORDER BY date DESC, id DESC', [cariId]);
  },

  async deleteCustomer(id: string) {
    await db.run('BEGIN TRANSACTION');
    try {
      await db.run('DELETE FROM cari_transactions WHERE cari_id = ?', [id]);
      await db.run('DELETE FROM cariler WHERE id = ?', [id]);
      await db.run("UPDATE sales SET cari_id = 'pesin' WHERE cari_id = ?", [id]);
      await db.run('COMMIT');
      return { success: true };
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  },

  async updateCustomer(id: string, cari: CariInput) {
    await db.run(
      `UPDATE cariler 
       SET name = ?, phone = ?, email = ?, address = ?, cari_type = ?, tax_office = ?, tax_number = ?, tc_number = ?
       WHERE id = ?`,
      [cari.name, cari.phone, cari.email, cari.address, cari.cari_type, cari.tax_office, cari.tax_number, cari.tc_number, id]
    );
    return { success: true };
  },

  // --- ÜRÜN & STOK ---
  async getProducts(): Promise<Product[]> {
    return db.all<Product>('SELECT * FROM products ORDER BY id DESC');
  },

  async addProduct(product: ProductInput): Promise<Product> {
    // Normalize imei and barcode: empty string -> null to avoid UNIQUE constraint violation
    const imeiVal = product.imei && String(product.imei).trim() !== '' ? String(product.imei).trim() : null;
    const barcodeVal = product.barcode && String(product.barcode).trim() !== '' ? String(product.barcode).trim() : null;

    const newProd = {
      id: 'p_' + Date.now(),
      type: product.type || 'Diğer',
      barcode: barcodeVal,
      name: product.name,
      imei: imeiVal,
      category: product.category || 'Diğer',
      stock: product.type === 'Cihaz' ? 1 : (toInt(product.stock) || 0),
      purchase_price: toNum(product.purchase_price) || 0,
      sale_price: toNum(product.sale_price) || 0,
      kdv_ratio: toInt(product.kdv_ratio) || 20
    };

    if (barcodeVal) {
      const dupBarcode = await db.get<{ id: string }>('SELECT id FROM products WHERE barcode = ?', [barcodeVal]);
      if (dupBarcode) throw new Error('Bu barkod zaten kayıtlı!');
    }

    if (imeiVal) {
      const dupImei = await db.get<{ id: string }>('SELECT id FROM products WHERE imei = ?', [imeiVal]);
      if (dupImei) throw new Error('Bu IMEI numarası zaten kayıtlı!');
    }

    await db.run(
      `INSERT INTO products (id, type, barcode, name, imei, category, stock, purchase_price, sale_price, kdv_ratio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newProd.id, newProd.type, newProd.barcode, newProd.name, newProd.imei, newProd.category, newProd.stock, newProd.purchase_price, newProd.sale_price, newProd.kdv_ratio]
    );
    return newProd;
  },

  async updateProductStock(id: string, change: number) {
    await db.run('UPDATE products SET stock = GREATEST(0, stock + ?) WHERE id = ?', [change, id]);
    return db.get<Product>('SELECT * FROM products WHERE id = ?', [id]);
  },

  async deleteProduct(id: string) {
    await db.run('DELETE FROM products WHERE id = ?', [id]);
    return { success: true };
  },

  async updateProduct(id: string, product: ProductInput) {
    // Normalize imei and barcode: empty string -> null to avoid UNIQUE constraint violation
    const imeiVal = product.imei && String(product.imei).trim() !== '' ? String(product.imei).trim() : null;
    const barcodeVal = product.barcode && String(product.barcode).trim() !== '' ? String(product.barcode).trim() : null;

    if (barcodeVal) {
      const dupBarcode = await db.get<{ id: string }>('SELECT id FROM products WHERE barcode = ? AND id != ?', [barcodeVal, id]);
      if (dupBarcode) throw new Error('Bu barkod başka bir üründe zaten kayıtlı!');
    }

    if (imeiVal) {
      const dupImei = await db.get<{ id: string }>('SELECT id FROM products WHERE imei = ? AND id != ?', [imeiVal, id]);
      if (dupImei) throw new Error('Bu IMEI numarası başka bir cihazda zaten kayıtlı!');
    }

    const updatedProd = {
      type: product.type || 'Diğer',
      barcode: barcodeVal,
      name: product.name,
      imei: imeiVal,
      category: product.category || 'Diğer',
      stock: product.type === 'Cihaz' ? 1 : (toInt(product.stock) || 0),
      purchase_price: toNum(product.purchase_price) || 0,
      sale_price: toNum(product.sale_price) || 0,
      kdv_ratio: toInt(product.kdv_ratio) || 20
    };

    await db.run(
      `UPDATE products 
       SET type = ?, barcode = ?, name = ?, imei = ?, category = ?, stock = ?, purchase_price = ?, sale_price = ?, kdv_ratio = ?
       WHERE id = ?`,
      [updatedProd.type, updatedProd.barcode, updatedProd.name, updatedProd.imei, updatedProd.category, updatedProd.stock, updatedProd.purchase_price, updatedProd.sale_price, updatedProd.kdv_ratio, id]
    );

    return db.get<Product>('SELECT * FROM products WHERE id = ?', [id]);
  },

  async getSales(): Promise<Sale[]> {
    const sales = await db.all<Sale>('SELECT * FROM sales ORDER BY id DESC');
    for (const s of sales) {
      s.items = await db.all<SaleItem>('SELECT id, product_id, quantity, price, name FROM sale_items WHERE sale_id = ?', [s.id]);
    }
    return sales;
  },

  async addSale(sale: SaleInput) {
    const saleId = 's_' + Date.now();
    const saleData = {
      id: saleId,
      date: sale.date || new Date().toLocaleDateString('sv-SE'),
      cari_id: sale.cari_id || 'pesin',
      total_amount: toNum(sale.total_amount) || 0,
      payment_method: sale.payment_method || 'Nakit',
      notes: sale.notes || ''
    };

    await db.run('BEGIN TRANSACTION');
    try {
      await db.run(
        `INSERT INTO sales (id, date, cari_id, total_amount, payment_method, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [saleData.id, saleData.date, saleData.cari_id, saleData.total_amount, saleData.payment_method, saleData.notes]
      );

      for (const item of sale.items) {
        await db.run(
          `INSERT INTO sale_items (sale_id, product_id, name, price, quantity)
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, item.product_id, item.name, toNum(item.price) || 0, toInt(item.quantity) || 1]
        );

        const prod = await db.get<{ type: string; stock: number }>('SELECT type, stock FROM products WHERE id = ?', [item.product_id]);
        if (prod && prod.type !== 'Hizmet') {
          await db.run('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [item.quantity, item.product_id]);
        }
      }

      if (saleData.cari_id !== 'pesin') {
        const cari = await db.get<{ balance: number }>('SELECT balance FROM cariler WHERE id = ?', [saleData.cari_id]);
        if (cari) {
          const newBalance = cari.balance + saleData.total_amount;
          await db.run('UPDATE cariler SET balance = ? WHERE id = ?', [newBalance, saleData.cari_id]);
          
          const txId = 'tx_' + Date.now();
          await db.run(
            `INSERT INTO cari_transactions (id, cari_id, date, type, amount, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [txId, saleData.cari_id, saleData.date, 'Borç', saleData.total_amount, 'Satış İşlemi']
          );
        }
      }

      await db.run('COMMIT');
      return { success: true, id: saleId };
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  },

  async deleteSale(id: string) {
    await db.run('BEGIN TRANSACTION');
    try {
      const sale = await db.get<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
      if (!sale) throw new Error('Satış bulunamadı!');

      const items = await db.all('SELECT * FROM sale_items WHERE sale_id = ?', [id]);
      for (const item of items) {
        const prod = await db.get<{ type: string }>('SELECT type FROM products WHERE id = ?', [item.product_id]);
        if (prod && prod.type !== 'Hizmet') {
          await db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
        }
      }

      if (sale.cari_id !== 'pesin') {
        const cari = await db.get<{ balance: number }>('SELECT balance FROM cariler WHERE id = ?', [sale.cari_id]);
        if (cari) {
          const newBalance = Math.max(0, cari.balance - sale.total_amount);
          await db.run('UPDATE cariler SET balance = ? WHERE id = ?', [newBalance, sale.cari_id]);
          await db.run("DELETE FROM cari_transactions WHERE cari_id = ? AND description = 'Satış İşlemi' AND amount = ?", [sale.cari_id, sale.total_amount]);
        }
      }

      await db.run('DELETE FROM sale_items WHERE sale_id = ?', [id]);
      await db.run('DELETE FROM sales WHERE id = ?', [id]);

      await db.run('COMMIT');
      return { success: true };
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  },

  async deleteSaleItem(saleId: string, itemId: number) {
    await db.run('BEGIN TRANSACTION');
    try {
      const sale = await db.get<Sale>('SELECT * FROM sales WHERE id = ?', [saleId]);
      if (!sale) throw new Error('Satış bulunamadı!');

      const item = await db.get<SaleItem>('SELECT * FROM sale_items WHERE id = ?', [itemId]);
      if (!item) throw new Error('Satış kalemi bulunamadı!');

      // Revert stock for the deleted item
      const prod = await db.get<{ type: string }>('SELECT type FROM products WHERE id = ?', [item.product_id]);
      if (prod && prod.type !== 'Hizmet') {
        await db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }

      // Delete the item
      await db.run('DELETE FROM sale_items WHERE id = ?', [itemId]);

      // Calculate new total amount for this sale
      const remainingItems = await db.all<{ price: number; quantity: number }>('SELECT price, quantity FROM sale_items WHERE sale_id = ?', [saleId]);
      
      if (remainingItems.length === 0) {
        // If no items are left, delete the entire sale
        if (sale.cari_id !== 'pesin') {
          const cari = await db.get<{ balance: number }>('SELECT balance FROM cariler WHERE id = ?', [sale.cari_id]);
          if (cari) {
            const newBalance = Math.max(0, cari.balance - sale.total_amount);
            await db.run('UPDATE cariler SET balance = ? WHERE id = ?', [newBalance, sale.cari_id]);
            await db.run("DELETE FROM cari_transactions WHERE cari_id = ? AND description = 'Satış İşlemi' AND amount = ?", [sale.cari_id, sale.total_amount]);
          }
        }
        await db.run('DELETE FROM sales WHERE id = ?', [saleId]);
      } else {
        // Otherwise, update the sale total
        const newTotalAmount = remainingItems.reduce((sum, itm) => sum + (itm.price * itm.quantity), 0);
        const diffAmount = sale.total_amount - newTotalAmount;

        await db.run('UPDATE sales SET total_amount = ? WHERE id = ?', [newTotalAmount, saleId]);

        // If it's a Cari sale, update Cari balance and the cari transaction
        if (sale.cari_id !== 'pesin') {
          const cari = await db.get<{ balance: number }>('SELECT balance FROM cariler WHERE id = ?', [sale.cari_id]);
          if (cari) {
            const newBalance = Math.max(0, cari.balance - diffAmount);
            await db.run('UPDATE cariler SET balance = ? WHERE id = ?', [newBalance, sale.cari_id]);
            // Update the transaction amount in cari_transactions
            await db.run("UPDATE cari_transactions SET amount = ? WHERE cari_id = ? AND description = 'Satış İşlemi' AND amount = ?", [newTotalAmount, sale.cari_id, sale.total_amount]);
          }
        }
      }

      await db.run('COMMIT');
      return { success: true };
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  },

  async updateSaleItem(saleId: string, itemId: number, newPrice: number | string, newQuantity: number | string) {
    await db.run('BEGIN TRANSACTION');
    try {
      const sale = await db.get<Sale>('SELECT * FROM sales WHERE id = ?', [saleId]);
      if (!sale) throw new Error('Satış bulunamadı!');

      const item = await db.get<SaleItem>('SELECT * FROM sale_items WHERE id = ?', [itemId]);
      if (!item) throw new Error('Satış kalemi bulunamadı!');

      // Revert old stock and add new stock difference
      const prod = await db.get<{ type: string }>('SELECT type FROM products WHERE id = ?', [item.product_id]);
      if (prod && prod.type !== 'Hizmet') {
        const stockDiff = item.quantity - toInt(newQuantity, 1);
        await db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [stockDiff, item.product_id]);
      }

      // Update the item
      await db.run(
        'UPDATE sale_items SET price = ?, quantity = ? WHERE id = ?',
        [toNum(newPrice) || 0, toInt(newQuantity) || 1, itemId]
      );

      // Recalculate sale total
      const allItems = await db.all<{ price: number; quantity: number }>('SELECT price, quantity FROM sale_items WHERE sale_id = ?', [saleId]);
      const newTotalAmount = allItems.reduce((sum, itm) => sum + (itm.price * itm.quantity), 0);
      const diffAmount = newTotalAmount - sale.total_amount;

      await db.run('UPDATE sales SET total_amount = ? WHERE id = ?', [newTotalAmount, saleId]);

      // If it's a Cari sale, update Cari balance and the cari transaction
      if (sale.cari_id !== 'pesin') {
        const cari = await db.get<{ balance: number }>('SELECT balance FROM cariler WHERE id = ?', [sale.cari_id]);
        if (cari) {
          const newBalance = Math.max(0, cari.balance + diffAmount);
          await db.run('UPDATE cariler SET balance = ? WHERE id = ?', [newBalance, sale.cari_id]);
          // Update the transaction amount in cari_transactions
          await db.run("UPDATE cari_transactions SET amount = ? WHERE cari_id = ? AND description = 'Satış İşlemi' AND amount = ?", [newTotalAmount, sale.cari_id, sale.total_amount]);
        }
      }

      await db.run('COMMIT');
      return { success: true };
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  },

  // --- TURKCELL PRİMLERİ ---
  async getTurkcellPremiums(): Promise<TurkcellPremium[]> {
    return db.all<TurkcellPremium>('SELECT * FROM turkcell_premiums ORDER BY date DESC, id DESC');
  },

  async addTurkcellPremium(premium: TurkcellPremiumInput) {
    const newPremium = {
      id: 'tp_' + Date.now(),
      date: premium.date,
      description: premium.description,
      amount: toNum(premium.amount) || 0,
      notes: premium.notes || ''
    };
    await db.run(
      `INSERT INTO turkcell_premiums (id, date, description, amount, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [newPremium.id, newPremium.date, newPremium.description, newPremium.amount, newPremium.notes]
    );
    return newPremium;
  },

  async updateTurkcellPremium(id: string, premium: TurkcellPremiumInput) {
    await db.run(
      `UPDATE turkcell_premiums 
       SET date = ?, description = ?, amount = ?, notes = ? 
       WHERE id = ?`,
      [premium.date, premium.description, toNum(premium.amount) || 0, premium.notes, id]
    );
    return { success: true };
  },

  async deleteTurkcellPremium(id: string) {
    await db.run('DELETE FROM turkcell_premiums WHERE id = ?', [id]);
    return { success: true };
  },

  // --- GİDERLER ---
  async getExpenses(): Promise<Expense[]> {
    return db.all<Expense>('SELECT * FROM expenses ORDER BY date DESC, id DESC');
  },

  async addExpense(expense: ExpenseInput) {
    const newExpense = {
      id: 'ex_' + Date.now(),
      date: expense.date,
      description: expense.description,
      amount: toNum(expense.amount) || 0,
      notes: expense.notes || ''
    };
    await db.run(
      `INSERT INTO expenses (id, date, description, amount, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [newExpense.id, newExpense.date, newExpense.description, newExpense.amount, newExpense.notes]
    );
    return newExpense;
  },

  async updateExpense(id: string, expense: ExpenseInput) {
    await db.run(
      `UPDATE expenses 
       SET date = ?, description = ?, amount = ?, notes = ? 
       WHERE id = ?`,
      [expense.date, expense.description, toNum(expense.amount) || 0, expense.notes, id]
    );
    return { success: true };
  },

  async deleteExpense(id: string) {
    await db.run('DELETE FROM expenses WHERE id = ?', [id]);
    return { success: true };
  },

  // --- DASHBOARD VERİLERİ ---
  async getDashboard(): Promise<DashboardData> {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const tempDate = new Date();
    tempDate.setDate(tempDate.getDate() - 7);
    const sevenDaysAgoStr = tempDate.toLocaleDateString('sv-SE');
    const tempMonth = new Date();
    tempMonth.setDate(tempMonth.getDate() - 30);
    const thirtyDaysAgoStr = tempMonth.toLocaleDateString('sv-SE');

    const todaySalesRow = await db.get<{ total: number }>('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE date = ?', [todayStr]);
    const weekSalesRow = await db.get<{ total: number }>('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE date >= ?', [sevenDaysAgoStr]);
    const monthSalesRow = await db.get<{ total: number }>('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE date >= ?', [thirtyDaysAgoStr]);
    const totalCariReceivablesRow = await db.get<{ total: number }>('SELECT COALESCE(SUM(balance), 0) as total FROM cariler WHERE balance > 0');
    const criticalStockCountRow = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE category != 'Hizmet' AND stock < 5");
    const totalSalesCountRow = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM sales');
    const totalTurkcellProfitRow = await db.get<{ total: number }>('SELECT COALESCE(SUM(amount), 0) as total FROM turkcell_premiums');
    const totalExpensesRow = await db.get<{ total: number }>('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
    
    const totalProductProfitRow = await db.get<{ total: number }>(`
      SELECT COALESCE(SUM((s_item.price - prod.purchase_price) * s_item.quantity), 0) as total 
      FROM sale_items s_item 
      JOIN products prod ON s_item.product_id = prod.id 
      JOIN sales s ON s_item.sale_id = s.id 
      WHERE prod.type = 'Cihaz'
    `);

    const weeklyChart: ChartPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toLocaleDateString('sv-SE');
      const daySalesRow = await db.get<{ total: number }>('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE date = ?', [dStr]);
      weeklyChart.push({
        date: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
        amount: daySalesRow ? daySalesRow.total : 0
      });
    }

    const monthlyChart: ChartPoint[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('sv-SE');
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('sv-SE');
    const monthSalesRows = await db.all<{ date: string; total: number }>('SELECT date, SUM(total_amount) as total FROM sales WHERE date >= ? AND date <= ? GROUP BY date', [startOfMonth, endOfMonth]);
    
    const monthMap: Record<string, number> = {};
    monthSalesRows.forEach(r => {
      monthMap[r.date] = r.total;
    });

    for (let d = 1; d <= now.getDate(); d++) {
      const dObj = new Date(now.getFullYear(), now.getMonth(), d);
      const dStr = dObj.toLocaleDateString('sv-SE');
      monthlyChart.push({
        day: d,
        amount: monthMap[dStr] || 0
      });
    }

    return {
      metrics: {
        todaySales: todaySalesRow ? todaySalesRow.total : 0,
        weekSales: weekSalesRow ? weekSalesRow.total : 0,
        monthSales: monthSalesRow ? monthSalesRow.total : 0,
        totalCariReceivables: totalCariReceivablesRow ? totalCariReceivablesRow.total : 0,
        criticalStockCount: criticalStockCountRow ? criticalStockCountRow.count : 0,
        totalSalesCount: totalSalesCountRow ? totalSalesCountRow.count : 0,
        totalTurkcellProfit: totalTurkcellProfitRow ? totalTurkcellProfitRow.total : 0,
        totalExpenses: totalExpensesRow ? totalExpensesRow.total : 0,
        totalCihazProfit: totalProductProfitRow ? totalProductProfitRow.total : 0
      },
      weeklyChart,
      monthlyChart,
      serverIp: 'localhost'
    };
  },

  // --- TURKCELL CİHAZ STOK ---
  async getTurkcellStock(): Promise<TurkcellDevice[]> {
    return db.all<TurkcellDevice>('SELECT * FROM turkcell_devices ORDER BY date_added DESC, id DESC');
  },

  async addTurkcellDevice(device: TurkcellDeviceInput) {
    const newDevice = {
      id: 'td_' + Date.now(),
      device_name: device.device_name,
      imei: device.imei,
      purchase_price: toNum(device.purchase_price) || 0.0,
      sale_price: toNum(device.sale_price) || 0.0,
      status: device.status || 'Stokta',
      date_added: new Date().toLocaleDateString('sv-SE'),
      notes: device.notes || '',
      kdv_ratio: toInt(device.kdv_ratio) || 20
    };
    await db.run(
      `INSERT INTO turkcell_devices (id, device_name, imei, purchase_price, sale_price, status, date_added, notes, kdv_ratio) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newDevice.id, newDevice.device_name, newDevice.imei, newDevice.purchase_price, newDevice.sale_price, newDevice.status, newDevice.date_added, newDevice.notes, newDevice.kdv_ratio]
    );
    return newDevice;
  },

  async updateTurkcellDevice(id: string, device: TurkcellDeviceInput) {
    await db.run(
      `UPDATE turkcell_devices 
       SET device_name = ?, imei = ?, purchase_price = ?, sale_price = ?, status = ?, notes = ?, kdv_ratio = ? 
       WHERE id = ?`,
      [device.device_name, device.imei, toNum(device.purchase_price) || 0.0, toNum(device.sale_price) || 0.0, device.status, device.notes, toInt(device.kdv_ratio) || 20, id]
    );
    return db.get<TurkcellDevice>('SELECT * FROM turkcell_devices WHERE id = ?', [id]);
  },

  async deleteTurkcellDevice(id: string) {
    await db.run('DELETE FROM turkcell_devices WHERE id = ?', [id]);
    return { success: true };
  },

  // --- KULLANICI & YETKİLENDİRME ---
  async login(username: string, password: string): Promise<{ success: true; user: AuthUser }> {
    if (!getSupabaseClient()) {
      throw new Error('Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.');
    }
    const hashed = await sha256(password);
    const user = await db.get<{ id: string; username: string; password: string; role: string; permissions: string }>('SELECT id, username, password, role, permissions FROM users WHERE username = ?', [username.trim()]);
    if (!user || user.password !== hashed) {
      throw new Error('Kullanıcı adı veya şifre hatalı!');
    }
    
    let permissions = [];
    try {
      permissions = JSON.parse(user.permissions);
    } catch (e) {
      permissions = [];
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: permissions
      }
    };
  },

  async getUsers(): Promise<User[]> {
    const users = await db.all<{ id: string; username: string; role: string; permissions: string }>('SELECT id, username, role, permissions FROM users ORDER BY id DESC');
    return users.map(user => {
      let permissions: string[] = [];
      try {
        permissions = JSON.parse(user.permissions);
      } catch (e) {
        permissions = [];
      }
      return { ...user, permissions };
    });
  },

  async createUser(user: { username: string; password: string; role: string; permissions?: string[] }) {
    const { username, password, role, permissions } = user;
    const dupUser = await db.get<{ id: string }>('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (dupUser) throw new Error('Bu kullanıcı adı zaten alınmış!');

    const newUserId = 'u_' + Date.now();
    const hashed = await sha256(password);
    const serializedPermissions = JSON.stringify(permissions || []);

    await db.run(
      `INSERT INTO users (id, username, password, role, permissions) 
       VALUES (?, ?, ?, ?, ?)`,
      [newUserId, username.trim(), hashed, role, serializedPermissions]
    );
    return { success: true };
  },

  async updateUser(user: { id: string; username: string; password?: string; role: string; permissions?: string[] }) {
    const { id, username, password, role, permissions } = user;
    const dupUser = await db.get<{ id: string }>('SELECT id FROM users WHERE username = ? AND id != ?', [username.trim(), id]);
    if (dupUser) throw new Error('Bu kullanıcı adı başka bir kullanıcı tarafından kullanılıyor!');

    const serializedPermissions = JSON.stringify(permissions || []);

    if (password && password.trim() !== '') {
      const hashed = await sha256(password);
      await db.run(
        `UPDATE users 
         SET username = ?, password = ?, role = ?, permissions = ?
         WHERE id = ?`,
        [username.trim(), hashed, role, serializedPermissions, id]
      );
    } else {
      await db.run(
        `UPDATE users 
         SET username = ?, role = ?, permissions = ?
         WHERE id = ?`,
        [username.trim(), role, serializedPermissions, id]
      );
    }
    return { success: true };
  },

  async deleteUser(id: string) {
    const targetUser = await db.get<{ username: string }>('SELECT username FROM users WHERE id = ?', [id]);
    if (!targetUser) throw new Error('Kullanıcı bulunamadı!');
    if (targetUser.username === 'admin') throw new Error('Ana admin hesabı silinemez!');

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    return { success: true };
  },

  // --- GÜN SONU / DAILY CLOSINGS ---
  async getDailyClosings(): Promise<DailyClosing[]> {
    return db.all<DailyClosing>('SELECT * FROM daily_closings ORDER BY date DESC');
  },

  async saveDailyClosing(closing: DailyClosing) {
    const id = closing.id || 'dc_' + Date.now();
    const dateVal = closing.date;
    const cashRev = toNum(closing.cash_revenue) || 0;
    const cardRev = toNum(closing.card_revenue) || 0;
    const kSales = toNum(closing.kontor_sales) || 0;
    const fPayments = toNum(closing.fatura_payments) || 0;
    const todayExp = toNum(closing.today_expenses) || 0;
    const expCash = toNum(closing.expected_cash) || 0;
    const physCash = toNum(closing.physical_cash) || 0;
    const physCard = toNum(closing.physical_card) || 0;
    const cashDiff = toNum(closing.cash_diff) || 0;
    const cardDiff = toNum(closing.card_diff) || 0;

    // Check if duplicate date exists
    const existing = await db.get<{ id: string }>('SELECT id FROM daily_closings WHERE date = ?', [dateVal]);
    if (existing && existing.id !== id) {
      await db.run(
        `UPDATE daily_closings 
         SET cash_revenue = ?, card_revenue = ?, kontor_sales = ?, fatura_payments = ?, today_expenses = ?, expected_cash = ?, physical_cash = ?, physical_card = ?, cash_diff = ?, card_diff = ? 
         WHERE id = ?`,
        [cashRev, cardRev, kSales, fPayments, todayExp, expCash, physCash, physCard, cashDiff, cardDiff, existing.id]
      );
      return { success: true, id: existing.id };
    }

    if (closing.id) {
      await db.run(
        `UPDATE daily_closings 
         SET date = ?, cash_revenue = ?, card_revenue = ?, kontor_sales = ?, fatura_payments = ?, today_expenses = ?, expected_cash = ?, physical_cash = ?, physical_card = ?, cash_diff = ?, card_diff = ? 
         WHERE id = ?`,
        [dateVal, cashRev, cardRev, kSales, fPayments, todayExp, expCash, physCash, physCard, cashDiff, cardDiff, id]
      );
    } else {
      await db.run(
        `INSERT INTO daily_closings (id, date, cash_revenue, card_revenue, kontor_sales, fatura_payments, today_expenses, expected_cash, physical_cash, physical_card, cash_diff, card_diff) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, dateVal, cashRev, cardRev, kSales, fPayments, todayExp, expCash, physCash, physCard, cashDiff, cardDiff]
      );
    }
    return { success: true, id };
  }
};
