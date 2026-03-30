import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../database/db';

export default function ImportExportScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    try {
      setExporting(true);
      const db = getDatabase();

      const clients = db.getAllSync('SELECT * FROM clients');
      const sales = db.getAllSync('SELECT * FROM sales');
      const payments = db.getAllSync('SELECT * FROM payments');
      const products = db.getAllSync('SELECT * FROM products');
      const cheques = db.getAllSync('SELECT * FROM cheques');
      const categories = db.getAllSync('SELECT * FROM categories');
      const brands = db.getAllSync('SELECT * FROM brands');
      const stockMovements = db.getAllSync('SELECT * FROM stock_movements');

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        data: { clients, sales, payments, products, cheques, categories, brands, stockMovements },
      };

      const json = JSON.stringify(exportData, null, 2);
      const filename = `taksit_export_${Date.now()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Taksit Manager Data',
        });
      } else {
        Alert.alert('Export Complete', `Data saved to: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Export Error', error.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    try {
      setImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
      const importData = JSON.parse(content);

      if (!importData.data) {
        Alert.alert('Import Error', 'Invalid file format.');
        return;
      }

      Alert.alert(
        'Confirm Import',
        'This will merge the imported data with existing data. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: () => performImport(importData.data),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Import Error', error.message);
    } finally {
      setImporting(false);
    }
  }

  function performImport(data) {
    const db = getDatabase();

    try {
      data.categories?.forEach((item) => {
        db.runSync(
          'INSERT OR IGNORE INTO categories (id, name, description) VALUES (?, ?, ?)',
          [item.id, item.name, item.description]
        );
      });

      data.brands?.forEach((item) => {
        db.runSync(
          'INSERT OR IGNORE INTO brands (id, name, description) VALUES (?, ?, ?)',
          [item.id, item.name, item.description]
        );
      });

      data.clients?.forEach((item) => {
        db.runSync(
          'INSERT OR IGNORE INTO clients (id, full_name, phone, address, national_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [item.id, item.full_name, item.phone, item.address, item.national_id, item.notes]
        );
      });

      data.products?.forEach((item) => {
        db.runSync(
          'INSERT OR IGNORE INTO products (id, name, description, sku, category_id, brand_id, unit_price, stock_quantity, min_stock_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.name, item.description, item.sku, item.category_id, item.brand_id, item.unit_price, item.stock_quantity, item.min_stock_level]
        );
      });

      data.sales?.forEach((item) => {
        db.runSync(
          'INSERT OR IGNORE INTO sales (id, client_id, total_amount, down_payment, remaining_amount, installment_count, installment_amount, installment_frequency, start_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.client_id, item.total_amount, item.down_payment, item.remaining_amount, item.installment_count, item.installment_amount, item.installment_frequency, item.start_date, item.status, item.notes]
        );
      });

      data.payments?.forEach((item) => {
        db.runSync(
          'INSERT OR IGNORE INTO payments (id, sale_id, client_id, amount, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.sale_id, item.client_id, item.amount, item.payment_date, item.payment_method, item.notes]
        );
      });

      Alert.alert('Import Complete', 'Data imported successfully!');
    } catch (error) {
      Alert.alert('Import Error', error.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Import / Export</Text>
        <Text style={styles.subtitle}>Backup and restore your data</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Export Data</Text>
          <Text style={styles.cardDesc}>
            Export all your clients, sales, payments, products and more as a JSON file.
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.exportBtn, exporting && styles.btnDisabled]}
            onPress={handleExport}
            disabled={exporting}
          >
            <Text style={styles.btnText}>{exporting ? 'Exporting...' : '↑ Export'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Import Data</Text>
          <Text style={styles.cardDesc}>
            Import data from a previously exported JSON file. Existing records will not be overwritten.
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.importBtn, importing && styles.btnDisabled]}
            onPress={handleImport}
            disabled={importing}
          >
            <Text style={styles.btnText}>{importing ? 'Importing...' : '↓ Import'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 24 },
  card: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 20,
    marginBottom: 16, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#7F8C8D', lineHeight: 20, marginBottom: 16 },
  btn: { borderRadius: 8, padding: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  exportBtn: { backgroundColor: '#27AE60' },
  importBtn: { backgroundColor: '#4A90E2' },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
