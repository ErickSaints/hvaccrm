import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function QrScannerScreen({ navigation, route }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={s.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={s.centered}>
        <Text style={s.message}>Necesitamos acceso a la cámara para escanear códigos QR</Text>
        <TouchableOpacity style={s.button} onPress={requestPermission}>
          <Text style={s.buttonText}>Conceder permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    navigation.navigate('AssetLookup', { qrData: data });
  };

  return (
    <View style={s.container}>
      <CameraView
        style={s.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={s.overlay}>
        <View style={s.frame} />
      </View>
      <View style={s.footer}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={s.closeText}>Cerrar</Text>
        </TouchableOpacity>
        {scanned && (
          <TouchableOpacity style={s.scanAgain} onPress={() => setScanned(false)}>
            <Text style={s.scanAgainText}>Escanear otro</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
  message: { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 20 },
  camera: { flex: 1 },
  overlay: { position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center' },
  frame: { width: 250, height: 250, borderWidth: 2, borderColor: '#fff', borderRadius: 16, backgroundColor: 'transparent' },
  footer: { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center', gap: 12 },
  button: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backBtn: { paddingVertical: 8 },
  backText: { color: '#6b7280', fontSize: 14 },
  closeBtn: { backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 24 },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scanAgain: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24 },
  scanAgainText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
