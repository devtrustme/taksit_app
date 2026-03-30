import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createClient } from '../models/clients';

export default function NewClientScreen({ navigation }) {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    national_id: '',
    notes: '',
  });

  function handleSave() {
    if (!form.full_name.trim()) {
      Alert.alert('Error', 'Full name is required.');
      return;
    }
    createClient(form);
    Alert.alert('Success', 'Client created successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  const fields = [
    { label: 'Full Name *', key: 'full_name', placeholder: 'Enter full name' },
    { label: 'Phone', key: 'phone', placeholder: 'e.g. 0555 123 456', keyboard: 'phone-pad' },
    { label: 'Address', key: 'address', placeholder: 'Optional' },
    { label: 'National ID', key: 'national_id', placeholder: 'Optional' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {fields.map(({ label, key, placeholder, keyboard }) => (
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
        <Text style={styles.inputLabel}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Optional notes..."
          multiline
          value={form.notes}
          onChangeText={(v) => setForm({ ...form, notes: v })}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Create Client</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  inputLabel: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD',
    borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 14,
  },
  textarea: { height: 90, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#4A90E2', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
