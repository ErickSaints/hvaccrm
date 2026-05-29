import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  StyleSheet, TextInput,
} from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Customer } from '../types';

export default function CustomersScreen({ navigation }: any) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadCustomers = async () => {
    try {
      const params: any = { limit: 50, page: 1 };
      if (search) params.search = search;
      const { data } = await api.get('/customers', { params });
      setCustomers(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const onSearch = (text: string) => {
    setSearch(text);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nombre, empresa o teléfono..."
        placeholderTextColor="#9ca3af"
        value={search}
        onChangeText={onSearch}
      />

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CustomerDetail', { id: item.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.contactName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.contactName}</Text>
              {item.companyName && <Text style={styles.company}>{item.companyName}</Text>}
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#2563eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  search: {
    backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 14,
    fontSize: 16, borderWidth: 1, borderColor: '#d1d5db', color: '#111827',
  },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#dbeafe',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#2563eb' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  company: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  phone: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
});
