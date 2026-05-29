import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Quotation } from '../types';

const statusLabels: Record<string, string> = { BORRADOR: 'Borrador', ENVIADA: 'Enviada', ACEPTADA: 'Aceptada', RECHAZADA: 'Rechazada' };

export default function QuotationDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [item, setItem] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/proposals/${id}`);
        setItem(data);
      } catch { Alert.alert('Error', 'No se pudo cargar'); navigation.goBack() }
      finally { setLoading(false) }
    })();
  }, [id]);

  if (loading) return <Loading />;
  if (!item) return null;

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Cotización #{item.id}</Text>
        <View style={[s.badge, { backgroundColor: statusLabels[item.status] ? '' : '' }]}>
          <Text style={s.badgeText}>{statusLabels[item.status]}</Text>
        </View>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Cliente</Text>
        <Text style={s.value}>{item.customer?.contactName}</Text>
        <Text style={s.value}>{item.customer?.email}</Text>
        <Text style={s.value}>{item.customer?.phone}</Text>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Montos</Text>
        {item.items?.map((line: any, i: number) => (
          <View key={i} style={s.lineRow}>
            <Text style={s.lineDesc}>{line.description}</Text>
            <Text style={s.lineTotal}>${Number(line.unitPrice * line.quantity).toLocaleString('es-MX')}</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalAmount}>${Number(item.total).toLocaleString('es-MX')}</Text>
        </View>
      </View>
      {item.notes && <View style={s.section}><Text style={s.sectionTitle}>Notas</Text><Text style={s.value}>{item.notes}</Text></View>}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Fechas</Text>
        <Text style={s.value}>Creada: {new Date(item.createdAt).toLocaleDateString('es-MX')}</Text>
        {item.validUntil && <Text style={s.value}>Válida hasta: {new Date(item.validUntil).toLocaleDateString('es-MX')}</Text>}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 14, fontWeight: '600', color: '#059669' },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 12, textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#374151', marginBottom: 4 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  lineDesc: { fontSize: 14, color: '#374151', flex: 1 },
  lineTotal: { fontSize: 14, fontWeight: '600', color: '#059669' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: '#e5e7eb' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#059669' },
});
