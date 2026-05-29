import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const modules = [
  { name: 'Tickets', icon: 'ticket', screen: 'Tickets', color: '#ef4444' },
  { name: 'Cotizaciones', icon: 'document-text', screen: 'Quotations', color: '#8b5cf6' },
  { name: 'Reportes', icon: 'clipboard', screen: 'ServiceReports', color: '#2563eb' },
  { name: 'Facturas', icon: 'receipt', screen: 'Invoices', color: '#16a34a' },
  { name: 'Equipos', icon: 'hardware-chip', screen: 'Equipment', color: '#0891b2' },
  { name: 'Activos QR', icon: 'qr-code', screen: 'Assets', color: '#7c3aed' },
  { name: 'Flotilla GPS', icon: 'location', screen: 'Fleet', color: '#d97706' },
  { name: 'Pólizas', icon: 'shield-checkmark', screen: 'Policies', color: '#059669' },
  { name: 'Mantenimientos', icon: 'construct', screen: 'MaintenanceLogs', color: '#0ea5e9' },
  { name: 'Dispatch', icon: 'calendar', screen: 'Dispatch', color: '#f97316' },
  { name: 'Levantamientos', icon: 'camera', screen: 'Surveys', color: '#6366f1' },
  { name: 'Inventario', icon: 'cube', screen: 'Inventory', color: '#14b8a6' },
  { name: 'Refacciones', icon: 'settings', screen: 'Refacciones', color: '#8b5cf6' },
  { name: 'Pricebook', icon: 'pricetags', screen: 'Pricebook', color: '#b45309' },
  { name: 'Campañas', icon: 'megaphone', screen: 'Campaigns', color: '#ec4899' },
  { name: 'Reportes Exec', icon: 'stats-chart', screen: 'Reports', color: '#1d4ed8' },
  { name: 'ML Predictions', icon: 'analytics', screen: 'MLPredictions', color: '#06b6d4' },
  { name: 'Usuarios', icon: 'people', screen: 'Users', color: '#374151' },
  { name: 'Suscripciones', icon: 'card', screen: 'Subscriptions', color: '#16a34a' },
  { name: 'Calc. HVAC', icon: 'calculator', screen: 'HvacCalculator', color: '#2563eb' },
  { name: 'Órdenes Compra', icon: 'cart', screen: 'PurchaseOrders', color: '#f59e0b' },
  { name: 'Reseñas', icon: 'star', screen: 'Reviews', color: '#f59e0b' },
  { name: 'Garantías', icon: 'ribbon', screen: 'Warranties', color: '#06b6d4' },
];

export default function MoreScreen({ navigation }: any) {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Módulos</Text>
      </View>
      <ScrollView contentContainerStyle={s.grid}>
        {modules.map((mod) => (
          <TouchableOpacity key={mod.screen} style={s.card} onPress={() => {
            const screenMap: Record<string, string> = {
              Tickets: 'Tickets', Quotations: 'Quotations', ServiceReports: 'ServiceReports',
              Invoices: 'Invoices', Equipment: 'Equipment', Assets: 'Assets',
              Fleet: 'FleetTracking', Policies: 'Policies', MaintenanceLogs: 'MaintenanceLogs',
              Dispatch: 'Dispatch', Surveys: 'Surveys', Inventory: 'Inventory',
              Refacciones: 'Refacciones', Pricebook: 'Pricebook', Campaigns: 'Campaigns',
              Reports: 'Reports', MLPredictions: 'MLPredictions', Users: 'Users',
              Subscriptions: 'Subscriptions', HvacCalculator: 'HvacCalculator',
              PurchaseOrders: 'PurchaseOrders', Reviews: 'Reviews', Warranties: 'Warranties',
            };
            const screenName = screenMap[mod.screen];
            if (['TicketDetail', 'QuotationDetail', 'ServiceReportDetail', 'InvoiceDetail', 'EquipmentDetail', 'PolicyDetail', 'MaintenanceDetail', 'SurveyDetail', 'UserDetail'].includes(screenName)) return;
            navigation.navigate(screenName);
          }}>
            <View style={[s.iconBox, { backgroundColor: mod.color + '15' }]}>
              <Ionicons name={mod.icon as any} size={24} color={mod.color} />
            </View>
            <Text style={s.cardLabel}>{mod.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#2563eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingBottom: 30 },
  card: { width: '30%', margin: '1.66%', alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
});
