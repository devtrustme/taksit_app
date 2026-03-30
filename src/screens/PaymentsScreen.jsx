import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAllPayments, createPayment, deletePayment } from '../models/payments';
import { getAllSales } from '../models/sales';

export default function PaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [pendingSales, setPendingSales] = useState([]);
  const [activeTab, setActiveTab] = useState('payments');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  function loadData() {
    setPayments(getAllPayments());
    const sales = getAllSales().filter((s) => s.status === 'active');
    setPendingSales(sales);
  }

  function handleDeletePayment(payment) {
    Alert.alert(
      'Delete Payment',
      `Delete payment of ${payment.amount.toFixed(2)} DZD?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePayment(payment.id);
            loadData();
          },
        },
      ]
    );
  }

  function renderPayment({ item }) {
    return (
      <View style={styles.item}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemAmount}>{item.amount.toFixed(2)} DZD</Text>
          <Text style={styles.itemSub}>{item.client_name}</Text>
          <Text style={styles.itemSub}>{item.payment_date?.split('T')[0]} • {item.payment_method}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeletePayment(item)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderPendingSale({ item }) {
    return (
      <View style={styles.item}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemAmount}>{item.client_name}</Text>
          <Text style={styles.itemSub}>Remaining: {(item.remaining_amount ?? 0).toFixed(2)} DZD</Text>
          <Text style={styles.itemSub}>
            Installment: {(item.installment_amount ?? 0).toFixed(2)} DZD / {item.installment_frequency}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => navigation.navigate('NewSale', { saleId: item.id })}
        >
          <Text style={styles.payBtnText}>Pay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
            Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending ({pendingSales.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'payments' ? (
        <FlatList
          data={payments}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPayment}
          ListEmptyComponent={<Text style={styles.emptyText}>No payments recorded.</Text>}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={pendingSales}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPendingSale}
          ListEmptyComponent={<Text style={styles.emptyText}>No pending sales.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  tabs: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4A90E2' },
  tabText: { fontSize: 14, color: '#999' },
  tabTextActive: { color: '#4A90E2', fontWeight: '600' },
  listContent: { padding: 12, paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 1,
  },
  itemInfo: { flex: 1 },
  itemAmount: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  itemSub: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: '#E74C3C', fontSize: 18 },
  payBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  payBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
});
