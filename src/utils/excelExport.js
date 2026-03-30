import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../database/db';

function fetchAll(query) {
  const db = getDatabase();
  return db.getAllSync(query);
}

export async function exportToExcel() {
  try {
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();

    const tables = [
      'clients', 'sales', 'sale_items', 'payments',
      'products', 'cheques', 'stock_movements', 'categories', 'brands', 'guarantors',
    ];

    for (const table of tables) {
      const rows = fetchAll(`SELECT * FROM ${table}`);
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
      XLSX.utils.book_append_sheet(wb, ws, table);
    }

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const date = new Date().toISOString().split('T')[0];
    const uri = `${FileSystem.documentDirectory}taksit_export_${date}.xlsx`;

    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Exporter Taksit Manager',
    });
    return true;
  } catch (e) {
    throw e;
  }
}

export async function backupDatabase() {
  try {
    const dbPath = `${FileSystem.documentDirectory}SQLite/taksit_manager.db`;
    const backupPath = `${FileSystem.documentDirectory}taksit_backup_${Date.now()}.db`;
    await FileSystem.copyAsync({ from: dbPath, to: backupPath });
    await Sharing.shareAsync(backupPath, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Sauvegarder la base de données',
    });
    return true;
  } catch (e) {
    throw e;
  }
}
