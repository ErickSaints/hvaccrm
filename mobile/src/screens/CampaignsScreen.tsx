import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, TextInput } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Campaign } from '../types';

const typeLabels: Record<string, string> = { EMAIL: '📧 Email', SMS: '📱 SMS', WHATSAPP: '💬 WhatsApp' };
const statusLabels: Record<string, string> = { BORRADOR: 'Borrador', ENVIANDO: 'Enviando', ENVIADA: 'Enviada', COMPLETADA: 'Completada' };
const statusColors: Record<string, string> = { BORRADOR: '#6b7280', ENVIANDO: '#d97706', ENVIADA: '#2563eb', COMPLETADA: '#16a34a' };

export default function CampaignsScreen() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/campaigns', { params: { limit: 50, page: 1, search: search || undefined } });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);
  useEffect(() => { const t = setTimeout(() => load(), 400); return () => clearTimeout(t) }, [search]);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Campañas Marketing</Text></View>
      <TextInput style={s.search} placeholder="Buscar campaña..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.titleText}>{item.name}</Text>
              <Text style={s.type}>{typeLabels[item.type]}</Text>
            </View>
            <View style={s.row}>
              <View style={[s.badge, { backgroundColor: statusColors[item.status] + '20' }]}>
                <Text style={[s.badgeText, { color: statusColors[item.status] }]}>{statusLabels[item.status]}</Text>
              </View>
              {item.sentCount !== undefined && <Text style={s.stats}>📤 {item.sentCount} | 📊 {item.openRate || 0}%</Text>}
            </View>
            {item.scheduledAt && <Text style={s.date}>Programada: {new Date(item.scheduledAt).toLocaleDateString('es-MX')}</Text>}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  type: { fontSize: 14 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  stats: { fontSize: 13, color: '#6b7280' },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
