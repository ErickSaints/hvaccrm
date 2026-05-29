import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Ticket } from '../types';

const statusColors: Record<string, string> = { ABIERTO: '#ef4444', EN_PROCESO: '#d97706', RESUELTO: '#16a34a', CERRADO: '#6b7280' };
const statusLabels: Record<string, string> = { ABIERTO: 'Abierto', EN_PROCESO: 'En Proceso', RESUELTO: 'Resuelto', CERRADO: 'Cerrado' };
const levelLabels: Record<string, string> = { EMERGENCIA: 'Emergencia', ATENCION: 'Atención', PROGRAMAR: 'Programar' };

export default function TicketDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [item, setItem] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/tickets/${id}`);
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
        <Text style={s.title}>#{item.id} {item.title}</Text>
        <View style={[s.badge, { backgroundColor: statusColors[item.status] + '20' }]}>
          <Text style={[s.badgeText, { color: statusColors[item.status] }]}>{statusLabels[item.status]}</Text>
        </View>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Detalles</Text>
        <Text style={s.label}>Nivel</Text><Text style={s.value}>{levelLabels[item.level]}</Text>
        <Text style={s.label}>Descripción</Text><Text style={s.value}>{item.description}</Text>
        
        <Text style={s.label}>Creado</Text><Text style={s.value}>{new Date(item.createdAt).toLocaleDateString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 14, fontWeight: '600' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 12, textTransform: 'uppercase' },
  label: { fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 2 },
  value: { fontSize: 15, color: '#374151' },
});
