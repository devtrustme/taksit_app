import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createClient, getClientById, updateClient } from '../models/clients';

export default function NewClientScreen({ route, navigation }) {
  const editId = route.params?.clientId;
  const [form, setForm] = useState({
    numero_client: '', full_name: '', cin: '', ccp: '',
    wilaya: '', commune: '', address: '',
    phone_1: '', phone_2: '', phone_3: '', notes: '',
  });

  useEffect(() => {
    if (editId) {
      const c = getClientById(editId);
      if (c) setForm({ ...c });
    }
  }, [editId]);

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    if (!form.full_name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }
    if (editId) {
      updateClient(editId, form);
    } else {
      createClient(form);
    }
    navigation.goBack();
  }

  function field(label, key, opts = {}) {
    return (
      <View style={styles.fieldBox}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={form[key] ?? ''}
          onChangeText={v => set(key, v)}
          placeholderTextColor="#999"
          {...opts}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{editId ? 'Modifier client' : 'Nouveau client'}</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {field('Nom complet *', 'full_name', { placeholder: 'Nom et prénom' })}
        {field('N° Client', 'numero_client', { placeholder: 'Ex: C001', keyboardType: 'default' })}
        {field('CIN', 'cin', { placeholder: 'Carte d\'identité nationale' })}
        {field('CCP', 'ccp', { placeholder: 'Compte CCP' })}
        {field('Wilaya', 'wilaya', { placeholder: 'Wilaya' })}
        {field('Commune', 'commune', { placeholder: 'Commune' })}
        {field('Adresse', 'address', { placeholder: 'Adresse complète', multiline: true })}
        {field('Téléphone 1', 'phone_1', { placeholder: '0550...', keyboardType: 'phone-pad' })}
        {field('Téléphone 2', 'phone_2', { placeholder: '0550...', keyboardType: 'phone-pad' })}
        {field('Téléphone 3', 'phone_3', { placeholder: '0550...', keyboardType: 'phone-pad' })}
        {field('Notes', 'notes', { placeholder: 'Remarques...', multiline: true })}
      </ScrollView>
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
  fieldBox: { marginBottom: 14 },
  label: { fontSize: 13, color: '#555', marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD',
    padding: 12, fontSize: 14, color: '#2C3E50',
  },
});
