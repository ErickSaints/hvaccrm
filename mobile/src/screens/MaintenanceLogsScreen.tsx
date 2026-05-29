import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, TextInput } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { MaintenanceLog } from '../types';

export default function MaintenanceLogsScreen({ navigation }: any) {
  const [items, setItems] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/maintenance', { params: { limit: 50, page: 1, search: search || undefined } });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);
  useEffect(() => { const t = setTimeout(() => load(), 400); return () => clearTimeout(t) }, [search]);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Mantenimientos</Text></View>
      <TextInput style={s.search} placeholder="Buscar..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('MaintenanceDetail', { id: item.id })}>
            <View style={s.row}>
              <Text style={s.titleText}>Mto #{item.id}</Text>
              <View style={[s.badge, { backgroundColor: item.status === 'COMPLETADO' ? '#16a34a20' : '#d9770620' }]}>
                <Text style={[s.badgeText, { color: item.status === 'COMPLETADO' ? '#16a34a' : '#d97706' }]}>{item.status === 'COMPLETADO' ? 'Completado' : 'Pendiente'}</Text>
              </View>
            </View>
            <Text style={s.date}>{new Date(item.scheduledDate).toLocaleDateString('es-MX')}</Text>
            <Text style={s.customer}>{item.policy?.name}</Text>
          </TouchableOpacity>
        )} contentContainerStyle={s.list} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#2563eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  search: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#d1d5db', color: '#111827' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  customer: { fontSize: 13, color: '#2563eb', marginTop: 2 },
});
