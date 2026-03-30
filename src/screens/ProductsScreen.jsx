import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  getAllProducts, createProduct, updateProduct, deleteProduct, searchProducts
} from '../models/products';
import { getAllCategories } from '../models/categories';
import { getAllBrands } from '../models/brands';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: '', description: '', sku: '', category_id: null,
    brand_id: null, unit_price: '', stock_quantity: '', min_stock_level: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  function loadData() {
    setProducts(getAllProducts());
    setCategories(getAllCategories());
    setBrands(getAllBrands());
  }

  function handleSearch(text) {
    setSearchQuery(text);
    setProducts(text.trim() ? searchProducts(text.trim()) : getAllProducts());
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', sku: '', category_id: null, brand_id: null, unit_price: '', stock_quantity: '', min_stock_level: '' });
    setModalVisible(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      sku: product.sku ?? '',
      category_id: product.category_id,
      brand_id: product.brand_id,
      unit_price: String(product.unit_price),
      stock_quantity: String(product.stock_quantity),
      min_stock_level: String(product.min_stock_level ?? 0),
    });
    setModalVisible(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Product name is required.');
      return;
    }
    const data = {
      ...form,
      unit_price: parseFloat(form.unit_price) || 0,
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
      min_stock_level: parseInt(form.min_stock_level, 10) || 0,
    };
    if (editing) {
      updateProduct(editing.id, data);
    } else {
      createProduct(data);
    }
    setModalVisible(false);
    loadData();
  }

  function handleDelete(product) {
    Alert.alert('Delete Product', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { deleteProduct(product.id); loadData(); },
      },
    ]);
  }

  function renderItem({ item }) {
    return (
      <View style={styles.item}>
        <TouchableOpacity style={styles.itemInfo} onPress={() => openEdit(item)}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSub}>
            {item.unit_price.toFixed(2)} DZD • Stock: {item.stock_quantity}
          </Text>
          {item.category_name ? <Text style={styles.itemSub}>{item.category_name}</Text> : null}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modal}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Product' : 'New Product'}</Text>
            {[
              { label: 'Name *', key: 'name', placeholder: 'Product name' },
              { label: 'Description', key: 'description', placeholder: 'Optional' },
              { label: 'SKU', key: 'sku', placeholder: 'Optional' },
              { label: 'Unit Price (DZD)', key: 'unit_price', placeholder: '0', keyboard: 'numeric' },
              { label: 'Stock Quantity', key: 'stock_quantity', placeholder: '0', keyboard: 'numeric' },
              { label: 'Min Stock Level', key: 'min_stock_level', placeholder: '0', keyboard: 'numeric' },
            ].map(({ label, key, placeholder, keyboard }) => (
              <View key={key}>
                <Text style={styles.inputLabel}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  value={form[key]}
                  onChangeText={(v) => setForm({ ...form, [key]: v })}
                  keyboardType={keyboard ?? 'default'}
                />
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  searchInput: {
    margin: 12,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    fontSize: 15,
  },
  listContent: { paddingBottom: 80 },
  item: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    elevation: 1,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  itemSub: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: '#E74C3C', fontSize: 18 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#4A90E2', justifyContent: 'center',
    alignItems: 'center', elevation: 5,
  },
  fabText: { color: '#FFF', fontSize: 30, lineHeight: 32 },
  modal: { flex: 1, backgroundColor: '#F5F5F5' },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD',
    borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cancelBtn: {
    flex: 1, marginRight: 8, borderWidth: 1, borderColor: '#DDD',
    borderRadius: 8, padding: 14, alignItems: 'center', backgroundColor: '#FFF',
  },
  cancelBtnText: { color: '#555', fontSize: 15 },
  saveBtn: { flex: 1, marginLeft: 8, backgroundColor: '#4A90E2', borderRadius: 8, padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
