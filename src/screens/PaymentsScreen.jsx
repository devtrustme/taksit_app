import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAllPendingPayments, recordPayment, snoozePayment } from '../models/payments';
import { updateChequeUsage } from '../models/cheques';
import { getDueStatus, getDaysLate } from '../utils/paymentLogic';
import { formatDate, todayISO } from '../utils/dateUtils';

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'En attente' },
  { key: 'partial', label: 'Partiel' },
  { key: 'late', label: 'En retard' },
  { key: 'paid', label: 'Payé' },
];

const STATUS_COLORS = {
  late: '#E74C3C',
  today: '#F39C12',
  partial: '#E67E22',
  pending: '#3498DB',
  paid: '#27AE60',
  snoozed: '#95A5A6',
};

export default function PaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Espèces');
  const [payNote, setPayNote] = useState('');
  const [showSnooze, setShowSnooze] = useState(false);
  const [snoozePaymentItem, setSnoozePaymentItem] = useState(null);
  const [snoozeDate, setSnoozeDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  function loadData() {
    setPayments(getAllPendingPayments());
  }

  function filteredPayments() {
    return payments.filter(p => {
      const s = getDueStatus(p.due_date, p.status, p.snoozed_to);
      if (activeTab === 'all') return true;
      if (activeTab === 'paid') return p.status === 'paid';
      if (activeTab === 'partial') return s === 'partial';
      if (activeTab === 'late') return s === 'late';
      if (activeTab === 'pending') return s === 'pending' || s === 'today';
      return true;
    });
  }

  function openPayModal(payment) {
    setSelectedPayment(payment);
    setPayAmount(String(payment.remaining ?? payment.amount_due ?? ''));
    setPayMethod('Espèces');
    setPayNote('');
    setPayModal(true);
  }

  function confirmPay() {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }
    recordPayment(selectedPayment.id, {
      amount_paid: amt,
      payment_method: payMethod,
      notes: payNote,
      paid_date: todayISO(),
    });
    if (payMethod === 'Chèque' || payMethod === 'Poste') {
      updateChequeUsage(selectedPayment.sale_id);
    }
    setPayModal(false);
    loadData();
  }

  function openSnooze(payment) {
    setSnoozePaymentItem(payment);
    setSnoozeDate(new Date());
    setShowSnooze(true);
  }

  function confirmSnooze() {
    if (snoozePaymentItem) {
      snoozePayment(snoozePaymentItem.id, snoozeDate.toISOString().split('T')[0]);
    }
    setShowSnooze(false);
    loadData();
  }

  function renderItem({ item }) {
    const s = getDueStatus(item.due_date, item.status, item.snoozed_to);
    const color = STATUS_COLORS[s] || '#3498DB';
    const daysLate = getDaysLate(item.due_date);

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}
        onPress={() => openPayModal(item)}
      >
        <View style={styles.cardRow}>
          <Text style={styles.clientName}>{item.client_name}</Text>
          <View style={styles.badges}>
            {daysLate > 0 && s === 'late' && (
              <View style={[styles.badge, { backgroundColor: '#E74C3C' }]}>
                <Text style={styles.badgeText}>{daysLate}j</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>{s}</Text>
            </View>
          </View>
        </View>
        {item.product_names ? (
          <Text style={styles.products} numberOfLines={1}>{item.product_names}</Text>
        ) : null}
        <View style={styles.cardRow}>
          <View>
            <Text style={styles.amountDue}>{(item.amount_due ?? 0).toLocaleString()} DA</Text>
            {item.amount_paid > 0 && (
              <Text style={styles.amountPaid}>Payé: {item.amount_paid.toLocaleString()} DA</Text>
            )}
            <Text style={styles.dueDate}>Éch. {formatDate(item.due_date)}</Text>
          </View>
          <TouchableOpacity style={styles.snoozeBtn} onPress={() => openSnooze(item)}>
            <Text style={styles.snoozeBtnText}>⏰</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Paiements</Text>
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filteredPayments()}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.empty}>Aucun paiement</Text>}
      />

      {/* Pay Modal */}
      <Modal visible={payModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enregistrer un paiement</Text>
            {selectedPayment && (
              <Text style={styles.modalSub}>{selectedPayment.client_name} — Éch. {formatDate(selectedPayment.due_date)}</Text>
            )}
            <Text style={styles.label}>Montant (DA)</Text>
            <TextInput
              style={styles.modalInput}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>Méthode de paiement</Text>
            <View style={styles.methodRow}>
              {['Espèces', 'Chèque', 'Poste'].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodBtn, payMethod === m && styles.methodBtnActive]}
                  onPress={() => setPayMethod(m)}
                >
                  <Text style={[styles.methodBtnText, payMethod === m && styles.methodBtnTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Note (optionnel)</Text>
            <TextInput
              style={styles.modalInput}
              value={payNote}
              onChangeText={setPayNote}
              placeholder="Remarque..."
              placeholderTextColor="#999"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModal(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmPay}>
                <Text style={styles.confirmBtnText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Snooze Picker */}
      {showSnooze && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Reporter au...</Text>
              <DateTimePicker
                value={snoozeDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(_, date) => date && setSnoozeDate(date)}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSnooze(false)}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={confirmSnooze}>
                  <Text style={styles.confirmBtnText}>Reporter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', padding: 16, paddingBottom: 8 },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8 },
  tab: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#3498DB' },
  tabText: { fontSize: 12, color: '#999' },
  tabTextActive: { color: '#3498DB', fontWeight: '700' },
  card: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14,
    marginBottom: 8, elevation: 1,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  clientName: { fontSize: 15, fontWeight: '700', color: '#2C3E50', flex: 1 },
  products: { fontSize: 12, color: '#7F8C8D', marginBottom: 6 },
  badges: { flexDirection: 'row', gap: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  amountDue: { fontSize: 17, fontWeight: 'bold', color: '#2C3E50' },
  amountPaid: { fontSize: 12, color: '#27AE60' },
  dueDate: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  snoozeBtn: { backgroundColor: '#ECF0F1', borderRadius: 20, padding: 8 },
  snoozeBtnText: { fontSize: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#7F8C8D', marginBottom: 16 },
  label: { fontSize: 13, color: '#555', marginBottom: 6, marginTop: 10 },
  modalInput: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    padding: 12, fontSize: 14, marginBottom: 4,
  },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  methodBtn: { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, alignItems: 'center' },
  methodBtnActive: { borderColor: '#3498DB', backgroundColor: '#EBF5FB' },
  methodBtnText: { color: '#555', fontSize: 13 },
  methodBtnTextActive: { color: '#3498DB', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#555' },
  confirmBtn: { flex: 1, backgroundColor: '#27AE60', borderRadius: 8, padding: 14, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: '700' },
});
