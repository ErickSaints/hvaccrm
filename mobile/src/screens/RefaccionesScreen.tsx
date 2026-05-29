import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, TextInput } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Refaccion } from '../types';

export default function RefaccionesScreen() {
  const [items, setItems] = useState<Refaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/refacciones', { params: { limit: 50, page: 1, search: search || undefined } });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);
  useEffect(() => { const t = setTimeout(() => load(), 400); return () => clearTimeout(t) }, [search]);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Refacciones</Text></View>
      <TextInput style={s.search} placeholder="Buscar refacción..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.titleText}>{item.name}</Text>
            <View style={s.row}>
              <Text style={s.sku}>{item.name}</Text>
              <Text style={s.stock}>{item.quantity} {item.unit || 'pz'}</Text>
            </View>
            <Text style={s.price}>${Number(item.unitPrice).toLocaleString('es-MX')}</Text>
          </View>
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
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sku: { fontSize: 13, color: '#6b7280' },
  stock: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  price: { fontSize: 15, fontWeight: '700', color: '#059669', marginTop: 6 },
});
