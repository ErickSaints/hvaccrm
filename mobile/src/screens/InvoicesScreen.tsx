import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, TextInput } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Invoice } from '../types';

const statusColors: Record<string, string> = { BORRADOR: '#6b7280', EMITIDA: '#2563eb', PAGADA: '#16a34a', CANCELADA: '#ef4444', VENCIDA: '#d97706' };
const statusLabels: Record<string, string> = { BORRADOR: 'Borrador', EMITIDA: 'Emitida', PAGADA: 'Pagada', CANCELADA: 'Cancelada', VENCIDA: 'Vencida' };

export default function InvoicesScreen({ navigation }: any) {
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/invoices', { params: { limit: 50, page: 1, search: search || undefined } });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);
  useEffect(() => { const t = setTimeout(() => load(), 400); return () => clearTimeout(t) }, [search]);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Facturas</Text></View>
      <TextInput style={s.search} placeholder="Buscar..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('InvoiceDetail', { id: item.id })}>
            <View style={s.row}>
              <Text style={s.titleText}>Factura #{item.number || item.id}</Text>
              <View style={[s.badge, { backgroundColor: statusColors[item.status] + '20' }]}>
                <Text style={[s.badgeText, { color: statusColors[item.status] }]}>{statusLabels[item.status]}</Text>
              </View>
            </View>
            <Text style={s.amount}>${Number(item.total).toLocaleString('es-MX')}</Text>
            <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('es-MX')}</Text>
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
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '700', color: '#059669', marginTop: 6 },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
