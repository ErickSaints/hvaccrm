import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, TextInput } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { PricebookItem } from '../types';

export default function PricebookScreen() {
  const [items, setItems] = useState<PricebookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/pricebook', { params: { limit: 50, page: 1, search: search || undefined } });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);
  useEffect(() => { const t = setTimeout(() => load(), 400); return () => clearTimeout(t) }, [search]);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Pricebook</Text></View>
      <TextInput style={s.search} placeholder="Buscar servicio..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.titleText}>{item.name}</Text>
              <Text style={s.category}>{item.categoryName || item.categoryId}</Text>
            </View>
            <View style={s.tiers}>
              <View style={s.tier}><Text style={s.tierLabel}>Good</Text><Text style={s.tierPrice}>${Number(item.goodPrice).toLocaleString('es-MX')}</Text></View>
              <View style={s.tier}><Text style={s.tierLabel}>Better</Text><Text style={s.tierPrice}>${Number(item.betterPrice).toLocaleString('es-MX')}</Text></View>
              <View style={[s.tier, s.bestTier]}><Text style={s.tierLabelBest}>Best</Text><Text style={s.tierPriceBest}>${Number(item.bestPrice).toLocaleString('es-MX')}</Text></View>
            </View>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  category: { fontSize: 12, color: '#6b7280', marginLeft: 8 },
  tiers: { flexDirection: 'row', marginTop: 12, gap: 8 },
  tier: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, padding: 10, alignItems: 'center' },
  tierLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  tierPrice: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 2 },
  bestTier: { backgroundColor: '#fef3c7' },
  tierLabelBest: { fontSize: 11, color: '#b45309', fontWeight: '700' },
  tierPriceBest: { fontSize: 14, fontWeight: '700', color: '#b45309', marginTop: 2 },
});
