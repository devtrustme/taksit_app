import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAllClients, searchClients, deleteClient } from '../models/clients';

export default function ClientsScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  function loadClients() {
    const data = getAllClients();
    setClients(data);
  }

  function handleSearch(text) {
    setSearchQuery(text);
    if (text.trim()) {
      const results = searchClients(text.trim());
      setClients(results);
    } else {
      loadClients();
    }
  }

  function handleDelete(client) {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteClient(client.id);
            loadClients();
          },
        },
      ]
    );
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('ClientProfile', { clientId: item.id })}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.full_name}</Text>
          {item.phone ? <Text style={styles.itemSub}>{item.phone}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search clients..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={clients}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No clients found.</Text>}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewClient')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    fontSize: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  itemSub: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: '#E74C3C', fontSize: 18 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabText: { color: '#FFF', fontSize: 30, lineHeight: 32 },
});
