import { getDatabase } from '../database/db';

export function getAllCheques() {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT ch.*, c.full_name AS client_name
     FROM cheques ch
     JOIN clients c ON ch.client_id = c.id
     ORDER BY ch.due_date ASC`
  );
}

export function getChequesBySale(saleId) {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM cheques WHERE sale_id = ? ORDER BY due_date ASC', [saleId]);
}

export function getChequesByClient(clientId) {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM cheques WHERE client_id = ? ORDER BY due_date ASC', [clientId]);
}

export function createCheque(cheque) {
  const db = getDatabase();
  const { sale_id, client_id, cheque_number, bank_name, amount, due_date, status, notes } = cheque;
  const result = db.runSync(
    `INSERT INTO cheques (sale_id, client_id, cheque_number, bank_name, amount, due_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [sale_id, client_id, cheque_number ?? null, bank_name ?? null, amount, due_date ?? null, status ?? 'pending', notes ?? null]
  );
  return result.lastInsertRowId;
}

export function updateChequeStatus(id, status) {
  const db = getDatabase();
  db.runSync(
    `UPDATE cheques SET status = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, id]
  );
}

export function deleteCheque(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM cheques WHERE id = ?', [id]);
}

export function getPendingCheques() {
  const db = getDatabase();
  return db.getAllSync(
    `SELECT ch.*, c.full_name AS client_name
     FROM cheques ch
     JOIN clients c ON ch.client_id = c.id
     WHERE ch.status = 'pending'
     ORDER BY ch.due_date ASC`
  );
}
