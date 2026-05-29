import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../lib/auth';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ServiceOrdersScreen from '../screens/ServiceOrdersScreen';
import ServiceOrderDetailScreen from '../screens/ServiceOrderDetailScreen';
import CustomersScreen from '../screens/CustomersScreen';
import CustomerDetailScreen from '../screens/CustomerDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

type IconName = 'home-outline' | 'home' | 'list-outline' | 'list' | 'people-outline' | 'people' | 'person-outline' | 'person';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const OrderStack = createNativeStackNavigator();
const CustomerStack = createNativeStackNavigator();

function OrderStackScreen() {
  return (
    <OrderStack.Navigator screenOptions={{ headerShown: false }}>
      <OrderStack.Screen name="ServiceOrders" component={ServiceOrdersScreen} />
      <OrderStack.Screen name="ServiceOrderDetail" component={ServiceOrderDetailScreen} />
    </OrderStack.Navigator>
  );
}

function CustomerStackScreen() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="Customers" component={CustomersScreen} />
      <CustomerStack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    </CustomerStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [IconName, IconName]> = {
            Dashboard: ['home-outline', 'home'],
            Orders: ['list-outline', 'list'],
            Customers: ['people-outline', 'people'],
            Profile: ['person-outline', 'person'],
          };
          const [outline, filled] = icons[route.name] || ['home-outline', 'home'];
          return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Orders" component={OrderStackScreen} options={{ tabBarLabel: 'Órdenes' }} />
      <Tab.Screen name="Customers" component={CustomerStackScreen} options={{ tabBarLabel: 'Clientes' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
