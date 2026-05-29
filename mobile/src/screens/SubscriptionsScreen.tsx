import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../lib/api';
import type { Subscription, SubscriptionPlan } from '../types';

const statusColors: Record<string, string> = { ACTIVA: '#16a34a', VENCIDA: '#ef4444', CANCELADA: '#6b7280', PRUEBA: '#2563eb' };

export default function SubscriptionsScreen() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/subscriptions/my');
        setSubscription(data);
      } catch { /* silent */ }
      finally { setLoading(false) }
    })();
  }, []);

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /></View>
  );

  return (
    <ScrollView style={s.container}>
      <View style={s.header}><Text style={s.title}>Suscripciones</Text></View>
      {!subscription ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Sin suscripción activa</Text>
          <Text style={s.emptyText}>Contrata un plan para acceder a todas las funcionalidades.</Text>
          <View style={s.plans}>
            <View style={s.plan}>
              <Text style={s.planName}>Básico</Text>
              <Text style={s.planPrice}>$499/mes</Text>
              <Text style={s.planDesc}>5 técnicos, 50 órdenes/mes</Text>
            </View>
            <View style={[s.plan, s.planFeatured]}>
              <Text style={s.planNameFeatured}>Profesional</Text>
              <Text style={s.planPriceFeatured}>$999/mes</Text>
              <Text style={s.planDesc}>15 técnicos, órdenes ilimitadas, ML</Text>
            </View>
            <View style={s.plan}>
              <Text style={s.planName}>Empresarial</Text>
              <Text style={s.planPrice}>$2,499/mes</Text>
              <Text style={s.planDesc}>Ilimitado, API, soporte prioritario</Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View style={s.card}>
            <Text style={s.cardLabel}>Plan</Text>
            <Text style={s.cardTitle}>{subscription.plan?.name || 'Sin plan'}</Text>
            <View style={[s.badge, { backgroundColor: statusColors[subscription.status] + '20' }]}>
              <Text style={[s.badgeText, { color: statusColors[subscription.status] }]}>{subscription.status}</Text>
            </View>
          </View>
          <View style={s.card}>
            <Text style={s.sectionTitle}>Detalles</Text>
            <Text style={s.label}>Inicio</Text><Text style={s.value}>{new Date(subscription.startDate).toLocaleDateString('es-MX')}</Text>
            {subscription.endDate && <><Text style={s.label}>Vence</Text><Text style={s.value}>{new Date(subscription.endDate).toLocaleDateString('es-MX')}</Text></>}
            <Text style={s.label}>Precio</Text><Text style={s.price}>${Number(subscription.plan?.price || 0).toLocaleString('es-MX')}/mes</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#2563eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, margin: 16, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLabel: { fontSize: 14, color: '#6b7280' },
  cardTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 8 },
  badgeText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 12, textTransform: 'uppercase' },
  label: { fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 2 },
  value: { fontSize: 15, color: '#374151', marginBottom: 4 },
  price: { fontSize: 20, fontWeight: '700', color: '#059669' },
  empty: { padding: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', textAlign: 'center', marginTop: 20 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8, marginBottom: 20 },
  plans: { gap: 12 },
  plan: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  planFeatured: { borderColor: '#2563eb', borderWidth: 2 },
  planName: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  planNameFeatured: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  planPrice: { fontSize: 22, fontWeight: '700', color: '#059669', marginTop: 8 },
  planPriceFeatured: { fontSize: 22, fontWeight: '700', color: '#2563eb', marginTop: 8 },
  planDesc: { fontSize: 13, color: '#6b7280', marginTop: 6 },
});
