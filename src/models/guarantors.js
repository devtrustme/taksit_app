import { getDatabase } from '../database/db';

export function getAllGuarantors() {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM guarantors ORDER BY full_name ASC');
}

export function getGuarantorById(id) {
  const db = getDatabase();
  return db.getFirstSync('SELECT * FROM guarantors WHERE id = ?', [id]);
}

export function createGuarantor(guarantor) {
  const db = getDatabase();
  const { full_name, phone_1, phone_2 } = guarantor;
  const result = db.runSync(
    'INSERT INTO guarantors (full_name, phone_1, phone_2) VALUES (?, ?, ?)',
    [full_name, phone_1 ?? null, phone_2 ?? null]
  );
  return result.lastInsertRowId;
}

export function updateGuarantor(id, guarantor) {
  const db = getDatabase();
  const { full_name, phone_1, phone_2 } = guarantor;
  db.runSync(
    'UPDATE guarantors SET full_name=?, phone_1=?, phone_2=? WHERE id=?',
    [full_name, phone_1 ?? null, phone_2 ?? null, id]
  );
}

export function deleteGuarantor(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM guarantors WHERE id = ?', [id]);
}

export function searchGuarantors(query) {
  const db = getDatabase();
  const like = `%${query}%`;
  return db.getAllSync(
    'SELECT * FROM guarantors WHERE full_name LIKE ? OR phone_1 LIKE ? ORDER BY full_name ASC',
    [like, like]
  );
}
