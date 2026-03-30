import { getDatabase } from '../database/db';

export function getAllProducts() {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT p.*, c.name AS category_name, b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     ORDER BY p.name ASC`
  );
}

export function getProductById(id) {
  const db = getDatabase();
  return db.getFirstSync(
    `SELECT p.*, c.name AS category_name, b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.id = ?`,
    [id]
  );
}

export function createProduct(product) {
  const db = getDatabase();
  const { category_id, brand_id, code, ref, model, name, buy_price, sell_price, stock_qty, stock_alert_qty } = product;
  const result = db.runSync(
    `INSERT INTO products (category_id, brand_id, code, ref, model, name, buy_price, sell_price, stock_qty, stock_alert_qty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      category_id ?? null, brand_id ?? null,
      code ?? null, ref ?? null, model ?? null,
      name, buy_price ?? 0, sell_price ?? 0,
      stock_qty ?? 0, stock_alert_qty ?? 1,
    ]
  );
  return result.lastInsertRowId;
}

export function updateProduct(id, product) {
  const db = getDatabase();
  const { category_id, brand_id, code, ref, model, name, buy_price, sell_price, stock_qty, stock_alert_qty } = product;
  db.runSync(
    `UPDATE products SET category_id=?, brand_id=?, code=?, ref=?, model=?, name=?,
      buy_price=?, sell_price=?, stock_qty=?, stock_alert_qty=? WHERE id=?`,
    [
      category_id ?? null, brand_id ?? null,
      code ?? null, ref ?? null, model ?? null,
      name, buy_price ?? 0, sell_price ?? 0,
      stock_qty ?? 0, stock_alert_qty ?? 1, id,
    ]
  );
}

export function deleteProduct(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM products WHERE id = ?', [id]);
}

export function getLowStockProducts() {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM products WHERE stock_qty <= stock_alert_qty ORDER BY stock_qty ASC');
}

export function searchProducts(query) {
  const db = getDatabase();
  const like = `%${query}%`;
  return db.getAllSync(
    `SELECT p.*, c.name AS category_name, b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.name LIKE ? OR p.model LIKE ? OR p.code LIKE ?
     ORDER BY p.name ASC`,
    [like, like, like]
  );
}

export function adjustStock(id, qty) {
  const db = getDatabase();
  db.runSync('UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?', [qty, id]);
}
