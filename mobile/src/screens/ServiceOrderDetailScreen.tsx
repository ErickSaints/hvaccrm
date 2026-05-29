import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  StyleSheet, ActivityIndicator, TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { ServiceOrder } from '../types';

const statusFlow: Record<string, string[]> = {
  PENDIENTE: ['EN_PROGRESO', 'CANCELADO'],
  EN_PROGRESO: ['COMPLETADO', 'CANCELADO'],
  COMPLETADO: [],
  CANCELADO: [],
};

const statusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente', EN_PROGRESO: 'En Progreso',
  COMPLETADO: 'Completado', CANCELADO: 'Cancelado',
};

const statusColors: Record<string, string> = {
  PENDIENTE: '#d97706', EN_PROGRESO: '#2563eb',
  COMPLETADO: '#16a34a', CANCELADO: '#ef4444',
};

export default function ServiceOrderDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const loadOrder = async () => {
    try {
      const { data } = await api.get(`/service-orders/${id}`);
      setOrder(data);
      setDiagnosis(data.diagnosis || '');
      setWorkPerformed(data.workPerformed || '');
      setRecommendations(data.recommendations || '');
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la orden');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(coords);

      await api.post('/fleet/location', {
        latitude: coords.lat,
        longitude: coords.lng,
        serviceOrderId: id,
      });
      return coords;
    } catch (err) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
      return null;
    }
  };

  const updateStatus = async (newStatus: string) => {
    setSaving(true);
    try {
      const payload: any = { status: newStatus };

      if (newStatus === 'EN_PROGRESO' && !location) {
        await getLocation();
      }

      if (newStatus === 'COMPLETADO') {
        payload.diagnosis = diagnosis;
        payload.workPerformed = workPerformed;
        payload.recommendations = recommendations;
        payload.completedAt = new Date().toISOString();
      }

      await api.put(`/service-orders/${id}`, payload);
      Alert.alert('Listo', `Orden ${statusLabels[newStatus]}`);
      loadOrder();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'COMPLETADO') {
      Alert.alert('Completar orden', '¿Guardar diagnóstico y marcar como completada?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Completar', onPress: () => updateStatus(newStatus) },
      ]);
    } else {
      const label = statusLabels[newStatus];
      Alert.alert(`¿${label}?`, `Cambiar estado a "${label}"`, [
        { text: 'No', style: 'cancel' },
        { text: 'Sí', onPress: () => updateStatus(newStatus) },
      ]);
    }
  };

  if (loading) return <Loading />;
  if (!order) return null;

  const nextStatuses = statusFlow[order.status] || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.number}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[order.status] + '20' }]}>
          <Text style={[styles.badgeText, { color: statusColors[order.status] }]}>
            {statusLabels[order.status]}
          </Text>
        </View>
      </View>

      {order.customer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text style={styles.value}>{order.customer.contactName}</Text>
          {order.customer.phone && <Text style={styles.value}>{order.customer.phone}</Text>}
          {order.customer.address && <Text style={styles.value}>{order.customer.address}</Text>}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles</Text>
        {order.description && <Text style={styles.value}>{order.description}</Text>}
        {order.scheduledDate && (
          <Text style={styles.value}>
            Programada: {new Date(order.scheduledDate).toLocaleDateString('es-MX', {
              dateStyle: 'long', timeStyle: 'short',
            })}
          </Text>
        )}
      </View>

      {(order.status === 'EN_PROGRESO' || order.status === 'PENDIENTE') && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnóstico</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe el diagnóstico..."
              placeholderTextColor="#9ca3af"
              value={diagnosis}
              onChangeText={setDiagnosis}
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trabajo Realizado</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe el trabajo realizado..."
              placeholderTextColor="#9ca3af"
              value={workPerformed}
              onChangeText={setWorkPerformed}
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recomendaciones</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Recomendaciones para el cliente..."
              placeholderTextColor="#9ca3af"
              value={recommendations}
              onChangeText={setRecommendations}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.locationBtn} onPress={getLocation}>
            <Text style={styles.locationBtnText}>
              {location ? '✓ Ubicación capturada' : '📡 Capturar ubicación GPS'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {nextStatuses.length > 0 && (
        <View style={styles.actions}>
          {nextStatuses.map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.actionBtn, { backgroundColor: statusColors[status] }]}
              onPress={() => handleStatusChange(status)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>
                  {status === 'EN_PROGRESO' ? '▶ Iniciar' :
                   status === 'COMPLETADO' ? '✓ Completar' :
                   status === 'CANCELADO' ? '✕ Cancelar' : statusLabels[status]}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación GPS</Text>
          <Text style={styles.value}>Lat: {location.lat.toFixed(6)}</Text>
          <Text style={styles.value}>Lng: {location.lng.toFixed(6)}</Text>
          <Text style={styles.link}>
            https://www.google.com/maps?q={location.lat},{location.lng}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    padding: 20, paddingTop: 60, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  orderNumber: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  badge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 14, fontWeight: '600' },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 8, textTransform: 'uppercase' as any },
  value: { fontSize: 15, color: '#374151', marginBottom: 4 },
  textArea: {
    backgroundColor: '#f9fafb', borderRadius: 8, padding: 12,
    fontSize: 14, color: '#111827', minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  locationBtn: {
    backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#2563eb',
  },
  locationBtnText: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  actions: { padding: 16, gap: 10 },
  actionBtn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { fontSize: 12, color: '#2563eb', marginTop: 4 },
});
