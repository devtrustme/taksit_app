import { getDatabase } from '../database/db';

export function getStockMovementsByProduct(productId) {
  const db = getDatabase();
  return db.getAllSync(
    'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY movement_date DESC',
    [productId]
  );
}

export function getAllStockMovements() {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT sm.*, p.name AS product_name
     FROM stock_movements sm
     JOIN products p ON sm.product_id = p.id
     ORDER BY sm.movement_date DESC`
  );
}

export function createStockMovement(movement) {
  const db = getDatabase();
  const { product_id, movement_type, quantity, reference_sale_id, notes } = movement;
  const result = db.runSync(
    `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_sale_id, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [product_id, movement_type, quantity, reference_sale_id ?? null, notes ?? null]
  );

  if (movement_type === 'entree') {
    db.runSync('UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?', [quantity, product_id]);
  } else if (movement_type === 'sortie') {
    db.runSync('UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?', [quantity, product_id]);
  }

  return result.lastInsertRowId;
}
