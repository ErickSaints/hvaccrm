import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import api from '../lib/api';

export default function FleetTrackingScreen() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede obtener ubicación');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(pos);

      try {
        setSending(true);
        await api.post('/fleet/location', {
          latitude: pos.lat,
          longitude: pos.lng,
          speed: loc.coords.speed,
          heading: loc.coords.heading,
          accuracy: loc.coords.accuracy,
        });
      } catch { /* offline */ }
      finally { setSending(false); setLoading(false) }
    })();
  }, []);

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /><Text style={s.loadingTxt}>Obteniendo ubicación...</Text></View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Flotilla GPS</Text></View>
      <View style={s.card}>
        <Text style={s.label}>📍 Tu ubicación actual</Text>
        <Text style={s.coord}>Lat: {location?.lat.toFixed(6)}</Text>
        <Text style={s.coord}>Lng: {location?.lng.toFixed(6)}</Text>
        {sending && <Text style={s.sending}>(Enviando...)</Text>}
      </View>
      <View style={s.card}>
        <Text style={s.info}>
          Activa el rastreo continuo para compartir tu ubicación en tiempo real con el despachador.
          Usa la app en segundo plano para mantener el reporte GPS activo.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingTxt: { marginTop: 12, fontSize: 15, color: '#6b7280' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#2563eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, margin: 16, marginBottom: 0, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  coord: { fontSize: 15, color: '#374151', marginBottom: 4, fontFamily: 'monospace' },
  sending: { fontSize: 13, color: '#2563eb', marginTop: 8, fontStyle: 'italic' },
  info: { fontSize: 14, color: '#6b7280', lineHeight: 22 },
});
