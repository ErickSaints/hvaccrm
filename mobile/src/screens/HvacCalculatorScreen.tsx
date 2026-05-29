import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

export default function HvacCalculatorScreen() {
  const [btu, setBtu] = useState('12000');
  const [area, setArea] = useState('0');
  const [result, setResult] = useState<{ tons: number; btu: number; area: number; recommendation: string } | null>(null);

  const calculate = () => {
    const btuVal = parseFloat(btu) || 0;
    const areaVal = parseFloat(area) || 0;
    const tons = btuVal / 12000;
    const calcArea = areaVal > 0 ? areaVal : btuVal / 25;
    let recommendation = '';
    if (btuVal <= 12000) recommendation = 'Mini Split 1T — Ideal para cuartos de hasta 20m²';
    else if (btuVal <= 24000) recommendation = 'Split 2T — Ideal para departamentos de hasta 50m²';
    else if (btuVal <= 36000) recommendation = 'Split 3T — Ideal para casas de hasta 70m²';
    else if (btuVal <= 48000) recommendation = 'Equipo Comercial 4T — Ideal para oficinas pequeñas';
    else recommendation = 'Sistema Comercial — Consulta ingeniería';
    setResult({ tons, btu: btuVal, area: calcArea, recommendation });
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}><Text style={s.title}>🧮 Calculadora HVAC</Text></View>
      <View style={s.section}>
        <Text style={s.label}>Capacidad (BTU/h)</Text>
        <TextInput style={s.input} value={btu} onChangeText={setBtu} keyboardType="numeric" placeholder="12000" placeholderTextColor="#9ca3af" />
        <Text style={s.label}>Área (m²) — opcional</Text>
        <TextInput style={s.input} value={area} onChangeText={setArea} keyboardType="numeric" placeholder="0" placeholderTextColor="#9ca3af" />
        <TouchableOpacity style={s.button} onPress={calculate}><Text style={s.buttonText}>Calcular</Text></TouchableOpacity>
      </View>
      {result && (
        <View style={s.resultCard}>
          <Text style={s.sectionTitle}>Resultado</Text>
          <View style={s.row}>
            <Text style={s.resultLabel}>Toneladas</Text>
            <Text style={s.resultValue}>{result.tons.toFixed(1)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.resultLabel}>BTU</Text>
            <Text style={s.resultValue}>{result.btu.toLocaleString()}</Text>
          </View>
          {result.area > 0 && (
            <View style={s.row}>
              <Text style={s.resultLabel}>Área estimada</Text>
              <Text style={s.resultValue}>{result.area.toFixed(0)} m²</Text>
            </View>
          )}
          <View style={s.recommendation}>
            <Text style={s.recIcon}>💡</Text>
            <Text style={s.recText}>{result.recommendation}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#2563eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#d1d5db', color: '#111827' },
  button: { backgroundColor: '#2563eb', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 12, padding: 20, borderTopWidth: 4, borderTopColor: '#2563eb' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  resultLabel: { fontSize: 15, color: '#6b7280' },
  resultValue: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  recommendation: { flexDirection: 'row', backgroundColor: '#f0fdf4', borderRadius: 10, padding: 14, marginTop: 16 },
  recIcon: { fontSize: 20, marginRight: 10 },
  recText: { fontSize: 14, color: '#16a34a', flex: 1, lineHeight: 20 },
});
