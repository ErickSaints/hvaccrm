import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Invoice, QuotationItem } from '../types';

const statusLabels: Record<string, string> = { BORRADOR: 'Borrador', EMITIDA: 'Emitida', PAGADA: 'Pagada', CANCELADA: 'Cancelada', VENCIDA: 'Vencida' };

export default function InvoiceDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [item, setItem] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/invoices/${id}`);
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
        <Text style={s.title}>Factura #{item.number || item.id}</Text>
        <Text style={s.status}>{statusLabels[item.status]}</Text>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Cliente</Text>
        <Text style={s.value}>{item.customer?.contactName}</Text>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Conceptos</Text>
        {item.quotation?.items?.map((line: QuotationItem, i: number) => (
          <View key={i} style={s.lineRow}>
            <View style={{ flex: 1 }}><Text style={s.lineDesc}>{line.description}</Text></View>
            <Text style={s.lineTotal}>${Number(line.unitPrice * line.quantity).toLocaleString('es-MX')}</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Subtotal</Text>
          <Text style={s.totalAmount}>${Number(item.subtotal || item.total).toLocaleString('es-MX')}</Text>
        </View>
        {item.tax > 0 && (
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>IVA</Text>
            <Text style={s.totalAmount}>${Number(item.tax).toLocaleString('es-MX')}</Text>
          </View>
        )}
        <View style={s.totalRow}>
          <Text style={s.grandLabel}>Total</Text>
          <Text style={s.grandAmount}>${Number(item.total).toLocaleString('es-MX')}</Text>
        </View>
      </View>
      {(item as any).paymentRef && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pago</Text>
          <Text style={s.value}>Referencia de pago: {(item as any).paymentRef}</Text>
          {item.paidAt && <Text style={s.value}>Pagado: {new Date(item.paidAt).toLocaleDateString('es-MX')}</Text>}
        </View>
      )}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Fechas</Text>
        <Text style={s.value}>Emisión: {new Date(item.createdAt).toLocaleDateString('es-MX')}</Text>
        {item.dueDate && <Text style={s.value}>Vence: {new Date(item.dueDate).toLocaleDateString('es-MX')}</Text>}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  status: { fontSize: 14, color: '#059669', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 12, textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#374151', marginBottom: 4 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  lineDesc: { fontSize: 14, color: '#374151' },
  lineTotal: { fontSize: 14, fontWeight: '600', color: '#059669' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8 },
  totalLabel: { fontSize: 15, color: '#6b7280' },
  totalAmount: { fontSize: 15, fontWeight: '600', color: '#374151' },
  grandLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  grandAmount: { fontSize: 18, fontWeight: '700', color: '#059669' },
});
