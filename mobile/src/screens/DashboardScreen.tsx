import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { useAuth } from '../lib/auth';
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

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/service-orders', {
        params: { limit: 20, page: 1 },
      });
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

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  if (loading) return <Loading />;

  const todayOrders = orders.filter((o) => {
    if (!o.scheduledDate) return false;
    const today = new Date();
    const orderDate = new Date(o.scheduledDate);
    return orderDate.toDateString() === today.toDateString();
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name}</Text>
          <Text style={styles.role}>{user?.role}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayOrders.length}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.filter(o => o.status === 'PENDIENTE').length}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.filter(o => o.status === 'EN_PROGRESO').length}</Text>
          <Text style={styles.statLabel}>En Progreso</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Órdenes de Servicio</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('ServiceOrderDetail', { id: item.id })}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>{item.number}</Text>
              <View style={[styles.badge, { backgroundColor: statusColors[item.status] + '20' }]}>
                <Text style={[styles.badgeText, { color: statusColors[item.status] }]}>
                  {statusLabels[item.status]}
                </Text>
              </View>
            </View>
            {item.customer && (
              <Text style={styles.customerName}>{item.customer.contactName}</Text>
            )}
            {item.scheduledDate && (
              <Text style={styles.date}>
                {new Date(item.scheduledDate).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, backgroundColor: '#2563eb',
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#fff' },
  role: { fontSize: 14, color: '#bfdbfe', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8, paddingHorizontal: 16 },
  logoutText: { color: '#fff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  customerName: { fontSize: 14, color: '#6b7280', marginTop: 6 },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
