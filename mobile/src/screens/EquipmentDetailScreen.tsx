import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Equipment } from '../types';

export default function EquipmentDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [item, setItem] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/equipment/${id}`);
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
        <Text style={s.title}>{item.type}</Text>
        {item.brand && <Text style={s.brand}>{item.brand}</Text>}
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Detalles</Text>
        {item.model && <><Text style={s.label}>Modelo</Text><Text style={s.value}>{item.model}</Text></>}
        {item.serialNumber && <><Text style={s.label}>No. Serie</Text><Text style={s.value}>{item.serialNumber}</Text></>}
        {item.installDate && <><Text style={s.label}>Instalación</Text><Text style={s.value}>{new Date(item.installDate).toLocaleDateString('es-MX')}</Text></>}
        {item.lastService && <><Text style={s.label}>Último Servicio</Text><Text style={s.value}>{new Date(item.lastService).toLocaleDateString('es-MX')}</Text></>}
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Cliente</Text>
        <Text style={s.value}>Cliente #{item.customerId}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  brand: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 12, textTransform: 'uppercase' },
  label: { fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 2 },
  value: { fontSize: 15, color: '#374151', marginBottom: 4 },
});
