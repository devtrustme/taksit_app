import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getClientById } from '../models/clients';
import { getSalesByClient } from '../models/sales';
import { getGuarantorById } from '../models/guarantors';
import { getPaymentsBySale } from '../models/payments';
import { getSaleItemsBySale } from '../models/saleItems';
import { getDueStatus } from '../utils/paymentLogic';
import { formatDate } from '../utils/dateUtils';

const STATUS_COLORS = {
  active: '#3498DB',
  completed: '#27AE60',
};

const PAYMENT_COLORS = {
  paid: '#27AE60',
  partial: '#E67E22',
  late: '#E74C3C',
  today: '#F39C12',
  pending: '#95A5A6',
  snoozed: '#BDC3C7',
};

export default function ClientProfileScreen({ route, navigation }) {
  const { clientId } = route.params;
  const [client, setClient] = useState(null);
  const [sales, setSales] = useState([]);
  const [guarantor, setGuarantor] = useState(null);
  const [expandedSale, setExpandedSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState({});

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
    if (c && c.guarantor_id) {
      setGuarantor(getGuarantorById(c.guarantor_id));
    }
  }

  function toggleSale(saleId) {
    if (expandedSale === saleId) {
      setExpandedSale(null);
    } else {
      setExpandedSale(saleId);
      if (!saleDetails[saleId]) {
        const payments = getPaymentsBySale(saleId);
        const items = getSaleItemsBySale(saleId);
        setSaleDetails(prev => ({ ...prev, [saleId]: { payments, items } }));
      }
    }
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  const totalRemaining = sales
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      const pmts = getPaymentsBySale(s.id);
      return sum + pmts.filter(p => p.status !== 'paid').reduce((a, p) => a + (p.remaining ?? 0), 0);
    }, 0);

  function callPhone(phone) {
    if (phone) Linking.openURL(`tel:${phone}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{client.full_name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{client.full_name}</Text>
          {client.numero_client ? <Text style={styles.sub}>N° {client.numero_client}</Text> : null}
          <View style={styles.phonesRow}>
            {[client.phone_1, client.phone_2, client.phone_3].filter(Boolean).map((p, i) => (
              <TouchableOpacity key={i} style={styles.phoneBtn} onPress={() => callPhone(p)}>
                <Text style={styles.phoneBtnText}>📞 {p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.infoGrid}>
            {client.cin ? <Text style={styles.infoItem}>CIN: {client.cin}</Text> : null}
            {client.ccp ? <Text style={styles.infoItem}>CCP: {client.ccp}</Text> : null}
            {client.wilaya ? <Text style={styles.infoItem}>Wilaya: {client.wilaya}</Text> : null}
            {client.commune ? <Text style={styles.infoItem}>Commune: {client.commune}</Text> : null}
            {client.address ? <Text style={styles.infoItem}>Adresse: {client.address}</Text> : null}
          </View>
          {client.notes ? <Text style={styles.notes}>{client.notes}</Text> : null}
        </View>

        {/* Guarantor */}
        {guarantor ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Garant</Text>
            <Text style={styles.guarantorName}>{guarantor.full_name}</Text>
            {guarantor.phone_1 ? (
              <TouchableOpacity onPress={() => callPhone(guarantor.phone_1)}>
                <Text style={styles.guarantorPhone}>📞 {guarantor.phone_1}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Total remaining */}
        <View style={styles.debtCard}>
          <Text style={styles.debtLabel}>Solde restant total</Text>
          <Text style={styles.debtAmount}>{Math.round(totalRemaining).toLocaleString()} DA</Text>
        </View>

        {/* Sales */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ventes ({sales.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NewSale', { clientId })}>
              <Text style={styles.newSaleBtn}>+ Nouvelle vente</Text>
            </TouchableOpacity>
          </View>
          {sales.map(sale => (
            <View key={sale.id}>
              <TouchableOpacity
                style={[styles.saleRow, { borderLeftColor: STATUS_COLORS[sale.status] || '#DDD' }]}
                onPress={() => toggleSale(sale.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.saleDate}>{formatDate(sale.sale_date)}</Text>
                  <Text style={styles.saleAmount}>{(sale.total_price ?? 0).toLocaleString()} DA — {sale.plan_months} mois</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[sale.status] || '#DDD' }]}>
                  <Text style={styles.statusBadgeText}>{sale.status === 'active' ? 'Actif' : 'Soldé'}</Text>
                </View>
                <Text style={styles.expandIcon}>{expandedSale === sale.id ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {expandedSale === sale.id && saleDetails[sale.id] && (
                <View style={styles.expandedSale}>
                  {saleDetails[sale.id].items.map((item, i) => (
                    <Text key={i} style={styles.saleItem}>• {item.product_name || 'Produit'}</Text>
                  ))}
                  {saleDetails[sale.id].payments.map(p => {
                    const s = getDueStatus(p.due_date, p.status, p.snoozed_to);
                    return (
                      <View key={p.id} style={[styles.paymentRow, { borderLeftColor: PAYMENT_COLORS[s] || '#DDD' }]}>
                        <Text style={styles.paymentNum}>#{p.payment_number}</Text>
                        <Text style={styles.paymentDate}>{formatDate(p.due_date)}</Text>
                        <Text style={styles.paymentAmt}>{(p.amount_due ?? 0).toLocaleString()} DA</Text>
                        <View style={[styles.payStatusBadge, { backgroundColor: PAYMENT_COLORS[s] || '#DDD' }]}>
                          <Text style={styles.payStatusText}>{s}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
          {sales.length === 0 && <Text style={styles.empty}>Aucune vente</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  loading: { textAlign: 'center', marginTop: 40, color: '#999' },
  scroll: { padding: 16, paddingBottom: 80 },
  headerCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 20,
    alignItems: 'center', marginBottom: 12, elevation: 2,
  },
  avatar: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#3498DB', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  sub: { fontSize: 13, color: '#7F8C8D', marginBottom: 6 },
  phonesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 10 },
  phoneBtn: { backgroundColor: '#EBF5FB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  phoneBtnText: { color: '#2980B9', fontSize: 13, fontWeight: '600' },
  infoGrid: { width: '100%', marginTop: 8 },
  infoItem: { fontSize: 13, color: '#555', marginBottom: 3 },
  notes: { fontSize: 13, color: '#7F8C8D', marginTop: 8, fontStyle: 'italic' },
  section: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  newSaleBtn: { color: '#3498DB', fontWeight: '700' },
  guarantorName: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  guarantorPhone: { color: '#2980B9', marginTop: 4 },
  debtCard: {
    backgroundColor: '#E74C3C', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 12,
  },
  debtLabel: { color: '#FFF', opacity: 0.8, fontSize: 13 },
  debtAmount: { color: '#FFF', fontSize: 26, fontWeight: 'bold', marginTop: 4 },
  saleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderLeftWidth: 3, paddingLeft: 10, marginBottom: 4,
  },
  saleDate: { fontSize: 12, color: '#7F8C8D' },
  saleAmount: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginHorizontal: 8 },
  statusBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  expandIcon: { fontSize: 12, color: '#999' },
  expandedSale: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 10, marginBottom: 8 },
  saleItem: { fontSize: 13, color: '#555', marginBottom: 4 },
  paymentRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    borderLeftWidth: 3, paddingLeft: 8, marginBottom: 2,
  },
  paymentNum: { fontSize: 12, color: '#999', width: 28 },
  paymentDate: { fontSize: 12, color: '#555', flex: 1 },
  paymentAmt: { fontSize: 13, fontWeight: '600', color: '#2C3E50', marginRight: 8 },
  payStatusBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  payStatusText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 10 },
});
