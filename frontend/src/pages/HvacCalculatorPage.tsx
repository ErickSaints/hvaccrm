import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Calculator, Thermometer, Wind, User, ShoppingCart, Loader2, Sun, Home, DoorOpen,
  Users, Building2, RefrigeratorIcon, Warehouse, UtensilsCrossed, Lightbulb,
  Ruler, Layers, Info, CheckCircle2, Droplets, Fan, Gauge, Pipette,
  Snowflake, Flame, ArrowLeftRight, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

type CalcMode = 'confort' | 'refrigeracion' | 'congelacion' | 'calefaccion' | 'ventilacion' | 'bombeo' | 'intercambiador';
type ClimateZone = 'template' | 'calido' | 'muy-calido' | 'extremo';
type UsageType = 'residencial' | 'comercial' | 'restaurante' | 'industrial';
type InsulationLevel = 'pobre' | 'media' | 'buena' | 'excelente';
type WallMaterial = 'ladrillo' | 'block' | 'panel' | 'concreto';
type RoofType = 'concreto' | 'lamina' | 'teja' | 'terraza';
type GlassType = 'sencillo' | 'doble' | 'polarizado';
type FanType = 'axial' | 'centrifugo' | 'cortina' | 'extractor-techo';
type PumpType = 'linea' | 'centrifuga' | 'multietapa' | 'sumergible';
type HxType = 'placas' | 'tubular';
type HeatingSystem = 'agua-caliente' | 'electrico' | 'bomba-calor';
type FuelType = 'gas-lp' | 'gas-natural' | 'electricidad' | 'diesel' | 'solar';
type ProductType = 'carnes' | 'lacteos' | 'verduras' | 'frutas' | 'precocinados' | 'pescados' | 'helados';
type FreezingType = 'estandar' | 'ultra' | 'iqf';
type EvaporatorType = 'aire-forzado' | 'estatico';
type SpaceType = 'almacen' | 'residencial' | 'oficina' | 'bano' | 'cocina-ligera' | 'cocina-comercial' | 'cocina-industrial' | 'estacionamiento' | 'taller' | 'gimnasio';
type PumpSystem = 'chiller' | 'condensacion' | 'hidroneumatico' | 'calefaccion';
type FluidType = 'agua' | 'glicol-30' | 'glicol-50' | 'agua-condensacion';
type HxFluidPair = 'agua-agua' | 'agua-glicol' | 'agua-refrigerante' | 'vapor-agua' | 'aceite-agua';
type HxMaterial = 'acero-inox' | 'titanio' | 'aleacion-cobre' | 'acero-carbono';

interface Customer { id: number; companyName?: string; contactName: string; }

interface CatalogItem {
  id: string; name: string; category: string;
  spec1: string; spec2: string; spec3: string;
  price: number; description: string;
}

// ─── Calc Mode Config ────────────────────────────────────────────────────────

const CALC_MODES: Record<CalcMode, { label: string; icon: any; desc: string }> = {
  confort: { label: 'Confort (Climatización)', icon: Thermometer, desc: 'Carga térmica para aire acondicionado residencial y comercial' },
  refrigeracion: { label: 'Refrigeración (0°C a 8°C)', icon: RefrigeratorIcon, desc: 'Cámaras de enfriado para carnes, lácteos, verduras' },
  congelacion: { label: 'Congelación (-18°C a -40°C)', icon: Snowflake, desc: 'Cámaras de congelación y ultracongelación' },
  calefaccion: { label: 'Calefacción', icon: Flame, desc: 'Calefacción por agua caliente, eléctrica o bomba de calor' },
  ventilacion: { label: 'Ventilación / Extracción', icon: Wind, desc: 'Extractores axiales, centrífugos, cortinas de aire' },
  bombeo: { label: 'Bombeo', icon: Droplets, desc: 'Bombas para chiller, condensación, hidroneumático' },
  intercambiador: { label: 'Intercambiadores de Calor', icon: Pipette, desc: 'Placas y tubulares para agua, refrigerante y procesos' },
};

// ─── Climate & Insulation ────────────────────────────────────────────────────

const ZONES: Record<ClimateZone, { label: string; temp: number; factor: number }> = {
  template: { label: 'Templado', temp: 25, factor: 0.85 },
  calido: { label: 'Cálido', temp: 32, factor: 1.0 },
  'muy-calido': { label: 'Muy Cálido', temp: 38, factor: 1.25 },
  extremo: { label: 'Extremo', temp: 45, factor: 1.5 },
};

const USAGES: Record<UsageType, { label: string; icon: any; allowedEquipment: string[]; desc: string; ach: number }> = {
  residencial: { label: 'Residencial', icon: Home, allowedEquipment: ['minisplit', 'fan-coil'], desc: 'Casas, departamentos', ach: 6 },
  comercial: { label: 'Comercial / Oficina', icon: Building2, allowedEquipment: ['minisplit', 'fan-coil', 'paquete'], desc: 'Oficinas, tiendas', ach: 8 },
  restaurante: { label: 'Restaurante / Cocina', icon: UtensilsCrossed, allowedEquipment: ['paquete', 'fan-coil'], desc: 'Alta carga térmica', ach: 18 },
  industrial: { label: 'Industrial / Bodega', icon: Warehouse, allowedEquipment: ['paquete'], desc: 'Naves, talleres', ach: 10 },
};

const SPACE_TYPES: Record<SpaceType, { label: string; ach: number; desc: string }> = {
  almacen: { label: 'Almacén', ach: 4, desc: 'Bodegas de baja ocupación' },
  residencial: { label: 'Residencial', ach: 6, desc: 'Casas y departamentos' },
  oficina: { label: 'Oficina', ach: 8, desc: 'Oficinas y salas de juntas' },
  bano: { label: 'Baño público', ach: 12, desc: 'Sanitarios y vestidores' },
  'cocina-ligera': { label: 'Cocina ligera', ach: 15, desc: 'Cocinas residenciales y de oficio' },
  'cocina-comercial': { label: 'Cocina comercial', ach: 20, desc: 'Restaurantes y comedores' },
  'cocina-industrial': { label: 'Cocina industrial', ach: 30, desc: 'Cocinas de alto volumen' },
  estacionamiento: { label: 'Estacionamiento', ach: 6, desc: 'Garajes y sótanos' },
  taller: { label: 'Taller / Nave', ach: 10, desc: 'Talleres de manufactura ligera' },
  gimnasio: { label: 'Gimnasio', ach: 12, desc: 'Áreas de ejercicio y deportes' },
};

const PRODUCT_TYPES: Record<ProductType, { label: string; specificHeat: number; tempRange: string }> = {
  carnes: { label: 'Carnes frescas', specificHeat: 3.5, tempRange: '0°C a 4°C' },
  lacteos: { label: 'Lácteos', specificHeat: 3.8, tempRange: '2°C a 6°C' },
  verduras: { label: 'Verduras y hortalizas', specificHeat: 4.0, tempRange: '4°C a 8°C' },
  frutas: { label: 'Frutas', specificHeat: 3.8, tempRange: '2°C a 8°C' },
  precocinados: { label: 'Precocinados', specificHeat: 3.2, tempRange: '0°C a 4°C' },
  pescados: { label: 'Pescados frescos', specificHeat: 3.6, tempRange: '0°C a 2°C' },
  helados: { label: 'Helados / Congelados', specificHeat: 2.0, tempRange: '-20°C a -25°C' },
};

const FREEZING_TYPES: Record<FreezingType, { label: string; temp: number; desc: string }> = {
  estandar: { label: 'Congelación estándar', temp: -18, desc: '-18°C a -22°C, carnes congeladas, helados' },
  ultra: { label: 'Ultracongelación', temp: -30, desc: '-30°C a -35°C, pescados, mariscos' },
  iqf: { label: 'Congelación IQF', temp: -40, desc: '-40°C, congelación individual rápida' },
};

const INSULATION: Record<InsulationLevel, { label: string; coeff: number; panelMm: number }> = {
  pobre: { label: 'Pobre', coeff: 1.4, panelMm: 50 },
  media: { label: 'Media', coeff: 1.0, panelMm: 80 },
  buena: { label: 'Buena', coeff: 0.8, panelMm: 100 },
  excelente: { label: 'Excelente', coeff: 0.6, panelMm: 150 },
};

const WALL_COEFF: Record<WallMaterial, number> = { ladrillo: 2.0, block: 1.8, panel: 0.8, concreto: 2.5 };
const ROOF_COEFF: Record<RoofType, number> = { concreto: 2.2, lamina: 3.5, teja: 2.8, terraza: 2.0 };
const GLASS_COEFF: Record<GlassType, number> = { sencillo: 5.8, doble: 3.2, polarizado: 2.5 };

const HEATING_SYSTEMS: Record<HeatingSystem, { label: string; efficiency: number; desc: string }> = {
  'agua-caliente': { label: 'Agua caliente (caldera)', efficiency: 0.85, desc: 'Caldera de gas LP o gas natural' },
  electrico: { label: 'Eléctrico (resistencia)', efficiency: 1.0, desc: 'Calefactores eléctricos, resistencia' },
  'bomba-calor': { label: 'Bomba de calor (COP)', efficiency: 3.5, desc: 'Sistema split inverter modo calor' },
};

const FUEL_COSTS: Record<FuelType, { label: string; unit: string; costPerUnit: number; btuPerUnit: number }> = {
  'gas-lp': { label: 'Gas LP', unit: 'kg', costPerUnit: 18, btuPerUnit: 12600 },
  'gas-natural': { label: 'Gas Natural', unit: 'm³', costPerUnit: 11, btuPerUnit: 10200 },
  electricidad: { label: 'Electricidad', unit: 'kWh', costPerUnit: 3.5, btuPerUnit: 3412 },
  diesel: { label: 'Diésel', unit: 'L', costPerUnit: 24, btuPerUnit: 38700 },
  solar: { label: 'Solar térmica', unit: '—', costPerUnit: 0, btuPerUnit: 0 },
};

const EVAPORATOR_TYPES: Record<EvaporatorType, { label: string; factor: number; desc: string }> = {
  'aire-forzado': { label: 'Aire forzado (ventilador)', factor: 1.0, desc: 'Mayor eficiencia, incluye carga de ventiladores' },
  estatico: { label: 'Estático (gravedad)', factor: 0.85, desc: 'Menor eficiencia, sin carga de ventiladores' },
};

const PUMP_SYSTEMS: Record<PumpSystem, { label: string; deltaT_default: number; desc: string }> = {
  chiller: { label: 'Agua helada (chiller)', deltaT_default: 5.5, desc: 'Circuitos cerrados de agua fría' },
  condensacion: { label: 'Agua de condensación', deltaT_default: 5.0, desc: 'Torre de enfriamiento / condensador' },
  hidroneumatico: { label: 'Hidroneumático', deltaT_default: 0, desc: 'Sistemas de presión de agua' },
  calefaccion: { label: 'Agua caliente (calefacción)', deltaT_default: 10, desc: 'Circuitos de radiadores / fan coils' },
};

const FLUID_TYPES: Record<FluidType, { label: string; sg: number; viscFactor: number }> = {
  agua: { label: 'Agua', sg: 1.0, viscFactor: 1.0 },
  'glicol-30': { label: 'Glicol 30%', sg: 1.04, viscFactor: 1.5 },
  'glicol-50': { label: 'Glicol 50%', sg: 1.07, viscFactor: 2.5 },
  'agua-condensacion': { label: 'Agua de condensación', sg: 1.0, viscFactor: 1.2 },
};

const HX_FLUID_PAIRS: Record<HxFluidPair, { label: string; uDefault: number; desc: string }> = {
  'agua-agua': { label: 'Agua - Agua', uDefault: 3000, desc: 'Agua helada / condensación' },
  'agua-glicol': { label: 'Agua/Glicol - Agua', uDefault: 2000, desc: 'Sistemas con glicol' },
  'agua-refrigerante': { label: 'Agua - Refrigerante', uDefault: 1000, desc: 'Condensadores / evaporadores' },
  'vapor-agua': { label: 'Vapor - Agua', uDefault: 2500, desc: 'Calefacción con vapor' },
  'aceite-agua': { label: 'Aceite térmico - Agua', uDefault: 500, desc: 'Procesos industriales' },
};

const HX_MATERIALS: Record<HxMaterial, { label: string; priceFactor: number; desc: string }> = {
  'acero-inox': { label: 'Acero inoxidable 316', priceFactor: 1.0, desc: 'Estándar para alimentos y HVAC' },
  titanio: { label: 'Titanio', priceFactor: 2.8, desc: 'Agua de mar, ambientes corrosivos' },
  'aleacion-cobre': { label: 'Aleación de cobre', priceFactor: 0.9, desc: 'Alta transferencia de calor' },
  'acero-carbono': { label: 'Acero al carbono', priceFactor: 0.6, desc: 'Vapor y aceites térmicos' },
};

// ─── Equipment Catalog (Mexican prices +35% markup) ─────────────────────────

const EQUIPMENT: Record<string, CatalogItem[]> = {
  minisplit: [
    { id: 'ms-05', name: 'Minisplit 1/2 Ton', category: 'minisplit', spec1: '6000 BTU', spec2: '14 SEER', spec3: '0.44 kW', price: 5670, description: 'Habitaciones <10m²' },
    { id: 'ms-075', name: 'Minisplit 3/4 Ton', category: 'minisplit', spec1: '9000 BTU', spec2: '14 SEER', spec3: '0.66 kW', price: 7020, description: 'Habitaciones 10-15m²' },
    { id: 'ms-1', name: 'Minisplit 1 Ton', category: 'minisplit', spec1: '12000 BTU', spec2: '15 SEER', spec3: '0.88 kW', price: 8370, description: 'Recámaras y oficinas' },
    { id: 'ms-15', name: 'Minisplit 1.5 Ton Inverter', category: 'minisplit', spec1: '18000 BTU', spec2: '18 SEER', spec3: '1.10 kW', price: 10530, description: 'Salas 20-30m², inverter ahorrador' },
    { id: 'ms-2', name: 'Minisplit 2 Ton Inverter', category: 'minisplit', spec1: '24000 BTU', spec2: '17 SEER', spec3: '1.47 kW', price: 12420, description: 'Áreas grandes 30-40m²' },
    { id: 'ms-25', name: 'Minisplit 2.5 Ton', category: 'minisplit', spec1: '30000 BTU', spec2: '13 SEER', spec3: '2.20 kW', price: 15930, description: 'Locales comerciales 40-50m²' },
    { id: 'ms-3', name: 'Minisplit 3 Ton Inverter', category: 'minisplit', spec1: '36000 BTU', spec2: '16 SEER', spec3: '2.40 kW', price: 19170, description: 'Grandes espacios 50-60m²' },
    { id: 'ms-4', name: 'Minisplit 4 Ton', category: 'minisplit', spec1: '48000 BTU', spec2: '13 SEER', spec3: '3.52 kW', price: 24975, description: 'Espacios muy grandes 60-80m²' },
  ],
  'fan-coil': [
    { id: 'fc-1', name: 'Fan Coil 1.5 TR', category: 'fan-coil', spec1: '18000 BTU', spec2: 'Chiller 4°C', spec3: '0.45 kW', price: 7020, description: 'Habitaciones de hotel' },
    { id: 'fc-2', name: 'Fan Coil 2 TR', category: 'fan-coil', spec1: '24000 BTU', spec2: 'Chiller 4°C', spec3: '0.60 kW', price: 8775, description: 'Oficinas pequeñas' },
    { id: 'fc-3', name: 'Fan Coil 3 TR', category: 'fan-coil', spec1: '36000 BTU', spec2: 'Chiller 4°C', spec3: '0.90 kW', price: 11070, description: 'Salones / Aulas' },
    { id: 'fc-4', name: 'Fan Coil 4 TR', category: 'fan-coil', spec1: '48000 BTU', spec2: 'Chiller 4°C', spec3: '1.20 kW', price: 14175, description: 'Salas de juntas grandes' },
    { id: 'fc-5', name: 'Fan Coil 5 TR', category: 'fan-coil', spec1: '60000 BTU', spec2: 'Chiller 4°C', spec3: '1.50 kW', price: 18225, description: 'Restaurantes / Salones' },
    { id: 'fc-8', name: 'Fan Coil 8 TR', category: 'fan-coil', spec1: '96000 BTU', spec2: 'Chiller 4°C', spec3: '2.40 kW', price: 26730, description: 'Grandes espacios comerciales' },
  ],
  paquete: [
    { id: 'pk-3', name: 'Equipo Paquete 3 Ton', category: 'paquete', spec1: '36000 BTU', spec2: '11 EER', spec3: '3.27 kW', price: 29700, description: 'Pequeños comercios' },
    { id: 'pk-5', name: 'Equipo Paquete 5 Ton', category: 'paquete', spec1: '60000 BTU', spec2: '11.5 EER', spec3: '5.22 kW', price: 47250, description: 'Oficinas / Locales' },
    { id: 'pk-75', name: 'Equipo Paquete 7.5 Ton', category: 'paquete', spec1: '90000 BTU', spec2: '11 EER', spec3: '8.18 kW', price: 64800, description: 'Restaurantes / Salones' },
    { id: 'pk-10', name: 'Equipo Paquete 10 Ton', category: 'paquete', spec1: '120000 BTU', spec2: '11.5 EER', spec3: '10.43 kW', price: 87750, description: 'Naves / Edificios' },
    { id: 'pk-125', name: 'Equipo Paquete 12.5 Ton', category: 'paquete', spec1: '150000 BTU', spec2: '11 EER', spec3: '13.64 kW', price: 105975, description: 'Edificios medianos' },
    { id: 'pk-15', name: 'Equipo Paquete 15 Ton', category: 'paquete', spec1: '180000 BTU', spec2: '11 EER', spec3: '16.36 kW', price: 124200, description: 'Grandes instalaciones' },
    { id: 'pk-20', name: 'Equipo Paquete 20 Ton', category: 'paquete', spec1: '240000 BTU', spec2: '11.5 EER', spec3: '20.87 kW', price: 168750, description: 'Naves industriales' },
  ],
  refrigeracion: [
    { id: 'rf-025', name: 'Condensadora 1/4HP + Evaporador', category: 'refrigeracion', spec1: '2000 BTU', spec2: 'R-404A', spec3: '0.25 kW', price: 11475, description: 'Cámaras <5m³ enfriado' },
    { id: 'rf-05', name: 'Condensadora 1/2HP + Evaporador', category: 'refrigeracion', spec1: '4000 BTU', spec2: 'R-404A', spec3: '0.45 kW', price: 16875, description: 'Cámaras 5-10m³ enfriado' },
    { id: 'rf-075', name: 'Condensadora 3/4HP + Evaporador', category: 'refrigeracion', spec1: '6000 BTU', spec2: 'R-404A', spec3: '0.65 kW', price: 22275, description: 'Cámaras 10-15m³ enfriado' },
    { id: 'rf-1', name: 'Condensadora 1HP + Evaporador', category: 'refrigeracion', spec1: '8000 BTU', spec2: 'R-404A', spec3: '0.85 kW', price: 28350, description: 'Cámaras 15-25m³ enfriado / 5-10m³ congelación' },
    { id: 'rf-15', name: 'Condensadora 1.5HP + Evaporador', category: 'refrigeracion', spec1: '12000 BTU', spec2: 'R-404A', spec3: '1.25 kW', price: 37800, description: 'Cámaras 25-35m³ enfriado' },
    { id: 'rf-2', name: 'Condensadora 2HP + Evaporador', category: 'refrigeracion', spec1: '16000 BTU', spec2: 'R-404A/R-507', spec3: '1.65 kW', price: 47250, description: 'Cámaras 35-50m³ enfriado' },
    { id: 'rf-3', name: 'Condensadora 3HP + Evaporador', category: 'refrigeracion', spec1: '24000 BTU', spec2: 'R-404A/R-507', spec3: '2.45 kW', price: 60750, description: 'Cámaras 50-70m³ enfriado' },
    { id: 'rf-5', name: 'Condensadora 5HP + Evaporador', category: 'refrigeracion', spec1: '40000 BTU', spec2: 'R-507', spec3: '4.1 kW', price: 87750, description: 'Cámaras 70-120m³ enfriado' },
    { id: 'rf-75', name: 'Condensadora 7.5HP + Evaporador', category: 'refrigeracion', spec1: '60000 BTU', spec2: 'R-507', spec3: '6.1 kW', price: 118800, description: 'Cámaras >120m³ enfriado' },
  ],
  congelacion: [
    { id: 'cf-05', name: 'Unidad Congelación 1/2HP', category: 'congelacion', spec1: '3500 BTU', spec2: 'R-404A', spec3: '0.45 kW', price: 18900, description: 'Cámaras <5m³ congelación' },
    { id: 'cf-1', name: 'Unidad Congelación 1HP', category: 'congelacion', spec1: '7000 BTU', spec2: 'R-404A', spec3: '0.85 kW', price: 32400, description: 'Cámaras 5-10m³ congelación' },
    { id: 'cf-15', name: 'Unidad Congelación 1.5HP', category: 'congelacion', spec1: '10500 BTU', spec2: 'R-404A', spec3: '1.25 kW', price: 43200, description: 'Cámaras 10-15m³ congelación' },
    { id: 'cf-2', name: 'Unidad Congelación 2HP', category: 'congelacion', spec1: '14000 BTU', spec2: 'R-507', spec3: '1.65 kW', price: 54000, description: 'Cámaras 15-25m³ congelación' },
    { id: 'cf-3', name: 'Unidad Congelación 3HP', category: 'congelacion', spec1: '21000 BTU', spec2: 'R-507', spec3: '2.45 kW', price: 70200, description: 'Cámaras 25-40m³ congelación' },
    { id: 'cf-5', name: 'Unidad Congelación 5HP', category: 'congelacion', spec1: '35000 BTU', spec2: 'R-507', spec3: '4.1 kW', price: 94500, description: 'Cámaras 40-70m³ congelación' },
    { id: 'cf-75', name: 'Unidad Congelación 7.5HP', category: 'congelacion', spec1: '52500 BTU', spec2: 'R-507', spec3: '6.1 kW', price: 135000, description: 'Cámaras 70-100m³ congelación' },
    { id: 'cf-10', name: 'Unidad Congelación 10HP', category: 'congelacion', spec1: '70000 BTU', spec2: 'R-507/NH3', spec3: '8.2 kW', price: 175500, description: 'Cámaras >100m³ congelación' },
  ],
  calefaccion: [
    { id: 'cal-05', name: 'Calefactor Eléctrico 5kW', category: 'calefaccion', spec1: '17000 BTU', spec2: '5 kW', spec3: '220V', price: 2700, description: 'Habitaciones <20m²' },
    { id: 'cal-10', name: 'Calefactor Eléctrico 10kW', category: 'calefaccion', spec1: '34000 BTU', spec2: '10 kW', spec3: '220V', price: 4725, description: 'Áreas 20-40m²' },
    { id: 'cal-15', name: 'Calefactor Eléctrico 15kW', category: 'calefaccion', spec1: '51000 BTU', spec2: '15 kW', spec3: '220V/3F', price: 6750, description: 'Áreas 40-60m²' },
    { id: 'cal-20', name: 'Calefactor Eléctrico 20kW', category: 'calefaccion', spec1: '68000 BTU', spec2: '20 kW', spec3: '220V/3F', price: 9450, description: 'Áreas 60-80m²' },
    { id: 'cal-bc-1', name: 'Bomba de Calor 1TR', category: 'calefaccion', spec1: '12000 BTU', spec2: 'COP 3.5', spec3: '1.0 kW', price: 14850, description: 'Habitaciones <30m²' },
    { id: 'cal-bc-15', name: 'Bomba de Calor 1.5TR', category: 'calefaccion', spec1: '18000 BTU', spec2: 'COP 3.5', spec3: '1.5 kW', price: 20250, description: 'Áreas 30-50m²' },
    { id: 'cal-bc-2', name: 'Bomba de Calor 2TR', category: 'calefaccion', spec1: '24000 BTU', spec2: 'COP 3.5', spec3: '2.0 kW', price: 25650, description: 'Áreas 50-70m²' },
    { id: 'cal-bc-3', name: 'Bomba de Calor 3TR', category: 'calefaccion', spec1: '36000 BTU', spec2: 'COP 3.5', spec3: '3.0 kW', price: 35100, description: 'Áreas 70-100m²' },
    { id: 'cal-bc-5', name: 'Bomba de Calor 5TR', category: 'calefaccion', spec1: '60000 BTU', spec2: 'COP 3.2', spec3: '5.5 kW', price: 54000, description: 'Áreas grandes >100m²' },
    { id: 'cal-rad-1', name: 'Radiador Agua Caliente 1 panel', category: 'calefaccion', spec1: '4000 BTU', spec2: 'Agua 70°C', spec3: '0.5 m', price: 1350, description: 'Habitaciones pequeñas' },
    { id: 'cal-rad-2', name: 'Radiador Agua Caliente 2 paneles', category: 'calefaccion', spec1: '7000 BTU', spec2: 'Agua 70°C', spec3: '1.0 m', price: 2160, description: 'Habitaciones medianas' },
    { id: 'cal-rad-3', name: 'Radiador Agua Caliente 3 paneles', category: 'calefaccion', spec1: '10000 BTU', spec2: 'Agua 70°C', spec3: '1.5 m', price: 3240, description: 'Salas y oficinas' },
  ],
  'bomba-linea': [
    { id: 'bl-05', name: 'Bomba en Línea 0.5 HP', category: 'bomba-linea', spec1: '20 GPM', spec2: '10 m', spec3: '0.37 kW', price: 5400, description: 'Circuitos pequeños agua helada' },
    { id: 'bl-1', name: 'Bomba en Línea 1 HP', category: 'bomba-linea', spec1: '40 GPM', spec2: '15 m', spec3: '0.75 kW', price: 8100, description: 'Circuitos medianos' },
    { id: 'bl-2', name: 'Bomba en Línea 2 HP', category: 'bomba-linea', spec1: '80 GPM', spec2: '18 m', spec3: '1.50 kW', price: 12150, description: 'Circuitos grandes' },
    { id: 'bl-3', name: 'Bomba en Línea 3 HP', category: 'bomba-linea', spec1: '120 GPM', spec2: '22 m', spec3: '2.20 kW', price: 17550, description: 'Circuitos principales' },
    { id: 'bl-5', name: 'Bomba en Línea 5 HP', category: 'bomba-linea', spec1: '200 GPM', spec2: '25 m', spec3: '3.73 kW', price: 25650, description: 'Chillers >30 TR' },
    { id: 'bl-75', name: 'Bomba en Línea 7.5 HP', category: 'bomba-linea', spec1: '300 GPM', spec2: '30 m', spec3: '5.60 kW', price: 36450, description: 'Chillers >50 TR' },
    { id: 'bl-10', name: 'Bomba en Línea 10 HP', category: 'bomba-linea', spec1: '400 GPM', spec2: '35 m', spec3: '7.46 kW', price: 48600, description: 'Chillers >80 TR' },
    { id: 'bl-15', name: 'Bomba en Línea 15 HP', category: 'bomba-linea', spec1: '600 GPM', spec2: '38 m', spec3: '11.2 kW', price: 67500, description: 'Chillers >120 TR' },
  ],
  'bomba-centrifuga': [
    { id: 'bc-2', name: 'Bomba Centrífuga 2 HP', category: 'bomba-centrifuga', spec1: '100 GPM', spec2: '20 m', spec3: '1.50 kW', price: 14850, description: 'Agua de condensación' },
    { id: 'bc-3', name: 'Bomba Centrífuga 3 HP', category: 'bomba-centrifuga', spec1: '150 GPM', spec2: '25 m', spec3: '2.20 kW', price: 20250, description: 'Torres de enfriamiento' },
    { id: 'bc-5', name: 'Bomba Centrífuga 5 HP', category: 'bomba-centrifuga', spec1: '250 GPM', spec2: '30 m', spec3: '3.73 kW', price: 29700, description: 'Circuitos principales' },
    { id: 'bc-75', name: 'Bomba Centrífuga 7.5 HP', category: 'bomba-centrifuga', spec1: '400 GPM', spec2: '32 m', spec3: '5.60 kW', price: 40500, description: 'Chillers medianos' },
    { id: 'bc-10', name: 'Bomba Centrífuga 10 HP', category: 'bomba-centrifuga', spec1: '500 GPM', spec2: '35 m', spec3: '7.46 kW', price: 54000, description: 'Chillers grandes' },
    { id: 'bc-15', name: 'Bomba Centrífuga 15 HP', category: 'bomba-centrifuga', spec1: '800 GPM', spec2: '40 m', spec3: '11.2 kW', price: 74250, description: 'Sistemas centrales' },
    { id: 'bc-20', name: 'Bomba Centrífuga 20 HP', category: 'bomba-centrifuga', spec1: '1000 GPM', spec2: '45 m', spec3: '14.9 kW', price: 94500, description: 'Grandes instalaciones' },
    { id: 'bc-30', name: 'Bomba Centrífuga 30 HP', category: 'bomba-centrifuga', spec1: '1500 GPM', spec2: '50 m', spec3: '22.4 kW', price: 135000, description: 'Sistemas industriales' },
  ],
  'bomba-multietapa': [
    { id: 'bm-1', name: 'Bomba Multietapa 1 HP', category: 'bomba-multietapa', spec1: '15 GPM', spec2: '60 m', spec3: '0.75 kW', price: 16200, description: 'Agua de caldera / presión' },
    { id: 'bm-2', name: 'Bomba Multietapa 2 HP', category: 'bomba-multietapa', spec1: '25 GPM', spec2: '80 m', spec3: '1.50 kW', price: 22950, description: 'Sistemas de alta presión' },
    { id: 'bm-3', name: 'Bomba Multietapa 3 HP', category: 'bomba-multietapa', spec1: '35 GPM', spec2: '100 m', spec3: '2.20 kW', price: 32400, description: 'Agua de condensado' },
    { id: 'bm-5', name: 'Bomba Multietapa 5 HP', category: 'bomba-multietapa', spec1: '50 GPM', spec2: '120 m', spec3: '3.73 kW', price: 43200, description: 'Sistemas hidroneumáticos' },
  ],
  'extractor-axial': [
    { id: 'ea-12', name: 'Extractor Axial 12"', category: 'extractor-axial', spec1: '1200 CFM', spec2: '0.12" SP', spec3: '0.09 kW', price: 2430, description: 'Baños / Cuartos pequeños' },
    { id: 'ea-16', name: 'Extractor Axial 16"', category: 'extractor-axial', spec1: '2200 CFM', spec2: '0.18" SP', spec3: '0.18 kW', price: 3375, description: 'Baños públicos / Vestidores' },
    { id: 'ea-20', name: 'Extractor Axial 20"', category: 'extractor-axial', spec1: '3500 CFM', spec2: '0.25" SP', spec3: '0.37 kW', price: 4725, description: 'Cocinas pequeñas' },
    { id: 'ea-24', name: 'Extractor Axial 24"', category: 'extractor-axial', spec1: '5200 CFM', spec2: '0.30" SP', spec3: '0.56 kW', price: 6480, description: 'Cocinas / Talleres' },
    { id: 'ea-30', name: 'Extractor Axial 30"', category: 'extractor-axial', spec1: '8500 CFM', spec2: '0.35" SP', spec3: '0.75 kW', price: 8775, description: 'Naves / Bodegas' },
    { id: 'ea-36', name: 'Extractor Axial 36"', category: 'extractor-axial', spec1: '12000 CFM', spec2: '0.40" SP', spec3: '1.12 kW', price: 12150, description: 'Naves industriales' },
    { id: 'ea-48', name: 'Extractor Axial 48"', category: 'extractor-axial', spec1: '22000 CFM', spec2: '0.50" SP', spec3: '2.25 kW', price: 18900, description: 'Grandes naves' },
  ],
  'extractor-centrifugo': [
    { id: 'ec-10', name: 'Extractor Centrífugo 10"', category: 'extractor-centrifugo', spec1: '800 CFM', spec2: '0.75" SP', spec3: '0.18 kW', price: 5400, description: 'Cocinas / Conductos largos' },
    { id: 'ec-12', name: 'Extractor Centrífugo 12"', category: 'extractor-centrifugo', spec1: '1400 CFM', spec2: '1.0" SP', spec3: '0.37 kW', price: 7425, description: 'Cocinas comerciales' },
    { id: 'ec-15', name: 'Extractor Centrífugo 15"', category: 'extractor-centrifugo', spec1: '2500 CFM', spec2: '1.25" SP', spec3: '0.75 kW', price: 10800, description: 'Restaurantes' },
    { id: 'ec-18', name: 'Extractor Centrífugo 18"', category: 'extractor-centrifugo', spec1: '4000 CFM', spec2: '1.5" SP', spec3: '1.12 kW', price: 14850, description: 'Cocinas industriales' },
    { id: 'ec-24', name: 'Extractor Centrífugo 24"', category: 'extractor-centrifugo', spec1: '8000 CFM', spec2: '2.0" SP', spec3: '2.25 kW', price: 22950, description: 'Extracción industrial' },
    { id: 'ec-30', name: 'Extractor Centrífugo 30"', category: 'extractor-centrifugo', spec1: '14000 CFM', spec2: '2.5" SP', spec3: '4.50 kW', price: 35100, description: 'Grandes industrias' },
  ],
  'cortina-aire': [
    { id: 'ca-1m', name: 'Cortina de Aire 1m', category: 'cortina-aire', spec1: '800 CFM', spec2: '3 m/s', spec3: '0.09 kW', price: 4050, description: 'Puertas pequeñas <1m' },
    { id: 'ca-15m', name: 'Cortina de Aire 1.5m', category: 'cortina-aire', spec1: '1200 CFM', spec2: '4 m/s', spec3: '0.18 kW', price: 5670, description: 'Puertas estándar' },
    { id: 'ca-2m', name: 'Cortina de Aire 2m', category: 'cortina-aire', spec1: '1800 CFM', spec2: '5 m/s', spec3: '0.37 kW', price: 7425, description: 'Puertas grandes' },
    { id: 'ca-3m', name: 'Cortina de Aire 3m', category: 'cortina-aire', spec1: '2800 CFM', spec2: '6 m/s', spec3: '0.56 kW', price: 10800, description: 'Accesos vehiculares' },
  ],
  'hx-placas': [
    { id: 'hxp-10', name: 'Intercambiador Placas 10 Placas', category: 'hx-placas', spec1: '50000 BTU/h', spec2: '0.5 m²', spec3: 'DN25', price: 6750, description: 'Aplicaciones ligeras' },
    { id: 'hxp-20', name: 'Intercambiador Placas 20 Placas', category: 'hx-placas', spec1: '120000 BTU/h', spec2: '1.2 m²', spec3: 'DN40', price: 10800, description: 'Chillers pequeños' },
    { id: 'hxp-30', name: 'Intercambiador Placas 30 Placas', category: 'hx-placas', spec1: '240000 BTU/h', spec2: '2.5 m²', spec3: 'DN50', price: 16200, description: 'Chillers medianos' },
    { id: 'hxp-50', name: 'Intercambiador Placas 50 Placas', category: 'hx-placas', spec1: '500000 BTU/h', spec2: '5.0 m²', spec3: 'DN65', price: 25650, description: 'Chillers grandes' },
    { id: 'hxp-80', name: 'Intercambiador Placas 80 Placas', category: 'hx-placas', spec1: '1000000 BTU/h', spec2: '10 m²', spec3: 'DN80', price: 40500, description: 'Sistemas centrales' },
    { id: 'hxp-120', name: 'Intercambiador Placas 120 Placas', category: 'hx-placas', spec1: '2000000 BTU/h', spec2: '20 m²', spec3: 'DN100', price: 67500, description: 'Grandes instalaciones' },
  ],
  'hx-tubular': [
    { id: 'hxt-05', name: 'Intercambiador Tubular 2"×1.5m', category: 'hx-tubular', spec1: '30000 BTU/h', spec2: '0.3 m²', spec3: '2"', price: 5400, description: 'Aplicaciones pequeñas' },
    { id: 'hxt-1', name: 'Intercambiador Tubular 3"×2m', category: 'hx-tubular', spec1: '80000 BTU/h', spec2: '0.8 m²', spec3: '3"', price: 9450, description: 'Calefacción / ACS' },
    { id: 'hxt-2', name: 'Intercambiador Tubular 4"×3m', category: 'hx-tubular', spec1: '200000 BTU/h', spec2: '2.0 m²', spec3: '4"', price: 16200, description: 'Procesos industriales' },
    { id: 'hxt-3', name: 'Intercambiador Tubular 6"×4m', category: 'hx-tubular', spec1: '500000 BTU/h', spec2: '5.0 m²', spec3: '6"', price: 28350, description: 'Calderas / Procesos' },
  ],
  ventilador: [
    { id: 'vn-300', name: 'Ventilador Industrial 300mm', category: 'ventilador', spec1: '3000 CFM', spec2: '0.15" SP', spec3: '0.18 kW', price: 2700, description: 'Ventilación general' },
    { id: 'vn-450', name: 'Ventilador Industrial 450mm', category: 'ventilador', spec1: '6500 CFM', spec2: '0.20" SP', spec3: '0.37 kW', price: 4050, description: 'Talleres / Naves pequeñas' },
    { id: 'vn-600', name: 'Ventilador Industrial 600mm', category: 'ventilador', spec1: '12000 CFM', spec2: '0.25" SP', spec3: '0.75 kW', price: 6480, description: 'Naves medianas' },
    { id: 'vn-750', name: 'Ventilador Industrial 750mm', category: 'ventilador', spec1: '20000 CFM', spec2: '0.30" SP', spec3: '1.50 kW', price: 10800, description: 'Grandes naves' },
  ],
};

// ─── Calculation Functions ───────────────────────────────────────────────────

function calcComfort(values: Record<string, number>): { btu: number; tons: number; kw: number; sensible: number; latent: number; details: { label: string; value: number; unit: string }[] } {
  const L = values.length || 5, W = values.width || 4, H = values.height || 2.5;
  const area = L * W, volume = L * W * H, perimeter = 2 * (L + W);
  const zoneTemp = values.zoneTemp || 32, zoneFactor = values.zoneFactor || 1.0;
  const people = values.people || 2, windows = values.windows || 2, doors = values.doors || 1;
  const insCoeff = values.insCoeff || 1.0, wallU = values.wallU || 1.8, roofU = values.roofU || 2.2;
  const glassU = values.glassU || 5.8, hasSolar = values.hasSolarControl ? 0.7 : 1.0;
  const eqLoad = values.equipmentLoad || 0, usageMult = values.usageMult || 1.0;
  const isRest = values.usageMult === 1.3;
  const forcedAch = values.ach || 0;

  const wallArea = perimeter * H * 0.6, roofArea = area, glassArea = windows * 1.5, doorArea = doors * 2;
  const deltaT = Math.max(zoneTemp - 24, 5), solarFactor = hasSolar;

  const wallLoad = wallArea * wallU * deltaT * 3.412;
  const roofLoad = roofArea * roofU * deltaT * 3.412 * 1.2;
  const glassLoad = glassArea * glassU * deltaT * 3.412 * solarFactor;
  const doorLoad = doorArea * 3.5 * deltaT * 3.412;
  const peopleSensible = people * 600 * (isRest ? 1.3 : usageMult);
  const peopleLatent = people * 400 * (isRest ? 1.3 : usageMult);
  const lightingLoad = area * 75 * 3.412;
  const equipLoad = eqLoad > 0 ? eqLoad * 3.412 : area * 100 * 3.412 * 0.5;
  const airChanges = forcedAch > 0 ? forcedAch : (doors > 2 ? 1.5 : doors > 0 ? 0.8 : 0.5);
  const infiltration = volume * airChanges * deltaT * 1.08;
  const solarLoad = glassArea * 180 * 3.412 * solarFactor * (zoneFactor > 1 ? 1.2 : 1.0);

  const sensible = wallLoad + roofLoad + glassLoad + doorLoad + peopleSensible + lightingLoad + equipLoad + infiltration + solarLoad;
  const latent = peopleLatent + volume * 0.5 * deltaT * 0.5;
  const total = sensible + latent;

  return {
    btu: Math.round(total), tons: Math.round(total / 12000 * 100) / 100, kw: Math.round(total / 3412 * 100) / 100,
    sensible: Math.round(sensible), latent: Math.round(latent),
    details: [
      { label: 'Muros y techos', value: Math.round(wallLoad + roofLoad), unit: 'BTU/h' },
      { label: 'Ventanas y puertas', value: Math.round(glassLoad + doorLoad), unit: 'BTU/h' },
      { label: 'Personas (sensible)', value: Math.round(peopleSensible), unit: 'BTU/h' },
      { label: 'Personas (latente)', value: Math.round(peopleLatent), unit: 'BTU/h' },
      { label: 'Iluminación', value: Math.round(lightingLoad), unit: 'BTU/h' },
      { label: 'Equipos eléctricos', value: Math.round(equipLoad), unit: 'BTU/h' },
      { label: 'Infiltración de aire', value: Math.round(infiltration), unit: 'BTU/h' },
      { label: 'Radiación solar', value: Math.round(solarLoad), unit: 'BTU/h' },
    ],
  };
}

function calcChamberLoad(values: Record<string, number>): { btu: number; tons: number; kw: number; sensible: number; latent: number; details: { label: string; value: number; unit: string }[] } {
  const L = values.length || 5, W = values.width || 4, H = values.height || 2.5;
  const volume = L * W * H, surfaceArea = 2 * (L * W + L * H + W * H);
  const chamberTemp = values.chamberTemp || 4;
  const zoneTemp = values.zoneTemp || 32;
  const deltaT = Math.abs(zoneTemp - chamberTemp);
  const insCoeff = values.insCoeff || 0.8;
  const productMass = values.productMass || 500;
  const doorOpenings = values.doorOpenings || 10;
  const hasDefrost = values.hasDefrost || 1;
  const people = values.people || 1;
  const evapFactor = values.evapFactor || 1.0;
  const specificHeat = values.specificHeat || 3.5;
  const isFreezing = chamberTemp < -10;

  const uValue = 0.28 * insCoeff;
  const transmission = surfaceArea * uValue * deltaT * 1.1 * 3.412;
  const productLoadW = productMass > 0 ? (productMass * specificHeat * deltaT * 1000) / (24 * 3600) : 0;
  const productLoad = productLoadW * 3.412;
  const infiltration = doorOpenings * 0.3 * 2.0 * deltaT * 8 * 3.412 * (isFreezing ? 1.5 : 1.0);
  const internal = ((people * 150) + (L * W * 10)) * 3.412 * 0.8;
  const defrost = hasDefrost ? transmission * (isFreezing ? 0.2 : 0.15) : 0;
  const fanLoad = volume * 2 * 3.412 * evapFactor;
  const safety = isFreezing ? 1.2 : 1.15;
  const total = (transmission + productLoad + infiltration + internal + defrost + fanLoad) * safety;

  return {
    btu: Math.round(total), tons: Math.round(total / 12000 * 100) / 100, kw: Math.round(total / 3412 * 100) / 100,
    sensible: Math.round(transmission + productLoad + infiltration + defrost + fanLoad), latent: 0,
    details: [
      { label: 'Transmisión (muros/techo/piso)', value: Math.round(transmission), unit: 'BTU/h' },
      { label: `Carga del producto (${isFreezing ? 'congelación' : 'enfriado'})`, value: Math.round(productLoad), unit: 'BTU/h' },
      { label: 'Infiltración (apertura puertas)', value: Math.round(infiltration), unit: 'BTU/h' },
      { label: 'Cargas internas (personas+luces)', value: Math.round(internal), unit: 'BTU/h' },
      { label: 'Ventiladores evaporador', value: Math.round(fanLoad), unit: 'BTU/h' },
      ...(hasDefrost ? [{ label: 'Descongelación', value: Math.round(defrost), unit: 'BTU/h' }] : []),
    ],
  };
}

function calcHeating(values: Record<string, number>): {
  btu: number; kw: number; tons: number;
  systemEfficiency: number; fuelConsumption: number; fuelUnit: string;
  monthlyCost: number; annualCost: number;
  details: { label: string; value: number; unit: string }[];
} {
  const L = values.length || 5, W = values.width || 4, H = values.height || 2.5;
  const area = L * W, volume = L * W * H, perimeter = 2 * (L + W);
  const outdoorTemp = values.outdoorTemp || 10;
  const indoorTemp = values.indoorTemp || 22;
  const deltaT = Math.max(indoorTemp - outdoorTemp, 5);
  const insCoeff = values.insCoeff || 1.0;
  const wallU = values.wallU || 1.8;
  const roofU = values.roofU || 2.2;
  const glassU = values.glassU || 5.8;
  const windows = values.windows || 2;
  const doors = values.doors || 1;
  const ach = values.ach || 0.5;
  const systemEff = values.systemEfficiency || 1.0;
  const fuelBtuPerUnit = values.fuelBtuPerUnit || 3412;
  const fuelCostPerUnit = values.fuelCostPerUnit || 3.5;

  const wallArea = perimeter * H * 0.6;
  const roofArea = area;
  const glassArea = windows * 1.5;
  const doorArea = doors * 2;

  const wallLoss = wallArea * wallU * deltaT * 3.412;
  const roofLoss = roofArea * roofU * deltaT * 3.412 * 1.2;
  const glassLoss = glassArea * glassU * deltaT * 3.412;
  const doorLoss = doorArea * 3.5 * deltaT * 3.412;
  const infiltrationLoss = volume * ach * deltaT * 1.08;
  const totalLoss = wallLoss + roofLoss + glassLoss + doorLoss + infiltrationLoss;
  const adjustedLoss = totalLoss / systemEff;

  const fuelConsumption = fuelBtuPerUnit > 0 ? adjustedLoss / fuelBtuPerUnit : 0;
  const monthlyCost = fuelConsumption * fuelCostPerUnit * 0.4;
  const annualCost = monthlyCost * 5;

  return {
    btu: Math.round(adjustedLoss), kw: Math.round(adjustedLoss / 3412 * 100) / 100,
    tons: Math.round(adjustedLoss / 12000 * 100) / 100,
    systemEfficiency: Math.round(systemEff * 100),
    fuelConsumption: Math.round(fuelConsumption * 100) / 100,
    fuelUnit: fuelBtuPerUnit === 3412 ? 'kWh' : fuelBtuPerUnit === 12600 ? 'kg' : fuelBtuPerUnit === 10200 ? 'm³' : fuelBtuPerUnit === 38700 ? 'L' : 'unidades',
    monthlyCost: Math.round(monthlyCost),
    annualCost: Math.round(annualCost),
    details: [
      { label: 'Pérdida por muros', value: Math.round(wallLoss), unit: 'BTU/h' },
      { label: 'Pérdida por techo', value: Math.round(roofLoss), unit: 'BTU/h' },
      { label: 'Pérdida por ventanas', value: Math.round(glassLoss), unit: 'BTU/h' },
      { label: 'Pérdida por puertas', value: Math.round(doorLoss), unit: 'BTU/h' },
      { label: 'Infiltración de aire', value: Math.round(infiltrationLoss), unit: 'BTU/h' },
      { label: 'Pérdida total (sin eficiencia)', value: Math.round(totalLoss), unit: 'BTU/h' },
      { label: 'Factor de eficiencia del sistema', value: Math.round(systemEff * 100), unit: '%' },
      { label: 'Consumo estimado mensual', value: Math.round(fuelConsumption * 0.4), unit: fuelBtuPerUnit === 3412 ? 'kWh' : fuelBtuPerUnit === 12600 ? 'kg' : fuelBtuPerUnit === 10200 ? 'm³' : 'L' },
      { label: 'Costo estimado mensual', value: Math.round(monthlyCost), unit: 'MXN' },
      { label: 'Costo estimado temporada (5 meses)', value: Math.round(annualCost), unit: 'MXN' },
    ],
  };
}

function calcPump(values: Record<string, number>): {
  gpm: number; lps: number; head: number; hp: number; kw: number;
  pipeSize: string; velocity: number; pumpType: string;
  details: { label: string; value: number; unit: string }[];
} {
  const chillerTons = values.chillerTons || 10;
  const deltaT = values.deltaTC || 5.5;
  const pipeLength = values.pipeLength || 50;
  const elevation = values.elevation || 5;
  const fittings = values.fittings || 8;
  const sg = values.specificGravity || 1.0;
  const useDirectFlow = values.directGpm && values.directGpm > 0;

  let gpm: number;
  if (useDirectFlow) {
    gpm = values.directGpm;
  } else {
    const deltaTF = deltaT * 1.8;
    gpm = Math.round((chillerTons * 12000) / (500 * deltaTF) * 10) / 10;
  }
  const lps = Math.round(gpm * 0.06309 * 100) / 100;

  const flowM3s = gpm * 0.00006309;
  const pipeDiameterM = Math.sqrt((4 * flowM3s) / (Math.PI * 2.0));
  const pipeDiameterIn = pipeDiameterM * 39.37;
  const stdPipeSize = [1, 1.25, 1.5, 2, 2.5, 3, 4, 6, 8, 10].find(s => s >= pipeDiameterIn) || 10;
  const actualArea = Math.PI * Math.pow(stdPipeSize * 0.0254 / 2, 2);
  const velocity = flowM3s / actualArea;

  const frictionLoss = 0.02 * (pipeLength / (stdPipeSize * 0.0254)) * (Math.pow(velocity, 2) / (2 * 9.81)) * (sg > 1 ? sg * 1.2 : 1.0);
  const fittingLoss = fittings * 0.3;
  const totalHead = Math.round((frictionLoss + fittingLoss + elevation) * 10) / 10;

  const headFt = totalHead * 3.281;
  const bhp = (gpm * headFt * sg) / (3960 * 0.75);
  const hp = Math.round(bhp * 10) / 10;
  const kw = Math.round(hp * 0.746 * 10) / 10;

  let pumpType = 'Bomba en línea';
  if (totalHead > 20) pumpType = 'Bomba centrífuga';
  if (totalHead > 40) pumpType = 'Bomba multietapa';
  if (gpm > 200) pumpType = 'Bomba centrífuga';

  return {
    gpm, lps, head: totalHead, hp, kw,
    pipeSize: `${stdPipeSize}"`,
    velocity: Math.round(velocity * 100) / 100,
    pumpType,
    details: [
      { label: 'Caudal requerido', value: gpm, unit: 'GPM' },
      { label: 'Caudal (SI)', value: lps, unit: 'L/s' },
      { label: 'Diámetro tubería recomendado', value: stdPipeSize, unit: 'pulg' },
      { label: 'Velocidad del flujo', value: Math.round(velocity * 100) / 100, unit: 'm/s' },
      { label: 'Pérdida por fricción', value: Math.round(frictionLoss * 10) / 10, unit: 'm' },
      { label: 'Pérdida por accesorios', value: Math.round(fittingLoss * 10) / 10, unit: 'm' },
      { label: 'Altura de elevación', value: elevation, unit: 'm' },
      { label: 'Altura dinámica total', value: totalHead, unit: 'mca' },
      { label: 'Tipo recomendado', value: 0, unit: pumpType },
      { label: 'Potencia hidráulica', value: hp, unit: 'HP' },
      { label: 'Potencia eléctrica', value: kw, unit: 'kW' },
    ],
  };
}

function calcVentilation(values: Record<string, number>): {
  cfm: number; m3h: number; sp: number; hp: number; kw: number;
  fanType: string; ach: number;
  details: { label: string; value: number; unit: string }[];
} {
  const L = values.length || 10, W = values.width || 8, H = values.height || 3;
  const volume = L * W * H;
  const ach = values.ach || 8;
  const ductLength = values.ductLength || 10;
  const ductFittings = values.ductFittings || 4;
  const useCortina = values.useCortina ? 1 : 0;
  const doorWidth = values.doorWidth || 1.5;
  const doorHeight = values.doorHeight || 2.5;

  let cfm: number;
  if (useCortina) {
    const doorArea = doorWidth * doorHeight;
    cfm = Math.round(doorArea * 400);
  } else {
    cfm = Math.round((volume * ach) / 60);
  }
  const m3h = Math.round(cfm * 1.699);

  const ductLoss = 0.08 * ductLength * (useCortina ? 0.3 : 1.0);
  const fittingLoss = ductFittings * 0.15;
  const sp = Math.round((ductLoss + fittingLoss) * 100) / 100;

  const hp = Math.round((cfm * sp) / (6356 * 0.65) * 100) / 100;
  const kw = Math.round(hp * 0.746 * 100) / 100;

  let fanType = 'axial';
  if (sp > 0.75) fanType = 'centrifugo';
  if (ach >= 20) fanType = 'centrifugo';
  if (volume > 5000) fanType = 'centrifugo';
  if (useCortina) fanType = 'cortina-aire';
  if (sp < 0.3 && volume < 2000) fanType = 'axial';

  return {
    cfm, m3h, sp, hp, kw, fanType, ach,
    details: [
      { label: 'Volumen del espacio', value: Math.round(volume), unit: 'm³' },
      { label: 'Renovaciones/hora', value: ach, unit: 'ACH' },
      { label: 'Caudal de aire requerido', value: cfm, unit: 'CFM' },
      { label: 'Caudal (SI)', value: m3h, unit: 'm³/h' },
      { label: 'Presión estática total', value: sp, unit: '"wg' },
      { label: 'Pérdida en conductos', value: Math.round(ductLoss * 100) / 100, unit: '"wg' },
      { label: 'Pérdida en accesorios', value: Math.round(fittingLoss * 100) / 100, unit: '"wg' },
      { label: 'Potencia del ventilador', value: hp, unit: 'HP' },
      { label: 'Tipo recomendado', value: 0, unit: fanType === 'axial' ? 'Axial' : fanType === 'centrifugo' ? 'Centrífugo' : fanType === 'cortina-aire' ? 'Cortina de aire' : 'Mixto' },
    ],
  };
}

function calcHeatExchanger(values: Record<string, number>): {
  area: number; plates: number; lwpd: number; lmtda: number; flowPri: number; flowSec: number;
  type: string; material: string;
  details: { label: string; value: number; unit: string }[];
} {
  const loadBTU = values.loadBTU || 200000;
  const tPriIn = values.tPriIn || 12, tPriOut = values.tPriOut || 7;
  const tSecIn = values.tSecIn || 32, tSecOut = values.tSecOut || 37;
  const uValue = values.uValue || 3000;
  const hxType = values.hxType || 0;
  const materialFactor = values.materialFactor || 1.0;
  const foulingFactor = values.foulingFactor || 1.0;

  const dT1 = Math.abs(tSecIn - tPriOut);
  const dT2 = Math.abs(tSecOut - tPriIn);
  const lmtd = dT1 === dT2 ? dT1 : (dT1 - dT2) / Math.log(dT1 / dT2);

  const loadW = loadBTU / 3.412;
  const effectiveU = uValue * (hxType === 1 ? 0.6 : 1.0) / foulingFactor;
  const areaM2 = loadW / (effectiveU * lmtd);
  const plates = hxType === 0 ? Math.round(areaM2 / 0.05 + 2) : 0;

  const priDeltaTF = Math.abs(tPriIn - tPriOut) * 1.8;
  const flowPri = Math.round(loadBTU / (500 * priDeltaTF) * 10) / 10;
  const secDeltaTF = Math.abs(tSecIn - tSecOut) * 1.8;
  const flowSec = Math.round(loadBTU / (500 * secDeltaTF) * 10) / 10;

  return {
    area: Math.round(areaM2 * 100) / 100,
    plates,
    lwpd: Math.round(lmtd * 100) / 100,
    lmtda: Math.round(lmtd * 100) / 100,
    flowPri, flowSec,
    type: hxType === 0 ? 'Placas' : 'Tubular',
    material: materialFactor >= 2 ? 'Titanio' : materialFactor >= 0.9 ? 'Acero inoxidable' : 'Acero al carbono',
    details: [
      { label: 'Carga térmica a transferir', value: Math.round(loadBTU), unit: 'BTU/h' },
      { label: 'Potencia (kW)', value: Math.round(loadW * 10) / 10, unit: 'kW' },
      { label: 'Diferencia de temp. media (LMTD)', value: Math.round(lmtd * 10) / 10, unit: '°C' },
      { label: 'Área de transferencia requerida', value: Math.round(areaM2 * 100) / 100, unit: 'm²' },
      { label: 'Tipo de intercambiador', value: 0, unit: hxType === 0 ? 'Placas' : 'Tubular' },
      ...(hxType === 0 ? [{ label: 'Número de placas estimado', value: plates, unit: 'placas' }] : []),
      { label: 'Flujo lado primario', value: flowPri, unit: 'GPM' },
      { label: 'Flujo lado secundario', value: flowSec, unit: 'GPM' },
      { label: 'Material recomendado', value: 0, unit: materialFactor >= 2 ? 'Titanio' : materialFactor >= 0.9 ? 'Acero inoxidable 316' : 'Acero al carbono' },
    ],
  };
}

// ─── Match Equipment ─────────────────────────────────────────────────────────

function matchEquipment(need: number, category: string, tolerance = 0.85): CatalogItem[] {
  const cat = EQUIPMENT[category] || [];
  const filtered = cat.filter(i => {
    const val = parseFloat(i.spec1.replace(/[^0-9.]/g, ''));
    return val >= need * tolerance && val <= need * 3;
  });
  filtered.sort((a, b) => parseFloat(a.spec1.replace(/[^0-9.]/g, '')) - parseFloat(b.spec1.replace(/[^0-9.]/g, '')));
  if (filtered.length === 0) {
    return [...cat].sort((a, b) => Math.abs(parseFloat(a.spec1.replace(/[^0-9.]/g, '')) - need) - Math.abs(parseFloat(b.spec1.replace(/[^0-9.]/g, '')) - need)).slice(0, 3);
  }
  const under = cat.filter(i => parseFloat(i.spec1.replace(/[^0-9.]/g, '')) < need).slice(-2);
  const over = filtered.slice(0, 3);
  return [...under, ...over].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i).slice(0, 4);
}

function matchPump(gpm: number, head: number): CatalogItem[] {
  const all = [...(EQUIPMENT['bomba-linea'] || []), ...(EQUIPMENT['bomba-centrifuga'] || []), ...(EQUIPMENT['bomba-multietapa'] || [])];
  const scored = all.map(i => {
    const g = parseFloat(i.spec1.replace(/[^0-9.]/g, ''));
    const h = parseFloat(i.spec2.replace(/[^0-9.]/g, ''));
    const score = Math.abs(g - gpm) * 0.7 + Math.abs(h - head) * 0.3;
    return { ...i, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 4).filter(i => i.score < 200);
}

function matchFan(cfm: number, sp: number): CatalogItem[] {
  const isHighSP = sp > 0.5;
  const cats = isHighSP ? ['extractor-centrifugo'] : ['extractor-axial', 'extractor-centrifugo'];
  const all = cats.flatMap(c => EQUIPMENT[c] || []);
  const scored = all.map(i => {
    const c = parseFloat(i.spec1.replace(/[^0-9.]/g, ''));
    const s = parseFloat(i.spec2.replace(/[^0-9.]/g, ''));
    const score = Math.abs(c - cfm) * 0.6 + Math.abs(s - sp) * 0.4;
    return { ...i, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 4).filter(i => i.score < 5000);
}

function matchHX(area: number, load: number): CatalogItem[] {
  const all = [...(EQUIPMENT['hx-placas'] || []), ...(EQUIPMENT['hx-tubular'] || [])];
  const scored = all.map(i => {
    const a = parseFloat(i.spec2.replace(/[^0-9.]/g, ''));
    const l = parseFloat(i.spec1.replace(/[^0-9.]/g, ''));
    const score = Math.abs(a - area) * 0.5 + Math.abs(l - load) * 0.5;
    return { ...i, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 4).filter(i => i.score < 5000);
}

function matchHeating(btu: number): CatalogItem[] {
  const all = EQUIPMENT['calefaccion'] || [];
  const scored = all.map(i => {
    const val = parseFloat(i.spec1.replace(/[^0-9.]/g, ''));
    const score = Math.abs(val - btu);
    return { ...i, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 4);
}

// ─── Component ───────────────────────────────────────────────────────────────

const formatMoney = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function HvacCalculatorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<CalcMode>('confort');

  // Shared dimensions
  const [length, setLength] = useState('5');
  const [width, setWidth] = useState('4');
  const [height, setHeight] = useState('2.5');

  // Confort / Climatización inputs
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
  const [achComfort, setAchComfort] = useState('0');

  // Refrigeración inputs
  const [refrigTemp, setRefrigTemp] = useState('4');
  const [chamberInsulation, setChamberInsulation] = useState<InsulationLevel>('buena');
  const [productMass, setProductMass] = useState('500');
  const [productType, setProductType] = useState<ProductType>('carnes');
  const [doorOpenings, setDoorOpenings] = useState('10');
  const [hasDefrost, setHasDefrost] = useState(true);
  const [evapType, setEvapType] = useState<EvaporatorType>('aire-forzado');
  const [chamberPeople, setChamberPeople] = useState('1');

  // Congelación inputs
  const [freezingType, setFreezingType] = useState<FreezingType>('estandar');
  const [freezeInsulation, setFreezeInsulation] = useState<InsulationLevel>('excelente');
  const [freezeProductMass, setFreezeProductMass] = useState('300');
  const [freezeDoorOpenings, setFreezeDoorOpenings] = useState('6');
  const [freezePeople, setFreezePeople] = useState('1');

  // Calefacción inputs
  const [indoorTemp, setIndoorTemp] = useState('22');
  const [outdoorTemp, setOutdoorTemp] = useState('10');
  const [heatInsulation, setHeatInsulation] = useState<InsulationLevel>('media');
  const [heatWall, setHeatWall] = useState<WallMaterial>('block');
  const [heatRoof, setHeatRoof] = useState<RoofType>('concreto');
  const [heatGlass, setHeatGlass] = useState<GlassType>('doble');
  const [heatWindows, setHeatWindows] = useState('2');
  const [heatDoors, setHeatDoors] = useState('1');
  const [heatAch, setHeatAch] = useState('0.5');
  const [heatingSystem, setHeatingSystem] = useState<HeatingSystem>('bomba-calor');
  const [fuelType, setFuelType] = useState<FuelType>('electricidad');

  // Ventilación inputs
  const [spaceType, setSpaceType] = useState<SpaceType>('oficina');
  const [achVent, setAchVent] = useState('8');
  const [ductLength, setDuctLength] = useState('10');
  const [ductFittings, setDuctFittings] = useState('4');
  const [useCortina, setUseCortina] = useState(false);
  const [doorWidth, setDoorWidth] = useState('1.5');
  const [doorHeight, setDoorHeight] = useState('2.5');

  // Bombeo inputs
  const [pumpSystem, setPumpSystem] = useState<PumpSystem>('chiller');
  const [chillerTons, setChillerTons] = useState('10');
  const [deltaTC, setDeltaTC] = useState('5.5');
  const [pipeLength, setPipeLength] = useState('50');
  const [elevation, setElevation] = useState('5');
  const [fittings, setFittings] = useState('8');
  const [fluidType, setFluidType] = useState<FluidType>('agua');
  const [useDirectFlow, setUseDirectFlow] = useState(false);
  const [directGpm, setDirectGpm] = useState('100');

  // Intercambiador inputs
  const [hxLoad, setHxLoad] = useState('200000');
  const [tPriIn, setTPriIn] = useState('12');
  const [tPriOut, setTPriOut] = useState('7');
  const [tSecIn, setTSecIn] = useState('32');
  const [tSecOut, setTSecOut] = useState('37');
  const [hxFluidPair, setHxFluidPair] = useState<HxFluidPair>('agua-agua');
  const [hxMaterial, setHxMaterial] = useState<HxMaterial>('acero-inox');
  const [hxType, setHxType] = useState<HxType>('placas');

  // Results
  const [result, setResult] = useState<any>(null);
  const [recommended, setRecommended] = useState<CatalogItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState('minisplit');

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => { const { data } = await api.get('/customers?limit=1000'); return data.data ?? []; },
  });

  function calculate() {
    setResult(null);
    setRecommended([]);

    switch (mode) {
      case 'confort': {
        const L = parseFloat(length) || 0, W = parseFloat(width) || 0, H = parseFloat(height) || 0;
        if (!L || !W || !H) { toast.error('Ingresa dimensiones válidas'); return; }
        const r = calcComfort({
          length: L, width: W, height: H,
          zoneTemp: ZONES[zone].temp, zoneFactor: ZONES[zone].factor,
          people: parseInt(people) || 0, windows: parseInt(windows) || 0, doors: parseInt(doors) || 0,
          insCoeff: INSULATION[insulation].coeff, wallU: WALL_COEFF[wall], roofU: ROOF_COEFF[roof],
          glassU: GLASS_COEFF[glass], hasSolarControl: hasSolarControl ? 1 : 0,
          equipmentLoad: parseFloat(equipmentLoad) || 0,
          usageMult: usage === 'restaurante' ? 1.3 : usage === 'industrial' ? 1.1 : 1.0,
          ach: parseFloat(achComfort) || 0,
        });
        setResult(r);
        setSelectedType(USAGES[usage].allowedEquipment[0]);
        const all = USAGES[usage].allowedEquipment.flatMap(t => EQUIPMENT[t] || []);
        const scored = all.map(i => {
          const val = parseFloat(i.spec1.replace(/[^0-9.]/g, ''));
          return { ...i, score: Math.abs(val - r.btu) };
        });
        scored.sort((a, b) => a.score - b.score);
        setRecommended(scored.slice(0, 4));
        break;
      }

      case 'refrigeracion': {
        const L = parseFloat(length) || 0, W = parseFloat(width) || 0, H = parseFloat(height) || 0;
        if (!L || !W || !H) { toast.error('Ingresa dimensiones válidas'); return; }
        const r = calcChamberLoad({
          length: L, width: W, height: H,
          chamberTemp: parseFloat(refrigTemp) || 4,
          zoneTemp: ZONES[zone].temp,
          insCoeff: INSULATION[chamberInsulation].coeff,
          productMass: parseFloat(productMass) || 0,
          specificHeat: PRODUCT_TYPES[productType].specificHeat,
          doorOpenings: parseInt(doorOpenings) || 0,
          hasDefrost: hasDefrost ? 1 : 0,
          people: parseInt(chamberPeople) || 1,
          evapFactor: EVAPORATOR_TYPES[evapType].factor,
        });
        setResult(r);
        setRecommended(matchEquipment(r.btu, 'refrigeracion'));
        break;
      }

      case 'congelacion': {
        const L = parseFloat(length) || 0, W = parseFloat(width) || 0, H = parseFloat(height) || 0;
        if (!L || !W || !H) { toast.error('Ingresa dimensiones válidas'); return; }
        const fType = FREEZING_TYPES[freezingType];
        const r = calcChamberLoad({
          length: L, width: W, height: H,
          chamberTemp: fType.temp,
          zoneTemp: ZONES[zone].temp,
          insCoeff: INSULATION[freezeInsulation].coeff,
          productMass: parseFloat(freezeProductMass) || 0,
          specificHeat: 2.0,
          doorOpenings: parseInt(freezeDoorOpenings) || 0,
          hasDefrost: 1,
          people: parseInt(freezePeople) || 1,
          evapFactor: 1.0,
        });
        setResult(r);
        setRecommended(matchEquipment(r.btu, 'congelacion'));
        break;
      }

      case 'calefaccion': {
        const L = parseFloat(length) || 0, W = parseFloat(width) || 0, H = parseFloat(height) || 0;
        if (!L || !W || !H) { toast.error('Ingresa dimensiones válidas'); return; }
        const sys = HEATING_SYSTEMS[heatingSystem];
        const fuel = FUEL_COSTS[fuelType];
        const r = calcHeating({
          length: L, width: W, height: H,
          outdoorTemp: parseFloat(outdoorTemp) || 10,
          indoorTemp: parseFloat(indoorTemp) || 22,
          insCoeff: INSULATION[heatInsulation].coeff,
          wallU: WALL_COEFF[heatWall], roofU: ROOF_COEFF[heatRoof],
          glassU: GLASS_COEFF[heatGlass],
          windows: parseInt(heatWindows) || 0, doors: parseInt(heatDoors) || 0,
          ach: parseFloat(heatAch) || 0.5,
          systemEfficiency: sys.efficiency,
          fuelBtuPerUnit: fuel.btuPerUnit,
          fuelCostPerUnit: fuel.costPerUnit,
        });
        setResult(r);
        setRecommended(matchHeating(r.btu));
        break;
      }

      case 'ventilacion': {
        const L = parseFloat(length) || 0, W = parseFloat(width) || 0, H = parseFloat(height) || 0;
        if (!L || !W || !H) { toast.error('Ingresa dimensiones válidas'); return; }
        const r = calcVentilation({
          length: L, width: W, height: H,
          ach: parseFloat(achVent) || 8,
          ductLength: parseFloat(ductLength) || 10,
          ductFittings: parseInt(ductFittings) || 4,
          useCortina: useCortina ? 1 : 0,
          doorWidth: parseFloat(doorWidth) || 1.5,
          doorHeight: parseFloat(doorHeight) || 2.5,
        });
        setResult(r);
        const fanCats = r.fanType === 'centrifugo' ? ['extractor-centrifugo'] : r.fanType === 'cortina-aire' ? ['cortina-aire'] : ['extractor-axial', 'extractor-centrifugo'];
        const all = fanCats.flatMap(c => EQUIPMENT[c] || []);
        const scored = all.map(i => {
          const cf = parseFloat(i.spec1.replace(/[^0-9.]/g, ''));
          const sp = parseFloat(i.spec2.replace(/[^0-9.]/g, ''));
          return { ...i, score: Math.abs(cf - r.cfm) * 0.6 + Math.abs(sp - r.sp) * 0.4 };
        });
        scored.sort((a, b) => a.score - b.score);
        setRecommended(scored.slice(0, 4));
        break;
      }

      case 'bombeo': {
        const ct = parseFloat(chillerTons) || 0;
        const dg = parseFloat(directGpm) || 0;
        if (!ct && !dg) { toast.error('Ingresa la capacidad del chiller o el caudal directo'); return; }
        const fluid = FLUID_TYPES[fluidType];
        const r = calcPump({
          chillerTons: ct,
          deltaTC: parseFloat(deltaTC) || 5.5,
          pipeLength: parseFloat(pipeLength) || 50,
          elevation: parseFloat(elevation) || 5,
          fittings: parseInt(fittings) || 8,
          specificGravity: fluid.sg,
          directGpm: useDirectFlow ? dg : 0,
        });
        setResult(r);
        setRecommended(matchPump(r.gpm, r.head));
        break;
      }

      case 'intercambiador': {
        const load = parseFloat(hxLoad) || 0;
        if (!load) { toast.error('Ingresa la carga térmica'); return; }
        const pair = HX_FLUID_PAIRS[hxFluidPair];
        const mat = HX_MATERIALS[hxMaterial];
        const r = calcHeatExchanger({
          loadBTU: load,
          tPriIn: parseFloat(tPriIn) || 12, tPriOut: parseFloat(tPriOut) || 7,
          tSecIn: parseFloat(tSecIn) || 32, tSecOut: parseFloat(tSecOut) || 37,
          uValue: pair.uDefault,
          materialFactor: mat.priceFactor,
          hxType: hxType === 'tubular' ? 1 : 0,
        });
        setResult(r);
        setRecommended(matchHX(r.area, load));
        break;
      }
    }
  }

  const quoteMutation = useMutation({
    mutationFn: async (item: CatalogItem) => {
      if (!selectedCustomerId && user?.role !== 'CLIENT') throw new Error('Selecciona un cliente');
      const { data } = await api.post('/mercadolibre/create-quotation', {
        itemId: item.id, title: item.name, price: item.price, quantity: 1, thumbnail: '',
        customerId: selectedCustomerId || undefined,
      });
      return data;
    },
    onSuccess: (data) => { toast.success('Cotización generada'); navigate(`/quotations/${data.id}`); },
    onError: (err: Error) => { toast.error(err.message || 'Error'); },
  });

  function Input({ label, value, onChange, min = '0', step, placeholder, suffix }: { label: string; value: string; onChange: (v: string) => void; min?: string; step?: string; placeholder?: string; suffix?: string }) {
    return (
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
        <div className="relative">
          <input type="number" value={value} onChange={e => onChange(e.target.value)} className="input-field pr-8" min={min} step={step} placeholder={placeholder} />
          {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">{suffix}</span>}
        </div>
      </div>
    );
  }

  function Select({ label, value, onChange, options }: { label: string; value: any; onChange: (v: any) => void; options: { value: any; label: string }[] }) {
    return (
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="input-field">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }

  function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
      <div className="card-static p-5">
        <div className="flex items-center gap-2 mb-4"><Icon className="w-5 h-5 text-primary-600" /><h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2></div>
        <div className="space-y-3">{children}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calculadora Técnica HVAC-R</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Dimensionamiento profesional HVAC-R · <span className="text-gray-400 dark:text-gray-500">by semasi</span></p>
      </div>

      {/* Tab Bar */}
      <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-thin">
        {(Object.entries(CALC_MODES) as [CalcMode, typeof CALC_MODES[CalcMode]][]).map(([k, v]) => {
          const Icon = v.icon;
          const active = mode === k;
          return (
            <button key={k} onClick={() => setMode(k)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                active
                  ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm'
                  : 'bg-white text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'}`} />
              {v.label.split('(')[0].trim()}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="xl:col-span-2 space-y-6">
          {/* Dimensiones (shared for most modes) */}
          {(mode === 'confort' || mode === 'refrigeracion' || mode === 'congelacion' || mode === 'calefaccion' || mode === 'ventilacion') && (
            <Section title="Dimensiones del Espacio" icon={Ruler}>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Largo (m)" value={length} onChange={setLength} step="0.1" />
                <Input label="Ancho (m)" value={width} onChange={setWidth} step="0.1" />
                <Input label="Alto (m)" value={height} onChange={setHeight} step="0.1" />
              </div>
            </Section>
          )}

          {/* ── Confort ── */}
          {mode === 'confort' && (
            <>
              <Section title="Aplicación y Clima" icon={Layers}>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Tipo de aplicación</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.entries(USAGES) as [UsageType, typeof USAGES[UsageType]][]).map(([k, v]) => {
                      const Icon = v.icon; const active = usage === k;
                      return (
                        <button key={k} onClick={() => setUsage(k)}
                          className={`flex items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-medium transition-all border ${
                            active ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm' : 'bg-white text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        ><Icon className={`w-4 h-4 ${active ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'}`} />{v.label}</button>
                      );
                    })}
                  </div>
                </div>
                <Select label="Zona climática" value={zone} onChange={setZone} options={Object.entries(ZONES).map(([k, v]) => ({ value: k, label: `${v.label} (${v.temp}°C)` }))} />
                <Select label="Aislamiento" value={insulation} onChange={setInsulation} options={Object.entries(INSULATION).map(([k, v]) => ({ value: k, label: v.label }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Select label="Muros" value={wall} onChange={setWall} options={Object.entries(WALL_COEFF).map(([k, v]) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))} />
                  <Select label="Techo" value={roof} onChange={setRoof} options={Object.entries(ROOF_COEFF).map(([k, v]) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))} />
                </div>
              </Section>
              <Section title="Cargas Adicionales" icon={Sun}>
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Personas" value={people} onChange={setPeople} />
                  <Input label="Ventanas" value={windows} onChange={setWindows} />
                  <Input label="Puertas" value={doors} onChange={setDoors} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select label="Vidrio" value={glass} onChange={setGlass} options={Object.entries(GLASS_COEFF).map(([k, v]) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))} />
                  <Input label="Carga equipos (W)" value={equipmentLoad} onChange={setEquipmentLoad} step="100" />
                </div>
                <Input label="Infiltración (ACH, 0=automático)" value={achComfort} onChange={setAchComfort} step="0.5" />
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <input type="checkbox" checked={hasSolarControl} onChange={e => setHasSolarControl(e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
                  Película / control solar en ventanas
                </label>
              </Section>
            </>
          )}

          {/* ── Refrigeración ── */}
          {mode === 'refrigeracion' && (
            <>
              <Section title="Condiciones de la Cámara" icon={RefrigeratorIcon}>
                <Select label="Zona climática exterior" value={zone} onChange={setZone} options={Object.entries(ZONES).map(([k, v]) => ({ value: k, label: `${v.label} (${v.temp}°C)` }))} />
                <Input label="Temperatura objetivo (°C)" value={refrigTemp} onChange={setRefrigTemp} step="0.5" suffix="°C" min="-5" />
                <Select label="Aislamiento" value={chamberInsulation} onChange={setChamberInsulation} options={Object.entries(INSULATION).map(([k, v]) => ({ value: k, label: `${v.label} (${v.panelMm}mm panel)` }))} />
                <Select label="Tipo de producto" value={productType} onChange={setProductType} options={Object.entries(PRODUCT_TYPES).map(([k, v]) => ({ value: k, label: v.label }))} />
              </Section>
              <Section title="Cargas de la Cámara" icon={Sun}>
                <Input label="Masa de producto (kg/día)" value={productMass} onChange={setProductMass} step="10" />
                <Input label="Aperturas de puerta al día" value={doorOpenings} onChange={setDoorOpenings} />
                <Input label="Personas que ingresan" value={chamberPeople} onChange={setChamberPeople} />
                <Select label="Tipo de evaporador" value={evapType} onChange={setEvapType} options={Object.entries(EVAPORATOR_TYPES).map(([k, v]) => ({ value: k, label: `${v.label} - ${v.desc}` }))} />
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
                  <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300">Descongelación eléctrica</p><p className="text-xs text-gray-400 dark:text-gray-500">+15% carga por descarche</p></div>
                  <input type="checkbox" checked={hasDefrost} onChange={e => setHasDefrost(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-checked:bg-primary-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full relative" />
                </label>
              </Section>
            </>
          )}

          {/* ── Congelación ── */}
          {mode === 'congelacion' && (
            <>
              <Section title="Condiciones de Congelación" icon={Snowflake}>
                <Select label="Zona climática exterior" value={zone} onChange={setZone} options={Object.entries(ZONES).map(([k, v]) => ({ value: k, label: `${v.label} (${v.temp}°C)` }))} />
                <Select label="Tipo de congelación" value={freezingType} onChange={setFreezingType} options={Object.entries(FREEZING_TYPES).map(([k, v]) => ({ value: k, label: `${v.label} (${v.temp}°C)` }))} />
                <Select label="Aislamiento" value={freezeInsulation} onChange={setFreezeInsulation} options={Object.entries(INSULATION).map(([k, v]) => ({ value: k, label: `${v.label} (${v.panelMm}mm panel)` }))} />
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">Para congelación se recomienda aislamiento "Buena" o "Excelente" (panel ≥100mm)</p>
              </Section>
              <Section title="Cargas de Congelación" icon={Sun}>
                <Input label="Masa de producto (kg/día)" value={freezeProductMass} onChange={setFreezeProductMass} step="10" />
                <Input label="Aperturas de puerta al día" value={freezeDoorOpenings} onChange={setFreezeDoorOpenings} />
                <Input label="Personas que ingresan" value={freezePeople} onChange={setFreezePeople} />
                <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">La descongelación está siempre activa para cámaras de congelación (+20% sobre transmisión)</p>
              </Section>
            </>
          )}

          {/* ── Calefacción ── */}
          {mode === 'calefaccion' && (
            <>
              <Section title="Condiciones Térmicas" icon={Flame}>
                <Select label="Zona climática exterior" value={zone} onChange={setZone} options={Object.entries(ZONES).map(([k, v]) => ({ value: k, label: `${v.label} (${v.temp}°C)` }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Temp. exterior (°C)" value={outdoorTemp} onChange={setOutdoorTemp} step="1" suffix="°C" />
                  <Input label="Temp. interior deseada (°C)" value={indoorTemp} onChange={setIndoorTemp} step="1" suffix="°C" />
                </div>
                <Select label="Aislamiento" value={heatInsulation} onChange={setHeatInsulation} options={Object.entries(INSULATION).map(([k, v]) => ({ value: k, label: v.label }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Select label="Muros" value={heatWall} onChange={setHeatWall} options={Object.entries(WALL_COEFF).map(([k, v]) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))} />
                  <Select label="Techo" value={heatRoof} onChange={setHeatRoof} options={Object.entries(ROOF_COEFF).map(([k, v]) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select label="Vidrio" value={heatGlass} onChange={setHeatGlass} options={Object.entries(GLASS_COEFF).map(([k, v]) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))} />
                  <Input label="Infiltración (ACH)" value={heatAch} onChange={setHeatAch} step="0.1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Ventanas" value={heatWindows} onChange={setHeatWindows} />
                  <Input label="Puertas" value={heatDoors} onChange={setHeatDoors} />
                </div>
              </Section>
              <Section title="Sistema de Calefacción" icon={Sun}>
                <Select label="Tipo de sistema" value={heatingSystem} onChange={setHeatingSystem} options={Object.entries(HEATING_SYSTEMS).map(([k, v]) => ({ value: k, label: `${v.label} (${v.desc})` }))} />
                <Select label="Tipo de combustible" value={fuelType} onChange={setFuelType} options={Object.entries(FUEL_COSTS).map(([k, v]) => ({ value: k, label: `${v.label} (${v.costPerUnit} MXN/${v.unit})` }))} />
                {heatingSystem === 'bomba-calor' && (
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">COP = {HEATING_SYSTEMS['bomba-calor'].efficiency} · Por cada kW eléctrico se generan {HEATING_SYSTEMS['bomba-calor'].efficiency} kW térmicos</p>
                )}
                {heatingSystem === 'agua-caliente' && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">Eficiencia estacional ~{HEATING_SYSTEMS['agua-caliente'].efficiency * 100}% · Se considera pérdida en caldera y distribución</p>
                )}
              </Section>
            </>
          )}

          {/* ── Ventilación ── */}
          {mode === 'ventilacion' && (
            <>
              <Section title="Tipo de Espacio" icon={Wind}>
                <Select label="Tipo de espacio" value={spaceType} onChange={(v) => { setSpaceType(v as SpaceType); setAchVent(String(SPACE_TYPES[v as SpaceType]?.ach || 8)); }} options={Object.entries(SPACE_TYPES).map(([k, v]) => ({ value: k, label: `${v.label} (${v.ach} ACH)` }))} />
                <Input label="Renovaciones por hora (ACH)" value={achVent} onChange={setAchVent} step="1" />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Longitud de conducto (m)" value={ductLength} onChange={setDuctLength} step="5" suffix="m" />
                  <Input label="Accesorios en conducto" value={ductFittings} onChange={setDuctFittings} />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <input type="checkbox" checked={useCortina} onChange={e => setUseCortina(e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
                  Cortina de aire (puerta)
                </label>
                {useCortina && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Ancho de puerta (m)" value={doorWidth} onChange={setDoorWidth} step="0.1" />
                    <Input label="Alto de puerta (m)" value={doorHeight} onChange={setDoorHeight} step="0.1" />
                  </div>
                )}
              </Section>
            </>
          )}

          {/* ── Bombeo ── */}
          {mode === 'bombeo' && (
            <>
              <Section title="Datos del Sistema" icon={Droplets}>
                <Select label="Tipo de sistema" value={pumpSystem} onChange={(v) => { setPumpSystem(v as PumpSystem); const sys = PUMP_SYSTEMS[v as PumpSystem]; setDeltaTC(String(sys.deltaT_default || 5.5)); }} options={Object.entries(PUMP_SYSTEMS).map(([k, v]) => ({ value: k, label: v.label }))} />
                <Select label="Tipo de fluido" value={fluidType} onChange={setFluidType} options={Object.entries(FLUID_TYPES).map(([k, v]) => ({ value: k, label: `${v.label} (sg=${v.sg})` }))} />
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <input type="checkbox" checked={useDirectFlow} onChange={e => setUseDirectFlow(e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
                  Especificar caudal directamente
                </label>
                {useDirectFlow ? (
                  <Input label="Caudal directo (GPM)" value={directGpm} onChange={setDirectGpm} step="10" />
                ) : (
                  <Input label="Capacidad del chiller (TR)" value={chillerTons} onChange={setChillerTons} min="1" step="0.5" />
                )}
              </Section>
              <Section title="Datos de Tubería" icon={Gauge}>
                <Input label="ΔT de diseño (°C)" value={deltaTC} onChange={setDeltaTC} step="0.5" suffix="°C" />
                <Input label="Longitud de tubería (m)" value={pipeLength} onChange={setPipeLength} step="10" suffix="m" />
                <Input label="Altura de elevación (m)" value={elevation} onChange={setElevation} step="1" suffix="mca" />
                <Input label="Núm. de accesorios (codos, válvulas)" value={fittings} onChange={setFittings} />
                <p className="text-xs text-gray-400 dark:text-gray-500">Incluye codos, válvulas de compuerta, check, filtros, etc.</p>
              </Section>
            </>
          )}

          {/* ── Intercambiador ── */}
          {mode === 'intercambiador' && (
            <>
              <Section title="Condiciones de Operación" icon={Pipette}>
                <Input label="Carga térmica a transferir (BTU/h)" value={hxLoad} onChange={setHxLoad} step="10000" suffix="BTU/h" />
                <Select label="Pares de fluidos" value={hxFluidPair} onChange={setHxFluidPair} options={Object.entries(HX_FLUID_PAIRS).map(([k, v]) => ({ value: k, label: `${v.label} (U=${v.uDefault} W/m²K)` }))} />
                <Select label="Tipo de intercambiador" value={hxType} onChange={setHxType} options={[{ value: 'placas', label: 'Placas' }, { value: 'tubular', label: 'Tubular' }]} />
                <Select label="Material" value={hxMaterial} onChange={setHxMaterial} options={Object.entries(HX_MATERIALS).map(([k, v]) => ({ value: k, label: `${v.label} (${v.desc})` }))} />
              </Section>
              <Section title="Temperaturas" icon={ArrowLeftRight}>
                <div className="p-3 bg-blue-50 rounded-xl"><p className="text-xs font-medium text-blue-700 mb-1">Circuito primario</p></div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Temp. entrada (°C)" value={tPriIn} onChange={setTPriIn} step="0.5" suffix="°C" />
                  <Input label="Temp. salida (°C)" value={tPriOut} onChange={setTPriOut} step="0.5" suffix="°C" />
                </div>
                <div className="p-3 bg-amber-50 rounded-xl"><p className="text-xs font-medium text-amber-700 mb-1">Circuito secundario</p></div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Temp. entrada (°C)" value={tSecIn} onChange={setTSecIn} step="0.5" suffix="°C" />
                  <Input label="Temp. salida (°C)" value={tSecOut} onChange={setTSecOut} step="0.5" suffix="°C" />
                </div>
              </Section>
            </>
          )}

          <button onClick={calculate} className="btn-primary w-full">
            <Calculator className="w-4 h-4 inline mr-2" />
            {mode === 'confort' ? 'Calcular Carga Térmica' :
             mode === 'refrigeracion' ? 'Calcular Refrigeración' :
             mode === 'congelacion' ? 'Calcular Congelación' :
             mode === 'calefaccion' ? 'Calcular Calefacción' :
             mode === 'ventilacion' ? 'Calcular Ventilación' :
             mode === 'bombeo' ? 'Calcular Bombeo' : 'Calcular Intercambiador'}
          </button>
        </div>

        {/* Results */}
        <div className="xl:col-span-3 space-y-6">
          {result && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {mode === 'confort' && (
                  <>
                    <SumCard label="Carga Térmica" value={result.btu.toLocaleString()} sub="BTU/h" color="text-primary-600" />
                    <SumCard label="Capacidad" value={result.tons.toFixed(1)} sub="Toneladas" color="text-emerald-600" />
                    <SumCard label="Equivalente" value={result.kw.toFixed(1)} sub="kW" color="text-amber-600" />
                  </>
                )}
                {(mode === 'refrigeracion' || mode === 'congelacion') && (
                  <>
                    <SumCard label="Carga Frigorífica" value={result.btu.toLocaleString()} sub="BTU/h" color="text-blue-600" />
                    <SumCard label="Capacidad" value={result.tons.toFixed(1)} sub="Toneladas" color="text-cyan-600" />
                    <SumCard label="Equivalente" value={result.kw.toFixed(1)} sub="kW" color="text-amber-600" />
                  </>
                )}
                {mode === 'calefaccion' && (
                  <>
                    <SumCard label="Pérdida Térmica" value={result.btu.toLocaleString()} sub="BTU/h" color="text-red-600" />
                    <SumCard label="Capacidad" value={result.tons.toFixed(1)} sub="Toneladas" color="text-orange-600" />
                    <SumCard label="Costo Mensual" value={`$${result.monthlyCost.toLocaleString()}`} sub="MXN" color="text-amber-600" />
                  </>
                )}
                {mode === 'ventilacion' && (
                  <>
                    <SumCard label="Caudal" value={result.cfm.toLocaleString()} sub="CFM" color="text-blue-600" />
                    <SumCard label="Presión Estática" value={result.sp.toFixed(2)} sub='"wg' color="text-emerald-600" />
                    <SumCard label="Potencia" value={result.hp.toFixed(2)} sub="HP" color="text-amber-600" />
                  </>
                )}
                {mode === 'bombeo' && (
                  <>
                    <SumCard label="Caudal" value={result.gpm.toLocaleString()} sub="GPM" color="text-blue-600" />
                    <SumCard label="Altura Total" value={result.head.toFixed(1)} sub="mca" color="text-emerald-600" />
                    <SumCard label="Potencia Bomba" value={result.hp.toFixed(1)} sub="HP" color="text-amber-600" />
                  </>
                )}
                {mode === 'intercambiador' && (
                  <>
                    <SumCard label="Área Requerida" value={result.area.toFixed(2)} sub="m²" color="text-blue-600" />
                    <SumCard label="Placas" value={result.plates.toString()} sub="unidades" color="text-emerald-600" />
                    <SumCard label="LMTD" value={result.lwpd.toFixed(1)} sub="°C" color="text-amber-600" />
                  </>
                )}
              </div>

              {/* Detail Breakdown */}
              <div className="card-static p-5">
                <div className="flex items-center gap-2 mb-4"><Info className="w-5 h-5 text-primary-600" /><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Desglose de Cálculo</h3></div>
                <div className="space-y-3">
                  {result.details?.map((d: any, i: number) => {
                    const isLabel = typeof d.value === 'number' && d.value === 0 && typeof d.unit === 'string';
                    const pct = result.btu ? Math.round(Math.abs(d.value) / result.btu * 100) : null;
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-600">{d.label}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {isLabel ? d.unit : `${typeof d.value === 'number' ? d.value.toLocaleString() : d.value} ${d.unit}`}
                          {pct !== null && pct > 0 && pct < 200 && <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({pct}%)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional info per mode */}
              {mode === 'bombeo' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InfoCard label="Tubería" value={result.pipeSize} />
                  <InfoCard label="Velocidad" value={`${result.velocity} m/s`} />
                  <InfoCard label="Caudal (SI)" value={`${result.lps} L/s`} />
                  <InfoCard label="Consumo" value={`${result.kw} kW`} />
                </div>
              )}
              {mode === 'ventilacion' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InfoCard label="Tipo" value={result.fanType === 'centrifugo' ? 'Centrífugo' : result.fanType === 'cortina-aire' ? 'Cortina de aire' : 'Axial'} />
                  <InfoCard label="Renovaciones" value={`${result.ach} ACH`} />
                  <InfoCard label="Caudal (SI)" value={`${result.m3h} m³/h`} />
                  <InfoCard label="Consumo" value={`${result.kw} kW`} />
                </div>
              )}
              {mode === 'intercambiador' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InfoCard label="Flujo primario" value={`${result.flowPri} GPM`} />
                  <InfoCard label="Flujo secundario" value={`${result.flowSec} GPM`} />
                  <InfoCard label="Tipo" value={result.type} />
                  <InfoCard label="Material" value={result.material} />
                </div>
              )}
              {mode === 'calefaccion' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InfoCard label="Eficiencia sistema" value={`${result.systemEfficiency}%`} />
                  <InfoCard label="Consumo mensual" value={`${result.fuelConsumption.toFixed(0)} ${result.fuelUnit}`} />
                  <InfoCard label="Costo mensual" value={`$${result.monthlyCost.toLocaleString()}`} />
                  <InfoCard label="Costo temporada" value={`$${result.annualCost.toLocaleString()}`} />
                </div>
              )}

              {/* Recommended Equipment */}
              {recommended.length > 0 && (
                <div className="card-static p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2"><Thermometer className="w-5 h-5 text-primary-600" /><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Equipo Recomendado</h3></div>
                    <div className="flex-1" />
                    <div className="w-full sm:w-56">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block"><User className="w-3 h-3 inline mr-1" />Cliente</label>
                      <select value={selectedCustomerId ?? ''} onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)} className="input-field text-sm">
                        <option value="">Seleccionar cliente...</option>
                        {customers?.map(c => <option key={c.id} value={c.id}>{c.companyName ? `${c.companyName} - ${c.contactName}` : c.contactName}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommended.map((item) => {
                      const val = parseFloat(item.spec1.replace(/[^0-9.]/g, ''));
                      const need = result.btu || result.gpm || result.cfm || result.area || 0;
                      const isBest = val >= need * 0.85 && val <= need * 1.5;
                      return (
                        <div key={item.id} className={`relative border rounded-xl p-4 transition-all hover:shadow-sm ${isBest ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}>
                          {isBest && <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />Ideal</span>}
                          <div className="mb-2"><h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{item.name}</h4><p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p></div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{item.spec1}</span><span>·</span><span>{item.spec2}</span><span>·</span><span>{item.spec3}</span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-lg font-bold text-primary-600">{formatMoney(item.price)}</p>
                            <button onClick={() => quoteMutation.mutate(item)}
                              disabled={quoteMutation.isPending || (user?.role !== 'CLIENT' && !selectedCustomerId)}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >{quoteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3" />}Cotizar</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!result && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Calculator className="w-16 h-16 text-gray-200 mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 dark:text-gray-500 mb-1">{CALC_MODES[mode].label}</h2>
              <p className="text-gray-400 dark:text-gray-500 text-sm max-w-md mb-2">{CALC_MODES[mode].desc}</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">Selecciona la pestaña del tipo de cálculo que necesitas, ingresa los datos y presiona Calcular</p>
              <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" />Precios mercado México +35%</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" />Basado en ASHRAE / NOM</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" />7 calculadoras especializadas</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SumCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card-static p-5 text-center">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{sub}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
