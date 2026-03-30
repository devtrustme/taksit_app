import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';
import { getDatabase } from '../database/db';

function fetchAll(query) {
  const db = getDatabase();
  return db.getAllSync(query);
}

/**
 * Export every table to individual CSV files, then share a ZIP-less bundle
 * by sharing one combined CSV that contains all tables separated by a header row.
 * Each table block starts with a "## TABLE: <name>" sentinel line so the file
 * can be re-parsed if needed.
 */
export async function exportToCSV() {
  const tables = [
    'clients', 'sales', 'sale_items', 'payments',
    'products', 'cheques', 'stock_movements', 'categories', 'brands', 'guarantors',
  ];

  const sections = tables.map(table => {
    const rows = fetchAll(`SELECT * FROM ${table}`);
    const csv = rows.length
      ? Papa.unparse(rows, { header: true })
      : '';
    return `## TABLE: ${table}\n${csv}`;
  });

  const content = sections.join('\n\n');
  const date = new Date().toISOString().split('T')[0];
  const uri = `${FileSystem.documentDirectory}taksit_export_${date}.csv`;

  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Exporter Taksit Manager',
  });
}

export async function backupDatabase() {
  const dbPath = `${FileSystem.documentDirectory}SQLite/taksit_manager.db`;
  const backupPath = `${FileSystem.documentDirectory}taksit_backup_${Date.now()}.db`;
  await FileSystem.copyAsync({ from: dbPath, to: backupPath });
  await Sharing.shareAsync(backupPath, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Sauvegarder la base de données',
  });
}
