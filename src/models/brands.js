import { getDatabase } from '../database/db';

export function getAllBrands() {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM brands ORDER BY name ASC');
}

export function getBrandById(id) {
  const db = getDatabase();
  return db.getFirstSync('SELECT * FROM brands WHERE id = ?', [id]);
}

export function createBrand(name) {
  const db = getDatabase();
  const result = db.runSync('INSERT INTO brands (name) VALUES (?)', [name]);
  return result.lastInsertRowId;
}

export function updateBrand(id, name) {
  const db = getDatabase();
  db.runSync('UPDATE brands SET name=? WHERE id=?', [name, id]);
}

export function deleteBrand(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM brands WHERE id = ?', [id]);
}
