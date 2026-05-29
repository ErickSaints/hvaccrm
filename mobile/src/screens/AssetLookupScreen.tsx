import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { Loading } from '../components/Loading';
import type { Asset } from '../types';

export default function AssetLookupScreen({ navigation, route }: any) {
  const { qrData } = route.params || {};
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!qrData) {
      setError('No se recibieron datos del código QR');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        let id = parseInt(qrData, 10);
        if (!isNaN(id)) {
          const { data } = await api.get(`/assets/${id}`);
          setAsset(data);
        } else {
          const { data } = await api.get('/assets', { params: { search: qrData, limit: 1 } });
          if (data.data?.length) setAsset(data.data[0]);
          else setError('No se encontró ningún activo con ese código QR');
        }
      } catch {
        setError('Error al buscar el activo');
      } finally {
        setLoading(false);
      }
    })();
  }, [qrData]);

  if (loading) return <Loading />;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.title}>Resultado QR</Text>
        <View style={{ width: 32 }} />
      </View>

      {error ? (
        <View style={s.centered}>
          <Ionicons name="close-circle" size={64} color="#ef4444" />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Assets')}>
            <Text style={s.primaryBtnText}>Ir a Activos</Text>
          </TouchableOpacity>
        </View>
      ) : asset ? (
        <View style={s.card}>
          <Ionicons name="checkmark-circle" size={48} color="#16a34a" style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={s.assetName}>{asset.name}</Text>
          <Text style={s.assetDetail}>S/N: {asset.serialNumber || 'N/A'}</Text>
          <Text style={s.assetDetail}>Ubicación: {asset.location || 'No especificada'}</Text>
          {asset.description && <Text style={s.assetDesc}>{asset.description}</Text>}
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Assets')}>
            <Text style={s.primaryBtnText}>Ver todos los activos</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, backgroundColor: '#2563eb' },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 16, marginBottom: 24 },
  card: { margin: 20, backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  assetName: { fontSize: 22, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  assetDetail: { fontSize: 15, color: '#4b5563', textAlign: 'center', marginBottom: 4 },
  assetDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
