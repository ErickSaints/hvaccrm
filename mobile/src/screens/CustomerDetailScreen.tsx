import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, Linking,
} from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Customer } from '../types';

export default function CustomerDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/customers/${id}`);
        setCustomer(data);
      } catch {
        Alert.alert('Error', 'No se pudo cargar el cliente');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Loading />;
  if (!customer) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer.contactName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{customer.contactName}</Text>
        {customer.companyName && <Text style={styles.company}>{customer.companyName}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contacto</Text>
        <Text style={styles.label}>Teléfono</Text>
        <Text style={styles.value}>{customer.phone}</Text>
        {customer.email && (
          <>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{customer.email}</Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dirección</Text>
        <Text style={styles.value}>{customer.address}</Text>
        {customer.city && <Text style={styles.value}>{customer.city}</Text>}
        {customer.state && <Text style={styles.value}>{customer.state}</Text>}
      </View>

      {customer.equipment && customer.equipment.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipos ({customer.equipment.length})</Text>
          {customer.equipment.map((eq) => (
            <View key={eq.id} style={styles.equipCard}>
              <Text style={styles.equipType}>{eq.type}</Text>
              {eq.brand && <Text style={styles.equipDetail}>{eq.brand} {eq.model}</Text>}
              {eq.serialNumber && <Text style={styles.equipDetail}>SN: {eq.serialNumber}</Text>}
              {eq.location && <Text style={styles.equipDetail}>Ubicación: {eq.location}</Text>}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    alignItems: 'center', padding: 24, paddingTop: 60,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#dbeafe',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#2563eb' },
  name: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  company: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 12, textTransform: 'uppercase' as any },
  label: { fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 2 },
  value: { fontSize: 16, color: '#374151' },
  equipCard: {
    backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8,
  },
  equipType: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  equipDetail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
