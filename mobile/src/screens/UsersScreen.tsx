import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, TextInput } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { User } from '../types';

export default function UsersScreen({ navigation }: any) {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/users', { params: { limit: 50, page: 1, search: search || undefined } });
      setItems(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  };

  useEffect(() => { load() }, []);
  useEffect(() => { const t = setTimeout(() => load(), 400); return () => clearTimeout(t) }, [search]);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Usuarios</Text></View>
      <TextInput style={s.search} placeholder="Buscar usuario..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
      <FlatList data={items} keyExtractor={i => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('UserDetail', { id: item.id })}>
            <View style={s.row}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.titleText}>{item.name}</Text>
                <Text style={s.email}>{item.email}</Text>
                <Text style={s.role}>{item.role}</Text>
              </View>
              <Text style={[s.active, { color: item.active ? '#16a34a' : '#ef4444' }]}>{item.active ? 'Activo' : 'Inactivo'}</Text>
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
  search: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#d1d5db', color: '#111827' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  email: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  role: { fontSize: 12, color: '#2563eb', marginTop: 2, textTransform: 'capitalize' },
  active: { fontSize: 12, fontWeight: '600' },
});
