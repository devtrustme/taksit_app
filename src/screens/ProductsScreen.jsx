import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProductById, createProduct, updateProduct } from '../models/products';
import { getAllCategories, createCategory } from '../models/categories';
import { getAllBrands, createBrand } from '../models/brands';

export default function ProductsScreen({ route, navigation }) {
  const editId = route.params?.productId;
  const [form, setForm] = useState({
    name: '', model: '', code: '', ref: '',
    buy_price: '', sell_price: '', stock_qty: '0', stock_alert_qty: '1',
    category_id: null, brand_id: null,
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [catModal, setCatModal] = useState(false);
  const [brandModal, setBrandModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  useEffect(() => {
    loadMeta();
    if (editId) {
      const p = getProductById(editId);
      if (p) {
        setForm({
          name: p.name ?? '',
          model: p.model ?? '',
          code: p.code ?? '',
          ref: p.ref ?? '',
          buy_price: String(p.buy_price ?? ''),
          sell_price: String(p.sell_price ?? ''),
          stock_qty: String(p.stock_qty ?? 0),
          stock_alert_qty: String(p.stock_alert_qty ?? 1),
          category_id: p.category_id,
          brand_id: p.brand_id,
        });
      }
    }
  }, [editId]);

  function loadMeta() {
    setCategories(getAllCategories());
    setBrands(getAllBrands());
  }

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }
    const data = {
      ...form,
      buy_price: parseFloat(form.buy_price) || 0,
      sell_price: parseFloat(form.sell_price) || 0,
      stock_qty: parseInt(form.stock_qty) || 0,
      stock_alert_qty: parseInt(form.stock_alert_qty) || 1,
    };
    if (editId) updateProduct(editId, data);
    else createProduct(data);
    navigation.goBack();
  }

  function addCategory() {
    if (!newCatName.trim()) return;
    createCategory(newCatName.trim());
    setNewCatName('');
    loadMeta();
  }

  function addBrand() {
    if (!newBrandName.trim()) return;
    createBrand(newBrandName.trim());
    setNewBrandName('');
    loadMeta();
  }

  const selectedCat = categories.find(c => c.id === form.category_id);
  const selectedBrand = brands.find(b => b.id === form.brand_id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{editId ? 'Modifier produit' : 'Nouveau produit'}</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Nom *</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={v => set('name', v)} placeholder="Nom du produit" placeholderTextColor="#999" />

        <Text style={styles.label}>Modèle</Text>
        <TextInput style={styles.input} value={form.model} onChangeText={v => set('model', v)} placeholder="Modèle" placeholderTextColor="#999" />

        <Text style={styles.label}>Code</Text>
        <TextInput style={styles.input} value={form.code} onChangeText={v => set('code', v)} placeholder="Code article" placeholderTextColor="#999" />

        <Text style={styles.label}>Référence</Text>
        <TextInput style={styles.input} value={form.ref} onChangeText={v => set('ref', v)} placeholder="Référence" placeholderTextColor="#999" />

        <Text style={styles.label}>Prix d'achat (DA)</Text>
        <TextInput style={styles.input} value={form.buy_price} onChangeText={v => set('buy_price', v)} keyboardType="numeric" placeholder="0" placeholderTextColor="#999" />

        <Text style={styles.label}>Prix de vente (DA)</Text>
        <TextInput style={styles.input} value={form.sell_price} onChangeText={v => set('sell_price', v)} keyboardType="numeric" placeholder="0" placeholderTextColor="#999" />

        <Text style={styles.label}>Quantité en stock</Text>
        <TextInput style={styles.input} value={form.stock_qty} onChangeText={v => set('stock_qty', v)} keyboardType="numeric" placeholder="0" placeholderTextColor="#999" />

        <Text style={styles.label}>Seuil d'alerte stock</Text>
        <TextInput style={styles.input} value={form.stock_alert_qty} onChangeText={v => set('stock_alert_qty', v)} keyboardType="numeric" placeholder="1" placeholderTextColor="#999" />

        <Text style={styles.label}>Catégorie</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setCatModal(true)}>
          <Text style={styles.selectBtnText}>{selectedCat ? selectedCat.name : 'Sélectionner...'}</Text>
          <Text style={styles.selectArrow}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Marque</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setBrandModal(true)}>
          <Text style={styles.selectBtnText}>{selectedBrand ? selectedBrand.name : 'Sélectionner...'}</Text>
          <Text style={styles.selectArrow}>▼</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={catModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Catégories</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="Nouvelle catégorie..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.addMiniBtn} onPress={addCategory}>
                <Text style={styles.addMiniBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.listItem, form.category_id === item.id && styles.listItemSelected]}
                  onPress={() => { set('category_id', item.id); setCatModal(false); }}
                >
                  <Text style={styles.listItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 300 }}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setCatModal(false)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Brand Modal */}
      <Modal visible={brandModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Marques</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={newBrandName}
                onChangeText={setNewBrandName}
                placeholder="Nouvelle marque..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.addMiniBtn} onPress={addBrand}>
                <Text style={styles.addMiniBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={brands}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.listItem, form.brand_id === item.id && styles.listItemSelected]}
                  onPress={() => { set('brand_id', item.id); setBrandModal(false); }}
                >
                  <Text style={styles.listItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 300 }}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setBrandModal(false)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#FFF', elevation: 2,
  },
  backBtn: { color: '#3498DB', fontSize: 15 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#2C3E50' },
  saveBtn: { backgroundColor: '#27AE60', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 60 },
  label: { fontSize: 13, color: '#555', marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD',
    padding: 12, fontSize: 14, color: '#2C3E50', marginBottom: 14,
  },
  selectBtn: {
    backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD',
    padding: 12, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between',
  },
  selectBtnText: { fontSize: 14, color: '#2C3E50' },
  selectArrow: { color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addMiniBtn: { backgroundColor: '#3498DB', borderRadius: 8, width: 44, alignItems: 'center', justifyContent: 'center' },
  addMiniBtnText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  listItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  listItemSelected: { backgroundColor: '#EBF5FB' },
  listItemText: { fontSize: 15, color: '#2C3E50' },
  closeBtn: { marginTop: 12, alignItems: 'center', padding: 14, borderTopWidth: 1, borderTopColor: '#EEE' },
  closeBtnText: { color: '#3498DB', fontWeight: '700' },
});
