import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDatabase } from '../database/db';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeSales: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    lowStockProducts: 0,
    pendingCheques: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  function loadStats() {
    const db = getDatabase();
    const totalClients = db.getFirstSync('SELECT COUNT(*) AS count FROM clients')?.count ?? 0;
    const activeSales = db.getFirstSync("SELECT COUNT(*) AS count FROM sales WHERE status = 'active'")?.count ?? 0;
    const totalRevenue = db.getFirstSync('SELECT SUM(amount) AS total FROM payments')?.total ?? 0;
    const pendingPayments = db.getFirstSync("SELECT SUM(remaining_amount) AS total FROM sales WHERE status = 'active'")?.total ?? 0;
    const lowStockProducts = db.getFirstSync('SELECT COUNT(*) AS count FROM products WHERE stock_quantity <= min_stock_level')?.count ?? 0;
    const pendingCheques = db.getFirstSync("SELECT COUNT(*) AS count FROM cheques WHERE status = 'pending'")?.count ?? 0;

    setStats({ totalClients, activeSales, totalRevenue, pendingPayments, lowStockProducts, pendingCheques });
  }

  const cards = [
    { label: 'Total Clients', value: stats.totalClients, screen: 'Clients', color: '#4A90E2' },
    { label: 'Active Sales', value: stats.activeSales, screen: 'NewSale', color: '#7ED321' },
    { label: 'Total Revenue', value: `${stats.totalRevenue.toFixed(2)} DZD`, screen: 'Payments', color: '#F5A623' },
    { label: 'Pending Payments', value: `${stats.pendingPayments.toFixed(2)} DZD`, screen: 'Payments', color: '#D0021B' },
    { label: 'Low Stock Items', value: stats.lowStockProducts, screen: 'Stock', color: '#9B59B6' },
    { label: 'Pending Cheques', value: stats.pendingCheques, screen: 'Payments', color: '#E74C3C' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Taksit Manager</Text>
        <Text style={styles.subtitle}>Dashboard</Text>
        <View style={styles.grid}>
          {cards.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { borderLeftColor: card.color }]}
              onPress={() => navigation.navigate(card.screen)}
            >
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  cardLabel: { fontSize: 12, color: '#7F8C8D' },
});
