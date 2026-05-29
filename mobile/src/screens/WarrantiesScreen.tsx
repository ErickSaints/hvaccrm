import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Warranty } from '../types';

export default function WarrantiesScreen() {
  const [items, setItems] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/warranties', { params: { limit: 50, page: 1 } });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Garantías</Text></View>
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => {
          const exp = item.endDate ? new Date(item.endDate) : null;
          const expired = exp && exp < new Date();
          const nearExp = exp && !expired && exp < new Date(Date.now() + 30 * 86400000);
          return (
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.titleText}>Garantía #{item.id}</Text>
                <Text style={[s.expBadge, { color: expired ? '#ef4444' : nearExp ? '#d97706' : '#16a34a' }]}>
                  {expired ? 'Vencida' : nearExp ? 'Próximo a vencer' : 'Vigente'}
                </Text>
              </View>
              <Text style={s.customer}>{item.equipment?.model || `Equipo #${item.equipmentId}`}</Text>
              {item.description && <Text style={s.desc}>{item.description}</Text>}
              {exp && <Text style={s.date}>Vence: {exp.toLocaleDateString('es-MX')}</Text>}
            </View>
          );
        }} contentContainerStyle={s.list} />
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
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  expBadge: { fontSize: 12, fontWeight: '600' },
  customer: { fontSize: 14, color: '#2563eb', marginTop: 4 },
  desc: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
