import * as SQLite from 'expo-sqlite';
import { createTables } from './schema';

let db = null;

export function getDatabase() {
  if (!db) {
    db = SQLite.openDatabaseSync('taksit_manager.db');
  }
  return db;
}

export function initDatabase() {
  const database = getDatabase();
  createTables(database);
  return database;
}
