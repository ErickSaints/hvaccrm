import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../lib/api';

export default function ReportsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [
          { data: orders }, { data: customers }, { data: revenue },
        ] = await Promise.all([
          api.get('/service-orders', { params: { limit: 1, page: 1 } }),
          api.get('/customers', { params: { limit: 1, page: 1 } }),
          api.get('/invoices', { params: { limit: 1, page: 1 } }),
          api.get('/reports/summary').catch(() => ({ data: null })),
        ]);
        setData({
          orders: orders.total || 0,
          customers: customers.total || 0,
          revenue: revenue.total || 0,
        });
      } catch { /* silent */ }
      finally { setLoading(false) }
    })();
  }, []);

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /></View>
  );

  return (
    <ScrollView style={s.container}>
      <View style={s.header}><Text style={s.title}>Reportes Ejecutivos</Text></View>
      <View style={s.grid}>
        <View style={s.card}><Text style={s.cardLabel}>Órdenes</Text><Text style={s.cardValue}>{data?.orders || 0}</Text></View>
        <View style={s.card}><Text style={s.cardLabel}>Clientes</Text><Text style={s.cardValue}>{data?.customers || 0}</Text></View>
        <View style={s.card}><Text style={s.cardLabel}>Ingresos</Text><Text style={s.cardValue}>${(data?.revenue || 0).toLocaleString('es-MX')}</Text></View>
      </View>
      <View style={s.info}>
        <Text style={s.infoText}>
          Próximamente: gráficos interactivos de tendencias, facturación mensual,
          órdenes por técnico, rentabilidad por cliente y más.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#2563eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  card: { width: '46%', backgroundColor: '#fff', borderRadius: 12, padding: 20, margin: '2%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  info: { backgroundColor: '#fff', borderRadius: 12, margin: 16, padding: 20 },
  infoText: { fontSize: 14, color: '#6b7280', lineHeight: 22 },
});
