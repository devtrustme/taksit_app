import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import ClientsScreen from '../screens/ClientsScreen';
import ClientProfileScreen from '../screens/ClientProfileScreen';
import NewClientScreen from '../screens/NewClientScreen';
import NewSaleScreen from '../screens/NewSaleScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import StockScreen from '../screens/StockScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ImportExportScreen from '../screens/ImportExportScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ImportExport"
        component={ImportExportScreen}
        options={{ title: 'Import / Export' }}
      />
    </Stack.Navigator>
  );
}

function ClientsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ClientsList"
        component={ClientsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ClientProfile"
        component={ClientProfileScreen}
        options={{ title: 'Profil Client' }}
      />
      <Stack.Screen
        name="NewClient"
        component={NewClientScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewSale"
        component={NewSaleScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function NewSaleStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="NewSaleMain"
        component={NewSaleScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function StockStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="StockList"
        component={StockScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Products"
        component={ProductsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PaymentsList"
        component={PaymentsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#3498DB',
          tabBarInactiveTintColor: '#95A5A6',
          tabBarStyle: { paddingBottom: 6, height: 60 },
          tabBarLabelStyle: { fontSize: 11 },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Dashboard: focused ? 'home' : 'home-outline',
              Clients: focused ? 'people' : 'people-outline',
              NewSale: focused ? 'add-circle' : 'add-circle-outline',
              Payments: focused ? 'cash' : 'cash-outline',
              Stock: focused ? 'cube' : 'cube-outline',
            };
            return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardStack}
          options={{ tabBarLabel: 'Tableau de bord' }}
        />
        <Tab.Screen
          name="Clients"
          component={ClientsStack}
          options={{ tabBarLabel: 'Clients' }}
        />
        <Tab.Screen
          name="NewSale"
          component={NewSaleStack}
          options={{ tabBarLabel: 'Nouvelle Vente' }}
        />
        <Tab.Screen
          name="Payments"
          component={PaymentsStack}
          options={{ tabBarLabel: 'Paiements' }}
        />
        <Tab.Screen
          name="Stock"
          component={StockStack}
          options={{ tabBarLabel: 'Stock' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({});
