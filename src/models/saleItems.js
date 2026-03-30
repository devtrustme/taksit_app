import { getDatabase } from '../database/db';

export function getSaleItemsBySale(saleId) {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);
}

export function createSaleItem(item) {
  const db = getDatabase();
  const { sale_id, product_id, product_name, model_at_sale, buy_price_at_sale, sell_price_at_sale } = item;
  const result = db.runSync(
    `INSERT INTO sale_items (sale_id, product_id, product_name, model_at_sale, buy_price_at_sale, sell_price_at_sale)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sale_id, product_id ?? null, product_name ?? null, model_at_sale ?? null, buy_price_at_sale ?? 0, sell_price_at_sale ?? 0]
  );
  return result.lastInsertRowId;
}

export function deleteSaleItemsBySale(saleId) {
  const db = getDatabase();
  db.runSync('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
}
