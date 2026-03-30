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
  const { name, description, sku, category_id, brand_id, unit_price, stock_quantity, min_stock_level, image_uri } = product;
  const result = db.runSync(
    `INSERT INTO products (name, description, sku, category_id, brand_id, unit_price, stock_quantity, min_stock_level, image_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description ?? null, sku ?? null, category_id ?? null, brand_id ?? null, unit_price ?? 0, stock_quantity ?? 0, min_stock_level ?? 0, image_uri ?? null]
  );
  return result.lastInsertRowId;
}

export function updateProduct(id, product) {
  const db = getDatabase();
  const { name, description, sku, category_id, brand_id, unit_price, stock_quantity, min_stock_level, image_uri } = product;
  db.runSync(
    `UPDATE products SET name = ?, description = ?, sku = ?, category_id = ?, brand_id = ?,
      unit_price = ?, stock_quantity = ?, min_stock_level = ?, image_uri = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [name, description ?? null, sku ?? null, category_id ?? null, brand_id ?? null, unit_price ?? 0, stock_quantity ?? 0, min_stock_level ?? 0, image_uri ?? null, id]
  );
}

export function deleteProduct(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM products WHERE id = ?', [id]);
}

export function getLowStockProducts() {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM products WHERE stock_quantity <= min_stock_level ORDER BY stock_quantity ASC');
}

export function searchProducts(query) {
  const db = getDatabase();
  const like = `%${query}%`;
  return db.getAllSync(
    'SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? ORDER BY name ASC',
    [like, like]
  );
}
