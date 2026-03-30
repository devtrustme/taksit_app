import { getDatabase } from '../database/db';

export function getAllSales() {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT s.*, c.full_name AS client_name
     FROM sales s
     JOIN clients c ON s.client_id = c.id
     ORDER BY s.created_at DESC`
  );
}

export function getSaleById(id) {
  const db = getDatabase();
  return db.getFirstSync(
    `SELECT s.*, c.full_name AS client_name
     FROM sales s
     JOIN clients c ON s.client_id = c.id
     WHERE s.id = ?`,
    [id]
  );
}

export function getSalesByClient(clientId) {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM sales WHERE client_id = ? ORDER BY created_at DESC', [clientId]);
}

export function createSale(sale) {
  const db = getDatabase();
  const {
    client_id, total_amount, down_payment, remaining_amount,
    installment_count, installment_amount, installment_frequency,
    start_date, status, notes
  } = sale;
  const result = db.runSync(
    `INSERT INTO sales (client_id, total_amount, down_payment, remaining_amount,
      installment_count, installment_amount, installment_frequency, start_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id, total_amount, down_payment ?? 0, remaining_amount ?? total_amount,
      installment_count ?? 1, installment_amount ?? 0, installment_frequency ?? 'monthly',
      start_date ?? null, status ?? 'active', notes ?? null
    ]
  );
  return result.lastInsertRowId;
}

export function updateSale(id, sale) {
  const db = getDatabase();
  const {
    total_amount, down_payment, remaining_amount,
    installment_count, installment_amount, installment_frequency,
    start_date, status, notes
  } = sale;
  db.runSync(
    `UPDATE sales SET total_amount = ?, down_payment = ?, remaining_amount = ?,
      installment_count = ?, installment_amount = ?, installment_frequency = ?,
      start_date = ?, status = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [
      total_amount, down_payment ?? 0, remaining_amount ?? total_amount,
      installment_count ?? 1, installment_amount ?? 0, installment_frequency ?? 'monthly',
      start_date ?? null, status ?? 'active', notes ?? null, id
    ]
  );
}

export function deleteSale(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM sales WHERE id = ?', [id]);
}
