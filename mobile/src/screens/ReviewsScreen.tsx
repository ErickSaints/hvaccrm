import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Review } from '../types';

export default function ReviewsScreen() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/reviews', { params: { limit: 50, page: 1 } });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);

  const stars = (n: number) => '⭐'.repeat(Math.min(n, 5)) + '☆'.repeat(Math.max(0, 5 - n));

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Reseñas</Text></View>
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.titleText}>{item.customer?.contactName || 'Cliente'}</Text>
              <Text style={s.stars}>{stars(item.rating)}</Text>
            </View>
            {item.comment && <Text style={s.comment}>{item.comment}</Text>}
            <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('es-MX')}</Text>
          </View>
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
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  stars: { fontSize: 16 },
  comment: { fontSize: 14, color: '#6b7280', marginTop: 6, lineHeight: 20 },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
});
