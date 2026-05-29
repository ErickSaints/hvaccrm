import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../lib/auth';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador', TECHNICIAN: 'Técnico', SALES: 'Ventas',
  CLIENT: 'Cliente', PROYECTOS: 'Proyectos', COMPRAS: 'Compras',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>{user?.role ? roleLabels[user.role] : ''}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        {user?.phone && (
          <View style={styles.row}>
            <Text style={styles.label}>Teléfono</Text>
            <Text style={styles.value}>{user.phone}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    alignItems: 'center', padding: 24, paddingTop: 60,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#dbeafe',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#2563eb' },
  name: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  role: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 12, textTransform: 'uppercase' as any },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  label: { fontSize: 14, color: '#6b7280' },
  value: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  logoutBtn: {
    margin: 16, backgroundColor: '#ef4444', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
