import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, TextInput } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { InventoryItem } from '../types';

export default function InventoryScreen({ navigation }: any) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/inventory', { params: { limit: 50, page: 1, search: search || undefined } });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);
  useEffect(() => { const t = setTimeout(() => load(), 400); return () => clearTimeout(t) }, [search]);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Inventario</Text></View>
      <TextInput style={s.search} placeholder="Buscar artículo..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.titleText}>{item.name}</Text>
                <Text style={s.sku}>{item.code}</Text>
              </View>
              <View style={s.stockBox}>
                <Text style={[s.stock, { color: item.currentStock <= (item.minStock || 0) ? '#ef4444' : '#16a34a' }]}>{item.currentStock}</Text>
                <Text style={s.unit}>{item.unit}</Text>
              </View>
            </View>
            <Text style={s.price}>${Number(item.unitPrice || 0).toLocaleString('es-MX')}</Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  sku: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  stockBox: { alignItems: 'center' },
  stock: { fontSize: 22, fontWeight: '700' },
  unit: { fontSize: 11, color: '#9ca3af', marginTop: -2 },
  price: { fontSize: 14, fontWeight: '600', color: '#059669', marginTop: 6 },
});
