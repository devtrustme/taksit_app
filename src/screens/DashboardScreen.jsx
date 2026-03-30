import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Linking, Alert, Modal, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAllPendingPayments, recordPayment, snoozePayment } from '../models/payments';
import { updateChequeUsage } from '../models/cheques';
import { getDatabase } from '../database/db';
import { getDueStatus, getDaysLate } from '../utils/paymentLogic';
import { formatDate, todayISO } from '../utils/dateUtils';

const STATUS_COLORS = {
  late: '#E74C3C',
  today: '#F39C12',
  partial: '#E67E22',
  pending: '#3498DB',
  snoozed: '#95A5A6',
};

function StatsBar({ stats }) {
  return (
    <View style={styles.statsBar}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.monthCollected.toLocaleString()} DA</Text>
        <Text style={styles.statLabel}>Collecté ce mois</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: '#E74C3C' }]}>{stats.totalRemaining.toLocaleString()} DA</Text>
        <Text style={styles.statLabel}>Reste total</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.lateCount}</Text>
        <Text style={styles.statLabel}>En retard</Text>
      </View>
    </View>
  );
}

function PaymentCard({ payment, onPay, onSnooze }) {
  const status = getDueStatus(payment.due_date, payment.status, payment.snoozed_to);
  const daysLate = getDaysLate(payment.due_date);
  const color = STATUS_COLORS[status] || '#3498DB';

  function callPhone() {
    if (payment.client_phone) {
      Linking.openURL(`tel:${payment.client_phone}`);
    }
  }

  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.cardRow}>
        <Text style={styles.clientName}>{payment.client_name}</Text>
        {daysLate > 0 && (
          <View style={[styles.badge, { backgroundColor: '#E74C3C' }]}>
            <Text style={styles.badgeText}>{daysLate}j retard</Text>
          </View>
        )}
        {status === 'today' && (
          <View style={[styles.badge, { backgroundColor: '#F39C12' }]}>
            <Text style={styles.badgeText}>Auj.</Text>
          </View>
        )}
      </View>
      {payment.product_names ? (
        <Text style={styles.products} numberOfLines={1}>{payment.product_names}</Text>
      ) : null}
      <View style={styles.cardRow}>
        <View>
          <Text style={styles.amountDue}>{(payment.amount_due ?? 0).toLocaleString()} DA</Text>
          {payment.amount_paid > 0 && (
            <Text style={styles.amountPaid}>Payé: {payment.amount_paid.toLocaleString()} DA</Text>
          )}
          <Text style={styles.remaining}>Reste: {(payment.remaining ?? payment.amount_due ?? 0).toLocaleString()} DA</Text>
          <Text style={styles.dueDate}>Échéance: {formatDate(payment.due_date)}</Text>
        </View>
        <View style={styles.actions}>
          {payment.client_phone ? (
            <TouchableOpacity style={styles.callBtn} onPress={callPhone}>
              <Text style={styles.callBtnText}>📞</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.payBtn} onPress={() => onPay(payment)}>
            <Text style={styles.payBtnText}>Payer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.snoozeBtn} onPress={() => onSnooze(payment)}>
            <Text style={styles.snoozeBtnText}>⏰</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ monthCollected: 0, totalRemaining: 0, lateCount: 0 });
  const [payModal, setPayModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
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
    const all = getAllPendingPayments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visible = all.filter(p => {
      const s = getDueStatus(p.due_date, p.status, p.snoozed_to);
      return s !== 'snoozed' && s !== 'paid';
    });

    visible.sort((a, b) => {
      const order = { late: 0, today: 1, partial: 2, pending: 3 };
      const sa = getDueStatus(a.due_date, a.status, a.snoozed_to);
      const sb = getDueStatus(b.due_date, b.status, b.snoozed_to);
      return (order[sa] ?? 9) - (order[sb] ?? 9);
    });

    setPayments(visible);

    const db = getDatabase();
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const collected = db.getFirstSync(
      `SELECT SUM(amount_paid) AS total FROM payments WHERE paid_date >= ? AND status IN ('paid','partial')`,
      [monthStart]
    );
    const remaining = db.getFirstSync(
      `SELECT SUM(remaining) AS total FROM payments WHERE status != 'paid'`
    );

    setStats({
      monthCollected: Math.round(collected?.total ?? 0),
      totalRemaining: Math.round(remaining?.total ?? 0),
      lateCount: visible.filter(p => getDueStatus(p.due_date, p.status, p.snoozed_to) === 'late').length,
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tableau de bord</Text>
      <StatsBar stats={stats} />
      <FlatList
        data={payments}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <PaymentCard payment={item} onPay={openPayModal} onSnooze={openSnooze} />
        )}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun paiement en attente</Text>
        }
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
              style={styles.input}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <View style={styles.quickBtnsRow}>
              {[500, 1000, 2000, 5000, 10000].map(v => (
                <TouchableOpacity key={v} style={styles.quickBtn} onPress={() => setPayAmount(String(v))}>
                  <Text style={styles.quickBtnText}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Méthode</Text>
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
  statsBar: {
    flexDirection: 'row', backgroundColor: '#2C3E50',
    marginHorizontal: 12, borderRadius: 12, padding: 16, marginBottom: 8,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 11, color: '#BDC3C7', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#4A5568', marginHorizontal: 4 },
  card: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14,
    marginBottom: 10, elevation: 2,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#2C3E50', flex: 1 },
  products: { fontSize: 12, color: '#7F8C8D', marginBottom: 6 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 6 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  amountDue: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  amountPaid: { fontSize: 13, color: '#27AE60' },
  remaining: { fontSize: 13, color: '#E74C3C', fontWeight: '600' },
  dueDate: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  actions: { alignItems: 'flex-end', gap: 6 },
  callBtn: { backgroundColor: '#27AE60', borderRadius: 20, padding: 8 },
  callBtnText: { fontSize: 16 },
  payBtn: { backgroundColor: '#3498DB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  payBtnText: { color: '#FFF', fontWeight: '700' },
  snoozeBtn: { backgroundColor: '#95A5A6', borderRadius: 20, padding: 8 },
  snoozeBtnText: { fontSize: 14 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#7F8C8D', marginBottom: 16 },
  label: { fontSize: 13, color: '#555', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    padding: 12, marginBottom: 8,
  },
  quickBtnsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  quickBtn: {
    backgroundColor: '#ECF0F1', borderRadius: 6, paddingHorizontal: 10,
    paddingVertical: 6, marginRight: 6, marginBottom: 6,
  },
  quickBtnText: { color: '#2C3E50', fontSize: 13 },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  methodBtn: { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, alignItems: 'center' },
  methodBtnActive: { borderColor: '#3498DB', backgroundColor: '#EBF5FB' },
  methodBtnText: { color: '#555', fontSize: 13 },
  methodBtnTextActive: { color: '#3498DB', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#555' },
  confirmBtn: { flex: 1, backgroundColor: '#27AE60', borderRadius: 8, padding: 14, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: '700' },
});
