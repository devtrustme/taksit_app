import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllClients, searchClients, createClient } from '../models/clients';
import { getAllGuarantors, createGuarantor } from '../models/guarantors';
import { searchProducts, getAllProducts } from '../models/products';
import { createSale } from '../models/sales';
import { createSaleItem } from '../models/saleItems';
import { createPayment } from '../models/payments';
import { createCheque } from '../models/cheques';
import { createStockMovement } from '../models/stockMovements';
import { generatePaymentSchedule, suggestPayments } from '../utils/paymentLogic';
import { formatDate, todayISO } from '../utils/dateUtils';

const STEPS = ['Client', 'Produits', 'Plan', 'Confirmation'];

export default function NewSaleScreen({ route, navigation }) {
  const prefillClientId = route.params?.clientId;
  const [step, setStep] = useState(0);

  // Step 1
  const [clients, setClients] = useState([]);
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [guarantors, setGuarantors] = useState([]);
  const [selectedGuarantor, setSelectedGuarantor] = useState(null);
  const [newClientMode, setNewClientMode] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newGuarantorMode, setNewGuarantorMode] = useState(false);
  const [newGuarantorName, setNewGuarantorName] = useState('');
  const [newGuarantorPhone, setNewGuarantorPhone] = useState('');

  // Step 2
  const [products, setProducts] = useState([]);
  const [productQuery, setProductQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Step 3
  const [planMonths, setPlanMonths] = useState(12);
  const [totalPrice, setTotalPrice] = useState('');
  const [firstPayment, setFirstPayment] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [saleDate, setSaleDate] = useState(todayISO());

  // Step 4
  const [schedule, setSchedule] = useState([]);
  const [chequesGiven, setChequesGiven] = useState('0');

  useEffect(() => {
    const allClients = getAllClients();
    setClients(allClients);
    if (prefillClientId) {
      const c = allClients.find(x => x.id === prefillClientId);
      if (c) setSelectedClient(c);
    }
    setGuarantors(getAllGuarantors());
    setProducts(getAllProducts());
  }, []);

  function searchC(text) {
    setClientQuery(text);
    if (text.trim()) setClients(searchClients(text.trim()));
    else setClients(getAllClients());
  }

  function searchP(text) {
    setProductQuery(text);
    if (text.trim()) setProducts(searchProducts(text.trim()));
    else setProducts(getAllProducts());
  }

  function addProduct(product) {
    if (selectedProducts.find(p => p.id === product.id)) return;
    setSelectedProducts(prev => [...prev, { ...product, price: product.sell_price ?? 0 }]);
  }

  function removeProduct(id) {
    setSelectedProducts(prev => prev.filter(p => p.id !== id));
  }

  function updateProductPrice(id, price) {
    setSelectedProducts(prev => prev.map(p => p.id === id ? { ...p, price: parseFloat(price) || 0 } : p));
  }

  function onPlanChange(months) {
    setPlanMonths(months);
    const total = parseFloat(totalPrice) || 0;
    if (total > 0) {
      const s = suggestPayments(months, total);
      setFirstPayment(String(Math.round(s.firstPayment)));
      setMonthlyAmount(String(Math.round(s.monthlyAmount)));
    }
  }

  function onTotalChange(val) {
    setTotalPrice(val);
    const total = parseFloat(val) || 0;
    if (total > 0) {
      const s = suggestPayments(planMonths, total);
      setFirstPayment(String(Math.round(s.firstPayment)));
      setMonthlyAmount(String(Math.round(s.monthlyAmount)));
    }
  }

  function buildSchedule() {
    const total = parseFloat(totalPrice) || 0;
    const first = parseFloat(firstPayment) || 0;
    const monthly = parseFloat(monthlyAmount) || 0;
    const sch = generatePaymentSchedule(saleDate, planMonths, total, first, monthly);
    setSchedule(sch);
  }

  function goNext() {
    if (step === 0) {
      if (!selectedClient && !newClientMode) {
        Alert.alert('Erreur', 'Sélectionnez ou créez un client');
        return;
      }
      if (newClientMode && !newClientName.trim()) {
        Alert.alert('Erreur', 'Le nom du client est obligatoire');
        return;
      }
    }
    if (step === 1 && selectedProducts.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins un produit');
      return;
    }
    if (step === 2) {
      if (!totalPrice || parseFloat(totalPrice) <= 0) {
        Alert.alert('Erreur', 'Prix total invalide');
        return;
      }
      buildSchedule();
    }
    setStep(s => s + 1);
  }

  function goBack() {
    if (step === 0) navigation.goBack();
    else setStep(s => s - 1);
  }

  async function confirmSale() {
    try {
      // Create client if needed
      let clientId = selectedClient?.id;
      if (newClientMode) {
        clientId = createClient({ full_name: newClientName, phone_1: newClientPhone });
        if (!clientId) throw new Error('Échec de la création du client');
      }
      if (!clientId) throw new Error('Client invalide');

      // Create guarantor if needed
      let guarantorId = selectedGuarantor?.id ?? null;
      if (newGuarantorMode && newGuarantorName.trim()) {
        guarantorId = createGuarantor({ full_name: newGuarantorName, phone_1: newGuarantorPhone });
        if (!guarantorId) guarantorId = null;
      }

      // Create sale
      const saleId = createSale({
        client_id: clientId,
        guarantor_id: guarantorId,
        sale_date: saleDate,
        plan_months: planMonths,
        total_price: parseFloat(totalPrice),
        first_payment: parseFloat(firstPayment) || 0,
        monthly_amount: parseFloat(monthlyAmount) || 0,
        status: 'active',
      });

      // Create sale items + decrement stock
      for (const p of selectedProducts) {
        createSaleItem({
          sale_id: saleId,
          product_id: p.id,
          product_name: p.name,
          model_at_sale: p.model ?? null,
          buy_price_at_sale: p.buy_price ?? 0,
          sell_price_at_sale: p.price,
        });
        createStockMovement({
          product_id: p.id,
          movement_type: 'sortie',
          quantity: 1,
          reference_sale_id: saleId,
          notes: `Vente #${saleId}`,
        });
      }

      // Create payment rows
      for (const p of schedule) {
        createPayment({
          sale_id: saleId,
          payment_number: p.payment_number,
          amount_due: p.amount_due,
          amount_paid: 0,
          remaining: p.amount_due,
          due_date: p.due_date,
          status: 'pending',
        });
      }

      // Create cheque record
      const cheques = parseInt(chequesGiven) || 0;
      if (cheques > 0) {
        createCheque({
          sale_id: saleId,
          total_cheques_given: cheques,
          cheques_remaining: cheques,
        });
      }

      Alert.alert('Succès', 'Vente créée avec succès!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <ScrollView contentContainerStyle={styles.stepContent}>
            <Text style={styles.stepTitle}>Étape 1 : Client</Text>

            {!newClientMode ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Rechercher un client..."
                  value={clientQuery}
                  onChangeText={searchC}
                  placeholderTextColor="#999"
                />
                {clients.slice(0, 8).map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.listItem, selectedClient?.id === c.id && styles.listItemSelected]}
                    onPress={() => setSelectedClient(c)}
                  >
                    <Text style={styles.listItemText}>{c.full_name}</Text>
                    {c.phone_1 ? <Text style={styles.listItemSub}>{c.phone_1}</Text> : null}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.linkBtn} onPress={() => setNewClientMode(true)}>
                  <Text style={styles.linkBtnText}>+ Créer un nouveau client</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View>
                <Text style={styles.label}>Nom complet *</Text>
                <TextInput style={styles.input} value={newClientName} onChangeText={setNewClientName} placeholderTextColor="#999" placeholder="Nom du client" />
                <Text style={styles.label}>Téléphone</Text>
                <TextInput style={styles.input} value={newClientPhone} onChangeText={setNewClientPhone} placeholderTextColor="#999" placeholder="0550..." keyboardType="phone-pad" />
                <TouchableOpacity style={styles.linkBtn} onPress={() => setNewClientMode(false)}>
                  <Text style={styles.linkBtnText}>← Rechercher un client existant</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedClient && (
              <View style={styles.selectedBox}>
                <Text style={styles.selectedLabel}>Client sélectionné :</Text>
                <Text style={styles.selectedName}>{selectedClient.full_name}</Text>
              </View>
            )}

            <Text style={[styles.stepTitle, { marginTop: 20 }]}>Garant (optionnel)</Text>
            {!newGuarantorMode ? (
              <>
                {guarantors.slice(0, 5).map(g => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.listItem, selectedGuarantor?.id === g.id && styles.listItemSelected]}
                    onPress={() => setSelectedGuarantor(selectedGuarantor?.id === g.id ? null : g)}
                  >
                    <Text style={styles.listItemText}>{g.full_name}</Text>
                    {g.phone_1 ? <Text style={styles.listItemSub}>{g.phone_1}</Text> : null}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.linkBtn} onPress={() => setNewGuarantorMode(true)}>
                  <Text style={styles.linkBtnText}>+ Nouveau garant</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View>
                <Text style={styles.label}>Nom garant</Text>
                <TextInput style={styles.input} value={newGuarantorName} onChangeText={setNewGuarantorName} placeholderTextColor="#999" placeholder="Nom du garant" />
                <Text style={styles.label}>Téléphone garant</Text>
                <TextInput style={styles.input} value={newGuarantorPhone} onChangeText={setNewGuarantorPhone} placeholderTextColor="#999" placeholder="0550..." keyboardType="phone-pad" />
                <TouchableOpacity style={styles.linkBtn} onPress={() => setNewGuarantorMode(false)}>
                  <Text style={styles.linkBtnText}>← Garant existant</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        );

      case 1:
        return (
          <ScrollView contentContainerStyle={styles.stepContent}>
            <Text style={styles.stepTitle}>Étape 2 : Produits</Text>
            <TextInput
              style={styles.input}
              placeholder="Rechercher un produit..."
              value={productQuery}
              onChangeText={searchP}
              placeholderTextColor="#999"
            />
            {products.slice(0, 10).map(p => (
              <TouchableOpacity
                key={p.id}
                style={styles.listItem}
                onPress={() => addProduct(p)}
              >
                <View style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemText}>{p.name}</Text>
                    {p.model ? <Text style={styles.listItemSub}>{p.model}</Text> : null}
                  </View>
                  <Text style={styles.productPrice}>{(p.sell_price ?? 0).toLocaleString()} DA</Text>
                  <Text style={styles.productStock}>Stock: {p.stock_qty ?? 0}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {selectedProducts.length > 0 && (
              <View style={styles.selectedProductsBox}>
                <Text style={styles.selectedLabel}>Produits sélectionnés :</Text>
                {selectedProducts.map(p => (
                  <View key={p.id} style={styles.selectedProductRow}>
                    <Text style={styles.selectedProductName} numberOfLines={1}>{p.name}</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={String(p.price)}
                      onChangeText={v => updateProductPrice(p.id, v)}
                      keyboardType="numeric"
                    />
                    <Text style={styles.priceUnit}>DA</Text>
                    <TouchableOpacity onPress={() => removeProduct(p.id)}>
                      <Text style={styles.removeBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <Text style={styles.totalProducts}>
                  Total: {selectedProducts.reduce((s, p) => s + p.price, 0).toLocaleString()} DA
                </Text>
              </View>
            )}
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView contentContainerStyle={styles.stepContent}>
            <Text style={styles.stepTitle}>Étape 3 : Plan de paiement</Text>
            <Text style={styles.label}>Date de vente</Text>
            <TextInput
              style={styles.input}
              value={saleDate}
              onChangeText={setSaleDate}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>Durée du plan</Text>
            <View style={styles.planRow}>
              {[5, 6, 12].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.planBtn, planMonths === m && styles.planBtnActive]}
                  onPress={() => onPlanChange(m)}
                >
                  <Text style={[styles.planBtnText, planMonths === m && styles.planBtnTextActive]}>{m} mois</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Prix total (DA)</Text>
            <TextInput
              style={styles.input}
              value={totalPrice}
              onChangeText={onTotalChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>1er versement (DA)</Text>
            <TextInput
              style={styles.input}
              value={firstPayment}
              onChangeText={setFirstPayment}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>Mensualité (DA)</Text>
            <TextInput
              style={styles.input}
              value={monthlyAmount}
              onChangeText={setMonthlyAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>Plan: {planMonths} mois</Text>
              <Text style={styles.summaryText}>Total: {(parseFloat(totalPrice) || 0).toLocaleString()} DA</Text>
              <Text style={styles.summaryText}>1er paiement: {(parseFloat(firstPayment) || 0).toLocaleString()} DA</Text>
              <Text style={styles.summaryText}>Mensualités: {(parseFloat(monthlyAmount) || 0).toLocaleString()} DA × {planMonths - (planMonths === 12 ? 0 : 1)} mois</Text>
            </View>
          </ScrollView>
        );

      case 3:
        return (
          <ScrollView contentContainerStyle={styles.stepContent}>
            <Text style={styles.stepTitle}>Étape 4 : Confirmation</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Client: {selectedClient?.full_name || newClientName}</Text>
              <Text style={styles.summaryText}>Produits: {selectedProducts.map(p => p.name).join(', ')}</Text>
              <Text style={styles.summaryText}>Total: {(parseFloat(totalPrice) || 0).toLocaleString()} DA</Text>
              <Text style={styles.summaryText}>Plan: {planMonths} mois</Text>
            </View>

            <Text style={styles.label}>Chèques remis</Text>
            <TextInput
              style={styles.input}
              value={chequesGiven}
              onChangeText={setChequesGiven}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Échéancier de paiement</Text>
            {schedule.map(p => (
              <View key={p.payment_number} style={styles.scheduleRow}>
                <Text style={styles.scheduleNum}>#{p.payment_number}</Text>
                <Text style={styles.scheduleDate}>{formatDate(p.due_date)}</Text>
                <Text style={styles.scheduleAmt}>{(p.amount_due ?? 0).toLocaleString()} DA</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.confirmBtn} onPress={confirmSale}>
              <Text style={styles.confirmBtnText}>✓ Confirmer la vente</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      default:
        return null;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepIndicatorItem}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i <= step && styles.stepDotTextActive]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      {renderStep()}

      {/* Navigation buttons */}
      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.backNavBtn} onPress={goBack}>
          <Text style={styles.backNavBtnText}>{step === 0 ? 'Annuler' : '← Retour'}</Text>
        </TouchableOpacity>
        {step < 3 && (
          <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>Suivant →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  stepIndicator: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#FFF', padding: 12, elevation: 2,
  },
  stepIndicatorItem: { alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: '#BDC3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  stepDotActive: { borderColor: '#3498DB', backgroundColor: '#3498DB' },
  stepDotText: { fontSize: 13, color: '#BDC3C7', fontWeight: '700' },
  stepDotTextActive: { color: '#FFF' },
  stepLabel: { fontSize: 11, color: '#BDC3C7' },
  stepLabelActive: { color: '#3498DB', fontWeight: '700' },
  stepContent: { padding: 16, paddingBottom: 100 },
  stepTitle: { fontSize: 17, fontWeight: 'bold', color: '#2C3E50', marginBottom: 14 },
  label: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD',
    padding: 12, fontSize: 14, color: '#2C3E50', marginBottom: 12,
  },
  listItem: {
    backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: '#EEE',
  },
  listItemSelected: { borderColor: '#3498DB', backgroundColor: '#EBF5FB' },
  listItemText: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  listItemSub: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  linkBtn: { marginTop: 4, marginBottom: 12 },
  linkBtnText: { color: '#3498DB', fontSize: 14 },
  selectedBox: {
    backgroundColor: '#EBF5FB', borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: '#3498DB', marginTop: 8,
  },
  selectedLabel: { fontSize: 12, color: '#7F8C8D', marginBottom: 4 },
  selectedName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productPrice: { color: '#27AE60', fontWeight: '700', marginHorizontal: 8 },
  productStock: { fontSize: 11, color: '#7F8C8D' },
  selectedProductsBox: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginTop: 14,
    borderWidth: 1, borderColor: '#DDD',
  },
  selectedProductRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 8,
  },
  selectedProductName: { flex: 1, fontSize: 13, color: '#2C3E50' },
  priceInput: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 6, padding: 6,
    width: 80, fontSize: 13, textAlign: 'right',
  },
  priceUnit: { fontSize: 12, color: '#555', marginHorizontal: 4 },
  removeBtn: { color: '#E74C3C', fontSize: 16, marginLeft: 8 },
  totalProducts: { fontSize: 14, fontWeight: '700', color: '#2C3E50', marginTop: 8, textAlign: 'right' },
  planRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  planBtn: {
    flex: 1, borderWidth: 2, borderColor: '#DDD', borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  planBtnActive: { borderColor: '#3498DB', backgroundColor: '#3498DB' },
  planBtnText: { color: '#555', fontWeight: '700' },
  planBtnTextActive: { color: '#FFF' },
  summaryBox: {
    backgroundColor: '#EBF5FB', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#3498DB', marginTop: 8,
  },
  summaryTitle: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50', marginBottom: 6 },
  summaryText: { fontSize: 13, color: '#555', marginBottom: 3 },
  scheduleRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 8, padding: 10, marginBottom: 4,
    borderWidth: 1, borderColor: '#EEE',
  },
  scheduleNum: { width: 30, fontSize: 12, color: '#999', fontWeight: '700' },
  scheduleDate: { flex: 1, fontSize: 13, color: '#555' },
  scheduleAmt: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  confirmBtn: {
    backgroundColor: '#27AE60', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 20,
  },
  confirmBtnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  navButtons: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, backgroundColor: '#FFF', elevation: 4,
    gap: 12,
  },
  backNavBtn: {
    flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  backNavBtnText: { color: '#555', fontWeight: '600' },
  nextBtn: {
    flex: 2, backgroundColor: '#3498DB', borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  nextBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
