import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { ServiceOrder } from '../types';

const statusColors: Record<string, string> = { PENDIENTE: '#d97706', EN_PROGRESO: '#2563eb', COMPLETADO: '#16a34a', CANCELADO: '#ef4444' };
const statusLabels: Record<string, string> = { PENDIENTE: 'Pendiente', EN_PROGRESO: 'En Progreso', COMPLETADO: 'Completado', CANCELADO: 'Cancelado' };

export default function DispatchScreen({ navigation }: any) {
  const [items, setItems] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/service-orders', {
        params: { limit: 50, page: 1, sort: 'scheduledDate,asc', status: 'PENDIENTE,EN_PROGRESO' },
      });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>📋 Dispatch / Agenda</Text></View>
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('ServiceOrderDetail', { id: item.id })}>
            <View style={s.row}>
              <Text style={s.titleText}>#{item.id} {item.customer?.contactName}</Text>
              <View style={[s.badge, { backgroundColor: statusColors[item.status] + '20' }]}>
                <Text style={[s.badgeText, { color: statusColors[item.status] }]}>{statusLabels[item.status]}</Text>
              </View>
            </View>
            {item.scheduledDate && (
              <Text style={s.time}>🕐 {new Date(item.scheduledDate).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
            )}
            {item.assignedTo && <Text style={s.tech}>👤 Técnico asignado</Text>}
            <Text style={s.address}>{item.customer?.address || ''}</Text>
          </TouchableOpacity>
        )} contentContainerStyle={s.list} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#2563eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  time: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  tech: { fontSize: 13, color: '#2563eb', marginTop: 2 },
  address: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
});
