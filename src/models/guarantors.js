import { getDatabase } from '../database/db';

export function getGuarantorsByClient(clientId) {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM guarantors WHERE client_id = ? ORDER BY full_name ASC', [clientId]);
}

export function getGuarantorById(id) {
  const db = getDatabase();
  return db.getFirstSync('SELECT * FROM guarantors WHERE id = ?', [id]);
}

export function createGuarantor(guarantor) {
  const db = getDatabase();
  const { client_id, full_name, phone, address, national_id, relationship } = guarantor;
  const result = db.runSync(
    `INSERT INTO guarantors (client_id, full_name, phone, address, national_id, relationship)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [client_id, full_name, phone ?? null, address ?? null, national_id ?? null, relationship ?? null]
  );
  return result.lastInsertRowId;
}

export function updateGuarantor(id, guarantor) {
  const db = getDatabase();
  const { full_name, phone, address, national_id, relationship } = guarantor;
  db.runSync(
    `UPDATE guarantors SET full_name = ?, phone = ?, address = ?, national_id = ?, relationship = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [full_name, phone ?? null, address ?? null, national_id ?? null, relationship ?? null, id]
  );
}

export function deleteGuarantor(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM guarantors WHERE id = ?', [id]);
}
