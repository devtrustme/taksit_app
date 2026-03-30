import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import { getDatabase } from '../database/db';

/**
 * Let the user pick a CSV file whose first row is a header matching the
 * expected import format:
 *   NUMERO CLIENT, DATE, CLIENT, PRODUIT, PRIX, V1, D1, V2, D2, ... V12, D12
 *
 * Each row creates one sale with its payment schedule.
 */
export async function importFromCSV() {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'text/csv',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return { imported: 0 };

  const uri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const { data: rows, errors } = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length) {
    throw new Error(`Erreur de lecture CSV: ${errors[0].message}`);
  }

  const db = getDatabase();
  let imported = 0;

  for (const row of rows) {
    const clientName = (row['CLIENT'] ?? row['client'] ?? '').trim();
    if (!clientName) continue;

    const numeroClient = (row['NUMERO CLIENT'] ?? row['numero_client'] ?? '').trim() || null;
    const saleDate = (row['DATE'] ?? row['date'] ?? new Date().toISOString().split('T')[0]).trim();
    const productName = (row['PRODUIT'] ?? row['produit'] ?? '').trim() || null;
    const totalPrice = parseFloat(row['PRIX'] ?? row['prix'] ?? 0) || 0;

    // Resolve or create client
    let clientId;
    const existing = db.getFirstSync('SELECT id FROM clients WHERE full_name = ?', [clientName]);
    if (existing) {
      clientId = existing.id;
    } else {
      clientId = db.runSync(
        'INSERT INTO clients (full_name, numero_client) VALUES (?, ?)',
        [clientName, numeroClient]
      ).lastInsertRowId;
    }

    // Collect payment schedule columns V1/D1 … V12/D12
    const paymentCols = [];
    for (let i = 1; i <= 12; i++) {
      const amount = parseFloat(row[`V${i}`] ?? '');
      const date = (row[`D${i}`] ?? '').trim();
      if (!isNaN(amount) && amount > 0) {
        paymentCols.push({ amount, date: date || null });
      }
    }

    const planMonths = paymentCols.length || 1;

    const saleId = db.runSync(
      `INSERT INTO sales (client_id, sale_date, plan_months, total_price, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [clientId, saleDate, planMonths, totalPrice]
    ).lastInsertRowId;

    if (productName) {
      db.runSync('INSERT INTO sale_items (sale_id, product_name) VALUES (?, ?)', [saleId, productName]);
    }

    paymentCols.forEach(({ amount, date }, idx) => {
      db.runSync(
        `INSERT INTO payments
           (sale_id, payment_number, amount_due, amount_paid, remaining, due_date, status)
         VALUES (?, ?, ?, 0, ?, ?, 'pending')`,
        [saleId, idx + 1, amount, amount, date]
      );
    });

    imported++;
  }

  return { imported };
}
