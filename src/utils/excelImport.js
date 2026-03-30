import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getDatabase } from '../database/db';

export async function importFromExcel() {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return { imported: 0 };

  const XLSX = require('xlsx');
  const uri = result.assets[0].uri;
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const wb = XLSX.read(base64, { type: 'base64' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const db = getDatabase();
  let imported = 0;

  for (const row of rows) {
    const clientName = row['CLIENT'] || row['client'] || '';
    const numeroClient = row['NUMERO CLIENT'] || row['numero_client'] || '';
    const saleDate = row['DATE'] || row['date'] || new Date().toISOString().split('T')[0];
    const productName = row['PRODUIT'] || row['produit'] || '';
    const totalPrice = parseFloat(row['PRIX'] || row['prix'] || 0);

    if (!clientName) continue;

    let clientId = null;
    const existingClient = db.getFirstSync(
      'SELECT id FROM clients WHERE full_name = ?', [clientName]
    );
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const r = db.runSync(
        'INSERT INTO clients (full_name, numero_client) VALUES (?, ?)',
        [clientName, numeroClient || null]
      );
      clientId = r.lastInsertRowId;
    }

    const payments = [];
    for (let i = 1; i <= 12; i++) {
      const v = row[`V${i}`];
      const d = row[`D${i}`];
      if (v !== undefined && v !== '') {
        payments.push({ amount: parseFloat(v), date: d });
      }
    }

    const planMonths = payments.length || 1;
    const saleResult = db.runSync(
      `INSERT INTO sales (client_id, sale_date, plan_months, total_price, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [clientId, saleDate, planMonths, totalPrice]
    );
    const saleId = saleResult.lastInsertRowId;

    if (productName) {
      db.runSync(
        'INSERT INTO sale_items (sale_id, product_name) VALUES (?, ?)',
        [saleId, productName]
      );
    }

    payments.forEach((p, idx) => {
      db.runSync(
        `INSERT INTO payments (sale_id, payment_number, amount_due, amount_paid, remaining, due_date, status)
         VALUES (?, ?, ?, 0, ?, ?, 'pending')`,
        [saleId, idx + 1, p.amount, p.amount, p.date || null]
      );
    });

    imported++;
  }

  return { imported };
}
