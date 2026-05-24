// @ts-nocheck
import * as THREE from 'three';
import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calculator, Thermometer, Wind, User, ShoppingCart, Loader2, Rotate3D, Home, Sun, DoorOpen, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

type ClimateZone = 'template' | 'calido' | 'muy-calido' | 'extremo';
type UsageType = 'residencial' | 'comercial' | 'restaurante' | 'industrial' | 'refrigeracion';
type EquipmentType = 'minisplit' | 'refrigeracion' | 'paquete' | 'fan-coil';

interface Customer {
  id: number;
  companyName?: string;
  contactName: string;
}

interface RecommendedUnit {
  id: string;
  name: string;
  type: EquipmentType;
  btu: number;
  tons: number;
  price: number;
  description: string;
}

const ZONE_FACTORS: Record<ClimateZone, { label: string; factor: number; desc: string }> = {
  template: { label: 'Templado', factor: 40, desc: 'Norte / Centro (promedio 25°C)' },
  calido: { label: 'Cálido', factor: 50, desc: 'Costas / Sur (promedio 30°C)' },
  'muy-calido': { label: 'Muy Cálido', factor: 60, desc: 'Noreste / Pacífico (promedio 35°C)' },
  extremo: { label: 'Extremo', factor: 70, desc: 'Desierto / Trópico (>40°C)' },
};

const USAGE_MULTIPLIERS: Record<UsageType, { label: string; multiplier: number; desc: string }> = {
  residencial: { label: 'Residencial', multiplier: 1.0, desc: 'Hogar / Departamento' },
  comercial: { label: 'Comercial / Oficina', multiplier: 1.15, desc: 'Oficinas / Tiendas' },
  restaurante: { label: 'Restaurante / Cocina', multiplier: 1.4, desc: 'Alta carga térmica' },
  industrial: { label: 'Industrial / Bodega', multiplier: 1.25, desc: 'Bodegas / Talleres' },
  refrigeracion: { label: 'Refrigeración / Cámara', multiplier: 1.5, desc: 'Cuartos fríos' },
};

function EquipmentModel({ type }: { type: EquipmentType }) {
  const groupRef = useRef<any>(null);
  useFrame((_, delta) => { if (groupRef.current) groupRef.current.rotation.y += delta * 0.5; });

  if (type === 'minisplit') {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[1.8, 0.35, 0.7]} />
          <meshStandardMaterial color="#2563eb" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.25, 0.36]}>
          <boxGeometry args={[1.4, 0.02, 0.15]} />
          <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.2} />
        </mesh>
      </group>
    );
  }
  if (type === 'refrigeracion') {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[1.0, 0.6, 0.6]} />
          <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.15, 0.31]}>
          <boxGeometry args={[0.5, 0.1, 0.01]} />
          <meshStandardMaterial color="#fca5a5" />
        </mesh>
      </group>
    );
  }
  if (type === 'paquete') {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.5, 0.8, 1.0]} />
          <meshStandardMaterial color="#059669" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.4, 0.51]}>
          <boxGeometry args={[0.8, 0.1, 0.01]} />
          <meshStandardMaterial color="#6ee7b7" />
        </mesh>
      </group>
    );
  }
  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.2, 0.4, 0.5]} />
        <meshStandardMaterial color="#7c3aed" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

function RoomScene({ type, heatLevel }: { type: EquipmentType; heatLevel: number }) {
  const intensity = Math.min(heatLevel / 50000, 1);
  const r = 0.2 + intensity * 0.8;
  const g = 0.8 - intensity * 0.6;
  const b = 0.3 - intensity * 0.2;

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <Canvas camera={{ position: [3, 2, 4], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          {/* Room wireframe */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(2.5, 1.5, 2.5)]} />
            <lineBasicMaterial color="#4b5563" />
          </lineSegments>
          {/* Heat glow */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.3 + intensity * 0.4, 16, 16]} />
            <meshStandardMaterial color={`rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`} transparent opacity={0.3 + intensity * 0.4} emissive={`rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`} emissiveIntensity={intensity} />
          </mesh>
          {/* Equipment */}
          <group position={[0, -0.3, 0.6]}>
            <EquipmentModel type={type} />
          </group>
          <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={7} autoRotate autoRotateSpeed={0.8} />
        </Suspense>
      </Canvas>
    </div>
  );
}

const EQUIPMENT_CATALOG: Record<EquipmentType, RecommendedUnit[]> = {
  minisplit: [
    { id: 'ms-05', name: 'Minisplit 1/2 Ton', type: 'minisplit', btu: 6000, tons: 0.5, price: 4200, description: 'Ideal para cuartos pequeños (<10m²)' },
    { id: 'ms-075', name: 'Minisplit 3/4 Ton', type: 'minisplit', btu: 9000, tons: 0.75, price: 5200, description: 'Para habitaciones de 10-15m²' },
    { id: 'ms-1', name: 'Minisplit 1 Ton', type: 'minisplit', btu: 12000, tons: 1.0, price: 6200, description: 'Recámaras y oficinas pequeñas' },
    { id: 'ms-15', name: 'Minisplit 1.5 Ton', type: 'minisplit', btu: 18000, tons: 1.5, price: 7800, description: 'Sala/Estancia de 20-30m²' },
    { id: 'ms-2', name: 'Minisplit 2 Ton', type: 'minisplit', btu: 24000, tons: 2.0, price: 9200, description: 'Áreas grandes 30-40m²' },
    { id: 'ms-25', name: 'Minisplit 2.5 Ton', type: 'minisplit', btu: 30000, tons: 2.5, price: 11800, description: 'Locales comerciales 40-50m²' },
    { id: 'ms-3', name: 'Minisplit 3 Ton', type: 'minisplit', btu: 36000, tons: 3.0, price: 14200, description: 'Grandes espacios 50-60m²' },
  ],
  refrigeracion: [
    { id: 'ref-025', name: 'Unidad Condensadora 1/4 HP', type: 'refrigeracion', btu: 2000, tons: 0.17, price: 5800, description: 'Cámaras pequeñas / Refrigeración ligera' },
    { id: 'ref-05', name: 'Unidad Condensadora 1/2 HP', type: 'refrigeracion', btu: 4000, tons: 0.33, price: 8500, description: 'Cuartos fríos pequeños' },
    { id: 'ref-075', name: 'Unidad Condensadora 3/4 HP', type: 'refrigeracion', btu: 6000, tons: 0.5, price: 11200, description: 'Cámaras de refrigeración medias' },
    { id: 'ref-1', name: 'Unidad Condensadora 1 HP', type: 'refrigeracion', btu: 8000, tons: 0.67, price: 14500, description: 'Cámaras de refrigeración comerciales' },
    { id: 'ref-15', name: 'Unidad Condensadora 1.5 HP', type: 'refrigeracion', btu: 12000, tons: 1.0, price: 18500, description: 'Cámaras medianas' },
    { id: 'ref-2', name: 'Unidad Condensadora 2 HP', type: 'refrigeracion', btu: 16000, tons: 1.33, price: 22500, description: 'Cámaras grandes' },
    { id: 'ref-3', name: 'Unidad Condensadora 3 HP', type: 'refrigeracion', btu: 24000, tons: 2.0, price: 32000, description: 'Cámaras grandes comerciales' },
  ],
  paquete: [
    { id: 'pk-3', name: 'Equipo Paquete 3 Ton', type: 'paquete', btu: 36000, tons: 3.0, price: 22000, description: 'Pequeños comercios' },
    { id: 'pk-5', name: 'Equipo Paquete 5 Ton', type: 'paquete', btu: 60000, tons: 5.0, price: 35000, description: 'Oficinas / Locales' },
    { id: 'pk-75', name: 'Equipo Paquete 7.5 Ton', type: 'paquete', btu: 90000, tons: 7.5, price: 48000, description: 'Restaurantes / Salones' },
    { id: 'pk-10', name: 'Equipo Paquete 10 Ton', type: 'paquete', btu: 120000, tons: 10.0, price: 65000, description: 'Naves / Edificios' },
    { id: 'pk-15', name: 'Equipo Paquete 15 Ton', type: 'paquete', btu: 180000, tons: 15.0, price: 92000, description: 'Grandes instalaciones' },
  ],
  'fan-coil': [
    { id: 'fc-1', name: 'Fan & Coil 1.5 TR', type: 'fan-coil', btu: 18000, tons: 1.5, price: 5200, description: 'Habitaciones de hotel' },
    { id: 'fc-2', name: 'Fan & Coil 2 TR', type: 'fan-coil', btu: 24000, tons: 2.0, price: 6500, description: 'Oficinas pequeñas' },
    { id: 'fc-3', name: 'Fan & Coil 3 TR', type: 'fan-coil', btu: 36000, tons: 3.0, price: 8200, description: 'Salones / Aulas' },
    { id: 'fc-5', name: 'Fan & Coil 5 TR', type: 'fan-coil', btu: 60000, tons: 5.0, price: 12000, description: 'Grandes espacios' },
  ],
};

export default function HvacCalculatorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [length, setLength] = useState('5');
  const [width, setWidth] = useState('4');
  const [height, setHeight] = useState('2.5');
  const [zone, setZone] = useState<ClimateZone>('calido');
  const [usage, setUsage] = useState<UsageType>('residencial');
  const [people, setPeople] = useState('2');
  const [windows, setWindows] = useState('2');
  const [doors, setDoors] = useState('1');
  const [equipType, setEquipType] = useState<EquipmentType>('minisplit');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [btuResult, setBtuResult] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<RecommendedUnit[]>([]);

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => { const { data } = await api.get<Customer[]>('/customers'); return data; },
  });

  const calculate = () => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const p = parseInt(people) || 0;
    const win = parseInt(windows) || 0;
    const door = parseInt(doors) || 0;

    if (!l || !w || !h) { toast.error('Ingresa dimensiones válidas'); return; }

    const area = l * w;
    const volume = l * w * h;
    const zoneFactor = ZONE_FACTORS[zone].factor;
    const usageMult = USAGE_MULTIPLIERS[usage].multiplier;

    let btu = area * zoneFactor * usageMult;
    btu += p * 600;
    btu += win * 1000;
    btu += door * 500;
    btu += volume * 5;

    if (usage === 'refrigeracion') {
      btu = volume * 150 * zoneFactor * 0.3;
    }

    btu = Math.round(btu);
    setBtuResult(btu);

    const catalog = EQUIPMENT_CATALOG[equipType];
    const matched = catalog.filter(u => u.btu >= btu * 0.85 && u.btu <= btu * 1.5);
    const best = catalog.filter(u => u.btu >= btu).slice(0, 3);
    if (matched.length === 0 && best.length === 0) {
      const closest = catalog.slice(-2);
      setRecommended(closest);
    } else {
      setRecommended(matched.length > 0 ? matched.slice(0, 4) : best.slice(0, 3));
    }
  };

  useEffect(() => { if (btuResult !== null) calculate(); }, [equipType]);

  const quoteMutation = useMutation({
    mutationFn: async (unit: RecommendedUnit) => {
      if (!selectedCustomerId && user?.role !== 'CLIENT') throw new Error('Selecciona un cliente');
      const { data } = await api.post('/mercadolibre/create-quotation', {
        itemId: unit.id,
        title: unit.name,
        price: unit.price,
        quantity: 1,
        thumbnail: '',
        customerId: selectedCustomerId || undefined,
      });
      return data;
    },
    onSuccess: (data) => { toast.success('Cotización generada'); navigate(`/quotations/${data.id}`); },
    onError: (err: Error) => { toast.error(err.message || 'Error'); },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calculadora de Carga Térmica</h1>
        <p className="text-gray-500 mt-1">Dimensiona el equipo HVAC ideal para cualquier espacio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Dimensiones del Espacio</h2>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Largo (m)</label>
                <input type="number" value={length} onChange={e => setLength(e.target.value)} className="input-field" min="1" step="0.1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ancho (m)</label>
                <input type="number" value={width} onChange={e => setWidth(e.target.value)} className="input-field" min="1" step="0.1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Alto (m)</label>
                <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="input-field" min="1" step="0.1" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1"><Sun className="w-3 h-3 inline mr-1" />Zona Climática</label>
              <select value={zone} onChange={e => setZone(e.target.value as ClimateZone)} className="input-field">
                {Object.entries(ZONE_FACTORS).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.desc}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1"><Home className="w-3 h-3 inline mr-1" />Tipo de Uso</label>
              <select value={usage} onChange={e => setUsage(e.target.value as UsageType)} className="input-field">
                {Object.entries(USAGE_MULTIPLIERS).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.desc}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1"><Users className="w-3 h-3 inline mr-1" />Personas</label>
                <input type="number" value={people} onChange={e => setPeople(e.target.value)} className="input-field" min="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ventanas</label>
                <input type="number" value={windows} onChange={e => setWindows(e.target.value)} className="input-field" min="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1"><DoorOpen className="w-3 h-3 inline mr-1" />Puertas</label>
                <input type="number" value={doors} onChange={e => setDoors(e.target.value)} className="input-field" min="0" />
              </div>
            </div>

            <button onClick={calculate} className="btn-primary w-full">Calcular Carga Térmica</button>

            {btuResult !== null && (
              <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                <p className="text-xs text-primary-600 font-medium mb-1">Requerimiento calculado</p>
                <p className="text-2xl font-bold text-primary-700">{btuResult.toLocaleString()} BTU/h</p>
                <p className="text-sm text-primary-500">{(btuResult / 12000).toFixed(2)} Toneladas</p>
                <p className="text-sm text-primary-500">{(btuResult / 3412).toFixed(1)} kW</p>
              </div>
            )}
          </div>
        </div>

        {/* Results + 3D */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3D Scene */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Rotate3D className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Visualización 3D</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Wind className="w-3 h-3" /> Arrastra para rotar</span>
                <select value={equipType} onChange={e => setEquipType(e.target.value as EquipmentType)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                  <option value="minisplit">Minisplit</option>
                  <option value="refrigeracion">Refrigeración</option>
                  <option value="paquete">Equipo Paquete</option>
                  <option value="fan-coil">Fan & Coil</option>
                </select>
              </div>
            </div>
            <RoomScene type={equipType} heatLevel={btuResult || 0} />
          </div>

          {/* Recommended Equipment */}
          {btuResult !== null && recommended.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Equipo Recomendado</h2>
                </div>
                <div className="w-full sm:w-56">
                  <label className="block text-xs font-medium text-gray-500 mb-1"><User className="w-3 h-3 inline mr-1" />Cliente</label>
                  <select value={selectedCustomerId ?? ''} onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)} className="input-field text-sm">
                    <option value="">Seleccionar cliente...</option>
                    {customers?.map(c => <option key={c.id} value={c.id}>{c.companyName ? `${c.companyName} - ${c.contactName}` : c.contactName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommended.map((unit) => (
                  <div key={unit.id} className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{unit.name}</h3>
                        <p className="text-xs text-gray-500">{unit.description}</p>
                      </div>
                      <span className="text-xs bg-primary-50 text-primary-700 font-medium px-2 py-0.5 rounded-full whitespace-nowrap">{unit.btu.toLocaleString()} BTU</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-lg font-bold text-primary-600">${unit.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                      <button
                        onClick={() => quoteMutation.mutate(unit)}
                        disabled={quoteMutation.isPending || (user?.role !== 'CLIENT' && !selectedCustomerId)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        {quoteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3" />}
                        Cotizar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
