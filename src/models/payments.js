import { getDatabase } from '../database/db';

export function getAllPayments() {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT p.*, c.full_name AS client_name, s.total_amount AS sale_total
     FROM payments p
     JOIN clients c ON p.client_id = c.id
     JOIN sales s ON p.sale_id = s.id
     ORDER BY p.payment_date DESC`
  );
}

export function getPaymentsBySale(saleId) {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM payments WHERE sale_id = ? ORDER BY payment_date DESC', [saleId]);
}

export function getPaymentsByClient(clientId) {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM payments WHERE client_id = ? ORDER BY payment_date DESC', [clientId]);
}

export function createPayment(payment) {
  const db = getDatabase();
  const { sale_id, client_id, amount, payment_date, payment_method, notes } = payment;
  const result = db.runSync(
    `INSERT INTO payments (sale_id, client_id, amount, payment_date, payment_method, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sale_id, client_id, amount, payment_date ?? new Date().toISOString(), payment_method ?? 'cash', notes ?? null]
  );

  const totalPaid = db.getFirstSync(
    'SELECT SUM(amount) AS total FROM payments WHERE sale_id = ?',
    [sale_id]
  );
  const sale = db.getFirstSync('SELECT total_amount FROM sales WHERE id = ?', [sale_id]);
  if (sale && totalPaid) {
    const remaining = sale.total_amount - totalPaid.total;
    const status = remaining <= 0 ? 'completed' : 'active';
    db.runSync(
      `UPDATE sales SET remaining_amount = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
      [Math.max(remaining, 0), status, sale_id]
    );
  }

  return result.lastInsertRowId;
}

export function deletePayment(id) {
  const db = getDatabase();
  const payment = db.getFirstSync('SELECT * FROM payments WHERE id = ?', [id]);
  db.runSync('DELETE FROM payments WHERE id = ?', [id]);

  if (payment) {
    const totalPaid = db.getFirstSync(
      'SELECT SUM(amount) AS total FROM payments WHERE sale_id = ?',
      [payment.sale_id]
    );
    const sale = db.getFirstSync('SELECT total_amount FROM sales WHERE id = ?', [payment.sale_id]);
    if (sale && totalPaid) {
      const remaining = sale.total_amount - (totalPaid.total ?? 0);
      const status = remaining <= 0 ? 'completed' : 'active';
      db.runSync(
        `UPDATE sales SET remaining_amount = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
        [Math.max(remaining, 0), status, payment.sale_id]
      );
    }
  }
}
