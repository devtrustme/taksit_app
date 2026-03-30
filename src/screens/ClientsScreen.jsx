import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAllClients, searchClients, deleteClient } from '../models/clients';

export default function ClientsScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  function loadClients() {
    setClients(getAllClients());
  }

  function handleSearch(text) {
    setQuery(text);
    if (text.trim()) {
      setClients(searchClients(text.trim()));
    } else {
      loadClients();
    }
  }

  function handleDelete(client) {
    Alert.alert('Supprimer', `Supprimer ${client.full_name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => { deleteClient(client.id); loadClients(); },
      },
    ]);
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ClientProfile', { clientId: item.id })}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.full_name}</Text>
            {item.phone_1 ? <Text style={styles.sub}>{item.phone_1}</Text> : null}
            {item.wilaya ? <Text style={styles.sub}>{item.wilaya}{item.commune ? ` — ${item.commune}` : ''}</Text> : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('NewClient', {})}
        >
          <Text style={styles.addBtnText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou téléphone..."
          value={query}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
      </View>
      <FlatList
        data={clients}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.empty}>Aucun client trouvé</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50' },
  addBtn: { backgroundColor: '#3498DB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#FFF', fontWeight: '700' },
  searchBox: { marginHorizontal: 12, marginBottom: 8 },
  searchInput: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 12,
    fontSize: 14, elevation: 1, color: '#2C3E50',
  },
  card: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14,
    marginBottom: 8, elevation: 1,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#3498DB', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  sub: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
