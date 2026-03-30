import { getDatabase } from '../database/db';

export function getPaymentsBySale(saleId) {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM payments WHERE sale_id = ? ORDER BY payment_number ASC', [saleId]);
}

export function getAllPendingPayments() {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT p.*, s.client_id, c.full_name AS client_name,
            c.phone_1 AS client_phone,
            GROUP_CONCAT(si.product_name, ', ') AS product_names
     FROM payments p
     JOIN sales s ON p.sale_id = s.id
     JOIN clients c ON s.client_id = c.id
     LEFT JOIN sale_items si ON si.sale_id = s.id
     WHERE s.status = 'active'
     GROUP BY p.id
     ORDER BY p.due_date ASC`
  );
}

export function createPayment(payment) {
  const db = getDatabase();
  const {
    sale_id, payment_number, amount_due, amount_paid,
    remaining, due_date, status,
  } = payment;
  const result = db.runSync(
    `INSERT INTO payments (sale_id, payment_number, amount_due, amount_paid, remaining, due_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [sale_id, payment_number, amount_due, amount_paid ?? 0, remaining ?? amount_due, due_date, status ?? 'pending']
  );
  return result.lastInsertRowId;
}

export function recordPayment(id, { amount_paid, payment_method, notes, paid_date }) {
  const db = getDatabase();
  const payment = db.getFirstSync('SELECT * FROM payments WHERE id = ?', [id]);
  if (!payment) return;
  const newPaid = (payment.amount_paid ?? 0) + amount_paid;
  const newRemaining = payment.amount_due - newPaid;
  const newStatus = newRemaining <= 0 ? 'paid' : 'partial';
  db.runSync(
    `UPDATE payments SET amount_paid=?, remaining=?, status=?,
      payment_method=?, notes=?, paid_date=? WHERE id=?`,
    [newPaid, Math.max(newRemaining, 0), newStatus, payment_method ?? null, notes ?? null, paid_date ?? null, id]
  );

  if (newStatus === 'paid') {
    const pendingCount = db.getFirstSync(
      `SELECT COUNT(*) AS cnt FROM payments WHERE sale_id = ? AND status != 'paid'`,
      [payment.sale_id]
    );
    if (pendingCount && pendingCount.cnt === 0) {
      db.runSync("UPDATE sales SET status='completed' WHERE id=?", [payment.sale_id]);
    }
  }
}

export function snoozePayment(id, snoozedTo) {
  const db = getDatabase();
  db.runSync('UPDATE payments SET snoozed_to=? WHERE id=?', [snoozedTo, id]);
}

export function updateChequeUsage(saleId) {
  const db = getDatabase();
  db.runSync(
    `UPDATE cheques SET cheques_used = cheques_used + 1,
      cheques_remaining = cheques_remaining - 1
     WHERE sale_id = ? AND cheques_remaining > 0`,
    [saleId]
  );
}
