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
    `SELECT s.*, c.full_name AS client_name, c.phone_1 AS client_phone
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
    client_id, guarantor_id, sale_date, plan_months,
    total_price, first_payment, monthly_amount, due_day, notes, status,
  } = sale;
  const result = db.runSync(
    `INSERT INTO sales (client_id, guarantor_id, sale_date, plan_months,
      total_price, first_payment, monthly_amount, due_day, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id, guarantor_id ?? null,
      sale_date, plan_months,
      total_price ?? 0, first_payment ?? 0, monthly_amount ?? 0,
      due_day ?? null, notes ?? null, status ?? 'active',
    ]
  );
  return result.lastInsertRowId;
}

export function updateSaleStatus(id, status) {
  const db = getDatabase();
  db.runSync('UPDATE sales SET status=? WHERE id=?', [status, id]);
}

export function deleteSale(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM sales WHERE id = ?', [id]);
}
