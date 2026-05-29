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
import MoreScreen from '../screens/MoreScreen';
import TicketsScreen from '../screens/TicketsScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import QuotationsScreen from '../screens/QuotationsScreen';
import QuotationDetailScreen from '../screens/QuotationDetailScreen';
import ServiceReportsScreen from '../screens/ServiceReportsScreen';
import ServiceReportDetailScreen from '../screens/ServiceReportDetailScreen';
import InvoicesScreen from '../screens/InvoicesScreen';
import InvoiceDetailScreen from '../screens/InvoiceDetailScreen';
import EquipmentScreen from '../screens/EquipmentScreen';
import EquipmentDetailScreen from '../screens/EquipmentDetailScreen';
import AssetsScreen from '../screens/AssetsScreen';
import FleetTrackingScreen from '../screens/FleetTrackingScreen';
import PoliciesScreen from '../screens/PoliciesScreen';
import PolicyDetailScreen from '../screens/PolicyDetailScreen';
import MaintenanceLogsScreen from '../screens/MaintenanceLogsScreen';
import MaintenanceLogDetailScreen from '../screens/MaintenanceLogDetailScreen';
import DispatchScreen from '../screens/DispatchScreen';
import SurveysScreen from '../screens/SurveysScreen';
import SurveyDetailScreen from '../screens/SurveyDetailScreen';
import InventoryScreen from '../screens/InventoryScreen';
import RefaccionesScreen from '../screens/RefaccionesScreen';
import PricebookScreen from '../screens/PricebookScreen';
import CampaignsScreen from '../screens/CampaignsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import MLPredictionsScreen from '../screens/MLPredictionsScreen';
import UsersScreen from '../screens/UsersScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import HvacCalculatorScreen from '../screens/HvacCalculatorScreen';
import PurchaseOrdersScreen from '../screens/PurchaseOrdersScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import WarrantiesScreen from '../screens/WarrantiesScreen';



type IconName = 'home-outline' | 'home' | 'list-outline' | 'list' | 'people-outline' | 'people' | 'person-outline' | 'person' | 'grid-outline' | 'grid' | 'apps-outline' | 'apps';

const RootStack = createNativeStackNavigator();
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
            More: ['grid-outline', 'apps'],
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
      <Tab.Screen name="More" component={MoreScreen} options={{ tabBarLabel: 'Más' }} />
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
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen name="Tickets" component={TicketsScreen} />
            <RootStack.Screen name="TicketDetail" component={TicketDetailScreen} />
            <RootStack.Screen name="Quotations" component={QuotationsScreen} />
            <RootStack.Screen name="QuotationDetail" component={QuotationDetailScreen} />
            <RootStack.Screen name="ServiceReports" component={ServiceReportsScreen} />
            <RootStack.Screen name="ServiceReportDetail" component={ServiceReportDetailScreen} />
            <RootStack.Screen name="Invoices" component={InvoicesScreen} />
            <RootStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
            <RootStack.Screen name="Equipment" component={EquipmentScreen} />
            <RootStack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} />
            <RootStack.Screen name="Assets" component={AssetsScreen} />
            <RootStack.Screen name="FleetTracking" component={FleetTrackingScreen} />
            <RootStack.Screen name="Policies" component={PoliciesScreen} />
            <RootStack.Screen name="PolicyDetail" component={PolicyDetailScreen} />
            <RootStack.Screen name="MaintenanceLogs" component={MaintenanceLogsScreen} />
            <RootStack.Screen name="MaintenanceDetail" component={MaintenanceLogDetailScreen} />
            <RootStack.Screen name="Dispatch" component={DispatchScreen} />
            <RootStack.Screen name="Surveys" component={SurveysScreen} />
            <RootStack.Screen name="SurveyDetail" component={SurveyDetailScreen} />
            <RootStack.Screen name="Inventory" component={InventoryScreen} />
            <RootStack.Screen name="Refacciones" component={RefaccionesScreen} />
            <RootStack.Screen name="Pricebook" component={PricebookScreen} />
            <RootStack.Screen name="Campaigns" component={CampaignsScreen} />
            <RootStack.Screen name="Reports" component={ReportsScreen} />
            <RootStack.Screen name="MLPredictions" component={MLPredictionsScreen} />
            <RootStack.Screen name="Users" component={UsersScreen} />
            <RootStack.Screen name="UserDetail" component={UserDetailScreen} />
            <RootStack.Screen name="Subscriptions" component={SubscriptionsScreen} />
            <RootStack.Screen name="HvacCalculator" component={HvacCalculatorScreen} />
            <RootStack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
            <RootStack.Screen name="Reviews" component={ReviewsScreen} />
            <RootStack.Screen name="Warranties" component={WarrantiesScreen} />
          </>
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
