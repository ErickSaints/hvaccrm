const fs = require('fs');
const path = require('path');

// ─── 1. Read and clean existing data ───────────────────────────────────────
function readJson(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  // Strip BOM
  raw = raw.replace(/^\uFEFF/, '');
  // Fix common encoding corruption from UTF-8 saved as Latin-1
  const fixes = {
    'Ôö£┬«': 'é', 'Ôö£Ôöñ': 'ó', 'Ôö£├¡': 'í', 'Ôö£├║': 'ú',
    'Ôö£Ôûô': '²', 'Ôö£┬í': 'á', 'Ôö£├ë': 'É', 'Ôö£├ë': 'É',
    'Ôö£┬ñ': 'ä', 'Ôö£├╝': 'ü', 'Ôö£├û': 'Ö', 'Ôö£├à': 'Å',
    '├¡': 'í', '├│': 'ó', '├í': 'á', '├®': 'é', '├║': 'ú',
    '├╝': 'ü', '├▒': 'ñ', '├æ': 'Ñ', '├ë': 'É',
  };
  // Simple accent restoration
  raw = raw.replace(/\\u[0-9a-f]{4}/g, m => {
    try { return JSON.parse('"' + m + '"'); } catch { return m; }
  });

  try {
    return JSON.parse(raw);
  } catch(e) {
    console.error('Error parsing JSON:', e.message);
    return [];
  }
}

let catalog = readJson(path.join(__dirname, '..', 'backend', 'scripts', 'catalog_import.json'));
console.log('Existing items:', catalog.length);

// ─── 2. Normalize categories ───────────────────────────────────────────────
const catMap = {
  'INSTALACION ELECTRICA': 'Instalacion Electrica',
  'Instalaci├│n El├®ctrica': 'Instalacion Electrica',
  'DUCTERIA': 'Ducteria',
  'Ducter├¡a': 'Ducteria',
  'Ducter├¡a': 'Ducteria',
  'SOPORTERIA Y ESTRUCTURALES': 'Soporteria y Estructurales',
  'Soporter├¡a y Estructurales': 'Soporteria y Estructurales',
  'VENTILACION Y EXTRACCION': 'Ventilacion y Extraccion',
  'Ventilaci├│n y Extracci├│n': 'Ventilacion y Extraccion',
  'CALEFACCION': 'Calefaccion',
  'Calefacci├│n': 'Calefaccion',
  'REFRIGERACION COMERCIAL': 'Refrigeracion Comercial',
  'Refrigeraci├│n Comercial': 'Refrigeracion Comercial',
  'AISLAMIENTO TERMICO': 'Aislamiento Termico',
  'Aislamiento T├®rmico': 'Aislamiento Termico',
  'CONTROLES Y AUTOMATIZACION (BMS)': 'Controles y Automatizacion (BMS)',
  'Controles y Automatizaci├│n (BMS)': 'Controles y Automatizacion (BMS)',
  'HERRAMIENTAS ELECTRICAS': 'Herramientas Electricas',
  'Herramientas El├®ctricas': 'Herramientas Electricas',
  'TUBERIA DE COBRE Y CONEXIONES': 'Tuberia de Cobre y Conexiones',
  'Tuber├¡a de Cobre y Conexiones': 'Tuberia de Cobre y Conexiones',
  'IGUALAS Y POLIZAS': 'Igualas y Polizas',
  'Igualas y P├│lizas': 'Igualas y Polizas',
  'INSTALACION EQUIPOS': 'Instalacion Equipos',
  'Instalaci├│n Equipos': 'Instalacion Equipos',
};

catalog.forEach(item => {
  if (item.category && catMap[item.category]) {
    item.category = catMap[item.category];
  }
  // Clean description encoding
  if (item.description) {
    item.description = item.description
      .replace(/├¡/g, 'í').replace(/├│/g, 'ó').replace(/├í/g, 'á')
      .replace(/├®/g, 'é').replace(/├║/g, 'ú').replace(/├▒/g, 'ñ')
      .replace(/├æ/g, 'Ñ').replace(/├ë/g, 'É').replace(/├û/g, 'Ö')
      .replace(/├╝/g, 'ü').replace(/├ñ/g, 'ä').replace(/├ë/g, 'É');
  }
  // Clean name encoding
  if (item.name) {
    item.name = item.name
      .replace(/├¡/g, 'í').replace(/├│/g, 'ó').replace(/├í/g, 'á')
      .replace(/├®/g, 'é').replace(/├║/g, 'ú').replace(/├▒/g, 'ñ')
      .replace(/├æ/g, 'Ñ').replace(/├ë/g, 'É').replace(/├û/g, 'Ö')
      .replace(/├╝/g, 'ü').replace(/├ñ/g, 'ä').replace(/├ë/g, 'É');
  }
  // Normalize unit
  if (item.unit) {
    item.unit = item.unit
      .replace(/├¡/g, 'í').replace(/├│/g, 'ó').replace(/├í/g, 'á')
      .replace(/├®/g, 'é').replace(/├║/g, 'ú').replace(/├▒/g, 'ñ');
  }
  // Round prices
  if (typeof item.basePrice === 'number') item.basePrice = Math.round(item.basePrice * 100) / 100;
  if (typeof item.costPrice === 'number') item.costPrice = Math.round(item.costPrice * 100) / 100;
});

// ─── 3. Remove unrelated / bad items ──────────────────────────────────────
const badCats = ['Movilidad Electrica'];
catalog = catalog.filter(item => !badCats.includes(item.category));

// Remove items where name contains "Fuente" in Chiller category (informational rows)
catalog = catalog.filter(item => !(item.category === 'Chiller (APU Reales)' && item.name === 'Fuente'));

// ─── 4. Deduplicate by name ────────────────────────────────────────────────
const seen = new Map();
const deduped = [];
catalog.forEach(item => {
  const key = item.name.toUpperCase().trim();
  if (seen.has(key)) {
    const existing = seen.get(key);
    // Keep the one with more complete data (prefer non-null basePrice, longer description)
    const existingScore = (existing.basePrice != null ? 1 : 0) + (existing.description ? existing.description.length : 0);
    const newScore = (item.basePrice != null ? 1 : 0) + (item.description ? item.description.length : 0);
    if (newScore > existingScore) {
      // Replace existing
      const idx = deduped.indexOf(existing);
      deduped[idx] = item;
      seen.set(key, item);
    }
  } else {
    seen.set(key, item);
    deduped.push(item);
  }
});
catalog = deduped;
console.log('After dedup:', catalog.length);

// ─── 5. Normalize units ────────────────────────────────────────────────────
const unitMap = {
  'servicio': 'servicio',
  'pza': 'pieza', 'pz': 'pieza', 'piezas': 'pieza',
  'kg': 'kg', 'kilos': 'kg',
  'm': 'metro', 'metros': 'metro', 'ml': 'metro', 'm lineal': 'metro',
  'm2': 'm2', 'm┬▓': 'm2',
  'jornal': 'jornal', 'jornada': 'jornal',
  'juego': 'juego', 'kit': 'juego',
  'caja': 'caja', 'caj': 'caja',
  'rollo': 'rollo',
  'litro': 'litro', 'l': 'litro',
  'par': 'par',
  'paquete': 'paquete',
  'obra': 'obra',
};
catalog.forEach(item => {
  if (item.unit && unitMap[item.unit.toLowerCase().trim()]) {
    item.unit = unitMap[item.unit.toLowerCase().trim()];
  }
  // Strip unit descriptions like "kg instalado" -> "kg"
  if (item.unit && item.unit.includes(' ')) {
    item.unit = item.unit.split(' ')[0];
  }
});

// ─── 6. Competitive price adjustments ─────────────────────────────────────
// Reduce some prices that seem high to be competitive
catalog.forEach(item => {
  // Adjust Instalacion Equipos - make more competitive
  if (item.category === 'Instalacion Equipos' && item.basePrice > 50000 && item.basePrice < 200000) {
    // Reduce VRF installation prices by 15-20% for competitiveness
    item.basePrice = Math.round(item.basePrice * 0.85);
  }
  // Adjust equipment prices - reduce retail premiums
  if (item.category === 'Equipos de Aire Acondicionado' && item.basePrice > 5000) {
    // Already competitive, keep as is
  }
  // Fill missing costPrice where basePrice exists
  if (item.basePrice != null && item.costPrice == null) {
    // Typical margin: 35-45% gross margin
    const margin = 0.35 + Math.random() * 0.10;
    item.costPrice = Math.round(item.basePrice * (1 - margin));
  }
});

// ─── 7. MASSIVE NEW CATEGORIES ─────────────────────────────────────────────

const newItems = [];

// ─ 7a. INGENIERIA Y DISEÑO ─────────────────────────────────────────────────
const ingenieria = [
  { name: 'Proyecto ejecutivo HVAC (residencial < 200 m2)', desc: 'Planos, memorias, especificaciones | Incluye cargas térmicas, ductería, instalaciones', u: 'proyecto', bp: 15000, cp: 8000 },
  { name: 'Proyecto ejecutivo HVAC (comercial 200-1000 m2)', desc: 'Planos, memorias, especificaciones | Incluye cargas, ductería, instalaciones, isométricos', u: 'proyecto', bp: 35000, cp: 20000 },
  { name: 'Proyecto ejecutivo HVAC (industrial > 1000 m2)', desc: 'Planos, memorias, especificaciones completas | Incluye todos los sistemas', u: 'proyecto', bp: 80000, cp: 45000 },
  { name: 'Proyecto ejecutivo VRF (residencial/comercial)', desc: 'Planos, memorias de cálculo, isométricos de refrigerante, selección de equipos', u: 'proyecto', bp: 45000, cp: 25000 },
  { name: 'Proyecto ejecutivo sistema agua helada', desc: 'Planos de planta, isométricos, selección de chiller/bombas/torre, esquemas hidráulicos', u: 'proyecto', bp: 65000, cp: 35000 },
  { name: 'Calculo de carga térmica (Manual J / CARRIER HAP)', desc: 'Cálculo detallado de carga térmica por espacio', u: 'proyecto', bp: 8000, cp: 4000 },
  { name: 'Calculo de ductería (Manual D / TECNODUCT)', desc: 'Cálculo de ductería con pérdidas de presión, selección de difusores y rejillas', u: 'proyecto', bp: 6000, cp: 3000 },
  { name: 'Calculo de tubería de refrigerante VRF', desc: 'Cálculo de longitudes equivalentes, diámetros, cargas de refrigerante', u: 'proyecto', bp: 8000, cp: 4000 },
  { name: 'Balanceo de sistema hidrónico', desc: 'Calculo de balanceo de válvulas, selección de balancing valves', u: 'proyecto', bp: 5000, cp: 2500 },
  { name: 'Estudio de factibilidad técnica HVAC', desc: 'Visita de campo, análisis de alternativas, recomendación de sistema', u: 'proyecto', bp: 12000, cp: 6000 },
  { name: 'Dictamen técnico de sistema existente', desc: 'Inspección, diagnóstico, reporte de condiciones y recomendaciones', u: 'proyecto', bp: 8000, cp: 4000 },
  { name: 'Levantamiento de instalaciones HVAC', desc: 'Levantamiento in situ de equipos, ductos, tuberías y controles existentes', u: 'proyecto', bp: 6000, cp: 3000 },
  { name: 'Ingeniería de detalle (modelado BIM)', desc: 'Modelado 3D BIM de sistemas HVAC (Revit)', u: 'proyecto', bp: 45000, cp: 25000 },
  { name: 'Coordinación de instalaciones (BIM 3D)', desc: 'Coordinación HVAC vs arquitectura, estructura, eléctrica, hidrosanitaria', u: 'proyecto', bp: 25000, cp: 15000 },
  { name: 'Supervisión de obra HVAC', desc: 'Supervisión técnica de instalación de sistemas HVAC | Por visita', u: 'visita', bp: 3500, cp: 2000 },
  { name: 'Residencia de obra HVAC (por semana)', desc: 'Residente de obra HVAC tiempo completo | Incluye reportes', u: 'semana', bp: 12000, cp: 7000 },
  { name: 'Dirección de proyecto HVAC (por mes)', desc: 'Dirección técnica y administrativa de proyecto HVAC | Mensual', u: 'mes', bp: 35000, cp: 20000 },
  { name: 'Estudio de eficiencia energética HVAC', desc: 'Auditoría energética, análisis de consumos, propuesta de optimización', u: 'proyecto', bp: 25000, cp: 15000 },
  { name: 'Certificación LEED (asesoría HVAC)', desc: 'Asesoría técnica para certificación LEED en categoría EA (optimización energía)', u: 'proyecto', bp: 60000, cp: 35000 },
  { name: 'Elaboración de especificaciones técnicas HVAC', desc: 'Especificaciones técnicas detalladas para licitación de sistemas HVAC', u: 'proyecto', bp: 15000, cp: 8000 },
  { name: 'Elaboración de alcances HVAC para licitación', desc: 'Definición de alcances, criterios de aceptación, listas de cantidades', u: 'proyecto', bp: 12000, cp: 6000 },
  { name: 'Revisión de proyecto ejecutivo HVAC (tercería)', desc: 'Revisión independiente de planos, memorias y especificaciones', u: 'proyecto', bp: 8000, cp: 4000 },
  { name: 'Peritaje HVAC (reporte técnico legal)', desc: 'Peritaje técnico con valor legal para controversias, seguros o siniestros', u: 'proyecto', bp: 25000, cp: 15000 },
  { name: 'Pruebas de performance a sistema HVAC', desc: 'Medición de flujos, temperaturas, presiones, consumos vs diseño | Reporte', u: 'proyecto', bp: 18000, cp: 10000 },
  { name: 'Comisionamiento HVAC (Cx) - fase diseño', desc: 'Revisión de documentos de diseño, criterios de aceptación, plan de Cx', u: 'proyecto', bp: 25000, cp: 15000 },
  { name: 'Comisionamiento HVAC (Cx) - fase construcción', desc: 'Verificación de instalación, pruebas funcionales, reportes', u: 'proyecto', bp: 35000, cp: 20000 },
  { name: 'Comisionamiento HVAC (Cx) - fase entrega', desc: 'Pruebas de sistemas, capacitación, manuales, garantías', u: 'proyecto', bp: 25000, cp: 15000 },
  { name: 'Comisionamiento HVAC (Cx) - completo', desc: 'Comisionamiento integral en fases diseño, construcción y entrega', u: 'proyecto', bp: 75000, cp: 45000 },
  { name: 'Manual de operación y mantenimiento HVAC', desc: 'Elaboración de manuales de equipos, procedimientos, rutinas de mantenimiento', u: 'proyecto', bp: 12000, cp: 6000 },
  { name: 'Capacitación a personal de mantenimiento HVAC', desc: 'Capacitación teórica-práctica en operación y mantenimiento de sistemas | Por sesión', u: 'sesion', bp: 5000, cp: 2500 },
];

// ─ 7b. CONTROL Y AUTOMATIZACION (BMS/DDC) - expanded ─────────────────────
const controls = [
  // Thermostats
  { name: 'Termostato mecánico (Cool Only)', desc: 'Termostato básico de pared para solo enfriamiento | Contacto simple', u: 'pieza', bp: 250, cp: 150 },
  { name: 'Termostato digital básico (Cool/Heat)', desc: 'Termostato digital con display LCD | Cool/Heat/Off/Auto | Ventilador', u: 'pieza', bp: 450, cp: 280 },
  { name: 'Termostato digital programable (7 días)', desc: 'Termostato digital programable 7 días | 4 periodos/día | Cool/Heat | Respaldo batería', u: 'pieza', bp: 850, cp: 500 },
  { name: 'Termostato WiFi programable', desc: 'Termostato con WiFi | App móvil | Programable 7 días | Geo-fencing', u: 'pieza', bp: 1800, cp: 1100 },
  { name: 'Termostato inteligente (Learning)', desc: 'Termostato con auto-aprendizaje | Sensores de presencia | WiFi | Reportes consumo', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Termostato Honeywell T6 Pro (WiFi)', desc: 'Termostato Honeywell T6 Pro WiFi | 7 días | Cool/Heat | Humedad', u: 'pieza', bp: 2200, cp: 1400 },
  { name: 'Termostato Honeywell T8000 (Vision PRO)', desc: 'Termostato Honeywell Vision PRO 8000 | Touchscreen | WiFi | 7 días', u: 'pieza', bp: 3200, cp: 2000 },
  { name: 'Termostato Carrier Edge Pro WiFi', desc: 'Termostato Carrier Edge Pro | WiFi | Touchscreen | 7 días | Dehumidificación', u: 'pieza', bp: 2800, cp: 1800 },
  { name: 'Termostato sensor de temperatura (remoto)', desc: 'Sensor remoto de temperatura para termostato | 3m cable', u: 'pieza', bp: 250, cp: 150 },
  // Sensors
  { name: 'Sensor de temperatura ducto (NTC 10K)', desc: 'Sensor NTC 10K para montaje en ducto | Bulbo metálico | Cable 1.5m', u: 'pieza', bp: 180, cp: 100 },
  { name: 'Sensor de temperatura ambiente (NTC 10K)', desc: 'Sensor NTC 10K para montaje en pared | Caja blanca', u: 'pieza', bp: 150, cp: 85 },
  { name: 'Sensor de temperatura exterior (NTC 10K)', desc: 'Sensor NTC 10K para intemperie | Protección solar | Cable 2m', u: 'pieza', bp: 220, cp: 130 },
  { name: 'Sensor de temperatura agua (inmersión)', desc: 'Sensor NTC 10K para inmersión en tubería | Bulbo de cobre | 1/2" NPT', u: 'pieza', bp: 280, cp: 160 },
  { name: 'Sensor de humedad relativa (ducto)', desc: 'Sensor HR para ducto | 4-20mA / 0-10V | 0-100% HR', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Sensor de humedad relativa (ambiente)', desc: 'Sensor HR para pared | 4-20mA / 0-10V | 0-100% HR', u: 'pieza', bp: 1000, cp: 600 },
  { name: 'Sensor de temperatura y humedad (combinado ducto)', desc: 'Sensor T+HR para ducto | 4-20mA | Display opcional', u: 'pieza', bp: 1500, cp: 900 },
  { name: 'Sensor de CO2 (ducto)', desc: 'Sensor de CO2 NDIR para ducto | 0-2000 ppm | 4-20mA / 0-10V', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Sensor de CO2 (ambiente)', desc: 'Sensor de CO2 NDIR para pared | 0-2000 ppm | 4-20mA / 0-10V', u: 'pieza', bp: 3200, cp: 2000 },
  { name: 'Sensor de presión diferencial (ducto)', desc: 'Sensor de presión ±250 Pa | 4-20mA | Para monitoreo de filtros/VAV', u: 'pieza', bp: 2200, cp: 1400 },
  { name: 'Sensor de presión estática (ducto)', desc: 'Sensor de presión estática 0-2.5" WC | 4-20mA / 0-10V', u: 'pieza', bp: 1800, cp: 1100 },
  { name: 'Sensor de flujo (agua) tipo paddle', desc: 'Sensor de flujo tipo paddle para tubería 1/2"-8" | Switch+4-20mA', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Sensor de flujo (agua) ultrasónico', desc: 'Sensor de flujo ultrasónico para tubería | Medicón sin contacto', u: 'pieza', bp: 8000, cp: 5000 },
  { name: 'Sensor de temperatura RTD PT100', desc: 'RTD PT100 de 3 hilos | Precisión ±0.1°C | Rango -50 a 200°C', u: 'pieza', bp: 450, cp: 280 },
  { name: 'Transmisor de temperatura (4-20mA)', desc: 'Transmisor de temperatura con salida 4-20mA | Configurable | Riel DIN', u: 'pieza', bp: 850, cp: 500 },
  { name: 'Sensor de calidad de aire (CO2+TVOC+PM2.5)', desc: 'Sensor multi-parámetro calidad de aire interior | CO2, TVOC, PM2.5, T, HR', u: 'pieza', bp: 5500, cp: 3500 },
  // Actuators
  { name: 'Actuador de compuerta (flotante 24V)', desc: 'Actuador flotante 24V | 5 Nm | Para compuerta de regulación | 90°', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Actuador de compuerta (proporcional 0-10V)', desc: 'Actuador proporcional 0-10V | 5 Nm | Para compuerta de regulación | 90°', u: 'pieza', bp: 1800, cp: 1100 },
  { name: 'Actuador de compuerta (flotante 24V 10 Nm)', desc: 'Actuador flotante 24V | 10 Nm | Para compuerta de regulación | 90°', u: 'pieza', bp: 1800, cp: 1100 },
  { name: 'Actuador de compuerta (proporcional 10 Nm)', desc: 'Actuador proporcional 0-10V | 10 Nm | 90° | Con muelle de retorno', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Actuador de compuerta (20 Nm flotante)', desc: 'Actuador flotante 24V | 20 Nm | Compuerta de gran tamaño | 90°', u: 'pieza', bp: 2800, cp: 1700 },
  { name: 'Actuador de compuerta (20 Nm proporcional)', desc: 'Actuador proporcional 0-10V | 20 Nm | Con muelle de retorno', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Actuador de válvula (2 vías, 24V, 1/2"-1")', desc: 'Actuador para válvula de zona 2 vías | 24V | ON/OFF o flotante', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Actuador de válvula (3 vías, 24V, 1/2"-1")', desc: 'Actuador para válvula de zona 3 vías | 24V | ON/OFF o flotante', u: 'pieza', bp: 1400, cp: 850 },
  { name: 'Actuador de válvula (proporcional 0-10V, 1/2"-1")', desc: 'Actuador proporcional 0-10V para válvula de zona | 24V', u: 'pieza', bp: 1800, cp: 1100 },
  { name: 'Actuador de válvula mariposa (2"-6")', desc: 'Actuador para válvula mariposa | 24V/220V | ON/OFF', u: 'pieza', bp: 4500, cp: 2800 },
  { name: 'Actuador de válvula mariposa (8"-12")', desc: 'Actuador para válvula mariposa | 24V/220V | ON/OFF', u: 'pieza', bp: 6500, cp: 4000 },
  { name: 'Actuador de válvula globo (proporcional)', desc: 'Actuador proporcional 0-10V para válvula globo | 500N | Carrera 20mm', u: 'pieza', bp: 3500, cp: 2200 },
  // Valves
  { name: 'Válvula de zona 2 vías (1/2")', desc: 'Válvula de zona ON/OFF 2 vías | 1/2" NPT | NC | 24V', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Válvula de zona 2 vías (3/4")', desc: 'Válvula de zona ON/OFF 2 vías | 3/4" NPT | NC | 24V', u: 'pieza', bp: 400, cp: 250 },
  { name: 'Válvula de zona 2 vías (1")', desc: 'Válvula de zona ON/OFF 2 vías | 1" NPT | NC | 24V', u: 'pieza', bp: 500, cp: 300 },
  { name: 'Válvula de zona 3 vías (1/2")', desc: 'Válvula de zona ON/OFF 3 vías | 1/2" NPT | 24V', u: 'pieza', bp: 450, cp: 280 },
  { name: 'Válvula de zona 3 vías (3/4")', desc: 'Válvula de zona ON/OFF 3 vías | 3/4" NPT | 24V', u: 'pieza', bp: 500, cp: 300 },
  { name: 'Válvula de zona 3 vías (1")', desc: 'Válvula de zona ON/OFF 3 vías | 1" NPT | 24V', u: 'pieza', bp: 600, cp: 350 },
  { name: 'Válvula de equilibrado (balancing) 1/2"', desc: 'Válvula de equilibrado hidrónico | 1/2" | Con tomas de presión', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Válvula de equilibrado (balancing) 3/4"', desc: 'Válvula de equilibrado hidrónico | 3/4" | Con tomas de presión', u: 'pieza', bp: 400, cp: 250 },
  { name: 'Válvula de equilibrado (balancing) 1"', desc: 'Válvula de equilibrado hidrónico | 1" | Con tomas de presión', u: 'pieza', bp: 500, cp: 300 },
  { name: 'Válvula de equilibrado (balancing) 2"', desc: 'Válvula de equilibrado hidrónico | 2" | Con tomas de presión y drenaje', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Válvula check de disco (2"-8")', desc: 'Válvula check de disco tipo wafer | Bridada | Hierro fundido', u: 'pieza', bp: 1500, cp: 900 },
  { name: 'Válvula mariposa (2"-6") manual', desc: 'Válvula mariposa manual con palanca | Bridada | Hierro dúctil', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Válvula mariposa (8"-12") manual', desc: 'Válvula mariposa manual con engranaje | Bridada | Hierro dúctil', u: 'pieza', bp: 2800, cp: 1700 },
  { name: 'Válvula compuerta (2"-6")', desc: 'Válvula de compuerta | Bridada | Hierro fundido', u: 'pieza', bp: 1800, cp: 1100 },
  { name: 'Válvula globo (2"-6")', desc: 'Válvula globo | Bridada | Hierro fundido | Para control/estrangulamiento', u: 'pieza', bp: 2200, cp: 1300 },
  { name: 'Válvula de seguridad y relevo (1/2"-2")', desc: 'Válvula de seguridad para protección por sobrepresión | Ajustable', u: 'pieza', bp: 800, cp: 500 },
  // DDC Controllers
  { name: 'Controlador DDC (16 puntos)', desc: 'Controlador digital directo 16 puntos | Programable | BACnet MS/TP', u: 'pieza', bp: 5500, cp: 3500 },
  { name: 'Controlador DDC (24 puntos)', desc: 'Controlador digital directo 24 puntos | Programable | BACnet MS/TP | IP', u: 'pieza', bp: 7500, cp: 4500 },
  { name: 'Controlador DDC (36 puntos)', desc: 'Controlador digital directo 36 puntos | Programable | BACnet/IP', u: 'pieza', bp: 9500, cp: 6000 },
  { name: 'Controlador DDC (48 puntos)', desc: 'Controlador digital directo 48 puntos | Programable | BACnet/IP | Modbus', u: 'pieza', bp: 12000, cp: 7500 },
  { name: 'Router BACnet/IP a MS/TP', desc: 'Router BACnet para integración IP a MS/TP | 1 puerto MS/TP', u: 'pieza', bp: 4500, cp: 2800 },
  { name: 'Gateway BACnet a Modbus', desc: 'Gateway de protocolo BACnet MS/TP a Modbus RTU', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Módulo de expansión E/S (8 entradas)', desc: 'Módulo de expansión 8 entradas analógicas/digitales | Para DDC', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Módulo de expansión E/S (8 salidas)', desc: 'Módulo de expansión 8 salidas analógicas/digitales | Para DDC', u: 'pieza', bp: 2800, cp: 1700 },
  { name: 'Interface de operador (touchscreen 7")', desc: 'Pantalla táctil 7" para interfaz de operador | BACnet/IP', u: 'pieza', bp: 12000, cp: 7500 },
  { name: 'Interface de operador (touchscreen 10")', desc: 'Pantalla táctil 10" para interfaz de operador | BACnet/IP | Web', u: 'pieza', bp: 18000, cp: 11000 },
  { name: 'PLC compacto (24E/16S)', desc: 'PLC compacto 24 entradas / 16 salidas | Programable | Modbus TCP', u: 'pieza', bp: 8500, cp: 5000 },
  { name: 'PLC modular (CPU + E/S)', desc: 'PLC modular | CPU + 8E/8S base | Expansible | Modbus/IP', u: 'pieza', bp: 12000, cp: 7000 },
  { name: 'Fuente de poder 24VAC (40VA)', desc: 'Fuente de poder 24VAC 40VA para controles | Riel DIN', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Fuente de poder 24VAC (100VA)', desc: 'Fuente de poder 24VAC 100VA | Riel DIN', u: 'pieza', bp: 550, cp: 350 },
  { name: 'Fuente de poder 24VDC (2A)', desc: 'Fuente de poder 24VDC 2A Switching | Riel DIN', u: 'pieza', bp: 600, cp: 350 },
  { name: 'Fuente de poder 24VDC (10A)', desc: 'Fuente de poder 24VDC 10A Switching | Riel DIN', u: 'pieza', bp: 1200, cp: 700 },
  // VAV
  { name: 'VAV (caja volumen variable) 4"', desc: 'Caja VAV de 4" | Con actuador + controlador | 0-10V | 150 CFM', u: 'pieza', bp: 5500, cp: 3500 },
  { name: 'VAV (caja volumen variable) 6"', desc: 'Caja VAV de 6" | Con actuador + controlador | 0-10V | 400 CFM', u: 'pieza', bp: 6500, cp: 4000 },
  { name: 'VAV (caja volumen variable) 8"', desc: 'Caja VAV de 8" | Con actuador + controlador | 0-10V | 700 CFM', u: 'pieza', bp: 7500, cp: 4500 },
  { name: 'VAV (caja volumen variable) 10"', desc: 'Caja VAV de 10" | Con actuador + controlador | 0-10V | 1200 CFM', u: 'pieza', bp: 9000, cp: 5500 },
  { name: 'VAV (caja volumen variable) 12"', desc: 'Caja VAV de 12" | Con actuador + controlador | 0-10V | 2000 CFM', u: 'pieza', bp: 11000, cp: 7000 },
  { name: 'VAV fan powered (serie) 6"', desc: 'Caja VAV fan powered serie | 6" | Ventilador interno | 400 CFM', u: 'pieza', bp: 12000, cp: 7500 },
  { name: 'VAV fan powered (serie) 8"', desc: 'Caja VAV fan powered serie | 8" | Ventilador interno | 700 CFM', u: 'pieza', bp: 15000, cp: 9000 },
  { name: 'VAV fan powered (paralelo) 6"', desc: 'Caja VAV fan powered paralelo | 6" | 400 CFM', u: 'pieza', bp: 13000, cp: 8000 },
  // System Integration & software
  { name: 'Licencia Software BMS (100 puntos)', desc: 'Licencia de software de supervisión BMS | Hasta 100 puntos | Tiempo real', u: 'licencia', bp: 25000, cp: 15000 },
  { name: 'Licencia Software BMS (500 puntos)', desc: 'Licencia de software de supervisión BMS | Hasta 500 puntos | Históricos', u: 'licencia', bp: 45000, cp: 28000 },
  { name: 'Licencia Software BMS (1000+ puntos)', desc: 'Licencia de software de supervisión BMS | Ilimitado | Múltiples estaciones', u: 'licencia', bp: 80000, cp: 50000 },
  { name: 'Programación de controlador DDC', desc: 'Programación de lógica de control de DDC | Por punto de control', u: 'punto', bp: 1200, cp: 700 },
  { name: 'Programación de secuencia de HVAC (por sistema)', desc: 'Programación de secuencia de operación para sistema HVAC completo', u: 'sistema', bp: 8000, cp: 4500 },
  { name: 'Configuración de red BACnet/MS/TP', desc: 'Configuración de red de controladores BACnet MS/TP | Tendido, direccionamiento, verificación', u: 'proyecto', bp: 5000, cp: 3000 },
  { name: 'Puesta en marcha de sistema BMS', desc: 'Verificación de todos los puntos, calibración de sensores, pruebas de actuadores', u: 'proyecto', bp: 15000, cp: 8500 },
  { name: 'Calibración de sensores (por punto)', desc: 'Calibración de sensor de temperatura, humedad, presión | Con certificado', u: 'punto', bp: 350, cp: 200 },
  { name: 'Tablero de control eléctrico para HVAC', desc: 'Tablero con PLC/DDC, contactores, protecciones, fuente | Fabricación', u: 'pieza', bp: 25000, cp: 15000 },
  { name: 'Variador de frecuencia VFD 0.5HP', desc: 'VFD 0.5HP / 0.37kW | 1x220V | Para ventilador/bomba chica', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Variador de frecuencia VFD 1HP', desc: 'VFD 1HP / 0.75kW | 1x220V', u: 'pieza', bp: 4500, cp: 2800 },
  { name: 'Variador de frecuencia VFD 2HP', desc: 'VFD 2HP / 1.5kW | 3x220V', u: 'pieza', bp: 5500, cp: 3500 },
  { name: 'Variador de frecuencia VFD 3HP', desc: 'VFD 3HP / 2.2kW | 3x220V', u: 'pieza', bp: 6500, cp: 4000 },
  { name: 'Variador de frecuencia VFD 5HP', desc: 'VFD 5HP / 3.7kW | 3x220/440V', u: 'pieza', bp: 8500, cp: 5000 },
  { name: 'Variador de frecuencia VFD 7.5HP', desc: 'VFD 7.5HP / 5.5kW | 3x440V', u: 'pieza', bp: 11000, cp: 7000 },
  { name: 'Variador de frecuencia VFD 10HP', desc: 'VFD 10HP / 7.5kW | 3x440V', u: 'pieza', bp: 14000, cp: 8500 },
  { name: 'Variador de frecuencia VFD 15HP', desc: 'VFD 15HP / 11kW | 3x440V', u: 'pieza', bp: 18000, cp: 11000 },
  { name: 'Variador de frecuencia VFD 20HP', desc: 'VFD 20HP / 15kW | 3x440V', u: 'pieza', bp: 22000, cp: 14000 },
  { name: 'Variador de frecuencia VFD 25HP', desc: 'VFD 25HP / 18.5kW | 3x440V', u: 'pieza', bp: 26000, cp: 16000 },
  { name: 'Variador de frecuencia VFD 30HP', desc: 'VFD 30HP / 22kW | 3x440V', u: 'pieza', bp: 30000, cp: 18000 },
  { name: 'Variador de frecuencia VFD 40HP', desc: 'VFD 40HP / 30kW | 3x440V', u: 'pieza', bp: 38000, cp: 23000 },
  { name: 'Variador de frecuencia VFD 50HP', desc: 'VFD 50HP / 37kW | 3x440V', u: 'pieza', bp: 45000, cp: 28000 },
  { name: 'Variador de frecuencia VFD 60HP', desc: 'VFD 60HP / 45kW | 3x440V', u: 'pieza', bp: 52000, cp: 32000 },
  { name: 'Variador de frecuencia VFD 75HP', desc: 'VFD 75HP / 55kW | 3x440V', u: 'pieza', bp: 65000, cp: 40000 },
  { name: 'Variador de frecuencia VFD 100HP', desc: 'VFD 100HP / 75kW | 3x440V', u: 'pieza', bp: 80000, cp: 50000 },
  { name: 'Variador de frecuencia VFD 150HP', desc: 'VFD 150HP / 110kW | 3x440V', u: 'pieza', bp: 120000, cp: 75000 },
  { name: 'Variador de frecuencia VFD 200HP', desc: 'VFD 200HP / 150kW | 3x440V', u: 'pieza', bp: 150000, cp: 90000 },
  { name: 'Arrancador suave (soft starter) 10HP', desc: 'Soft starter 10HP | 3x220/440V', u: 'pieza', bp: 8000, cp: 5000 },
  { name: 'Arrancador suave (soft starter) 25HP', desc: 'Soft starter 25HP | 3x440V', u: 'pieza', bp: 14000, cp: 8500 },
  { name: 'Arrancador suave (soft starter) 50HP', desc: 'Soft starter 50HP | 3x440V', u: 'pieza', bp: 22000, cp: 14000 },
  { name: 'Arrancador suave (soft starter) 100HP', desc: 'Soft starter 100HP | 3x440V', u: 'pieza', bp: 35000, cp: 22000 },
  // Energy monitoring
  { name: 'Medidor de energía eléctrica (monofásico)', desc: 'Medidor de energía MID | Monofásico | Comunicación Modbus | 100A', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Medidor de energía eléctrica (trifásico)', desc: 'Medidor de energía MID | Trifásico | Comunicación Modbus | 5A/1A', u: 'pieza', bp: 5500, cp: 3500 },
  { name: 'Transformador de corriente (TC) 100A', desc: 'TC 100/5A | Para medición de energía | 1% precisión', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Transformador de corriente (TC) 200A', desc: 'TC 200/5A | Para medición de energía', u: 'pieza', bp: 400, cp: 250 },
  { name: 'Transformador de corriente (TC) 400A', desc: 'TC 400/5A | Para medición de energía', u: 'pieza', bp: 500, cp: 300 },
  { name: 'Transformador de corriente (TC) 800A', desc: 'TC 800/5A | Para medición de energía', u: 'pieza', bp: 650, cp: 400 },
  { name: 'Transformador de corriente (TC) 1600A', desc: 'TC 1600/5A | Para medición de energía', u: 'pieza', bp: 900, cp: 550 },
  { name: 'Medidor de BTU (energía térmica)', desc: 'Medidor de BTU para sistema agua helada/calefacción | Incluye sensor T+caudal', u: 'pieza', bp: 8000, cp: 5000 },
  // Control panels
  { name: 'Tablero de control para bomba (1-5HP)', desc: 'Tablero con arrancador/guarda motor, selector, relevadores, protecciones', u: 'pieza', bp: 4500, cp: 2800 },
  { name: 'Tablero de control para bomba (7.5-15HP)', desc: 'Tablero de control con arrancador suave/estrella-delta', u: 'pieza', bp: 8500, cp: 5000 },
  { name: 'Tablero de control para bomba (20-50HP)', desc: 'Tablero de control con VFD integrado + bypass', u: 'pieza', bp: 18000, cp: 11000 },
  { name: 'Tablero de control para torre de enfriamiento', desc: 'Tablero para control de ventilador + bomba de torre | Temperatura', u: 'pieza', bp: 12000, cp: 7000 },
  { name: 'Tablero de control para chiller (interfaz BMS)', desc: 'Tablero de interface para monitoreo y control de chiller vía BMS', u: 'pieza', bp: 15000, cp: 9000 },
  { name: 'Cable de control 18 AWG (par trenzado)', desc: 'Cable 18 AWG par trenzado blindado | Para sensores/actuadores | Metro', u: 'metro', bp: 15, cp: 8 },
  { name: 'Cable de comunicación RS-485', desc: 'Cable para red BACnet MS/TP | 22 AWG par trenzado blindado | Metro', u: 'metro', bp: 18, cp: 10 },
  { name: 'Cable de red Ethernet (Cat 6a, metro)', desc: 'Cable de red Cat 6a UTP | 4 pares | Para redes BACnet/IP', u: 'metro', bp: 12, cp: 7 },
];

// ─ 7c. EFICIENCIA ENERGETICA ──────────────────────────────────────────────
const energyEff = [
  { name: 'Auditoría energética básica (< 500 m2)', desc: 'Levantamiento de consumos, análisis de facturación, recomendaciones generales', u: 'proyecto', bp: 12000, cp: 6000 },
  { name: 'Auditoría energética detallada (> 500 m2)', desc: 'Auditoría con mediciones, análisis de cargas, simulación energética, reporte completo', u: 'proyecto', bp: 35000, cp: 20000 },
  { name: 'Estudio de línea base energética', desc: 'Establecimiento de línea base de consumo (EPA Method / IPMVP)', u: 'proyecto', bp: 20000, cp: 12000 },
  { name: 'Análisis de calidad de energía eléctrica', desc: 'Medición y análisis de armónicas, factor de potencia, transitorios | 7 días', u: 'proyecto', bp: 15000, cp: 8500 },
  { name: 'Estudio de factibilidad de cogeneración', desc: 'Análisis técnico-económico de cogeneración con calderas/chillers', u: 'proyecto', bp: 40000, cp: 25000 },
  { name: 'Medición de eficiencia de chiller (kW/TR)', desc: 'Medición de kW/TR real vs diseño | Recomendaciones de optimización', u: 'proyecto', bp: 12000, cp: 7000 },
  { name: 'Balanceo térmico de sistema HVAC', desc: 'Medición de flujos de aire y agua, balanceo de sistema completo', u: 'proyecto', bp: 25000, cp: 15000 },
  { name: 'Estudio de iluminación eficiente (LED retrofit)', desc: 'Levantamiento, cálculo de luxes, propuesta de retrofit LED, ROI', u: 'proyecto', bp: 15000, cp: 8000 },
  { name: 'Análisis de retorno de inversión (ROI) ESCO', desc: 'Análisis financiero de proyectos ESCO con medición IPMVP', u: 'proyecto', bp: 20000, cp: 12000 },
  { name: 'Medición y verificación (M&V) IPMVP', desc: 'Medición y verificación de ahorros conforme a IPMVP Opción A/B/C/D', u: 'proyecto', bp: 25000, cp: 15000 },
  { name: 'Estudio de factibilidad solar FV para HVAC', desc: 'Análisis de generación solar fotovoltaica para compensar consumo HVAC', u: 'proyecto', bp: 18000, cp: 10000 },
  { name: 'Diagnóstico de envolvente térmica', desc: 'Termografía, análisis de puentes térmicos, infiltraciones', u: 'proyecto', bp: 15000, cp: 8500 },
  { name: 'Termografía infrarroja (eléctrica)', desc: 'Termografía de tableros eléctricos, motores, conexiones | Reporte', u: 'proyecto', bp: 8000, cp: 4500 },
  { name: 'Termografía infrarroja (mecánica/HVAC)', desc: 'Termografía de equipos HVAC, ductos, aislamientos | Reporte', u: 'proyecto', bp: 8000, cp: 4500 },
  { name: 'Análisis de calidad de aire interior (IAQ)', desc: 'Medición de CO2, CO, VOC, PM, T, HR, hongos | Reporte con recomendaciones', u: 'proyecto', bp: 12000, cp: 7000 },
  { name: 'Implementación de FREE COOLING (economizer)', desc: 'Ingeniería, suministro e instalación de compuerta economizer en AHU', u: 'proyecto', bp: 35000, cp: 20000 },
  { name: 'Retrofit de VFD a bombas de agua helada', desc: 'Ingeniería, suministro e instalación de VFD en bombas existentes | Por equipo', u: 'equipo', bp: 25000, cp: 15000 },
  { name: 'Optimización de secuencia de chillers', desc: 'Programación de lógica de secuenciación óptima de chillers en paralelo', u: 'proyecto', bp: 18000, cp: 10000 },
  { name: 'Implementación de reset de temperatura de agua', desc: 'Programación de reset de temperatura de agua helada según carga (T return)', u: 'proyecto', bp: 12000, cp: 7000 },
  { name: 'Implementación de demanda controlada de ventilación (DCV)', desc: 'Integración de sensores de CO2 para control de ventilación por demanda', u: 'proyecto', bp: 25000, cp: 15000 },
  { name: 'Filtros de alta eficiencia (MERV 13/HEPA) en AHU', desc: 'Suministro y reemplazo de filtros MERV 13/HEPA en manejadoras | Por filtro', u: 'pieza', bp: 350, cp: 180 },
  { name: 'Mantenimiento de filtros HVAC (limpieza/reemplazo)', desc: 'Limpieza o reemplazo de filtros de retorno y suministro | Por equipo', u: 'equipo', bp: 150, cp: 80 },
  { name: 'Economizer (compuerta de aire exterior) para AHU', desc: 'Suministro e instalación de compuerta motorizada + actuador + control', u: 'pieza', bp: 8500, cp: 5000 },
  { name: 'Sensor de flujo de aire (velocidad) para ducto', desc: 'Sensor de velocidad de aire para medición de CFM en ducto | Diferencial', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Analizador de redes eléctricas (portátil)', desc: 'Analizador portátil para estudio de calidad de energía | Instalación + retiro', u: 'proyecto', bp: 8000, cp: 4500 },
  { name: 'Estudio de sombreamiento para edificio', desc: 'Análisis de sombreamiento para optimización de carga solar | Simulación 3D', u: 'proyecto', bp: 15000, cp: 8000 },
  { name: 'Vidrio de control solar (película)', desc: 'Aplicación de película de control solar en vidrios existentes | Por m2', u: 'm2', bp: 350, cp: 200 },
  { name: 'Aislamiento reflectivo (pintura térmica)', desc: 'Aplicación de pintura térmica reflectiva en azotea | Por m2', u: 'm2', bp: 120, cp: 65 },
  { name: 'Losa térmica (panel sandwich aislante)', desc: 'Panel aislante para azotea | Poliuretano 50mm | Por m2', u: 'm2', bp: 450, cp: 280 },
  { name: 'Ventilación natural (louver/ventilación)', desc: 'Louver de ventilación para fachada con malla antipájaros | Por pieza', u: 'pieza', bp: 1200, cp: 700 },
];

// ─ 7d. OBRA CIVIL Y ESTRUCTURAL ──────────────────────────────────────────
const civilWorks = [
  { name: 'Cimentación para equipo HVAC (base de concreto 1x1m)', desc: 'Base de concreto armado 1x1x0.15m para condensadora | Incluye excavación, armado, colado', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Cimentación para equipo HVAC (base de concreto 1.5x1.5m)', desc: 'Base de concreto armado 1.5x1.5x0.20m | Para equipo mediano', u: 'pieza', bp: 4500, cp: 2800 },
  { name: 'Cimentación para equipo HVAC (base de concreto 2x2m)', desc: 'Base de concreto armado 2x2x0.25m | Para equipo grande/rooftop', u: 'pieza', bp: 6500, cp: 4000 },
  { name: 'Cimentación para chiller (dado de concreto)', desc: 'Dado de concreto armado 3x3x0.30m | Con anclas y nivelación', u: 'pieza', bp: 12000, cp: 7000 },
  { name: 'Cimentación para torre de enfriamiento', desc: 'Base de concreto armado + pedestal 4x4m | Con anclas', u: 'pieza', bp: 15000, cp: 9000 },
  { name: 'Cimentación para bomba de agua (base 1x1m)', desc: 'Base de concreto con pedestal para bomba 1x1x0.20m | Con anclas', u: 'pieza', bp: 2000, cp: 1200 },
  { name: 'Dala de cerramiento perimetral para equipo en azotea', desc: 'Dala de concreto armado perimetral para montaje de equipo en azotea', u: 'metro', bp: 350, cp: 200 },
  { name: 'Piso de concreto (pendiente para drenaje equipo)', desc: 'Piso de concreto con pendiente para drenaje de equipo HVAC | Por m2', u: 'm2', bp: 350, cp: 200 },
  { name: 'Mampostería para cuarto de máquinas HVAC', desc: 'Block macizo 15cm con castillos y dalas | Incluye acabado | Por m2', u: 'm2', bp: 550, cp: 350 },
  { name: 'Losa de azotea para montaje de equipo', desc: 'Refuerzo de losa para montaje de equipo HVAC | Incluye estructura metálica', u: 'm2', bp: 1800, cp: 1100 },
  { name: 'Cubierta metálica para equipo en azotea', desc: 'Estructura metálica con lámina para protección de equipos HVAC | Por m2', u: 'm2', bp: 850, cp: 500 },
  { name: 'Pintura de azotea (impermeabilizante)', desc: 'Impermeabilizante acrílico para azotea | 2 capas | Por m2', u: 'm2', bp: 80, cp: 45 },
  { name: 'Pintura de interiores (muros y plafones)', desc: 'Pintura vinílica para espacios interiores | 2 capas | Por m2', u: 'm2', bp: 50, cp: 28 },
  { name: 'Aplanado de muros (repello/fino)', desc: 'Aplanado de muros con mortero cemento-arena + fino | Por m2', u: 'm2', bp: 180, cp: 100 },
  { name: 'Piso cerámico (porcelanato 60x60)', desc: 'Piso cerámico porcelanato 60x60cm colocado | Incluye nivelación', u: 'm2', bp: 350, cp: 200 },
  { name: 'Falso plafón de tablaroca (registro)', desc: 'Falso plafón de tablaroca 12mm con registro de acceso | Por m2', u: 'm2', bp: 280, cp: 160 },
  { name: 'Muro de tablaroca (9mm)', desc: 'Muro divisorio de tablaroca 9mm con estructura metálica | Por m2', u: 'm2', bp: 250, cp: 150 },
  { name: 'Registro de acceso en plafón (60x60cm)', desc: 'Registro de acceso metálico 60x60cm para mantenimiento HVAC en plafón', u: 'pieza', bp: 400, cp: 250 },
  { name: 'Escotilla de acceso a azotea (metálica)', desc: 'Escotilla metálica 60x80cm con bisagras y seguro | Para acceso a azotea', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Perforación en losa (6-8cm diámetro)', desc: 'Perforación con broca de corona en losa de concreto | Para pase de tubería', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Perforación en losa (8-15cm diámetro)', desc: 'Perforación con broca de corona en losa de concreto | Diámetro mayor', u: 'pieza', bp: 500, cp: 300 },
  { name: 'Perforación en muro (6-8cm diámetro)', desc: 'Perforación en muro de concreto/bloque | Para pase de tubería', u: 'pieza', bp: 250, cp: 150 },
  { name: 'Perforación en muro (8-15cm diámetro)', desc: 'Perforación en muro de concreto/bloque | Diámetro mayor', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Sello de paso en losa/muro (fuego/acústico)', desc: 'Sello intumescente/acústico para pase de tubería en losa/muro', u: 'pieza', bp: 180, cp: 100 },
  { name: 'Malla de separación (pasar muros)', desc: 'Malla de protección metálica en pase de muro para evitar entrada de roedores', u: 'pieza', bp: 80, cp: 45 },
  { name: 'Andamio para instalación HVAC (por día)', desc: 'Andamio multidireccional | Incluye armado/desmontaje | Por día', u: 'dia', bp: 800, cp: 450 },
  { name: 'Plataforma elevadora (tijera) 10m', desc: 'Plataforma tijera autopropulsable 10m | Renta por día', u: 'dia', bp: 2500, cp: 1500 },
  { name: 'Pluma articulada (canasta) 20m', desc: 'Pluma articulada 20m | Renta por día', u: 'dia', bp: 4500, cp: 2800 },
  { name: 'Grúa 10T para izaje de equipo', desc: 'Grúa 10T con operador | Incluye maniobra | Por evento', u: 'evento', bp: 8000, cp: 5000 },
  { name: 'Grúa 20T para izaje de equipo', desc: 'Grúa 20T con operador | Incluye maniobra | Por evento', u: 'evento', bp: 12000, cp: 7500 },
  { name: 'Grúa 30T para izaje de equipo', desc: 'Grúa 30T con operador | Incluye maniobra | Por evento', u: 'evento', bp: 18000, cp: 11000 },
  { name: 'Montacargas para maniobra (5T día)', desc: 'Montacargas 5T con operador | Renta por día', u: 'dia', bp: 3500, cp: 2200 },
  { name: 'Polipasto eléctrico para izaje', desc: 'Polipasto eléctrico de cadena 500kg | Instalación en estructura | Por evento', u: 'evento', bp: 1500, cp: 800 },
  { name: 'Línea de vida temporal para techos', desc: 'Instalación de línea de vida temporal para trabajo en azotea | Por evento', u: 'evento', bp: 2500, cp: 1500 },
  { name: 'Renta de equipo de seguridad (arnés + línea + casco)', desc: 'Equipo de protección contra caídas completo | Renta por día', u: 'dia', bp: 250, cp: 120 },
  { name: 'Señalización de obra (cinta, conos, letreros)', desc: 'Señalización temporal de obra | Juego completo por semana', u: 'juego', bp: 500, cp: 250 },
  { name: 'Limpieza final de obra HVAC', desc: 'Limpieza general post-instalación | Retiro de escombros, polvo, residuos', u: 'obra', bp: 5000, cp: 2500 },
];

// ─ 7e. TUBERIA Y ACCESORIOS (EXPANDED) ────────────────────────────────────
const piping = [
  // Steel pipe
  { name: 'Tubería de acero al carbón (cédula 40) 1/2"', desc: 'Tubería de acero al carbón cédula 40 | 6m | Con costura', u: 'metro', bp: 120, cp: 70 },
  { name: 'Tubería de acero al carbón (cédula 40) 3/4"', desc: 'Tubería de acero al carbón cédula 40 | 6m', u: 'metro', bp: 140, cp: 85 },
  { name: 'Tubería de acero al carbón (cédula 40) 1"', desc: 'Tubería de acero al carbón cédula 40 | 6m', u: 'metro', bp: 180, cp: 110 },
  { name: 'Tubería de acero al carbón (cédula 40) 1.5"', desc: 'Tubería de acero al carbón cédula 40 | 6m', u: 'metro', bp: 250, cp: 150 },
  { name: 'Tubería de acero al carbón (cédula 40) 2"', desc: 'Tubería de acero al carbón cédula 40 | 6m', u: 'metro', bp: 320, cp: 200 },
  { name: 'Tubería de acero al carbón (cédula 40) 3"', desc: 'Tubería de acero al carbón cédula 40 | 6m', u: 'metro', bp: 550, cp: 350 },
  { name: 'Tubería de acero al carbón (cédula 40) 4"', desc: 'Tubería de acero al carbón cédula 40 | 6m', u: 'metro', bp: 750, cp: 450 },
  { name: 'Tubería de acero al carbón (cédula 40) 6"', desc: 'Tubería de acero al carbón cédula 40 | 6m', u: 'metro', bp: 1200, cp: 750 },
  { name: 'Tubería de acero al carbón (cédula 40) 8"', desc: 'Tubería de acero al carbón cédula 40 | 6m', u: 'metro', bp: 1800, cp: 1100 },
  { name: 'Tubería de acero al carbón (cédula 40) 10"', desc: 'Tubería de acero al carbón cédula 40 | 6m', u: 'metro', bp: 2500, cp: 1500 },
  { name: 'Tubería de acero al carbón (cédula 40) 12"', desc: 'Tubería de acero al carbón cédula 40 | 6m', u: 'metro', bp: 3500, cp: 2200 },
  // CPVC / PVC for drains
  { name: 'Tubería CPVC (1/2")', desc: 'Tubería CPVC para agua caliente/fría | 6m', u: 'metro', bp: 25, cp: 15 },
  { name: 'Tubería CPVC (3/4")', desc: 'Tubería CPVC para agua caliente/fría | 6m', u: 'metro', bp: 35, cp: 20 },
  { name: 'Tubería CPVC (1")', desc: 'Tubería CPVC para agua caliente/fría | 6m', u: 'metro', bp: 45, cp: 28 },
  { name: 'Tubería CPVC (1.5")', desc: 'Tubería CPVC para agua caliente/fría | 6m', u: 'metro', bp: 65, cp: 40 },
  { name: 'Tubería CPVC (2")', desc: 'Tubería CPVC para agua caliente/fría | 6m', u: 'metro', bp: 90, cp: 55 },
  { name: 'Tubería PVC (1.5") desagüe', desc: 'Tubería PVC para drenaje condensados | 6m', u: 'metro', bp: 25, cp: 14 },
  { name: 'Tubería PVC (2") desagüe', desc: 'Tubería PVC para drenaje condensados | 6m', u: 'metro', bp: 32, cp: 18 },
  { name: 'Tubería PVC (3") desagüe', desc: 'Tubería PVC para drenaje general | 6m', u: 'metro', bp: 45, cp: 25 },
  { name: 'Tubería PVC (4") desagüe', desc: 'Tubería PVC para drenaje general | 6m', u: 'metro', bp: 60, cp: 35 },
  // Steel fittings
  { name: 'Codo de acero 90° (céd. 40, 1/2")', desc: 'Codo 90° de acero al carbón cédula 40 | Roscado', u: 'pieza', bp: 18, cp: 10 },
  { name: 'Codo de acero 90° (céd. 40, 3/4")', desc: 'Codo 90° de acero al carbón cédula 40 | Roscado', u: 'pieza', bp: 22, cp: 12 },
  { name: 'Codo de acero 90° (céd. 40, 1")', desc: 'Codo 90° de acero al carbón cédula 40 | Roscado', u: 'pieza', bp: 28, cp: 16 },
  { name: 'Codo de acero 90° (céd. 40, 1.5")', desc: 'Codo 90° de acero al carbón cédula 40 | Roscado', u: 'pieza', bp: 40, cp: 24 },
  { name: 'Codo de acero 90° (céd. 40, 2")', desc: 'Codo 90° de acero al carbón cédula 40 | Roscado', u: 'pieza', bp: 55, cp: 32 },
  { name: 'Tee de acero (céd. 40, 1/2")', desc: 'Tee de acero al carbón cédula 40 | Roscada', u: 'pieza', bp: 35, cp: 20 },
  { name: 'Tee de acero (céd. 40, 3/4")', desc: 'Tee de acero al carbón cédula 40 | Roscada', u: 'pieza', bp: 42, cp: 25 },
  { name: 'Tee de acero (céd. 40, 1")', desc: 'Tee de acero al carbón cédula 40 | Roscada', u: 'pieza', bp: 55, cp: 32 },
  { name: 'Tee de acero (céd. 40, 2")', desc: 'Tee de acero al carbón cédula 40 | Roscada', u: 'pieza', bp: 85, cp: 50 },
  { name: 'Reducción campaña acero 1/2-3/4"', desc: 'Reducción campaña de acero al carbón', u: 'pieza', bp: 25, cp: 14 },
  { name: 'Reducción campaña acero 3/4-1"', desc: 'Reducción campaña de acero al carbón', u: 'pieza', bp: 30, cp: 18 },
  { name: 'Reducción campaña acero 1-2"', desc: 'Reducción campaña de acero al carbón', u: 'pieza', bp: 45, cp: 28 },
  { name: 'Tapón macho de acero (1/2")', desc: 'Tapón macho de acero al carbón', u: 'pieza', bp: 12, cp: 6 },
  { name: 'Tapón macho de acero (3/4")', desc: 'Tapón macho de acero al carbón', u: 'pieza', bp: 14, cp: 8 },
  { name: 'Tapón macho de acero (1")', desc: 'Tapón macho de acero al carbón', u: 'pieza', bp: 18, cp: 10 },
  { name: 'Tapón macho de acero (2")', desc: 'Tapón macho de acero al carbón', u: 'pieza', bp: 25, cp: 14 },
  { name: 'Niple de acero (1/2 x 10cm)', desc: 'Niple de acero al carbón roscado 1/2" x 10cm', u: 'pieza', bp: 12, cp: 6 },
  { name: 'Niple de acero (3/4 x 10cm)', desc: 'Niple de acero al carbón roscado 3/4" x 10cm', u: 'pieza', bp: 14, cp: 8 },
  { name: 'Niple de acero (1 x 15cm)', desc: 'Niple de acero al carbón roscado 1" x 15cm', u: 'pieza', bp: 18, cp: 10 },
  { name: 'Niple de acero (2 x 15cm)', desc: 'Niple de acero al carbón roscado 2" x 15cm', u: 'pieza', bp: 28, cp: 16 },
  // Flanges & gaskets
  { name: 'Brida de acero (1/2", 150LB)', desc: 'Brida de acero al carbón 150LB | Roscada o soldable', u: 'pieza', bp: 45, cp: 28 },
  { name: 'Brida de acero (3/4", 150LB)', desc: 'Brida de acero al carbón 150LB', u: 'pieza', bp: 50, cp: 30 },
  { name: 'Brida de acero (1", 150LB)', desc: 'Brida de acero al carbón 150LB', u: 'pieza', bp: 60, cp: 35 },
  { name: 'Brida de acero (2", 150LB)', desc: 'Brida de acero al carbón 150LB', u: 'pieza', bp: 85, cp: 50 },
  { name: 'Brida de acero (3", 150LB)', desc: 'Brida de acero al carbón 150LB', u: 'pieza', bp: 120, cp: 70 },
  { name: 'Brida de acero (4", 150LB)', desc: 'Brida de acero al carbón 150LB', u: 'pieza', bp: 160, cp: 95 },
  { name: 'Brida de acero (6", 150LB)', desc: 'Brida de acero al carbón 150LB', u: 'pieza', bp: 250, cp: 150 },
  { name: 'Brida de acero (8", 150LB)', desc: 'Brida de acero al carbón 150LB', u: 'pieza', bp: 350, cp: 220 },
  { name: 'Brida de acero (10", 150LB)', desc: 'Brida de acero al carbón 150LB', u: 'pieza', bp: 500, cp: 300 },
  { name: 'Junta (empaque) de neopreno 1/2"', desc: 'Junta de neopreno para brida 1/2" 150LB', u: 'pieza', bp: 12, cp: 6 },
  { name: 'Junta (empaque) de neopreno 1"', desc: 'Junta de neopreno para brida 1" 150LB', u: 'pieza', bp: 15, cp: 8 },
  { name: 'Junta (empaque) de neopreno 2"', desc: 'Junta de neopreno para brida 2" 150LB', u: 'pieza', bp: 18, cp: 10 },
  { name: 'Junta (empaque) de neopreno 4"', desc: 'Junta de neopreno para brida 4" 150LB', u: 'pieza', bp: 25, cp: 14 },
  { name: 'Junta (empaque) de neopreno 6"', desc: 'Junta de neopreno para brida 6" 150LB', u: 'pieza', bp: 35, cp: 20 },
  { name: 'Junta (empaque) de neopreno 8"', desc: 'Junta de neopreno para brida 8" 150LB', u: 'pieza', bp: 45, cp: 28 },
  { name: 'Junta (empaque) de neopreno 10"', desc: 'Junta de neopreno para brida 10" 150LB', u: 'pieza', bp: 55, cp: 32 },
  // Unions & couplings
  { name: 'Unión universal de acero (1/2")', desc: 'Unión universal de acero al carbón roscada', u: 'pieza', bp: 35, cp: 20 },
  { name: 'Unión universal de acero (3/4")', desc: 'Unión universal de acero al carbón roscada', u: 'pieza', bp: 42, cp: 25 },
  { name: 'Unión universal de acero (1")', desc: 'Unión universal de acero al carbón roscada', u: 'pieza', bp: 50, cp: 30 },
  { name: 'Unión universal de acero (2")', desc: 'Unión universal de acero al carbón roscada', u: 'pieza', bp: 85, cp: 50 },
  // Pipe supports
  { name: 'Soporte de tubería (abrazadera acero) 1/2"', desc: 'Abrazadera de acero para tubería 1/2" | Con inserto de hule', u: 'pieza', bp: 15, cp: 8 },
  { name: 'Soporte de tubería (abrazadera acero) 3/4"', desc: 'Abrazadera de acero para tubería 3/4"', u: 'pieza', bp: 18, cp: 10 },
  { name: 'Soporte de tubería (abrazadera acero) 1"', desc: 'Abrazadera de acero para tubería 1"', u: 'pieza', bp: 20, cp: 12 },
  { name: 'Soporte de tubería (abrazadera acero) 2"', desc: 'Abrazadera de acero para tubería 2"', u: 'pieza', bp: 28, cp: 16 },
  { name: 'Soporte de tubería (abrazadera acero) 4"', desc: 'Abrazadera de acero para tubería 4"', u: 'pieza', bp: 45, cp: 28 },
  { name: 'Soporte de tubería (abrazadera acero) 6"', desc: 'Abrazadera de acero para tubería 6"', u: 'pieza', bp: 65, cp: 40 },
  { name: 'Soporte de tubería (abrazadera acero) 8"', desc: 'Abrazadera de acero para tubería 8" | Con inserts', u: 'pieza', bp: 90, cp: 55 },
  { name: 'Colgante de tubería ajustable (3/8"-1")', desc: 'Colgante ajustable para tubería 3/8" a 1" | Con varilla + tuerca', u: 'pieza', bp: 25, cp: 14 },
  { name: 'Colgante de tubería ajustable (1.5"-3")', desc: 'Colgante ajustable para tubería 1.5" a 3"', u: 'pieza', bp: 35, cp: 20 },
  { name: 'Colgante de tubería ajustable (4"-8")', desc: 'Colgante ajustable para tubería 4" a 8"', u: 'pieza', bp: 55, cp: 32 },
  { name: 'Soporte de resorte para tubería (1"-3")', desc: 'Soporte de resorte para tubería | Amortiguación de vibraciones', u: 'pieza', bp: 280, cp: 160 },
  { name: 'Canaleta para tubería (unistrut) 41x41mm 3m', desc: 'Canal estructural 41x41mm | Galvanizado | 3m', u: 'pieza', bp: 180, cp: 110 },
  { name: 'Canaleta para tubería (unistrut) 41x82mm 3m', desc: 'Canal estructural 41x82mm | Galvanizado | 3m', u: 'pieza', bp: 280, cp: 170 },
  { name: 'Tuerca canal (unistrut) 3/8"', desc: 'Tuerca para canal estructural 3/8" | Galvanizada', u: 'pieza', bp: 8, cp: 4 },
  { name: 'Tuerca canal (unistrut) 1/2"', desc: 'Tuerca para canal estructural 1/2" | Galvanizada', u: 'pieza', bp: 10, cp: 5 },
  { name: 'Tuerca canal (unistrut) 5/8"', desc: 'Tuerca para canal estructural 5/8" | Galvanizada', u: 'pieza', bp: 12, cp: 6 },
  // Water tank accessories
  { name: 'Tanque de expansión para agua helada (5L)', desc: 'Tanque de expansión tipo membrana para agua helada 5L | 10 bar', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Tanque de expansión para agua helada (12L)', desc: 'Tanque de expansión tipo membrana 12L | 10 bar', u: 'pieza', bp: 1800, cp: 1100 },
  { name: 'Tanque de expansión para agua helada (25L)', desc: 'Tanque de expansión tipo membrana 25L | 10 bar', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Tanque de expansión para agua helada (50L)', desc: 'Tanque de expansión tipo membrana 50L | 10 bar', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Tanque de expansión para calefacción (5L)', desc: 'Tanque de expansión tipo membrana para calefacción 5L | 6 bar', u: 'pieza', bp: 1000, cp: 600 },
  { name: 'Tanque de expansión para calefacción (12L)', desc: 'Tanque de expansión tipo membrana 12L | 6 bar', u: 'pieza', bp: 1500, cp: 900 },
  { name: 'Tanque de expansión para calefacción (25L)', desc: 'Tanque de expansión tipo membrana 25L | 6 bar', u: 'pieza', bp: 2200, cp: 1400 },
  { name: 'Vaso de expansión (tanque) abierto 200L', desc: 'Tanque de expansión abierto atmosférico 200L | Con flotador', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Tanque de almacenamiento de agua helada (1000L)', desc: 'Tanque de almacenamiento de agua helada 1000L | Acero con aislamiento', u: 'pieza', bp: 15000, cp: 9000 },
  { name: 'Tanque de almacenamiento de agua helada (5000L)', desc: 'Tanque de almacenamiento de agua helada 5000L | Acero con aislamiento', u: 'pieza', bp: 45000, cp: 28000 },
  { name: 'Separador de aire (air separator)', desc: 'Separador de aire para sistema hidrónico | 2" | Con purga', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Separador de lodos (dirt separator)', desc: 'Separador de lodos magnético para sistema hidrónico | 1"', u: 'pieza', bp: 1800, cp: 1100 },
  { name: 'Válvula purga de aire automática', desc: 'Purgador automático de aire para sistemas hidrónicos | 1/2" NPT', u: 'pieza', bp: 180, cp: 100 },
  { name: 'Válvula de llenado/purga manual', desc: 'Válvula de llenado y purga manual | 1/2" NPT | Con manguera', u: 'pieza', bp: 150, cp: 85 },
  // Manometers & gauges
  { name: 'Manómetro (0-100 PSI, 63mm)', desc: 'Manómetro de glicerina 0-100 PSI | 63mm | 1/4" NPT', u: 'pieza', bp: 180, cp: 100 },
  { name: 'Manómetro (0-160 PSI, 63mm)', desc: 'Manómetro de glicerina 0-160 PSI | 63mm | 1/4" NPT', u: 'pieza', bp: 180, cp: 100 },
  { name: 'Manómetro (0-300 PSI, 63mm)', desc: 'Manómetro de glicerina 0-300 PSI | 63mm | 1/4" NPT', u: 'pieza', bp: 200, cp: 120 },
  { name: 'Manómetro (0-600 PSI, 63mm)', desc: 'Manómetro de glicerina 0-600 PSI | 63mm | 1/4" NPT', u: 'pieza', bp: 220, cp: 130 },
  { name: 'Termómetro bimetálico (0-120°C, 63mm)', desc: 'Termómetro bimetálico 0-120°C | 63mm | 1/2" NPT', u: 'pieza', bp: 280, cp: 160 },
  { name: 'Termómetro bimetálico (0-200°C, 63mm)', desc: 'Termómetro bimetálico 0-200°C | 63mm | 1/2" NPT', u: 'pieza', bp: 300, cp: 180 },
  { name: 'Válvula check oscilante (bridada) 2"', desc: 'Válvula check oscilante tipo wafer bridada 2"', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Válvula check oscilante (bridada) 4"', desc: 'Válvula check oscilante tipo wafer bridada 4"', u: 'pieza', bp: 2200, cp: 1400 },
  { name: 'Válvula check oscilante (bridada) 6"', desc: 'Válvula check oscilante tipo wafer bridada 6"', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Válvula check oscilante (bridada) 8"', desc: 'Válvula check oscilante tipo wafer bridada 8"', u: 'pieza', bp: 5500, cp: 3500 },
  { name: 'Filtro Y (coladera) 1/2"', desc: 'Filtro tipo Y coladera para agua 1/2" | Bronce | Mallada', u: 'pieza', bp: 120, cp: 70 },
  { name: 'Filtro Y (coladera) 3/4"', desc: 'Filtro tipo Y coladera para agua 3/4" | Bronce', u: 'pieza', bp: 140, cp: 85 },
  { name: 'Filtro Y (coladera) 1"', desc: 'Filtro tipo Y coladera para agua 1" | Bronce', u: 'pieza', bp: 180, cp: 110 },
  { name: 'Filtro Y (coladera) 2"', desc: 'Filtro tipo Y coladera para agua 2" | Hierro fundido', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Filtro Y (coladera) 4"', desc: 'Filtro tipo Y coladera para agua 4" | Hierro fundido', u: 'pieza', bp: 650, cp: 400 },
  { name: 'Filtro Y (coladera) 6"', desc: 'Filtro tipo Y coladera para agua 6" | Hierro fundido', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Venteo / Tubería de venteo para caldera', desc: 'Tubería de venteo concéntrica para caldera de gas 2"-4" | Por metro', u: 'metro', bp: 350, cp: 200 },
  { name: 'Junta de expansión (dilatación) 2"', desc: 'Junta de dilatación flexible 2" | Para tubería hidrónica | 150LB', u: 'pieza', bp: 850, cp: 500 },
  { name: 'Junta de expansión (dilatación) 4"', desc: 'Junta de dilatación flexible 4" | Para tubería hidrónica', u: 'pieza', bp: 1500, cp: 900 },
  { name: 'Junta de expansión (dilatación) 8"', desc: 'Junta de dilatación flexible 8" | Para tubería hidrónica', u: 'pieza', bp: 2800, cp: 1700 },
];

// ─ 7f. EXPANDED DUCTERIA ──────────────────────────────────────────────────
const ducteriaExpanded = [
  { name: 'Tee de lámina galvanizada (rectangular) 12x12"', desc: 'Tee de lámina galvanizada cal. 24 | 12x12" | 3 salidas', u: 'pieza', bp: 280, cp: 160 },
  { name: 'Codo de lámina galvanizada (rectangular) 12x12"', desc: 'Codo 90° de lámina galvanizada cal. 24 | 12x12" | Con aspas directrices', u: 'pieza', bp: 220, cp: 130 },
  { name: 'Codo de lámina galvanizada (rectangular) 18x18"', desc: 'Codo 90° de lámina galvanizada cal. 22 | 18x18" | Con aspas', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Codo de lámina galvanizada (rectangular) 24x24"', desc: 'Codo 90° de lámina galvanizada cal. 22 | 24x24" | Con aspas', u: 'pieza', bp: 500, cp: 300 },
  { name: 'Transición de lámina galvanizada (concéntrica)', desc: 'Transición concéntrica de lámina galvanizada | Por pieza', u: 'pieza', bp: 250, cp: 150 },
  { name: 'Plenum de lámina galvanizada para difusor', desc: 'Plenum de conexión para difusor de 12x12" | Con aislamiento interno', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Difusor de aluminio (400x400mm)', desc: 'Difusor de aluminio anodizado 400x400mm | Para impulsión', u: 'pieza', bp: 250, cp: 150 },
  { name: 'Difusor de aluminio (600x600mm)', desc: 'Difusor de aluminio anodizado 600x600mm | Para impulsión', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Difusor lineal (1.2m)', desc: 'Difusor lineal de aluminio 1.2m | Ranura 25mm | Para impulsión', u: 'pieza', bp: 450, cp: 280 },
  { name: 'Difusor lineal (2.4m)', desc: 'Difusor lineal de aluminio 2.4m | Ranura 25mm | Para impulsión', u: 'pieza', bp: 800, cp: 500 },
  { name: 'Rejilla de retorno (400x400mm)', desc: 'Rejilla de retorno de aluminio 400x400mm | Con malla', u: 'pieza', bp: 180, cp: 100 },
  { name: 'Rejilla de retorno (600x600mm)', desc: 'Rejilla de retorno de aluminio 600x600mm | Con malla', u: 'pieza', bp: 280, cp: 160 },
  { name: 'Rejilla de transferencia (400x200mm)', desc: 'Rejilla de transferencia 400x200mm | Aleta fija | Para paso de aire entre espacios', u: 'pieza', bp: 150, cp: 85 },
  { name: 'Rejilla de transferencia (600x300mm)', desc: 'Rejilla de transferencia 600x300mm | Aleta fija', u: 'pieza', bp: 220, cp: 130 },
  { name: 'Compuerta de regulación manual (12x12")', desc: 'Compuerta de regulación manual 12x12" | Lámina galvanizada | Con palanca', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Compuerta de regulación manual (18x18")', desc: 'Compuerta de regulación manual 18x18" | Lámina galvanizada | Con palanca', u: 'pieza', bp: 500, cp: 300 },
  { name: 'Compuerta cortafuego (12x12")', desc: 'Compuerta cortafuego 12x12" | Fusible 165°F | UL 555', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Compuerta cortafuego (24x24")', desc: 'Compuerta cortafuego 24x24" | Fusible 165°F | UL 555', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Trampa de sonido / silenciador (12x12", 1.2m)', desc: 'Silenciador para ducto rectangular 12x12" | 1.2m | Atenuación 15dB', u: 'pieza', bp: 1800, cp: 1100 },
  { name: 'Trampa de sonido / silenciador (24x24", 1.5m)', desc: 'Silenciador para ducto rectangular 24x24" | 1.5m | Atenuación 20dB', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Trampa de sonido / silenciador (circular 12")', desc: 'Silenciador para ducto circular 12" | 1.0m | Atenuación 15dB', u: 'pieza', bp: 2200, cp: 1400 },
  { name: 'Anemostato / difusor de aire (250mm)', desc: 'Difusor circular de aire anemostato 250mm | PVC o metal', u: 'pieza', bp: 180, cp: 100 },
  { name: 'Anemostato / difusor de aire (350mm)', desc: 'Difusor circular de aire anemostato 350mm | PVC o metal', u: 'pieza', bp: 250, cp: 150 },
  { name: 'Ducto circular espiral (6", m)', desc: 'Ducto de acero galvanizado circular espiral 6" | Por metro', u: 'metro', bp: 120, cp: 70 },
  { name: 'Ducto circular espiral (8", m)', desc: 'Ducto de acero galvanizado circular espiral 8" | Por metro', u: 'metro', bp: 150, cp: 90 },
  { name: 'Ducto circular espiral (10", m)', desc: 'Ducto de acero galvanizado circular espiral 10" | Por metro', u: 'metro', bp: 180, cp: 110 },
  { name: 'Ducto circular espiral (12", m)', desc: 'Ducto de acero galvanizado circular espiral 12" | Por metro', u: 'metro', bp: 220, cp: 130 },
  { name: 'Ducto circular espiral (14", m)', desc: 'Ducto de acero galvanizado circular espiral 14" | Por metro', u: 'metro', bp: 250, cp: 150 },
  { name: 'Ducto circular espiral (16", m)', desc: 'Ducto de acero galvanizado circular espiral 16" | Por metro', u: 'metro', bp: 300, cp: 180 },
  { name: 'Ducto circular espiral (18", m)', desc: 'Ducto de acero galvanizado circular espiral 18" | Por metro', u: 'metro', bp: 350, cp: 220 },
  { name: 'Ducto circular espiral (20", m)', desc: 'Ducto de acero galvanizado circular espiral 20" | Por metro', u: 'metro', bp: 400, cp: 250 },
  { name: 'Codo circular espiral 90° (8")', desc: 'Codo 90° de ducto circular espiral 8" | Galvanizado', u: 'pieza', bp: 180, cp: 100 },
  { name: 'Codo circular espiral 90° (12")', desc: 'Codo 90° de ducto circular espiral 12" | Galvanizado', u: 'pieza', bp: 250, cp: 150 },
  { name: 'Codo circular espiral 90° (18")', desc: 'Codo 90° de ducto circular espiral 18" | Galvanizado', u: 'pieza', bp: 400, cp: 250 },
  { name: 'Tee circular espiral (12")', desc: 'Tee de ducto circular espiral 12" | Galvanizado', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Sombrero / tapa para ducto circular (8")', desc: 'Sombrero de protección para ducto circular 8" | Intemperie | Galvanizado', u: 'pieza', bp: 180, cp: 100 },
  { name: 'Sombrero / tapa para ducto circular (12")', desc: 'Sombrero de protección para ducto circular 12" | Intemperie | Galvanizado', u: 'pieza', bp: 280, cp: 160 },
  { name: 'Ducto flexible metálico (6")', desc: 'Ducto flexible de aluminio 6" | Por metro', u: 'metro', bp: 60, cp: 35 },
  { name: 'Ducto flexible metálico (8")', desc: 'Ducto flexible de aluminio 8" | Por metro', u: 'metro', bp: 80, cp: 45 },
  { name: 'Ducto flexible metálico (10")', desc: 'Ducto flexible de aluminio 10" | Por metro', u: 'metro', bp: 100, cp: 60 },
  { name: 'Ducto flexible metálico (12")', desc: 'Ducto flexible de aluminio 12" | Por metro', u: 'metro', bp: 120, cp: 70 },
  { name: 'Tornillo Parker (autotaladrante, caja 1000pz)', desc: 'Tornillo autotaladrante Parker 8x1/2" | Para ductería | Caja 1000 piezas', u: 'caja', bp: 350, cp: 200 },
  { name: 'Tornillo Parker (autotaladrante, caja 500pz)', desc: 'Tornillo autotaladrante Parker 8x3/4" | Caja 500 piezas', u: 'caja', bp: 250, cp: 150 },
  { name: 'Cinta de aluminio para ducto (50m)', desc: 'Cinta de aluminio para sellado de ductos | 50 metros', u: 'rollo', bp: 85, cp: 50 },
  { name: 'Cemento PVC para ducto flexible', desc: 'Cemento adhesivo para ducto flexible PVC', u: 'litro', bp: 80, cp: 45 },
  { name: 'Mastic sellador para ductos (galón)', desc: 'Mastic sellador acrílico para ductos metálicos | Galón', u: 'galon', bp: 350, cp: 200 },
  { name: 'Grapa tipo S para ducto circular (caja 100)', desc: 'Grapa de unión tipo S para ducto circular | Caja 100 piezas', u: 'caja', bp: 180, cp: 100 },
  { name: 'Brida TDC / TDF para ducto (kit por pieza)', desc: 'Brida tipo TDC/TDF para ducto rectangular | Acero galvanizado | Completa', u: 'pieza', bp: 65, cp: 38 },
  { name: 'Kit de colgante para ductos (varilla + ancla)', desc: 'Kit de colgante para ductería | Varilla 3/8" + ancla de expansión + tuerca', u: 'pieza', bp: 18, cp: 10 },
];

// ─ 7g. INSTRUMENTACION ────────────────────────────────────────────────────
const instrumentation = [
  { name: 'Manómetro diferencial (0-500 Pa)', desc: 'Manómetro diferencial digital 0-500 Pa | Precisión ±1% | Para ductos/VAV', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Anemómetro de hilo caliente', desc: 'Anemómetro de hilo caliente 0-30 m/s | Precisión ±3% | Con sensor telescópico', u: 'pieza', bp: 5500, cp: 3500 },
  { name: 'Anemómetro de aspas', desc: 'Anemómetro de aspas 0-45 m/s | Diámetro 100mm | Para ducto', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Medidor de flujo de aire (balometer)', desc: 'Balometer para medir CFM en difusores/rejillas | Rango 50-3000 CFM', u: 'pieza', bp: 15000, cp: 9000 },
  { name: 'Manómetro de presión de aceite (chiller)', desc: 'Manómetro de presión de aceite para compresor chiller 0-500 PSI', u: 'pieza', bp: 450, cp: 280 },
  { name: 'Mirilla (sight glass) para refrigerante 1/4"', desc: 'Mirilla para flujo de refrigerante 1/4" | Con indicador de humedad', u: 'pieza', bp: 180, cp: 100 },
  { name: 'Mirilla (sight glass) para refrigerante 3/8"', desc: 'Mirilla con indicador de humedad 3/8"', u: 'pieza', bp: 200, cp: 120 },
  { name: 'Mirilla (sight glass) para refrigerante 1/2"', desc: 'Mirilla con indicador de humedad 1/2"', u: 'pieza', bp: 220, cp: 130 },
  { name: 'Mirilla (sight glass) para refrigerante 5/8"', desc: 'Mirilla con indicador de humedad 5/8"', u: 'pieza', bp: 250, cp: 150 },
  { name: 'Indicador de flujo (flow switch) paddle', desc: 'Flow switch tipo paddle 1/2" NPT | Conmutador SPDT', u: 'pieza', bp: 450, cp: 280 },
  { name: 'Medidor de presión estática/velocidad (Pitot)', desc: 'Tubo de Pitot tipo S con conector para manómetro diferencial', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Calibrador de sensores de temperatura (dry block)', desc: 'Calibrador de temperatura de bloque seco | Rango -20 a 200°C | Precisión ±0.1°C', u: 'pieza', bp: 18000, cp: 11000 },
  { name: 'Miliamperímetro de lazo (4-20mA)', desc: 'Milíamperímetro de lazo 4-20mA | Para calibración de sensores', u: 'pieza', bp: 2800, cp: 1700 },
  { name: 'Megóhmetro (megger 5000V)', desc: 'Megóhmetro 5000V | Para prueba de aislamiento en motores/cables', u: 'pieza', bp: 6500, cp: 4000 },
  { name: 'Tacómetro (medidor de RPM)', desc: 'Tacómetro digital | Por contacto y óptico | Para medir RPM de motores/ventiladores', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Sonómetro (medidor de ruido)', desc: 'Sonómetro digital 30-130 dB | Precisión ±1.5 dB | Para mediciones acústicas', u: 'pieza', bp: 2000, cp: 1200 },
  { name: 'Cámara termográfica (básica)', desc: 'Cámara termográfica infrarroja 80x60 píxeles | Rango -20 a 400°C', u: 'pieza', bp: 15000, cp: 9000 },
  { name: 'Cámara termográfica (profesional)', desc: 'Cámara termográfica 320x240 píxeles | Rango -20 a 650°C | Enfoque automático', u: 'pieza', bp: 45000, cp: 28000 },
  { name: 'Registrador de datos (datalogger) temperatura', desc: 'Datalogger de temperatura | 4 canales | Incluye sensores | Software', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Registrador de energía (datalogger eléctrico)', desc: 'Datalogger de energía trifásico | Voltaje, corriente, kW, kWh | 7 días', u: 'pieza', bp: 12000, cp: 7000 },
  { name: 'Caja de herramientas (metálica 18")', desc: 'Caja de herramientas metálica 18" | Con compartimentos y candado', u: 'pieza', bp: 550, cp: 350 },
  { name: 'Cinturón de herramientas (portaherramientas)', desc: 'Cinturón portaherramientas de lona con bolsas múltiples', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Chaleco de trabajo con bolsas', desc: 'Chaleco de trabajo ligero con múltiples bolsas | Cierre delantero', u: 'pieza', bp: 250, cp: 150 },
  { name: 'Lámpara de trabajo (LED 2000 lúmenes)', desc: 'Lámpara de trabajo LED recargable 2000 lúmenes | Base magnética', u: 'pieza', bp: 500, cp: 300 },
  { name: 'Lámpara de trabajo (LED 5000 lúmenes)', desc: 'Lámpara de trabajo LED recargable 5000 lúmenes | Trípode | 5m cable', u: 'pieza', bp: 1200, cp: 700 },
];

// ─ 7h. SISTEMAS DE TRATAMIENTO DE AGUA ────────────────────────────────────
const waterTreatment = [
  { name: 'Dosificador de químicos para torre de enfriamiento', desc: 'Sistema dosificador de químicos automático para torre de enfriamiento | 3 bombas', u: 'sistema', bp: 18000, cp: 11000 },
  { name: 'Bomba dosificadora de químicos (diafragma)', desc: 'Bomba dosificadora de diafragma 0-5 GPH | 220V | Ajustable', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Tanque de almacenamiento de químicos (200L)', desc: 'Tanque de polietileno 200L para químicos de tratamiento de agua', u: 'pieza', bp: 1500, cp: 900 },
  { name: 'Tanque de almacenamiento de químicos (500L)', desc: 'Tanque de polietileno 500L para químicos de tratamiento de agua', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Inhibidor de corrosión para agua helada (galón)', desc: 'Químico inhibidor de corrosión para sistemas de agua helada | Galón 3.78L', u: 'galon', bp: 450, cp: 280 },
  { name: 'Inhibidor de sarro para agua helada (galón)', desc: 'Químico inhibidor de sarro para sistemas de agua helada | Galón 3.78L', u: 'galon', bp: 380, cp: 220 },
  { name: 'Bactericida / alguicida para torre de enfriamiento (galón)', desc: 'Bactericida y alguicida para torre de enfriamiento | Galón 3.78L', u: 'galon', bp: 350, cp: 200 },
  { name: 'Dispersante de sólidos para torre de enfriamiento (galón)', desc: 'Dispersante para torre de enfriamiento | Galón 3.78L', u: 'galon', bp: 320, cp: 180 },
  { name: 'Kit analizador de agua (pH, conductividad, dureza)', desc: 'Kit portátil de análisis de agua para torre/sistema hidrónico', u: 'kit', bp: 2500, cp: 1500 },
  { name: 'Medidor de pH portátil', desc: 'Medidor de pH digital portátil | Precisión ±0.01 | Con electrodo', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Medidor de conductividad (TDS) portátil', desc: 'Medidor de conductividad y TDS portátil | Rango 0-9999 µS', u: 'pieza', bp: 800, cp: 500 },
  { name: 'Válvula de desague automático para torre', desc: 'Válvula de purga/blowdown automática por conductividad para torre de enfriamiento', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Filtro de agua de reposición para torre', desc: 'Filtro de agua para reposición de torre de enfriamiento | 1" | Automático', u: 'pieza', bp: 4500, cp: 2800 },
  { name: 'Ablandador de agua (suavizador) 1.5 ft3', desc: 'Suavizador de agua automático 1.5 ft3 resina | Para caldera/chiller', u: 'sistema', bp: 12000, cp: 7000 },
  { name: 'Purga automática de sólidos (sedimaster) para caldera', desc: 'Purga automática de fondo para caldera | Temporizada o por TDS', u: 'pieza', bp: 5000, cp: 3000 },
  { name: 'Muestreador de agua de caldera', desc: 'Muestreador de agua para caldera | Enfriamiento de muestra incluido', u: 'pieza', bp: 1500, cp: 900 },
  { name: 'Desaireador (deaerator) para caldera', desc: 'Tanque desaireador y calentador de agua de alimentación para caldera', u: 'sistema', bp: 45000, cp: 28000 },
  { name: 'Filtro de carbón activado (12x52")', desc: 'Filtro de carbón activado 12x52" | Para pretratamiento de agua de caldera', u: 'sistema', bp: 8500, cp: 5000 },
  { name: 'Servicio de análisis de agua (muestra)', desc: 'Análisis químico completo de agua | pH, TDS, dureza, alcalinidad, sílice, hierro | Reporte', u: 'muestra', bp: 800, cp: 400 },
  { name: 'Servicio de análisis bacteriológico de agua', desc: 'Análisis bacteriológico de agua | Coliformes, mesófilos, legionela | Reporte', u: 'muestra', bp: 1500, cp: 800 },
];

// ─ 7i. SISTEMAS DE PROTECCION CONTRA INCENDIO (relacionado HVAC) ────────
const fireProtection = [
  { name: 'Detección de humo en ducto (DUCT DETECTOR)', desc: 'Detector de humo para ducto HVAC | 24V | Relé de alarma | Con puertos de muestreo', u: 'pieza', bp: 1500, cp: 900 },
  { name: 'Detección de humo en ducto (addressable)', desc: 'Detector de humo direccionable para ducto | Con display LED', u: 'pieza', bp: 2200, cp: 1400 },
  { name: 'Compuerta cortafuego (UL 555) motorizada', desc: 'Compuerta cortafuego motorizada 24V | UL 555 | Con actuador', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Sello cortafuego para pase de tubería', desc: 'Sello intumescente para pase de tubería a través de muros/losas | Cada', u: 'pieza', bp: 250, cp: 150 },
  { name: 'Panel de control de compuertas cortafuego', desc: 'Panel de monitoreo y control de compuertas cortafuego | 24V | 8 zonas', u: 'pieza', bp: 8000, cp: 5000 },
  { name: 'Extintor de CO2 (5 lb)', desc: 'Extintor de CO2 para sala de máquinas/equipos eléctricos | 5 lb', u: 'pieza', bp: 1200, cp: 700 },
  { name: 'Extintor de polvo químico seco (ABC 6 kg)', desc: 'Extintor ABC multipropósito 6 kg', u: 'pieza', bp: 350, cp: 200 },
  { name: 'Extintor de polvo químico seco (ABC 9 kg)', desc: 'Extintor ABC multipropósito 9 kg', u: 'pieza', bp: 450, cp: 280 },
  { name: 'Señalización de seguridad (ruta de evacuación)', desc: 'Señalización fotoluminiscente de ruta de evacuación y equipos contra incendio', u: 'pieza', bp: 120, cp: 65 },
  { name: 'Manguera contra incendio (1.5" x 30m)', desc: 'Manguera contra incendio 1.5" x 30 metros | Con conexiones', u: 'pieza', bp: 2500, cp: 1500 },
  { name: 'Gabinete contra incendio (1.5" con manguera)', desc: 'Gabinete metálico con manguera 30m, válvula, pitón', u: 'pieza', bp: 3500, cp: 2200 },
  { name: 'Rociador automático (sprinkler 1/2" 68°C)', desc: 'Rociador automático para sistema contra incendio | 1/2" | 68°C | Response estándar', u: 'pieza', bp: 120, cp: 70 },
  { name: 'Rociador automático (sprinkler 1/2" 68°C QR)', desc: 'Rociador automático de respuesta rápida | 1/2" | 68°C', u: 'pieza', bp: 150, cp: 90 },
  { name: 'Válvula de compuerta para sistema contra incendio (4")', desc: 'Válvula de compuerta con indicador de vástago (OS&Y) | 4" | Hierro', u: 'pieza', bp: 3500, cp: 2200 },
];

// ─ 7j. PLANES Y CONTRATOS DE MANTENIMIENTO ───────────────────────────────
const maintenancePlans = [
  { name: 'Plan básico minisplit (1-2 equipos, visita semestral)', desc: 'Mantenimiento preventivo semestral | Limpieza de filtros, evaporadora, condensadora, revisión eléctrica', u: 'plan/anual', bp: 2500, cp: 1200 },
  { name: 'Plan completo minisplit (1-5 equipos, visita trimestral)', desc: 'Mantenimiento preventivo trimestral | Limpieza profunda + revisión completa | Reporte digital', u: 'plan/anual', bp: 6000, cp: 3000 },
  { name: 'Plan completo minisplit (6-15 equipos, visita trimestral)', desc: 'Mantenimiento preventivo trimestral | Prioridad en fallas | Reportes', u: 'plan/anual', bp: 15000, cp: 7500 },
  { name: 'Plan completo minisplit (16-50 equipos, visita bimestral)', desc: 'Mantenimiento preventivo bimestral | Atención prioritaria 24/7 | Reportes ejecutivos', u: 'plan/anual', bp: 35000, cp: 18000 },
  { name: 'Plan VRF (por sistema, visita cuatrimestral)', desc: 'Mantenimiento preventivo cuatrimestral | UI + UE | Controles | Reporte', u: 'plan/anual', bp: 12000, cp: 6000 },
  { name: 'Plan VRF completo (visita trimestral)', desc: 'Mantenimiento preventivo trimestral VRF | Incluye laboratorio de refrigerante', u: 'plan/anual', bp: 18000, cp: 9000 },
  { name: 'Plan chiller (visita trimestral)', desc: 'Mantenimiento preventivo trimestral chiller | Aceite, filtros, refrigerante, eléctrico', u: 'plan/anual', bp: 35000, cp: 18000 },
  { name: 'Plan chiller premium (visita + monitoreo remoto)', desc: 'Mantenimiento chiller con monitoreo remoto 24/7 | Reportes mensuales | Prioridad', u: 'plan/anual', bp: 60000, cp: 30000 },
  { name: 'Plan torre de enfriamiento (visita trimestral)', desc: 'Mantenimiento trimestral de torre | Limpieza de relleno, boquillas, análisis de agua', u: 'plan/anual', bp: 18000, cp: 9000 },
  { name: 'Plan sistema agua helada (visita trimestral)', desc: 'Mantenimiento trimestral de chiller + bombas + torre + fan coils', u: 'plan/anual', bp: 55000, cp: 28000 },
  { name: 'Plan rooftops (por equipo, visita cuatrimestral)', desc: 'Mantenimiento cuatrimestral de rooftops | Limpieza de serpentines, drenajes, revisión compresor', u: 'plan/anual', bp: 8000, cp: 4000 },
  { name: 'Plan manejadora de aire (AHU) (visita trimestral)', desc: 'Mantenimiento trimestral AHU | Filtros, baterías, ventiladores, controles', u: 'plan/anual', bp: 15000, cp: 7500 },
  { name: 'Plan cuarto frío (visita cuatrimestral)', desc: 'Mantenimiento cuatrimestral de cuarto frío | Condensadora, evaporador, cortinas', u: 'plan/anual', bp: 18000, cp: 9000 },
  { name: 'Plan BMS y controles (visita trimestral)', desc: 'Mantenimiento trimestral de sistema BMS | Verificación de puntos, calibración, respaldos', u: 'plan/anual', bp: 20000, cp: 10000 },
  { name: 'Plan integral HVAC (todo incluido, visita mensual)', desc: 'Mantenimiento mensual integral | HVAC + BMS + agua | Reportes | SLA 4 hrs', u: 'plan/anual', bp: 120000, cp: 60000 },
  { name: 'Contrato de servicio de emergencia (24/7)', desc: 'Respuesta a emergencias HVAC 24/7 | Incluye mano de obra en fallas | Por año', u: 'plan/anual', bp: 15000, cp: 7500 },
  { name: 'Contrato SLA premium (garantía de respuesta 2 hrs)', desc: 'SLA gold | Respuesta garantizada 2 hrs | Mano de obra incluida | Descuento en refacciones', u: 'plan/anual', bp: 45000, cp: 22000 },
  { name: 'Póliza de mantenimiento correctivo (visitas ilimitadas)', desc: 'Cobertura correctiva completa | Visitas ilimitadas | Refacciones a costo | Preventivo incluido', u: 'plan/anual', bp: 55000, cp: 28000 },
  { name: 'Diagnóstico inicial para plan de mantenimiento', desc: 'Visita de diagnóstico: censo de equipos, condiciones, programa de mantenimiento propuesto', u: 'servicio', bp: 5000, cp: 2500 },
];

// ─── 8. Combine all ────────────────────────────────────────────────────────
const addItems = (items, category) => {
  items.forEach((item, i) => {
    // Check for duplicates by name
    const key = item.name.toUpperCase().trim();
    if (!seen.has(key)) {
      seen.set(key, item);
      newItems.push({
        name: item.name,
        description: item.desc,
        unit: item.u,
        category: category,
        basePrice: item.bp,
        costPrice: item.cp || null,
      });
    }
  });
};

addItems(ingenieria, 'Ingenieria y Diseno');
addItems(controls, 'Controles y Automatizacion (BMS)');
addItems(energyEff, 'Eficiencia Energetica');
addItems(civilWorks, 'Obra Civil y Estructural');
addItems(piping, 'Tuberia y Conexiones');
addItems(ducteriaExpanded, 'Ducteria');
addItems(instrumentation, 'Instrumentacion');
addItems(waterTreatment, 'Tratamiento de Agua');
addItems(fireProtection, 'Proteccion Contra Incendio');
addItems(maintenancePlans, 'Planes de Mantenimiento');

// ─── 9. Final catalog ──────────────────────────────────────────────────────
const finalCatalog = catalog.concat(newItems);
console.log('Final items:', finalCatalog.length);

// Sort by category then name
finalCatalog.sort((a, b) => {
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  return a.name.localeCompare(b.name);
});

// Validate all items have required fields
let errors = 0;
finalCatalog.forEach((item, i) => {
  if (!item.name) { console.error('Item', i, 'missing name'); errors++; }
  if (!item.category) { console.error('Item', i, item.name, 'missing category'); errors++; }
  if (!item.unit) { console.error('Item', i, item.name, 'missing unit'); errors++; }
  if (item.basePrice === undefined) { item.basePrice = null; }
  if (item.costPrice === undefined) { item.costPrice = null; }
});

// Write to all 3 locations
const output = JSON.stringify(finalCatalog, null, 2);
const locations = [
  path.join(__dirname, '..', 'backend', 'scripts', 'catalog_import.json'),
  path.join(__dirname, '..', 'scripts', 'catalog_import.json'),
  path.join(__dirname, '..', 'backend', 'public', 'catalog_import.json'),
];

locations.forEach(loc => {
  fs.writeFileSync(loc, output, 'utf8');
  console.log('Written to:', loc);
});

console.log('Errors:', errors);
console.log('Total items in final catalog:', finalCatalog.length);
