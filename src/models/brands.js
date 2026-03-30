import { getDatabase } from '../database/db';

export function getAllBrands() {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM brands ORDER BY name ASC');
}

export function getBrandById(id) {
  const db = getDatabase();
  return db.getFirstSync('SELECT * FROM brands WHERE id = ?', [id]);
}

export function createBrand(brand) {
  const db = getDatabase();
  const { name, description } = brand;
  const result = db.runSync(
    'INSERT INTO brands (name, description) VALUES (?, ?)',
    [name, description ?? null]
  );
  return result.lastInsertRowId;
}

export function updateBrand(id, brand) {
  const db = getDatabase();
  const { name, description } = brand;
  db.runSync(
    `UPDATE brands SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?`,
    [name, description ?? null, id]
  );
}

export function deleteBrand(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM brands WHERE id = ?', [id]);
}
