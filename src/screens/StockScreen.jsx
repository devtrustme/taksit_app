import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAllProducts, searchProducts, getLowStockProducts } from '../models/products';

export default function StockScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [showLowStock])
  );

  function loadProducts() {
    if (showLowStock) {
      setProducts(getLowStockProducts());
    } else {
      setProducts(getAllProducts());
    }
  }

  function handleSearch(text) {
    setSearchQuery(text);
    setProducts(text.trim() ? searchProducts(text.trim()) : getAllProducts());
  }

  function toggleLowStock() {
    setSearchQuery('');
    setShowLowStock(!showLowStock);
  }

  function renderItem({ item }) {
    const isLow = item.stock_quantity <= item.min_stock_level;
    return (
      <TouchableOpacity
        style={[styles.item, isLow && styles.itemLow]}
        onPress={() => navigation.navigate('Products', { productId: item.id })}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.sku ? <Text style={styles.itemSub}>SKU: {item.sku}</Text> : null}
          {item.category_name ? <Text style={styles.itemSub}>{item.category_name}</Text> : null}
        </View>
        <View style={styles.stockBadge}>
          <Text style={[styles.stockQty, isLow && styles.stockQtyLow]}>
            {item.stock_quantity}
          </Text>
          <Text style={styles.stockLabel}>in stock</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity
          style={[styles.filterBtn, showLowStock && styles.filterBtnActive]}
          onPress={toggleLowStock}
        >
          <Text style={[styles.filterBtnText, showLowStock && styles.filterBtnTextActive]}>
            Low Stock
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {showLowStock ? 'No low stock products.' : 'No products found.'}
          </Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  headerRow: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  searchInput: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    fontSize: 15,
    marginRight: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  filterBtnActive: { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },
  filterBtnText: { fontSize: 13, color: '#555' },
  filterBtnTextActive: { color: '#FFF', fontWeight: '600' },
  listContent: { paddingBottom: 32 },
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
  itemLow: { borderLeftWidth: 3, borderLeftColor: '#E74C3C' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  itemSub: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  stockBadge: { alignItems: 'center' },
  stockQty: { fontSize: 22, fontWeight: 'bold', color: '#27AE60' },
  stockQtyLow: { color: '#E74C3C' },
  stockLabel: { fontSize: 11, color: '#999' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
});
