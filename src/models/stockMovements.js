import { getDatabase } from '../database/db';

export function getStockMovements(productId) {
  const db = getDatabase();
  return db.getAllSync(
    'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC',
    [productId]
  );
}

export function getAllStockMovements() {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT sm.*, p.name AS product_name
     FROM stock_movements sm
     JOIN products p ON sm.product_id = p.id
     ORDER BY sm.created_at DESC`
  );
}

export function createStockMovement(movement) {
  const db = getDatabase();
  const { product_id, movement_type, quantity, reference_id, reference_type, notes } = movement;
  const result = db.runSync(
    `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, reference_type, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [product_id, movement_type, quantity, reference_id ?? null, reference_type ?? null, notes ?? null]
  );

  if (movement_type === 'in') {
    db.runSync(
      `UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE id = ?`,
      [quantity, product_id]
    );
  } else if (movement_type === 'out') {
    db.runSync(
      `UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = datetime('now') WHERE id = ?`,
      [quantity, product_id]
    );
  }

  return result.lastInsertRowId;
}
