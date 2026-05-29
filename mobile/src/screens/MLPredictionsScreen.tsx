import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../lib/api';
import type { MLPrediction } from '../types';

export default function MLPredictionsScreen() {
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/ml/predictions', { params: { limit: 20, page: 1 } });
        setPredictions(data.data || []);
      } catch { /* silent */ }
      finally { setLoading(false) }
    })();
  }, []);

  return (
    <ScrollView style={s.container}>
      <View style={s.header}><Text style={s.title}>🤖 Predicciones ML</Text></View>
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <View style={s.content}>
          {predictions.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Sin predicciones aún</Text>
              <Text style={s.emptyText}>Las predicciones de ML se generan automáticamente al acumular datos de órdenes, clientes y equipos.</Text>
            </View>
          ) : predictions.map((p, i) => (
            <View key={i} style={s.card}>
              <Text style={s.cardTitle}>{p.equipmentType}</Text>
              <Text style={s.cardValue}>{p.recommendedAction}</Text>
              <Text style={s.cardConf}>Fallo probable: {Math.round((p.failureProbability || 0) * 100)}%</Text>
            </View>
          ))}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Modelos Activos</Text>
            <View style={s.modelRow}><Text style={s.modelName}>Fallos de Equipo</Text><Text style={s.modelStatus}>✅ Activo</Text></View>
            <View style={s.modelRow}><Text style={s.modelName}>Órdenes por Temporada</Text><Text style={s.modelStatus}>✅ Activo</Text></View>
            <View style={s.modelRow}><Text style={s.modelName}>Riesgo de Cancelación</Text><Text style={s.modelStatus}>✅ Activo</Text></View>
            <View style={s.modelRow}><Text style={s.modelName}>Up-sell Sugerido</Text><Text style={s.modelStatus}>🔄 Entrenando</Text></View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', paddingTop: 40 },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#2563eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  content: { padding: 16 },
  empty: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  cardValue: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  cardConf: { fontSize: 12, color: '#2563eb', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 12, textTransform: 'uppercase' },
  modelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modelName: { fontSize: 14, color: '#374151' },
  modelStatus: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
});
