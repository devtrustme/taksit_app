import { getDatabase } from '../database/db';

export function getChequesBySale(saleId) {
  const db = getDatabase();
  return db.getFirstSync('SELECT * FROM cheques WHERE sale_id = ?', [saleId]);
}

export function createCheque(cheque) {
  const db = getDatabase();
  const { sale_id, total_cheques_given, cheques_remaining, notes } = cheque;
  const result = db.runSync(
    `INSERT INTO cheques (sale_id, total_cheques_given, cheques_used, cheques_remaining, cheques_returned, notes)
     VALUES (?, ?, 0, ?, 0, ?)`,
    [sale_id, total_cheques_given ?? 0, cheques_remaining ?? total_cheques_given ?? 0, notes ?? null]
  );
  return result.lastInsertRowId;
}

export function updateChequeUsage(saleId) {
  const db = getDatabase();
  db.runSync(
    `UPDATE cheques SET cheques_used = cheques_used + 1,
      cheques_remaining = cheques_remaining - 1
     WHERE sale_id = ? AND cheques_remaining > 0`,
    [saleId]
  );
}
