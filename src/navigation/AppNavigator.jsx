import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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

function ClientsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ClientsList" component={ClientsScreen} options={{ title: 'Clients' }} />
      <Stack.Screen name="ClientProfile" component={ClientProfileScreen} options={{ title: 'Client Profile' }} />
      <Stack.Screen name="NewClient" component={NewClientScreen} options={{ title: 'New Client' }} />
      <Stack.Screen name="NewSale" component={NewSaleScreen} options={{ title: 'New Sale' }} />
    </Stack.Navigator>
  );
}

function StockStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StockList" component={StockScreen} options={{ title: 'Stock' }} />
      <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
    </Stack.Navigator>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsStack}
        options={{ tabBarLabel: 'Clients' }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ tabBarLabel: 'Payments' }}
      />
      <Tab.Screen
        name="Stock"
        component={StockStack}
        options={{ tabBarLabel: 'Stock' }}
      />
      <Tab.Screen
        name="ImportExport"
        component={ImportExportScreen}
        options={{ tabBarLabel: 'Import/Export' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
