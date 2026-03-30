# Taksit Manager

A React Native Expo application for managing installment sales (taksit), clients, payments, stock, and more.

## Features

- **Dashboard** — Quick overview of clients, sales, revenue, pending payments, and low-stock alerts
- **Clients** — Manage clients, view profiles, track guarantors
- **Sales** — Create and track installment sales with full line-item support
- **Payments** — Record and review payments; track pending installments
- **Stock** — Monitor product inventory, flag low-stock items
- **Products** — Full product CRUD with categories and brands
- **Import / Export** — Backup and restore all data as JSON

## Project Structure

```
taksit_app/
├── App.js                          # Entry point
├── app.json                        # Expo configuration
├── babel.config.js
├── package.json
├── src/
│   ├── database/
│   │   ├── db.js                   # Database connection & init
│   │   └── schema.js               # Table definitions (SQLite)
│   ├── models/
│   │   ├── clients.js
│   │   ├── sales.js
│   │   ├── payments.js
│   │   ├── products.js
│   │   ├── cheques.js
│   │   ├── guarantors.js
│   │   ├── saleItems.js
│   │   ├── categories.js
│   │   ├── brands.js
│   │   └── stockMovements.js
│   ├── screens/
│   │   ├── DashboardScreen.jsx
│   │   ├── ClientsScreen.jsx
│   │   ├── ClientProfileScreen.jsx
│   │   ├── NewSaleScreen.jsx
│   │   ├── PaymentsScreen.jsx
│   │   ├── StockScreen.jsx
│   │   ├── ProductsScreen.jsx
│   │   └── ImportExportScreen.jsx
│   ├── navigation/
│   │   └── AppNavigator.jsx        # Bottom-tab + stack navigator
│   ├── components/                 # Reusable UI components
│   └── utils/                      # Utility helpers
└── assets/
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

```bash
npm install -g expo-cli
```

### Installation

```bash
# Clone the repository
git clone https://github.com/devtrustme/taksit_app.git
cd taksit_app

# Install dependencies
npm install

# Start the Expo development server
npm start
```

Then scan the QR code with the Expo Go app on your device, or press `a` for Android / `i` for iOS simulator.

## Tech Stack

| Package | Purpose |
|---|---|
| Expo ~52 | Development platform |
| React Native 0.76 | Mobile framework |
| expo-sqlite | Local SQLite database |
| @react-navigation/native | Navigation |
| @react-navigation/bottom-tabs | Tab navigation |
| @react-navigation/native-stack | Stack navigation |
| expo-file-system | File I/O for import/export |
| expo-sharing | Share exported files |
| expo-document-picker | Pick import files |
| react-native-safe-area-context | Safe area handling |

## Database

The app uses **SQLite** via `expo-sqlite`. The database is initialized on first launch and stored on-device. Tables:

- `clients` — Customer records
- `guarantors` — Client guarantors
- `sales` — Installment sale records
- `sale_items` — Line items per sale
- `payments` — Payment history
- `cheques` — Post-dated cheque tracking
- `products` — Product catalog
- `categories` — Product categories
- `brands` — Product brands
- `stock_movements` — Stock in/out history

## License

MIT
