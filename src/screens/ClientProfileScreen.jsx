import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getClientById } from '../models/clients';
import { getSalesByClient } from '../models/sales';
import { getGuarantorsByClient } from '../models/guarantors';

export default function ClientProfileScreen({ route, navigation }) {
  const { clientId } = route.params;
  const [client, setClient] = useState(null);
  const [sales, setSales] = useState([]);
  const [guarantors, setGuarantors] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [clientId])
  );

  function loadData() {
    const c = getClientById(clientId);
    setClient(c);
    const s = getSalesByClient(clientId);
    setSales(s);
    const g = getGuarantorsByClient(clientId);
    setGuarantors(g);
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const totalDebt = sales
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.remaining_amount ?? 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.name}>{client.full_name}</Text>
          {client.phone ? <Text style={styles.sub}>{client.phone}</Text> : null}
          {client.address ? <Text style={styles.sub}>{client.address}</Text> : null}
          {client.national_id ? <Text style={styles.sub}>ID: {client.national_id}</Text> : null}
        </View>

        <View style={styles.debtCard}>
          <Text style={styles.debtLabel}>Total Outstanding Debt</Text>
          <Text style={styles.debtAmount}>{totalDebt.toFixed(2)} DZD</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sales ({sales.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NewSale', { clientId })}>
              <Text style={styles.addBtn}>+ New Sale</Text>
            </TouchableOpacity>
          </View>
          {sales.map((sale) => (
            <View key={sale.id} style={styles.saleItem}>
              <Text style={styles.saleTotal}>{sale.total_amount.toFixed(2)} DZD</Text>
              <Text style={styles.saleSub}>
                Remaining: {(sale.remaining_amount ?? 0).toFixed(2)} DZD • {sale.status}
              </Text>
              <Text style={styles.saleSub}>{sale.created_at?.split('T')[0]}</Text>
            </View>
          ))}
          {sales.length === 0 && <Text style={styles.emptyText}>No sales yet.</Text>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Guarantors ({guarantors.length})</Text>
          </View>
          {guarantors.map((g) => (
            <View key={g.id} style={styles.guarantorItem}>
              <Text style={styles.guarantorName}>{g.full_name}</Text>
              {g.phone ? <Text style={styles.guarantorSub}>{g.phone}</Text> : null}
              {g.relationship ? <Text style={styles.guarantorSub}>{g.relationship}</Text> : null}
            </View>
          ))}
          {guarantors.length === 0 && <Text style={styles.emptyText}>No guarantors.</Text>}
        </View>

        {client.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{client.notes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loading: { textAlign: 'center', marginTop: 40, color: '#999' },
  scrollContent: { padding: 16 },
  header: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  sub: { fontSize: 14, color: '#7F8C8D', marginTop: 2 },
  debtCard: {
    backgroundColor: '#D0021B',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  debtLabel: { color: '#FFF', fontSize: 13, opacity: 0.8 },
  debtAmount: { color: '#FFF', fontSize: 26, fontWeight: 'bold', marginTop: 4 },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  addBtn: { color: '#4A90E2', fontSize: 14, fontWeight: '600' },
  saleItem: { borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 8 },
  saleTotal: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  saleSub: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  guarantorItem: { borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 8 },
  guarantorName: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  guarantorSub: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  notes: { fontSize: 14, color: '#555', lineHeight: 20 },
});
