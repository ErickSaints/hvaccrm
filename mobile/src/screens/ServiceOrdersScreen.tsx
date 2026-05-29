import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, TextInput,
} from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { ServiceOrder } from '../types';

const statusColors: Record<string, string> = {
  PENDIENTE: '#d97706',
  EN_PROGRESO: '#2563eb',
  COMPLETADO: '#16a34a',
  CANCELADO: '#ef4444',
};

const statusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En Progreso',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

export default function ServiceOrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadOrders = async () => {
    try {
      const params: any = { limit: 50, page: 1 };
      if (search) params.search = search;
      const { data } = await api.get('/service-orders', { params });
      setOrders(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadOrders(), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Órdenes de Servicio</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por número o cliente..."
        placeholderTextColor="#9ca3af"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ServiceOrderDetail', { id: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderNumber}>{item.number}</Text>
              <View style={[styles.badge, { backgroundColor: statusColors[item.status] + '20' }]}>
                <Text style={[styles.badgeText, { color: statusColors[item.status] }]}>
                  {statusLabels[item.status]}
                </Text>
              </View>
            </View>
            {item.customer && (
              <Text style={styles.customer}>{item.customer.contactName}</Text>
            )}
            {item.scheduledDate && (
              <Text style={styles.date}>
                {new Date(item.scheduledDate).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>
            )}
            {item.description && (
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            )}
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
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  customer: { fontSize: 15, color: '#374151', marginTop: 6, fontWeight: '500' },
  date: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  desc: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
});
