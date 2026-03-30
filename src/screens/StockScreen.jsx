import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAllProducts, searchProducts, deleteProduct, adjustStock } from '../models/products';
import { createStockMovement } from '../models/stockMovements';

export default function StockScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('entree');

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  function loadProducts() {
    setProducts(getAllProducts());
  }

  function handleSearch(text) {
    setQuery(text);
    if (text.trim()) setProducts(searchProducts(text.trim()));
    else loadProducts();
  }

  function handleDelete(product) {
    Alert.alert('Supprimer', `Supprimer ${product.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => { deleteProduct(product.id); loadProducts(); },
      },
    ]);
  }

  function openAdjust(product) {
    setAdjustProduct(product);
    setAdjustQty('1');
    setAdjustType('entree');
    setAdjustModal(true);
  }

  function confirmAdjust() {
    const qty = parseInt(adjustQty);
    if (!qty || qty <= 0) {
      Alert.alert('Erreur', 'Quantité invalide');
      return;
    }
    createStockMovement({
      product_id: adjustProduct.id,
      movement_type: adjustType,
      quantity: qty,
      notes: 'Ajustement manuel',
    });
    setAdjustModal(false);
    loadProducts();
  }

  function renderItem({ item }) {
    const isLow = item.stock_qty <= item.stock_alert_qty;
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.productName}>{item.name}</Text>
              {isLow && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>⚠ Stock bas</Text>
                </View>
              )}
            </View>
            {item.model ? <Text style={styles.sub}>{item.model}</Text> : null}
            {item.category_name ? <Text style={styles.sub}>{item.category_name}{item.brand_name ? ` — ${item.brand_name}` : ''}</Text> : null}
            <View style={styles.pricesRow}>
              <Text style={styles.buyPrice}>Achat: {(item.buy_price ?? 0).toLocaleString()} DA</Text>
              <Text style={styles.sellPrice}>Vente: {(item.sell_price ?? 0).toLocaleString()} DA</Text>
            </View>
          </View>
          <View style={styles.stockBox}>
            <Text style={[styles.stockQty, isLow && { color: '#E74C3C' }]}>{item.stock_qty ?? 0}</Text>
            <Text style={styles.stockLabel}>unités</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => openAdjust(item)}>
            <Text style={styles.adjustBtnText}>Ajuster stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('Products', { productId: item.id })}
          >
            <Text style={styles.editBtnText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const lowCount = products.filter(p => p.stock_qty <= p.stock_alert_qty).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('Products', {})}
        >
          <Text style={styles.addBtnText}>+ Produit</Text>
        </TouchableOpacity>
      </View>
      {lowCount > 0 && (
        <View style={styles.alertBar}>
          <Text style={styles.alertBarText}>⚠ {lowCount} produit(s) en stock bas</Text>
        </View>
      )}
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un produit..."
        value={query}
        onChangeText={handleSearch}
        placeholderTextColor="#999"
      />
      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.empty}>Aucun produit</Text>}
      />

      <Modal visible={adjustModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ajuster le stock</Text>
            {adjustProduct && <Text style={styles.modalSub}>{adjustProduct.name} — Stock actuel: {adjustProduct.stock_qty}</Text>}
            <View style={styles.typeRow}>
              {[{ key: 'entree', label: 'Entrée ↑' }, { key: 'sortie', label: 'Sortie ↓' }].map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, adjustType === t.key && styles.typeBtnActive]}
                  onPress={() => setAdjustType(t.key)}
                >
                  <Text style={[styles.typeBtnText, adjustType === t.key && styles.typeBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Quantité</Text>
            <TextInput
              style={styles.modalInput}
              value={adjustQty}
              onChangeText={setAdjustQty}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#999"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAdjustModal(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmAdjust}>
                <Text style={styles.confirmBtnText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50' },
  addBtn: { backgroundColor: '#3498DB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#FFF', fontWeight: '700' },
  alertBar: {
    backgroundColor: '#FFF3CD', marginHorizontal: 12, borderRadius: 8,
    padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#FFEAA7',
  },
  alertBarText: { color: '#856404', fontWeight: '600' },
  searchInput: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 12, fontSize: 14,
    marginHorizontal: 12, marginBottom: 8, elevation: 1, color: '#2C3E50',
  },
  card: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14,
    marginBottom: 8, elevation: 1,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 },
  productName: { fontSize: 15, fontWeight: '700', color: '#2C3E50', marginRight: 8 },
  sub: { fontSize: 12, color: '#7F8C8D', marginBottom: 2 },
  alertBadge: { backgroundColor: '#E74C3C', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  alertBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  pricesRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  buyPrice: { fontSize: 12, color: '#7F8C8D' },
  sellPrice: { fontSize: 13, color: '#27AE60', fontWeight: '600' },
  stockBox: { alignItems: 'center', minWidth: 50 },
  stockQty: { fontSize: 26, fontWeight: 'bold', color: '#2C3E50' },
  stockLabel: { fontSize: 11, color: '#7F8C8D' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 },
  adjustBtn: { flex: 2, backgroundColor: '#EBF5FB', borderRadius: 8, padding: 8, alignItems: 'center' },
  adjustBtnText: { color: '#2980B9', fontWeight: '600', fontSize: 13 },
  editBtn: { flex: 2, backgroundColor: '#FFF9C4', borderRadius: 8, padding: 8, alignItems: 'center' },
  editBtnText: { color: '#856404', fontWeight: '600', fontSize: 13 },
  deleteBtn: { backgroundColor: '#FDEDEC', borderRadius: 8, padding: 8, paddingHorizontal: 12 },
  deleteBtnText: { color: '#E74C3C', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#7F8C8D', marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, borderWidth: 2, borderColor: '#DDD', borderRadius: 10, padding: 12, alignItems: 'center' },
  typeBtnActive: { borderColor: '#27AE60', backgroundColor: '#EAFAF1' },
  typeBtnText: { fontWeight: '700', color: '#555' },
  typeBtnTextActive: { color: '#27AE60' },
  label: { fontSize: 13, color: '#555', marginBottom: 6 },
  modalInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#555' },
  confirmBtn: { flex: 1, backgroundColor: '#27AE60', borderRadius: 8, padding: 14, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: '700' },
});
