export function createTables(db) {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      brand_id INTEGER,
      code TEXT,
      ref TEXT,
      model TEXT,
      name TEXT NOT NULL,
      buy_price REAL,
      sell_price REAL,
      stock_qty INTEGER DEFAULT 0,
      stock_alert_qty INTEGER DEFAULT 1,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_client TEXT,
      full_name TEXT NOT NULL,
      cin TEXT,
      ccp TEXT,
      wilaya TEXT,
      commune TEXT,
      address TEXT,
      phone_1 TEXT,
      phone_2 TEXT,
      phone_3 TEXT,
      photo_path TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS guarantors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone_1 TEXT,
      phone_2 TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      guarantor_id INTEGER,
      sale_date TEXT NOT NULL,
      plan_months INTEGER NOT NULL,
      total_price REAL,
      first_payment REAL,
      monthly_amount REAL,
      due_day INTEGER,
      notes TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (guarantor_id) REFERENCES guarantors(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      product_name TEXT,
      model_at_sale TEXT,
      buy_price_at_sale REAL,
      sell_price_at_sale REAL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      payment_number INTEGER,
      amount_due REAL,
      amount_paid REAL DEFAULT 0,
      remaining REAL,
      due_date TEXT,
      paid_date TEXT,
      snoozed_to TEXT,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      notes TEXT,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );

    CREATE TABLE IF NOT EXISTS cheques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      total_cheques_given INTEGER,
      cheques_used INTEGER DEFAULT 0,
      cheques_remaining INTEGER,
      cheques_returned INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      movement_type TEXT,
      quantity INTEGER,
      reference_sale_id INTEGER,
      movement_date TEXT DEFAULT (datetime('now')),
      notes TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
}
