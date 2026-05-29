import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Asset } from '../types';

export default function AssetsScreen({ navigation }: any) {
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/assets', { params: { limit: 50, page: 1 } });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Activos con QR</Text></View>
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
            <TouchableOpacity style={s.card}>
            <View style={s.row}>
              <Text style={s.icon}>⚙️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.titleText}>{item.name}</Text>
                <Text style={s.serial}>S/N: {item.serialNumber}</Text>
                <Text style={s.status}>📍 {item.location || 'Ubicación no especificada'}</Text>
              </View>
              <Text style={s.qr}>📱QR</Text>
            </View>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 28, marginRight: 12 },
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  serial: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  status: { fontSize: 13, color: '#16a34a', marginTop: 2 },
  qr: { fontSize: 16 },
});
