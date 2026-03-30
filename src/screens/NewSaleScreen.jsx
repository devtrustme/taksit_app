import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllClients, searchClients } from '../models/clients';
import { createSale } from '../models/sales';
import { createSaleItem } from '../models/saleItems';
import { getAllProducts, searchProducts } from '../models/products';

export default function NewSaleScreen({ route, navigation }) {
  const preselectedClientId = route.params?.clientId ?? null;

  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientList, setShowClientList] = useState(false);

  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const [downPayment, setDownPayment] = useState('0');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (preselectedClientId) {
      const allClients = getAllClients();
      const c = allClients.find((cl) => cl.id === preselectedClientId);
      if (c) setSelectedClient(c);
    }
    setProducts(getAllProducts());
  }, []);

  function handleClientSearch(text) {
    setClientSearch(text);
    if (text.trim()) {
      setClients(searchClients(text.trim()));
    } else {
      setClients(getAllClients());
    }
    setShowClientList(true);
  }

  function handleProductSearch(text) {
    setProductSearch(text);
    if (text.trim()) {
      setProducts(searchProducts(text.trim()));
    } else {
      setProducts(getAllProducts());
    }
    setShowProductList(true);
  }

  function addToCart(product) {
    const existing = cartItems.find((i) => i.product_id === product.id);
    if (existing) {
      setCartItems(cartItems.map((i) =>
        i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
          : i
      ));
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.unit_price,
        total_price: product.unit_price,
      }]);
    }
    setShowProductList(false);
    setProductSearch('');
  }

  function removeFromCart(productId) {
    setCartItems(cartItems.filter((i) => i.product_id !== productId));
  }

  const totalAmount = cartItems.reduce((sum, i) => sum + i.total_price, 0);
  const remainingAmount = totalAmount - parseFloat(downPayment || '0');
  const installmentAmount = parseFloat(installmentCount) > 0
    ? remainingAmount / parseFloat(installmentCount)
    : 0;

  function handleSubmit() {
    if (!selectedClient) {
      Alert.alert('Error', 'Please select a client.');
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Please add at least one product.');
      return;
    }

    const saleId = createSale({
      client_id: selectedClient.id,
      total_amount: totalAmount,
      down_payment: parseFloat(downPayment || '0'),
      remaining_amount: remainingAmount,
      installment_count: parseInt(installmentCount, 10),
      installment_amount: installmentAmount,
      installment_frequency: 'monthly',
      start_date: startDate,
      notes,
    });

    cartItems.forEach((item) => {
      createSaleItem({
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      });
    });

    Alert.alert('Success', 'Sale created successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Client</Text>
        {selectedClient ? (
          <View style={styles.selectedItem}>
            <Text style={styles.selectedName}>{selectedClient.full_name}</Text>
            <TouchableOpacity onPress={() => setSelectedClient(null)}>
              <Text style={styles.changeBtn}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Search client..."
              value={clientSearch}
              onChangeText={handleClientSearch}
              onFocus={() => setShowClientList(true)}
            />
            {showClientList && (
              <FlatList
                data={clients}
                keyExtractor={(i) => String(i.id)}
                style={styles.dropdown}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => { setSelectedClient(item); setShowClientList(false); }}
                  >
                    <Text>{item.full_name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>Products</Text>
        <TextInput
          style={styles.input}
          placeholder="Search product..."
          value={productSearch}
          onChangeText={handleProductSearch}
          onFocus={() => setShowProductList(true)}
        />
        {showProductList && (
          <FlatList
            data={products}
            keyExtractor={(i) => String(i.id)}
            style={styles.dropdown}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.dropdownItem} onPress={() => addToCart(item)}>
                <Text>{item.name}</Text>
                <Text style={styles.productPrice}>{item.unit_price.toFixed(2)} DZD</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {cartItems.map((item) => (
          <View key={item.product_id} style={styles.cartItem}>
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName}>{item.product_name}</Text>
              <Text style={styles.cartItemPrice}>
                {item.quantity} × {item.unit_price.toFixed(2)} = {item.total_price.toFixed(2)} DZD
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.product_id)}>
              <Text style={styles.removeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{totalAmount.toFixed(2)} DZD</Text>
        </View>

        <Text style={styles.sectionTitle}>Payment Terms</Text>
        <Text style={styles.inputLabel}>Down Payment (DZD)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={downPayment}
          onChangeText={setDownPayment}
        />
        <Text style={styles.inputLabel}>Number of Installments</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={installmentCount}
          onChangeText={setInstallmentCount}
        />
        <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
        />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryRow}>Remaining: {remainingAmount.toFixed(2)} DZD</Text>
          <Text style={styles.summaryRow}>Per Installment: {installmentAmount.toFixed(2)} DZD</Text>
        </View>

        <Text style={styles.inputLabel}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Create Sale</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  inputLabel: { fontSize: 13, color: '#555', marginBottom: 4 },
  dropdown: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    maxHeight: 160,
    marginBottom: 8,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productPrice: { color: '#4A90E2', fontWeight: '600' },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedName: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  changeBtn: { color: '#4A90E2', fontWeight: '600' },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  cartItemPrice: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  removeBtn: { color: '#E74C3C', fontSize: 18, paddingHorizontal: 6 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#4A90E2' },
  summaryCard: { backgroundColor: '#F0F8FF', borderRadius: 8, padding: 12, marginBottom: 8 },
  summaryRow: { fontSize: 14, color: '#2C3E50', marginBottom: 2 },
  submitBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
