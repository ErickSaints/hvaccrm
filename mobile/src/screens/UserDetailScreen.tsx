import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { User } from '../types';

export default function UserDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [item, setItem] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/users/${id}`);
        setItem(data);
      } catch { Alert.alert('Error', 'No se pudo cargar'); navigation.goBack() }
      finally { setLoading(false) }
    })();
  }, [id]);

  if (loading) return <Loading />;
  if (!item) return null;

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={s.title}>{item.name}</Text>
        <Text style={s.role}>{item.role}</Text>
        <Text style={[s.status, { color: item.active ? '#16a34a' : '#ef4444' }]}>{item.active ? '✅ Activo' : '❌ Inactivo'}</Text>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Contacto</Text>
        <Text style={s.label}>Email</Text><Text style={s.value}>{item.email}</Text>
        {item.phone && <><Text style={s.label}>Teléfono</Text><Text style={s.value}>{item.phone}</Text></>}
      </View>
      
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  role: { fontSize: 15, color: '#6b7280', marginTop: 4, textTransform: 'capitalize' },
  status: { fontSize: 14, marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 12, textTransform: 'uppercase' },
  label: { fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 2 },
  value: { fontSize: 15, color: '#374151', marginBottom: 4 },

});
