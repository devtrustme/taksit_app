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
  const { numero_client, full_name, cin, ccp, wilaya, commune, address, phone_1, phone_2, phone_3, photo_path, notes } = client;
  const result = db.runSync(
    `INSERT INTO clients (numero_client, full_name, cin, ccp, wilaya, commune, address, phone_1, phone_2, phone_3, photo_path, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      numero_client ?? null, full_name,
      cin ?? null, ccp ?? null, wilaya ?? null, commune ?? null, address ?? null,
      phone_1 ?? null, phone_2 ?? null, phone_3 ?? null,
      photo_path ?? null, notes ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export function updateClient(id, client) {
  const db = getDatabase();
  const { numero_client, full_name, cin, ccp, wilaya, commune, address, phone_1, phone_2, phone_3, photo_path, notes } = client;
  db.runSync(
    `UPDATE clients SET numero_client=?, full_name=?, cin=?, ccp=?, wilaya=?, commune=?,
      address=?, phone_1=?, phone_2=?, phone_3=?, photo_path=?, notes=? WHERE id=?`,
    [
      numero_client ?? null, full_name,
      cin ?? null, ccp ?? null, wilaya ?? null, commune ?? null, address ?? null,
      phone_1 ?? null, phone_2 ?? null, phone_3 ?? null,
      photo_path ?? null, notes ?? null, id,
    ]
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
    `SELECT * FROM clients
     WHERE full_name LIKE ? OR phone_1 LIKE ? OR phone_2 LIKE ? OR phone_3 LIKE ?
     ORDER BY full_name ASC`,
    [like, like, like, like]
  );
}
