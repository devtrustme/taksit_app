import { getDatabase } from '../database/db';

export function getAllCategories() {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM categories ORDER BY name ASC');
}

export function getCategoryById(id) {
  const db = getDatabase();
  return db.getFirstSync('SELECT * FROM categories WHERE id = ?', [id]);
}

export function createCategory(category) {
  const db = getDatabase();
  const { name, description } = category;
  const result = db.runSync(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description ?? null]
  );
  return result.lastInsertRowId;
}

export function updateCategory(id, category) {
  const db = getDatabase();
  const { name, description } = category;
  db.runSync(
    `UPDATE categories SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?`,
    [name, description ?? null, id]
  );
}

export function deleteCategory(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
}
