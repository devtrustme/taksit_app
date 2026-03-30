import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportToCSV, backupDatabase } from '../utils/excelExport';
import { importFromCSV } from '../utils/excelImport';

export default function ImportExportScreen() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function handleExport() {
    setLoading(true);
    setStatus('');
    try {
      await exportToCSV();
      setStatus('Export CSV réussi !');
    } catch (e) {
      Alert.alert('Erreur', e.message || "Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setLoading(true);
    setStatus('');
    try {
      const result = await importFromCSV();
      setStatus(`Import terminé : ${result.imported} vente(s) importée(s)`);
      Alert.alert('Import réussi', `${result.imported} vente(s) importée(s)`);
    } catch (e) {
      Alert.alert('Erreur', e.message || "Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  }

  async function handleBackup() {
    setLoading(true);
    setStatus('');
    try {
      await backupDatabase();
      setStatus('Sauvegarde partagée !');
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Import / Export</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Exporter les données</Text>
        <Text style={styles.sectionDesc}>
          Exporte toutes les données (clients, ventes, paiements, produits…) dans un
          fichier CSV. Ouvrable dans Excel, Google Sheets, etc.
          Partagez via WhatsApp, e-mail, Drive, etc.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={handleExport} disabled={loading}>
          <Text style={styles.btnText}>Exporter en CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📥 Importer des données</Text>
        <Text style={styles.sectionDesc}>
          Importe des ventes depuis un fichier CSV (.csv) avec les colonnes :{'\n'}
          NUMERO CLIENT, DATE, CLIENT, PRODUIT, PRIX, V1, D1, V2, D2, … V12, D12
        </Text>
        <TouchableOpacity style={[styles.btn, styles.btnImport]} onPress={handleImport} disabled={loading}>
          <Text style={styles.btnText}>Importer depuis CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💾 Sauvegarder la base de données</Text>
        <Text style={styles.sectionDesc}>
          Copie le fichier SQLite complet et l'ouvre dans le menu de partage.
          Envoyez via WhatsApp ou e-mail pour conserver une sauvegarde complète.
        </Text>
        <TouchableOpacity style={[styles.btn, styles.btnBackup]} onPress={handleBackup} disabled={loading}>
          <Text style={styles.btnText}>Sauvegarder (.db)</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#3498DB" />
          <Text style={styles.loadingText}>En cours…</Text>
        </View>
      )}

      {!!status && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>✓ {status}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', padding: 20, paddingBottom: 12 },
  section: {
    backgroundColor: '#FFF', borderRadius: 12, margin: 12, marginTop: 0,
    padding: 18, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginBottom: 8 },
  sectionDesc: { fontSize: 13, color: '#7F8C8D', marginBottom: 14, lineHeight: 18 },
  btn: { backgroundColor: '#3498DB', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnImport: { backgroundColor: '#27AE60' },
  btnBackup: { backgroundColor: '#9B59B6' },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  loadingBox: { alignItems: 'center', padding: 20 },
  loadingText: { color: '#7F8C8D', marginTop: 8 },
  statusBox: {
    backgroundColor: '#EAFAF1', borderRadius: 10, margin: 12,
    padding: 14, borderWidth: 1, borderColor: '#A9DFBF',
  },
  statusText: { color: '#27AE60', fontWeight: '600', textAlign: 'center' },
});
