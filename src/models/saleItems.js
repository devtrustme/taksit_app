import { getDatabase } from '../database/db';

export function getSaleItemsBySale(saleId) {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT si.*, p.name AS product_name, p.sku AS product_sku
     FROM sale_items si
     JOIN products p ON si.product_id = p.id
     WHERE si.sale_id = ?`,
    [saleId]
  );
}

export function createSaleItem(saleItem) {
  const db = getDatabase();
  const { sale_id, product_id, quantity, unit_price } = saleItem;
  const total_price = quantity * unit_price;
  const result = db.runSync(
    `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
     VALUES (?, ?, ?, ?, ?)`,
    [sale_id, product_id, quantity, unit_price, total_price]
  );
  db.runSync(
    `UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = datetime('now') WHERE id = ?`,
    [quantity, product_id]
  );
  return result.lastInsertRowId;
}

export function deleteSaleItem(id) {
  const db = getDatabase();
  const item = db.getFirstSync('SELECT * FROM sale_items WHERE id = ?', [id]);
  if (item) {
    db.runSync(
      `UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE id = ?`,
      [item.quantity, item.product_id]
    );
  }
  db.runSync('DELETE FROM sale_items WHERE id = ?', [id]);
}

export function getSaleItemsByProduct(productId) {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT si.*, s.created_at AS sale_date, c.full_name AS client_name
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     JOIN clients c ON s.client_id = c.id
     WHERE si.product_id = ?
     ORDER BY s.created_at DESC`,
    [productId]
  );
}
