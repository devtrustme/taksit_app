import { getDatabase } from '../database/db';

export function getAllCategories() {
  const db = getDatabase();
  return db.getAllSync('SELECT * FROM categories ORDER BY name ASC');
}

export function getCategoryById(id) {
  const db = getDatabase();
  return db.getFirstSync('SELECT * FROM categories WHERE id = ?', [id]);
}

export function createCategory(name) {
  const db = getDatabase();
  const result = db.runSync('INSERT INTO categories (name) VALUES (?)', [name]);
  return result.lastInsertRowId;
}

export function updateCategory(id, name) {
  const db = getDatabase();
  db.runSync('UPDATE categories SET name=? WHERE id=?', [name, id]);
}

export function deleteCategory(id) {
  const db = getDatabase();
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
}
