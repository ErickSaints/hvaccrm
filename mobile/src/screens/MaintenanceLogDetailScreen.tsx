import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { MaintenanceLog } from '../types';

export default function MaintenanceLogDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [item, setItem] = useState<MaintenanceLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/maintenance/${id}`);
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
        <Text style={s.title}>Mantenimiento #{item.id}</Text>
        <Text style={[s.status, { color: item.status === 'COMPLETADO' ? '#16a34a' : '#d97706' }]}>{item.status === 'COMPLETADO' ? '✅ Completado' : '⏳ Pendiente'}</Text>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Detalles</Text>
        <Text style={s.label}>Programado</Text><Text style={s.value}>{new Date(item.scheduledDate).toLocaleDateString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</Text>
        {item.completedDate && <><Text style={s.label}>Completado</Text><Text style={s.value}>{new Date(item.completedDate).toLocaleDateString('es-MX')}</Text></>}
      </View>
      {item.notes && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Notas</Text>
          <Text style={s.value}>{item.notes}</Text>
        </View>
      )}
      {item.policy && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Póliza</Text>
          <Text style={s.value}>{item.policy.name || `Póliza #${item.policyId}`}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  status: { fontSize: 14, marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 12, textTransform: 'uppercase' },
  label: { fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 2 },
  value: { fontSize: 15, color: '#374151', marginBottom: 4 },
});
