import { getDatabase } from '../database/db';

export function getAllClients() {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM clients ORDER BY full_name ASC');
}

export function getClientById(id) {
  const db = getDatabase();
  return db.getFirstSync('SELECT * FROM clients WHERE id = ?', [id]);
}

export function createClient(client) {
  const db = getDatabase();
  const { full_name, phone, address, national_id, notes } = client;
  const result = db.runSync(
    'INSERT INTO clients (full_name, phone, address, national_id, notes) VALUES (?, ?, ?, ?, ?)',
    [full_name, phone ?? null, address ?? null, national_id ?? null, notes ?? null]
  );
  return result.lastInsertRowId;
}

export function updateClient(id, client) {
  const db = getDatabase();
  const { full_name, phone, address, national_id, notes } = client;
  db.runSync(
    `UPDATE clients SET full_name = ?, phone = ?, address = ?, national_id = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`,
    [full_name, phone ?? null, address ?? null, national_id ?? null, notes ?? null, id]
  );
}

export function deleteClient(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM clients WHERE id = ?', [id]);
}

export function searchClients(query) {
  const db = getDatabase();
  const like = `%${query}%`;
  return db.getAllSync(
    'SELECT * FROM clients WHERE full_name LIKE ? OR phone LIKE ? OR national_id LIKE ? ORDER BY full_name ASC',
    [like, like, like]
  );
}
