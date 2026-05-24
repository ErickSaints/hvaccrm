import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Calculator, Thermometer, Wind, User, ShoppingCart, Loader2, Sun, Home, DoorOpen,
  Users, Building2, RefrigeratorIcon, Warehouse, UtensilsCrossed, Lightbulb,
  Ruler, Layers, Info, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

type ClimateZone = 'template' | 'calido' | 'muy-calido' | 'extremo';
type UsageType = 'residencial' | 'comercial' | 'restaurante' | 'industrial' | 'refrigeracion';
type InsulationLevel = 'pobre' | 'media' | 'buena' | 'excelente';
type WallMaterial = 'ladrillo' | 'block' | 'panel' | 'concreto';
type RoofType = 'concreto' | 'lamina' | 'teja' | 'terraza';
type GlassType = 'sencillo' | 'doble' | 'polarizado';
type RefrigerationType = 'enfriado' | 'congelacion' | 'ultra-congelacion';
type ApplicationType = 'confort' | 'refrigeracion';

interface Customer {
  id: number; companyName?: string; contactName: string;
}

interface RecommendedUnit {
  id: string; name: string; type: string; btu: number; tons: number;
  price: number; description: string; efficiency: string; kw: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ZONES: Record<ClimateZone, { label: string; temp: number; factor: number }> = {
  template: { label: 'Templado', temp: 25, factor: 0.85 },
  calido: { label: 'Cálido', temp: 32, factor: 1.0 },
  'muy-calido': { label: 'Muy Cálido', temp: 38, factor: 1.25 },
  extremo: { label: 'Extremo', temp: 45, factor: 1.5 },
};

const USAGES: Record<UsageType, { label: string; icon: any; app: ApplicationType; allowedEquipment: string[]; desc: string }> = {
  residencial: { label: 'Residencial', icon: Home, app: 'confort', allowedEquipment: ['minisplit', 'fan-coil'], desc: 'Casas, departamentos, cuartos' },
  comercial: { label: 'Comercial / Oficina', icon: Building2, app: 'confort', allowedEquipment: ['minisplit', 'fan-coil', 'paquete'], desc: 'Oficinas, tiendas, consultorios' },
  restaurante: { label: 'Restaurante / Cocina', icon: UtensilsCrossed, app: 'confort', allowedEquipment: ['paquete', 'fan-coil'], desc: 'Alta carga por cocinas y personas' },
  industrial: { label: 'Industrial / Bodega', icon: Warehouse, app: 'confort', allowedEquipment: ['paquete'], desc: 'Naves, talleres, almacenes' },
  refrigeracion: { label: 'Refrigeración / Cámara Fría', icon: RefrigeratorIcon, app: 'refrigeracion', allowedEquipment: ['refrigeracion'], desc: 'Cámaras de enfriado y congelación' },
};

const INSULATION: Record<InsulationLevel, { label: string; coeff: number }> = {
  pobre: { label: 'Pobre (sin aislamiento)', coeff: 1.4 },
  media: { label: 'Media (aislamiento básico)', coeff: 1.0 },
  buena: { label: 'Buena (aislamiento estándar)', coeff: 0.8 },
  excelente: { label: 'Excelente (aislamiento premium)', coeff: 0.6 },
};

const WALL_COEFF: Record<WallMaterial, number> = { ladrillo: 2.0, block: 1.8, panel: 0.8, concreto: 2.5 };
const ROOF_COEFF: Record<RoofType, number> = { concreto: 2.2, lamina: 3.5, teja: 2.8, terraza: 2.0 };
const GLASS_COEFF: Record<GlassType, number> = { sencillo: 5.8, doble: 3.2, polarizado: 2.5 };

const REFRIG_TYPES: Record<RefrigerationType, { label: string; temp: number; desc: string }> = {
  enfriado: { label: 'Enfriado (0°C a 8°C)', temp: 4, desc: 'Carnes, lácteos, verduras' },
  congelacion: { label: 'Congelación (-18°C a -22°C)', temp: -18, desc: 'Carnes congeladas, helados' },
  'ultra-congelacion': { label: 'Ultra-congelación (-30°C a -40°C)', temp: -35, desc: 'Pescados, productos ultracongelados' },
};

// ─── Equipment Catalog ──────────────────────────────────────────────────────

const EQUIPMENT: Record<string, RecommendedUnit[]> = {
  minisplit: [
    { id: 'ms-05', name: 'Minisplit 1/2 Ton', type: 'minisplit', btu: 6000, tons: 0.5, price: 4200, description: 'Habitaciones <10m²', efficiency: '14 SEER', kw: 0.44 },
    { id: 'ms-075', name: 'Minisplit 3/4 Ton', type: 'minisplit', btu: 9000, tons: 0.75, price: 5200, description: 'Habitaciones 10-15m²', efficiency: '14 SEER', kw: 0.66 },
    { id: 'ms-1', name: 'Minisplit 1 Ton', type: 'minisplit', btu: 12000, tons: 1.0, price: 6200, description: 'Recámaras y oficinas', efficiency: '15 SEER', kw: 0.88 },
    { id: 'ms-15', name: 'Minisplit 1.5 Ton', type: 'minisplit', btu: 18000, tons: 1.5, price: 7800, description: 'Salas 20-30m²', efficiency: '15 SEER', kw: 1.32 },
    { id: 'ms-2', name: 'Minisplit 2 Ton', type: 'minisplit', btu: 24000, tons: 2.0, price: 9200, description: 'Áreas grandes 30-40m²', efficiency: '14 SEER', kw: 1.76 },
    { id: 'ms-25', name: 'Minisplit 2.5 Ton', type: 'minisplit', btu: 30000, tons: 2.5, price: 11800, description: 'Locales comerciales 40-50m²', efficiency: '13 SEER', kw: 2.20 },
    { id: 'ms-3', name: 'Minisplit 3 Ton', type: 'minisplit', btu: 36000, tons: 3.0, price: 14200, description: 'Grandes espacios 50-60m²', efficiency: '13 SEER', kw: 2.64 },
    { id: 'ms-4', name: 'Minisplit 4 Ton', type: 'minisplit', btu: 48000, tons: 4.0, price: 18500, description: 'Espacios muy grandes 60-80m²', efficiency: '13 SEER', kw: 3.52 },
  ],
  'fan-coil': [
    { id: 'fc-1', name: 'Fan & Coil 1.5 TR', type: 'fan-coil', btu: 18000, tons: 1.5, price: 5200, description: 'Habitaciones de hotel', efficiency: 'Chiller 4°C', kw: 0.45 },
    { id: 'fc-2', name: 'Fan & Coil 2 TR', type: 'fan-coil', btu: 24000, tons: 2.0, price: 6500, description: 'Oficinas pequeñas', efficiency: 'Chiller 4°C', kw: 0.60 },
    { id: 'fc-3', name: 'Fan & Coil 3 TR', type: 'fan-coil', btu: 36000, tons: 3.0, price: 8200, description: 'Salones / Aulas', efficiency: 'Chiller 4°C', kw: 0.90 },
    { id: 'fc-4', name: 'Fan & Coil 4 TR', type: 'fan-coil', btu: 48000, tons: 4.0, price: 10500, description: 'Salas de juntas grandes', efficiency: 'Chiller 4°C', kw: 1.20 },
    { id: 'fc-5', name: 'Fan & Coil 5 TR', type: 'fan-coil', btu: 60000, tons: 5.0, price: 13500, description: 'Restaurantes / Salones', efficiency: 'Chiller 4°C', kw: 1.50 },
    { id: 'fc-8', name: 'Fan & Coil 8 TR', type: 'fan-coil', btu: 96000, tons: 8.0, price: 19800, description: 'Grandes espacios comerciales', efficiency: 'Chiller 4°C', kw: 2.40 },
  ],
  paquete: [
    { id: 'pk-3', name: 'Equipo Paquete 3 Ton', type: 'paquete', btu: 36000, tons: 3.0, price: 22000, description: 'Pequeños comercios', efficiency: '11 EER', kw: 3.27 },
    { id: 'pk-5', name: 'Equipo Paquete 5 Ton', type: 'paquete', btu: 60000, tons: 5.0, price: 35000, description: 'Oficinas / Locales', efficiency: '11.5 EER', kw: 5.22 },
    { id: 'pk-75', name: 'Equipo Paquete 7.5 Ton', type: 'paquete', btu: 90000, tons: 7.5, price: 48000, description: 'Restaurantes / Salones', efficiency: '11 EER', kw: 8.18 },
    { id: 'pk-10', name: 'Equipo Paquete 10 Ton', type: 'paquete', btu: 120000, tons: 10, price: 65000, description: 'Naves / Edificios', efficiency: '11.5 EER', kw: 10.43 },
    { id: 'pk-125', name: 'Equipo Paquete 12.5 Ton', type: 'paquete', btu: 150000, tons: 12.5, price: 78500, description: 'Edificios medianos', efficiency: '11 EER', kw: 13.64 },
    { id: 'pk-15', name: 'Equipo Paquete 15 Ton', type: 'paquete', btu: 180000, tons: 15, price: 92000, description: 'Grandes instalaciones', efficiency: '11 EER', kw: 16.36 },
    { id: 'pk-20', name: 'Equipo Paquete 20 Ton', type: 'paquete', btu: 240000, tons: 20, price: 125000, description: 'Naves industriales', efficiency: '11.5 EER', kw: 20.87 },
  ],
  refrigeracion: [
    { id: 'rf-025', name: 'Condensadora 1/4 HP + Evaporador', type: 'refrigeracion', btu: 2000, tons: 0.17, price: 8500, description: 'Cámaras pequeñas <5m³ enfriado', efficiency: 'R-404A', kw: 0.25 },
    { id: 'rf-05', name: 'Condensadora 1/2 HP + Evaporador', type: 'refrigeracion', btu: 4000, tons: 0.33, price: 12500, description: 'Cuartos fríos 5-10m³ enfriado', efficiency: 'R-404A', kw: 0.45 },
    { id: 'rf-075', name: 'Condensadora 3/4 HP + Evaporador', type: 'refrigeracion', btu: 6000, tons: 0.5, price: 16500, description: 'Cámaras 10-15m³ enfriado', efficiency: 'R-404A', kw: 0.65 },
    { id: 'rf-1', name: 'Condensadora 1 HP + Evaporador', type: 'refrigeracion', btu: 8000, tons: 0.67, price: 21000, description: 'Cámaras 15-25m³ enfriado / 5-10m³ congelación', efficiency: 'R-404A', kw: 0.85 },
    { id: 'rf-15', name: 'Condensadora 1.5 HP + Evaporador', type: 'refrigeracion', btu: 12000, tons: 1.0, price: 28000, description: 'Cámaras 25-35m³ enfriado / 10-15m³ congelación', efficiency: 'R-404A', kw: 1.25 },
    { id: 'rf-2', name: 'Condensadora 2 HP + Evaporador', type: 'refrigeracion', btu: 16000, tons: 1.33, price: 35000, description: 'Cámaras 35-50m³ enfriado / 15-25m³ congelación', efficiency: 'R-404A/R-507', kw: 1.65 },
    { id: 'rf-3', name: 'Condensadora 3 HP + Evaporador', type: 'refrigeracion', btu: 24000, tons: 2.0, price: 45000, description: 'Cámaras 50-70m³ enfriado / 25-35m³ congelación', efficiency: 'R-404A/R-507', kw: 2.45 },
    { id: 'rf-5', name: 'Condensadora 5 HP + Evaporador', type: 'refrigeracion', btu: 40000, tons: 3.33, price: 65000, description: 'Cámaras grandes 70-120m³ enfriado', efficiency: 'R-507', kw: 4.1 },
    { id: 'rf-75', name: 'Condensadora 7.5 HP + Evaporador', type: 'refrigeracion', btu: 60000, tons: 5.0, price: 88000, description: 'Cámaras muy grandes >120m³ enfriado', efficiency: 'R-507', kw: 6.1 },
  ],
};

// ─── Calculation Engine ──────────────────────────────────────────────────────

interface CalcInputs {
  length: number; width: number; height: number;
  zone: ClimateZone; usage: UsageType;
  people: number; windows: number; doors: number;
  insulation: InsulationLevel; wall: WallMaterial; roof: RoofType;
  glass: GlassType; hasSolarControl: boolean; equipmentLoad: number;
  // Refrigeration
  refrigerType: RefrigerationType;
  chamberInsulation: InsulationLevel;
  productMass: number;
  doorOpenings: number;
  hasDefrost: boolean;
}

interface CalcResult {
  btu: number; tons: number; kw: number;
  sensible: number; latent: number;
  details: { label: string; value: number; unit: string }[];
}

function calcAC(inputs: CalcInputs): CalcResult {
  const { length: L, width: W, height: H, zone, usage, people, windows, doors, insulation, wall, roof, glass, hasSolarControl, equipmentLoad } = inputs;
  const area = L * W;
  const volume = L * W * H;
  const perimeter = 2 * (L + W);
  const zoneTemp = ZONES[zone].temp;
  const zoneFactor = ZONES[zone].factor;

  // Wall area (assume 60% of perimeter × height is exposed wall)
  const wallArea = perimeter * H * 0.6;
  // Roof area
  const roofArea = area;
  // Glass area (assumes 1.5 m² per window)
  const glassArea = windows * 1.5;
  // Door area (assumes 2 m² per door)
  const doorArea = doors * 2;

  const insulationCoeff = INSULATION[insulation].coeff;
  const wallU = WALL_COEFF[wall] * insulationCoeff;
  const roofU = ROOF_COEFF[roof] * insulationCoeff;
  const glassU = GLASS_COEFF[glass];
  const doorU = 3.5;

  // ΔT for design: Ambient - 24°C (comfort temp)
  const deltaT = Math.max(zoneTemp - 24, 5);
  const solarFactor = hasSolarControl ? 0.7 : 1.0;

  // Wall transmission
  const wallLoad = wallArea * wallU * deltaT * 3.412; // W → BTU/h
  // Roof transmission
  const roofLoad = roofArea * roofU * deltaT * 3.412 * 1.2;
  // Glass transmission
  const glassLoad = glassArea * glassU * deltaT * 3.412 * solarFactor;
  // Door transmission
  const doorLoad = doorArea * doorU * deltaT * 3.412;

  // People - sensible + latent
  const usageMult = usage === 'restaurante' ? 1.3 : usage === 'industrial' ? 1.1 : 1.0;
  const peopleSensible = people * 600 * usageMult;
  const peopleLatent = people * 400 * usageMult;

  // Lighting and equipment
  const lightingLoad = area * 75 * 3.412; // 75 W/m² → BTU/h
  const equipLoad = equipmentLoad > 0 ? equipmentLoad * 3.412 : area * 100 * 3.412 * 0.5;

  // Infiltration
  const airChanges = doors > 2 ? 1.5 : doors > 0 ? 0.8 : 0.5;
  const infiltration = volume * airChanges * deltaT * 1.08;

  // Solar radiation on glass (additional)
  const solarLoad = glassArea * 180 * 3.412 * solarFactor * (zoneFactor > 1 ? 1.2 : 1.0);

  const sensible = wallLoad + roofLoad + glassLoad + doorLoad + peopleSensible + lightingLoad + equipLoad + infiltration + solarLoad;
  const latent = peopleLatent + volume * 0.5 * deltaT * 0.5;
  const total = sensible + latent;

  return {
    btu: Math.round(total),
    tons: Math.round(total / 12000 * 100) / 100,
    kw: Math.round(total / 3412 * 100) / 100,
    sensible: Math.round(sensible),
    latent: Math.round(latent),
    details: [
      { label: 'Techos y muros', value: Math.round(wallLoad + roofLoad), unit: 'BTU/h' },
      { label: 'Ventanas y puertas', value: Math.round(glassLoad + doorLoad), unit: 'BTU/h' },
      { label: 'Personas (sensible)', value: Math.round(peopleSensible), unit: 'BTU/h' },
      { label: 'Personas (latente)', value: Math.round(peopleLatent), unit: 'BTU/h' },
      { label: 'Iluminación', value: Math.round(lightingLoad), unit: 'BTU/h' },
      { label: 'Equipos eléctricos', value: Math.round(equipLoad), unit: 'BTU/h' },
      { label: 'Infiltración', value: Math.round(infiltration), unit: 'BTU/h' },
      { label: 'Radiación solar', value: Math.round(solarLoad), unit: 'BTU/h' },
    ],
  };
}

function calcRefrigeration(inputs: CalcInputs): CalcResult {
  const { length: L, width: W, height: H, zone, refrigerType, chamberInsulation, productMass, doorOpenings, hasDefrost, people, usage } = inputs;
  const volume = L * W * H;
  const surfaceArea = 2 * (L * W + L * H + W * H);
  const ambientTemp = ZONES[zone].temp;
  const chamberTemp = REFRIG_TYPES[refrigerType].temp;
  const deltaT = ambientTemp - chamberTemp;
  const insCoeff = INSULATION[chamberInsulation].coeff;

  // Transmission load (walls, ceiling, floor)
  // U-value for insulated panel: 0.28 W/m²K (good) adjusted by insulation
  const uValue = 0.28 * insCoeff;
  const transmissionW = surfaceArea * uValue * deltaT * 1.1; // 10% safety
  const transmission = transmissionW * 3.412;

  // Product load
  // Specific heat above freezing: 3.5 kJ/kgK; below: 2.0 kJ/kgK
  // Assume cooling from ambient to chamber temp in 24h
  const specificHeat = chamberTemp >= 0 ? 3.5 : 2.0;
  const productLoadW = productMass > 0 ? (productMass * specificHeat * deltaT * 1000) / (24 * 3600) : 0;
  const productLoad = productLoadW * 3.412;

  // Infiltration (door openings)
  // Each opening: 0.5 × door area × ΔT × factor
  const doorArea = 2.0; // Standard door 2m²
  const infiltrationW = doorOpenings * 0.3 * doorArea * deltaT * 8;
  const infiltration = infiltrationW * 3.412;

  // Internal loads
  const peopleW = people * 150; // 150W per person in cold environment
  const lightingW = L * W * 10; // 10 W/m²
  const internalW = peopleW + lightingW;
  const internal = internalW * 3.412 * 0.8;

  // Defrost load
  const defrostLoad = hasDefrost ? (transmission * 0.15) : 0;

  // Fan load (evaporator fans)
  const fanLoad = volume * 2 * 3.412;

  // Safety factor 15%
  const total = (transmission + productLoad + infiltration + internal + defrostLoad + fanLoad) * 1.15;

  return {
    btu: Math.round(total),
    tons: Math.round(total / 12000 * 100) / 100,
    kw: Math.round(total / 3412 * 100) / 100,
    sensible: Math.round(transmission + productLoad + infiltration + defrostLoad + fanLoad),
    latent: 0,
    details: [
      { label: 'Transmisión (muros/techo/piso)', value: Math.round(transmission), unit: 'BTU/h' },
      { label: 'Carga del producto', value: Math.round(productLoad), unit: 'BTU/h' },
      { label: 'Infiltración (apertura de puertas)', value: Math.round(infiltration), unit: 'BTU/h' },
      { label: 'Cargas internas (personas + luces)', value: Math.round(internal), unit: 'BTU/h' },
      { label: 'Ventiladores evaporador', value: Math.round(fanLoad), unit: 'BTU/h' },
      ...(hasDefrost ? [{ label: 'Descongelación', value: Math.round(defrostLoad), unit: 'BTU/h' } as const] : []),
    ],
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

const formatMoney = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function HvacCalculatorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form state
  const [length, setLength] = useState('5');
  const [width, setWidth] = useState('4');
  const [height, setHeight] = useState('2.5');
  const [zone, setZone] = useState<ClimateZone>('calido');
  const [usage, setUsage] = useState<UsageType>('residencial');
  const [people, setPeople] = useState('2');
  const [windows, setWindows] = useState('2');
  const [doors, setDoors] = useState('1');
  const [insulation, setInsulation] = useState<InsulationLevel>('media');
  const [wall, setWall] = useState<WallMaterial>('block');
  const [roof, setRoof] = useState<RoofType>('concreto');
  const [glass, setGlass] = useState<GlassType>('sencillo');
  const [hasSolarControl, setHasSolarControl] = useState(false);
  const [equipmentLoad, setEquipmentLoad] = useState('0');

  // Refrigeration fields
  const [refrigType, setRefrigType] = useState<RefrigerationType>('enfriado');
  const [chamberInsulation, setChamberInsulation] = useState<InsulationLevel>('buena');
  const [productMass, setProductMass] = useState('500');
  const [doorOpenings, setDoorOpenings] = useState('10');
  const [hasDefrost, setHasDefrost] = useState(true);

  // Results
  const [result, setResult] = useState<CalcResult | null>(null);
  const [recommended, setRecommended] = useState<RecommendedUnit[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const usageConfig = USAGES[usage];
  const isRefrigeracion = usage === 'refrigeracion';
  const allowedEquipment = usageConfig.allowedEquipment;
  const [selectedType, setSelectedType] = useState(allowedEquipment[0]);

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => { const { data } = await api.get<Customer[]>('/customers'); return data; },
  });

  function calculate() {
    const L = parseFloat(length) || 0;
    const W = parseFloat(width) || 0;
    const H = parseFloat(height) || 0;
    const p = parseInt(people) || 0;
    const win = parseInt(windows) || 0;
    const dor = parseInt(doors) || 0;
    const eqLoad = parseFloat(equipmentLoad) || 0;

    if (!L || !W || !H) { toast.error('Ingresa dimensiones válidas'); return; }

    const inputs: CalcInputs = {
      length: L, width: W, height: H, zone, usage,
      people: p, windows: win, doors: dor,
      insulation, wall, roof, glass, hasSolarControl, equipmentLoad: eqLoad,
      refrigerType: refrigType, chamberInsulation,
      productMass: parseFloat(productMass) || 0,
      doorOpenings: parseInt(doorOpenings) || 0,
      hasDefrost,
    };

    const calcResult = isRefrigeracion ? calcRefrigeration(inputs) : calcAC(inputs);
    setResult(calcResult);

    // Match equipment
    const catalog = EQUIPMENT[selectedType] || [];
    // Filter by allowed equipment types
    const allEquip = allowedEquipment.flatMap(t => EQUIPMENT[t] || []);
    const btu = calcResult.btu;

    // Find best matches: equipment that can handle this load
    const minimal = btu * 0.85;
    const maximal = btu * 2.0;
    let matched = allEquip.filter(u => u.btu >= minimal && u.btu <= maximal);
    matched.sort((a, b) => a.btu - b.btu);

    if (matched.length === 0) {
      // No match in range - get closest
      const sorted = [...allEquip].sort((a, b) => Math.abs(a.btu - btu) - Math.abs(b.btu - btu));
      matched = sorted.slice(0, 3);
    }

    // Show closest matches (undersized + oversized)
    const undersized = allEquip.filter(u => u.btu < btu).slice(-2);
    const oversized = allEquip.filter(u => u.btu >= btu).slice(0, 3);
    const combined = [...undersized, ...oversized].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    setRecommended(combined.length > 0 ? combined.slice(0, 4) : matched.slice(0, 4));
  }

  function getEquipmentForType(type: string): RecommendedUnit[] {
    return EQUIPMENT[type] || [];
  }

  const quoteMutation = useMutation({
    mutationFn: async (unit: RecommendedUnit) => {
      if (!selectedCustomerId && user?.role !== 'CLIENT') throw new Error('Selecciona un cliente');
      const { data } = await api.post('/mercadolibre/create-quotation', {
        itemId: unit.id, title: unit.name, price: unit.price, quantity: 1, thumbnail: '',
        customerId: selectedCustomerId || undefined,
      });
      return data;
    },
    onSuccess: (data) => { toast.success('Cotización generada'); navigate(`/quotations/${data.id}`); },
    onError: (err: Error) => { toast.error(err.message || 'Error'); },
  });

  // When usage changes, update selected equipment type
  function handleUsageChange(u: UsageType) {
    setUsage(u);
    setSelectedType(USAGES[u].allowedEquipment[0]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calculadora de Carga Térmica HVAC-R</h1>
        <p className="text-gray-500 mt-1">Cálculo profesional basado en normas ASHRAE para dimensionar equipos de climatización y refrigeración</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Dimensions */}
          <div className="card-static p-5">
            <div className="flex items-center gap-2 mb-4">
              <Ruler className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Dimensiones del Espacio</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Largo (m)', value: length, set: setLength, icon: null },
                { label: 'Ancho (m)', value: width, set: setWidth, icon: null },
                { label: 'Alto (m)', value: height, set: setHeight, icon: null },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{f.label}</label>
                  <input type="number" value={f.value} onChange={e => f.set(e.target.value)} className="input-field" min="0.5" step="0.1" />
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {(() => { const l=parseFloat(length)||0; const w=parseFloat(width)||0; const h=parseFloat(height)||0; if (!l||!w||!h) return null; return `Volumen: ${(l*w*h).toFixed(1)} m³ · Área: ${(l*w).toFixed(1)} m²`; })()}
            </div>
          </div>

          {/* Usage & Climate */}
          <div className="card-static p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Tipo y Clima</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de aplicación</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(Object.entries(USAGES) as [UsageType, typeof USAGES[UsageType]][]).map(([k, v]) => {
                    const Icon = v.icon;
                    const active = usage === k;
                    return (
                      <button key={k} onClick={() => handleUsageChange(k)}
                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-medium transition-all border ${
                          active ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-primary-500' : 'text-gray-400'}`} />
                        {v.label.split('/')[0].trim()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Zona climática</label>
                <select value={zone} onChange={e => setZone(e.target.value as ClimateZone)} className="input-field">
                  {Object.entries(ZONES).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.temp}°C)</option>)}
                </select>
              </div>

              {isRefrigeracion ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de cámara</label>
                    <select value={refrigType} onChange={e => setRefrigType(e.target.value as RefrigerationType)} className="input-field">
                      {Object.entries(REFRIG_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">{REFRIG_TYPES[refrigType].desc}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Aislamiento de cámara</label>
                    <select value={chamberInsulation} onChange={e => setChamberInsulation(e.target.value as InsulationLevel)} className="input-field">
                      {Object.entries(INSULATION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Aislamiento del inmueble</label>
                    <select value={insulation} onChange={e => setInsulation(e.target.value as InsulationLevel)} className="input-field">
                      {Object.entries(INSULATION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Material muros</label>
                      <select value={wall} onChange={e => setWall(e.target.value as WallMaterial)} className="input-field">
                        {Object.entries(WALL_COEFF).map(([k, v]) => <option key={k} value={k}>{k.charAt(0).toUpperCase()+k.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de techo</label>
                      <select value={roof} onChange={e => setRoof(e.target.value as RoofType)} className="input-field">
                        {Object.entries(ROOF_COEFF).map(([k, v]) => <option key={k} value={k}>{k.charAt(0).toUpperCase()+k.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Load Details */}
          <div className="card-static p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Cargas Adicionales</h2>
            </div>
            <div className="space-y-3">
              {isRefrigeracion ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Masa de producto (kg/día)</label>
                    <input type="number" value={productMass} onChange={e => setProductMass(e.target.value)} className="input-field" min="0" step="10" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Aperturas de puerta al día</label>
                    <input type="number" value={doorOpenings} onChange={e => setDoorOpenings(e.target.value)} className="input-field" min="0" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Descongelación eléctrica</p>
                      <p className="text-xs text-gray-400">+15% a la carga de transmisión</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={hasDefrost} onChange={e => setHasDefrost(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block"><Users className="w-3 h-3 inline mr-1" />Personas</label>
                      <input type="number" value={people} onChange={e => setPeople(e.target.value)} className="input-field" min="0" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Ventanas</label>
                      <input type="number" value={windows} onChange={e => setWindows(e.target.value)} className="input-field" min="0" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block"><DoorOpen className="w-3 h-3 inline mr-1" />Puertas</label>
                      <input type="number" value={doors} onChange={e => setDoors(e.target.value)} className="input-field" min="0" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de vidrio</label>
                    <select value={glass} onChange={e => setGlass(e.target.value as GlassType)} className="input-field">
                      {Object.entries(GLASS_COEFF).map(([k, v]) => <option key={k} value={k}>{k.charAt(0).toUpperCase()+k.slice(1)} ({v} W/m²K)</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                    <input type="checkbox" checked={hasSolarControl} onChange={e => setHasSolarControl(e.target.checked)} className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                    <span>Película solar / Control solar en ventanas</span>
                  </label>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block"><Lightbulb className="w-3 h-3 inline mr-1" />Carga equipos eléctricos (W)</label>
                    <input type="number" value={equipmentLoad} onChange={e => setEquipmentLoad(e.target.value)} className="input-field" min="0" step="100" placeholder="Ej: 2000 para cocina equipada" />
                  </div>
                </>
              )}

              <button onClick={calculate} className="btn-primary w-full mt-2">
                <Calculator className="w-4 h-4 inline mr-2" />
                Calcular Carga Térmica
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="xl:col-span-3 space-y-6">
          {/* Result summary / Quick select */}
          {result && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-static p-5 text-center">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Carga Térmica Total</p>
                  <p className="text-3xl font-bold text-primary-600">{result.btu.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">BTU/h</p>
                </div>
                <div className="card-static p-5 text-center">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Capacidad Requerida</p>
                  <p className="text-3xl font-bold text-emerald-600">{result.tons.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">Toneladas</p>
                </div>
                <div className="card-static p-5 text-center">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Equivalente Eléctrico</p>
                  <p className="text-3xl font-bold text-amber-600">{result.kw.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">kW</p>
                </div>
              </div>

              {/* Detail breakdown */}
              <div className="card-static p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Desglose de Carga</h3>
                </div>
                <div className="space-y-2">
                  {result.details.map((d, i) => {
                    const pct = Math.round(d.value / result.btu * 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{d.label}</span>
                            <span className="font-medium text-gray-900">{d.value.toLocaleString()} {d.unit} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!isRefrigeracion && (
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-blue-600 font-semibold">{result.sensible.toLocaleString()} BTU/h</p>
                      <p className="text-xs text-blue-500">Carga Sensible</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-amber-600 font-semibold">{result.latent.toLocaleString()} BTU/h</p>
                      <p className="text-xs text-amber-500">Carga Latente</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended Equipment */}
              <div className="card-static p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Equipo Recomendado</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Tipo:</span>
                    <div className="flex gap-1">
                      {allowedEquipment.map(t => (
                        <button key={t} onClick={() => setSelectedType(t)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                            selectedType === t ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {t === 'minisplit' ? 'Minisplit' : t === 'fan-coil' ? 'Fan & Coil' : t === 'paquete' ? 'Paquete' : 'Refrigeración'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-3 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 mb-1 block"><User className="w-3 h-3 inline mr-1" />Cliente</label>
                    <select value={selectedCustomerId ?? ''} onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)} className="input-field text-sm">
                      <option value="">Seleccionar cliente...</option>
                      {customers?.map(c => <option key={c.id} value={c.id}>{c.companyName ? `${c.companyName} - ${c.contactName}` : c.contactName}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommended.map((unit) => {
                    const isExact = unit.btu >= result.btu;
                    const isOversized = unit.btu > result.btu * 1.3;
                    return (
                      <div key={unit.id} className={`relative border rounded-xl p-4 transition-all hover:shadow-sm ${
                        isExact && !isOversized ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200 hover:border-primary-300'
                      }`}>
                        {isExact && !isOversized && (
                          <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Recomendado
                          </span>
                        )}
                        {isOversized && (
                          <span className="absolute top-2 right-2 text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                            Sobredimensionado
                          </span>
                        )}
                        <div className="mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{unit.name}</h4>
                          <p className="text-xs text-gray-500">{unit.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                          <span className="font-medium text-gray-700">{unit.btu.toLocaleString()} BTU</span>
                          <span>·</span>
                          <span>{unit.tons.toFixed(2)} TR</span>
                          <span>·</span>
                          <span>{unit.efficiency}</span>
                          <span>·</span>
                          <span>{unit.kw.toFixed(2)} kW</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-lg font-bold text-primary-600">{formatMoney(unit.price)}</p>
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
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!result && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Calculator className="w-16 h-16 text-gray-200 mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-1">Calcula tu carga térmica</h2>
              <p className="text-gray-400 text-sm max-w-md">
                Ingresa las dimensiones y características del espacio, luego presiona "Calcular Carga Térmica" para ver los equipos recomendados.
              </p>
              <div className="flex items-center gap-6 mt-6 text-xs text-gray-400">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Basado en ASHRAE</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> NOM-020-ENER</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Carga sensible + latente</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
