import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { ServiceReport, UsedMaterial } from '../types';

export default function ServiceReportDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [item, setItem] = useState<ServiceReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/service-reports/${id}`);
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
        <Text style={s.title}>Reporte de Servicio #{item.id}</Text>
        <Text style={s.subtitle}>Orden #{item.serviceOrderId}</Text>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Diagnóstico</Text>
        <Text style={s.value}>{item.diagnosis}</Text>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Trabajo Realizado</Text>
        <Text style={s.value}>{item.workPerformed}</Text>
      </View>
      {item.recommendations && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recomendaciones</Text>
          <Text style={s.value}>{item.recommendations}</Text>
        </View>
      )}
      {item.usedMaterials && item.usedMaterials.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Materiales</Text>
          {item.usedMaterials.map((m: UsedMaterial, i: number) => (
            <View key={i} style={s.lineRow}>
              <Text style={s.lineDesc}>{m.name} x{m.quantity}</Text>
              <Text style={s.lineTotal}>${Number(m.unitPrice * m.quantity).toLocaleString('es-MX')}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 8, textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#374151', lineHeight: 22 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  lineDesc: { fontSize: 14, color: '#374151', flex: 1 },
  lineTotal: { fontSize: 14, fontWeight: '600', color: '#059669' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#059669' },
});
