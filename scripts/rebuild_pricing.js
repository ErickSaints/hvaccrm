const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'backend', 'scripts', 'catalog_import.json');
let data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// ─── CONFIG: Mexican market competitive prices (CDMX, Junio 2026) ─────────
// Sources:
//   HomePro Feb 2026 Índice Costos Mano Obra (PRNewswire)
//   analisisdepreciosunitarios.com (APU México +200,000 conceptos)
//   IMIC Instituto Mexicano de Ingeniería de Costos
//   CEICO-CMIC Catálogos Nacionales de Costos 2025-2026
//   CYPE Generador de Precios México
//   QueCalor.com.mx (distribuidor Carrier/LG)
//   REACSA México (distribuidor HVAC)
//   ClimasMonterrey.com
//   AireyClimas ULL CDMX
//   Habitissimo CDMX 2026
//   Home Depot México 2026
//   Mercado Libre México 2026
//   Computrabajo/OCC (salarios 2026)
//   NOM-001-SEDE-2012, NOM-023-ENER-2018

const PRECIO_INSTALACION_POR_TR = {
  'Minisplit 1 TR': 3500,
  'Minisplit 2 TR': 3000,
  'Minisplit 3 TR': 2500,
  'Minisplit 4 TR': 2200,
  'Minisplit 5 TR': 2000,
  'Cassette 2 TR': 3500,
  'Cassette 3 TR': 3000,
  'Cassette 4 TR': 2800,
  'Piso-Techo 3 TR': 3200,
  'Piso-Techo 5 TR': 2800,
  'Piso-Techo 8 TR': 2500,
  'Fan Coil 2 TR': 3800,
  'Fan Coil 3 TR': 3500,
  'Fan Coil 4 TR': 3200,
  'Fan Coil 6 TR': 3000,
  'Fan Coil 8 TR': 2800,
  'Fan Coil 10 TR': 2500,
  'Fan Coil 15 TR': 2200,
  'Fan Coil 20 TR': 2000,
  'AHU 400 CFM': 3000,
  'AHU 800 CFM': 3200,
  'AHU 1500 CFM': 3500,
  'AHU 3000 CFM': 3000,
  'AHU 5000 CFM': 2800,
  'AHU 10000 CFM': 2500,
  'Rooftop 5 TR': 5500,
  'Rooftop 7.5 TR': 5000,
  'Rooftop 10 TR': 4500,
  'Rooftop 12.5 TR': 4000,
  'Rooftop 15 TR': 3800,
  'Rooftop 20 TR': 3500,
  'Rooftop 25 TR': 3200,
  'VRF unidad interior': 5000,
  'VRF sistema completo': 6000,
  'Chiller scroll 30 TR': 4500,
  'Chiller scroll 50 TR': 4000,
  'Chiller scroll 80 TR': 3500,
  'Chiller tornillo 100 TR': 3200,
  'Chiller tornillo 150 TR': 3000,
  'Chiller tornillo 200 TR': 2800,
  'Chiller tornillo 300 TR': 2600,
  'Chiller centrifugo 400 TR': 2400,
  'Chiller centrifugo 600 TR': 2200,
  'Chiller centrifugo 800 TR': 2000,
  'Torre enfriamiento 100 TR': 3000,
  'Torre enfriamiento 200 TR': 2600,
  'Torre enfriamiento 300 TR': 2300,
  'Torre enfriamiento 500 TR': 2000,
  'Bomba de agua 1 HP': 3800,
  'Bomba de agua 2 HP': 4500,
  'Bomba de agua 3 HP': 5200,
  'Bomba de agua 5 HP': 6500,
  'Bomba de agua 10 HP': 8500,
  'Bomba de agua 20 HP': 11000,
  'Bomba de agua 50 HP': 15000,
  'Caldera 500 MBH': 10000,
  'Caldera 1000 MBH': 15000,
  'Caldera 2000 MBH': 22000,
  'Caldera 5000 MBH': 30000,
  'Cuarto frio pequeno': 10000,
  'Cuarto frio mediano': 15000,
  'Cuarto frio grande': 22000,
};

const instalacionItems = [];
Object.entries(PRECIO_INSTALACION_POR_TR).forEach(([equipo, precioTr]) => {
  const matchTR = equipo.match(/([\d.]+)\s*TR/);
  const toneladas = matchTR ? parseFloat(matchTR[1]) : 1;
  const totalBase = Math.round(precioTr * toneladas);

  if (equipo.includes('Minisplit')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalación minisplit ${tr} TR (alta pared)`,
      description: `Instalación profesional de minisplit ${tr} TR | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye: soportería, tubería de cobre hasta 5m aislada, cableado eléctrico, drenaje, vacío, prueba de funcionamiento | No incluye equipo | Garantía 1 año en instalación | NOM-001-SEDE`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Cassette')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalación cassette ${tr} TR`,
      description: `Instalación profesional de cassette ${tr} TR en plafón | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye: soportería, tubería de cobre hasta 8m aislada, cableado eléctrico, drenaje con bomba, control remoto, vacío, prueba | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Piso-Techo')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalación piso-techo ${tr} TR`,
      description: `Instalación profesional de piso-techo ${tr} TR | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye: soportería, tubería de cobre aislada, cableado, drenaje, control, termostato, vacío, prueba | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Fan Coil')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalación fan coil ${tr} TR (agua helada)`,
      description: `Instalación profesional de fan coil ${tr} TR | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye: tubería de agua helada ida/retorno aislada, válvulas de corte y balanceo, conexión eléctrica, drenaje, bandeja de condensados | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('AHU')) {
    const cfm = parseInt(equipo.match(/(\d+)\s*CFM/)[1]);
    const tr = Math.round(cfm / 400);
    const totalBase = Math.round(precioTr * tr);
    instalacionItems.push({
      name: `Instalación manejadora de aire ${cfm} CFM (${tr} TR)`,
      description: `Instalación profesional de manejadora de aire ${cfm} CFM | Mano de obra: $${precioTr.toLocaleString()}/TR x ${tr} TR | Incluye: conexión a ductos existentes, tubería de agua helada, válvulería, conexión eléctrica y control, drenaje, bandeja | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Rooftop')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalación rooftop/paquete ${tr} TR`,
      description: `Instalación profesional de rooftop ${tr} TR en azotea | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye: base metálica estructural, ductería de conexión, cableado eléctrico, termostato, arranque y puesta en marcha | No incluye equipo | Aplica NOM-001-SEDE`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('VRF unidad interior')) {
    instalacionItems.push({
      name: `Instalación unidad interior VRF (cassette/conducto/pared)`,
      description: `Instalación profesional de unidad interior VRF | Precio fijo por unidad interior | Incluye: tubería de refrigerante con aislamiento individual, cableado de control comBus, drenaje, soportería, conexión a red principal | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: 5000,
      costPrice: Math.round(5000 * 0.55),
    });
  } else if (equipo.includes('VRF sistema')) {
    instalacionItems.push({
      name: `Instalación sistema VRF completo (por TR)`,
      description: `Instalación profesional de sistema VRF | Incluye: tubería de refrigerante con aislamiento, derivadores Refnet, cableado de control y alimentación, drenajes, carga de refrigerante, puesta en marcha, comisionamiento | Cotizar por TR del sistema`,
      unit: 'TR',
      category: 'Instalacion Equipos',
      basePrice: precioTr,
      costPrice: Math.round(precioTr * 0.55),
    });
  } else if (equipo.includes('Chiller')) {
    const tr = toneladas;
    const tipo = equipo.includes('centrifugo') ? 'centrífugo' : equipo.includes('tornillo') ? 'tornillo' : 'scroll';
    instalacionItems.push({
      name: `Instalación chiller ${tipo} ${tr} TR`,
      description: `Instalación profesional de chiller ${tipo} ${tr} TR | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye: cimentación, conexiones hidráulicas, eléctricas y de control, tubería de agua helada, válvulería, arranque, comisionamiento, pruebas | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Torre')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalación torre de enfriamiento ${tr} TR`,
      description: `Instalación profesional de torre de enfriamiento ${tr} TR | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye: base nivelada, tubería de conexión ida/retorno, válvulería, flotador, conexión eléctrica, arranque y balanceo | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Bomba')) {
    const hp = parseInt(equipo.match(/(\d+)\s*HP/)[1]);
    instalacionItems.push({
      name: `Instalación bomba de agua HVAC ${hp} HP`,
      description: `Instalación profesional de bomba de agua ${hp} HP | Incluye: tubería de succión y descarga, válvulas de compuerta y check, conexión eléctrica trifásica, base metálica, acoplamiento flexible, alineación, balanceo | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Caldera')) {
    const mbh = parseInt(equipo.match(/(\d+)\s*MBH/)[1]);
    instalacionItems.push({
      name: `Instalación caldera ${mbh} MBH`,
      description: `Instalación profesional de caldera ${mbh} MBH | Incluye: conexión de gas LP/natural con válvula de seguridad, chimenea/venteo, tubería de agua caliente aislada, válvulería de seguridad, conexión eléctrica y control termostato | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Cuarto')) {
    const tam = equipo.includes('pequeno') ? 'pequeño' : equipo.includes('mediano') ? 'mediano' : 'grande';
    instalacionItems.push({
      name: `Instalación cuarto frío ${tam}`,
      description: `Instalación profesional de cuarto frío ${tam} | Incluye: panel aislante, puerta con cierre hermético, unidad condensadora, evaporador, tubería de refrigerante, control digital, iluminación, cortina de tiras | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  }
});

// ─── 2. Pólizas de Mantenimiento ──────────────────────────────────────────
// PRECIOS BASADOS EN HOMEPRO FEBRERO 2026 (PRNewswire) + MERCADO CDMX 2026
//
// HomePro Feb 2026 — Precios preventivos c/visita:
//   Minisplit 1-3 TR: $2,500-$2,700
//   Piso-techo 5 TR: $2,800
//   Cassette 2-4 TR: $2,700-$3,200
//   Fan coil 4.5 TR: $3,600
//   Chiller: desde $15,000/visita
//   Rooftop: $4,000-$9,000/visita
//   VRF (por unidad): $2,800-$4,500
//
// Póliza anual = precio visita × visitas × factor de descuento por contrato:
//   Básica: 2 visitas ($2,500-$3,600 c/u) → descuento 15-20%
//   Estándar: 4 visitas → descuento 20-25%
//   Premium: 4 visitas + emergencias 24/7 → prima +25%
//
const MANT_POR_TR_ANUAL = {
  'Minisplit':                              { basico: 4800, estandar: 7600, premium: 9500 },
  'Cassette':                               { basico: 4400, estandar: 7200, premium: 9000 },
  'Piso-Techo':                             { basico: 4200, estandar: 6800, premium: 8600 },
  'Fan Coil (agua helada)':                 { basico: 5200, estandar: 8400, premium: 10500 },
  'AHU/Manejadora de aire':                 { basico: 4000, estandar: 6600, premium: 8200 },
  'Rooftop/Paquete':                        { basico: 4500, estandar: 7200, premium: 9000 },
  'VRF':                                    { basico: 3600, estandar: 5800, premium: 7200 },
  'Chiller':                                { basico: 2800, estandar: 4800, premium: 6000 },
  'Torre de enfriamiento':                  { basico: 2000, estandar: 3600, premium: 4500 },
  'Sistema agua helada completo':           { basico: 2400, estandar: 4200, premium: 5400 },
  'Bomba de agua HVAC':                     { basico: 1600, estandar: 2800, premium: 0 },
  'Cuarto frío':                            { basico: 4000, estandar: 6800, premium: 8500 },
  'Caldera':                                { basico: 2400, estandar: 4200, premium: 5500 },
  'Unidad condensadora remota':             { basico: 3200, estandar: 5600, premium: 7000 },
  'Sistema expansión directa (DX)':         { basico: 3800, estandar: 6200, premium: 7800 },
  'Enfriador de líquido (chiller compacto)':{ basico: 3200, estandar: 5400, premium: 6800 },
  'Mirage / equipo tipo ventana':           { basico: 2200, estandar: 3800, premium: 4800 },
};

const MANT_DESCRIPCION = {
  'Minisplit':                              { equipo: 'minisplit (alta pared)', detalle: 'Limpieza de filtros, evaporadora, condensadora, bandeja de drenaje, ventilador | Revisión de presiones, amperajes, carga de refrigerante, conexiones eléctricas, control remoto, drenaje' },
  'Cassette':                               { equipo: 'cassette', detalle: 'Limpieza de filtros, evaporadora, condensadora, bandeja de drenaje, bomba de condensados, ventilador | Revisión de presiones, amperajes, carga de refrigerante, conexiones eléctricas, control remoto' },
  'Piso-Techo':                             { equipo: 'piso-techo', detalle: 'Limpieza de serpentín, filtros, ventilador, drenaje, control, termostato | Revisión de presiones, amperajes, carga de refrigerante' },
  'Fan Coil (agua helada)':                 { equipo: 'fan coil (agua helada)', detalle: 'Limpieza de serpentín de agua helada, bandeja de condensados, filtros, ventilador, válvulas de control | Revisión de temperatura de impulsión y retorno, conexiones hidráulicas, actuadores' },
  'AHU/Manejadora de aire':                 { equipo: 'manejadora de aire', detalle: 'Limpieza de serpentines de enfriamiento y calefacción, filtros, ventiladores, compuertas de mezcla, drenaje | Revisión de transmisiones, bandas, poleas, conexiones eléctricas, controles, sensores' },
  'Rooftop/Paquete':                        { equipo: 'rooftop/paquete', detalle: 'Limpieza de serpentines de condensador y evaporador, filtros, quemadores, ventiladores, drenaje | Revisión de presiones, amperajes, carga de refrigerante, controles, termostato, secuencia de operación' },
  'VRF':                                    { equipo: 'sistema VRF', detalle: 'Limpieza de condensadoras, evaporadoras, filtros de aire, drenajes | Revisión de tubería de refrigerante, detección de fugas, carga de refrigerante, presiones, controles de red, cableado de comunicación' },
  'Chiller':                                { equipo: 'chiller', detalle: 'Limpieza de condensador y evaporador, cambio de aceite y filtros, revisión de compresor | Análisis de refrigerante, presiones, temperaturas, controles, bombas, torre de enfriamiento, válvulería' },
  'Torre de enfriamiento':                  { equipo: 'torre de enfriamiento', detalle: 'Limpieza de relleno, eliminador de arrastre, boquillas, bandeja, flotador, válvula de llenado | Revisión de motor, ventilador, transmisión, análisis de agua (pH, TDS, dureza), tratamiento químico' },
  'Sistema agua helada completo':           { equipo: 'sistema de agua helada completo', detalle: 'Mantenimiento completo de todo el sistema: chiller, bombas de agua helada y condensado, torre de enfriamiento, fan coils o manejadoras, válvulería, controles, sensores | Reporte ejecutivo de eficiencia' },
  'Bomba de agua HVAC':                     { equipo: 'bomba de agua HVAC', detalle: 'Lubricación de baleros y chumaceras, revisión de sellos mecánicos, acoplamiento, motor, válvulas de succión y descarga, presiones, amperajes, alineación, base y nivelación' },
  'Cuarto frío':                            { equipo: 'cuarto frío', detalle: 'Limpieza de condensador, evaporador, puerta, cortinas, drenaje, control de temperatura | Revisión de presiones, carga de refrigerante, cortinas, burletes' },
  'Caldera':                                { equipo: 'caldera', detalle: 'Revisión de quemadores, intercambiador de calor, válvulas de seguridad, chimenea, controles, presión de gas | Análisis de combustión, eficiencia' },
  'Unidad condensadora remota':             { equipo: 'unidad condensadora remota', detalle: 'Limpieza de serpentín, ventilador, compresor, presiones, controles | Revisión de presiones, amperajes, carga de refrigerante' },
  'Sistema expansión directa (DX)':         { equipo: 'sistema de expansión directa (DX)', detalle: 'Revisión de evaporador, condensador, válvula de expansión, línea de líquido, succión | Presiones, amperajes, temperatura de sobrecalentamiento y subenfriamiento' },
  'Enfriador de líquido (chiller compacto)':{ equipo: 'enfriador de líquido compacto', detalle: 'Revisión de compresor Scroll, condensador de aire, filtros, presiones | Temperatura de agua helada, controles, alarmas' },
  'Mirage / equipo tipo ventana':           { equipo: 'equipo tipo ventana/Mirage', detalle: 'Limpieza de serpentines, filtro, bandeja, motor, control, drenaje | Revisión de presiones, amperajes' },
};

const MANT_VISITAS = {
  'basico':   '2 visitas preventivas/año (semestral)',
  'estandar': '4 visitas preventivas/año (trimestral)',
  'premium':  '4 visitas preventivas/año + emergencias 24/7 sin costo',
};

const MANT_INCLUYE = {
  'basico':   'Mano de obra preventiva, reporte digital con fotos, 10% descuento en refacciones, 15% descuento en mano de obra correctiva',
  'estandar': 'Mano de obra preventiva, reporte digital ejecutivo, 15% descuento en refacciones, 20% descuento en mano de obra correctiva, respuesta prioritaria < 24 hrs hábiles',
  'premium':  'Mano de obra preventiva y correctiva sin costo, reporte ejecutivo, 20% descuento en refacciones, respuesta inmediata < 4 hrs, atención 24/7/365, monitoreo remoto trimestral',
};

const polizaItems = [];
Object.entries(MANT_POR_TR_ANUAL).forEach(([equipo, planes]) => {
  Object.entries(planes).forEach(([nivel, precioUnitario]) => {
    if (precioUnitario === 0) return;

    const desc = MANT_DESCRIPCION[equipo];
    const visits = MANT_VISITAS[nivel];
    const incluye = MANT_INCLUYE[nivel];
    const unidad = equipo === 'Bomba de agua HVAC' ? 'HP/año' : 'TR/año';
    const descUnidad = equipo === 'Bomba de agua HVAC' ? 'HP' : 'TR';

    const nivelLabel = nivel.charAt(0).toUpperCase() + nivel.slice(1);

    polizaItems.push({
      name: `Póliza mantenimiento ${equipo} - ${nivelLabel}`,
      description: `Póliza de mantenimiento preventivo ${nivelLabel} para ${desc.equipo} | ${visits} | $${precioUnitario.toLocaleString()}/${descUnidad}/año | ${incluye} | Trabajos incluidos: ${desc.detalle} | Cotizar: ${descUnidad} del equipo × $${precioUnitario.toLocaleString()}/${descUnidad}/año | Precios basados en HomePro CDMX Feb 2026, competitivos para contratos corporativos`,
      unit: unidad,
      category: 'Pólizas de Mantenimiento',
      basePrice: precioUnitario,
      costPrice: Math.round(precioUnitario * 0.55),
    });
  });
});

// ─── 3. Servicios individuales de Mantenimiento Preventivo ────────────────
// Precios basados en: HomePro Feb 2026, Habitissimo CDMX, APU analisisdepreciosunitarios.com
const serviciosMantto = [
  { name: 'Diagnóstico y visita técnica HVAC', desc: 'Visita de diagnóstico técnico a equipo HVAC | Incluye: revisión general visual, medición de presiones de succión y descarga, temperaturas de aire (bulbo seco/húmedo), amperajes, voltajes, superheat/subcool | Reporte detallado de diagnóstico con recomendaciones | Precio CDMX 2026', unit: 'servicio', bp: 850 },
  { name: 'Limpieza profunda de minisplit 1 TR', desc: 'Limpieza profunda completa de minisplit 1 TR | Incluye: desmontaje, limpieza de evaporadora y condensadora con químico desengrasante, lavado a presión, limpieza de filtros, bandeja de drenaje, ventilador, sanitización con bactericida, revisión de drenaje, prueba de funcionamiento | 2-3 hrs', unit: 'servicio', bp: 1800 },
  { name: 'Limpieza profunda de minisplit 1.5 TR', desc: 'Limpieza profunda completa de minisplit 1.5 TR | Desmontaje, limpieza química, lavado a presión, filtros, bandeja, drenaje, sanitización, revisión de presiones y amperajes, prueba | 2-3 hrs', unit: 'servicio', bp: 2000 },
  { name: 'Limpieza profunda de minisplit 2 TR', desc: 'Limpieza profunda completa de minisplit 2 TR | Desmontaje, limpieza química de ambos serpentines, lavado a presión, sanitización, revisión de presiones y amperajes, carga de refrigerante si requiere, prueba | 3-4 hrs', unit: 'servicio', bp: 2200 },
  { name: 'Limpieza profunda de minisplit 3 TR', desc: 'Limpieza profunda completa de minisplit 3 TR (tipo comercial) | Desmontaje, limpieza química profunda, lavado a presión con hidrolavadora, sanitización, revisión de presiones, amperajes, superheat/subcool, ajuste de carga, prueba | 3-4 hrs', unit: 'servicio', bp: 2800 },
  { name: 'Limpieza profunda de minisplit 5 TR', desc: 'Limpieza profunda completa de minisplit 5 TR tipo comercial/industrial | Desmontaje, limpieza química, lavado a presión, sanitización, revisión completa de operación | 4-5 hrs', unit: 'servicio', bp: 3500 },
  { name: 'Limpieza de cassette 2-4 TR', desc: 'Limpieza profunda de cassette 2-4 TR en plafón | Incluye: desmontaje de rejilla y filtros, limpieza de evaporadora, bandeja de condensados, bomba de drenaje, sanitización, revisión de drenaje, armado, prueba | 3-4 hrs', unit: 'servicio', bp: 3000 },
  { name: 'Limpieza de fan coil (agua helada)', desc: 'Limpieza profunda de fan coil de agua helada | Incluye: limpieza de serpentín con químico apropiado, bandeja de condensados, filtros, ventilador, válvulas de control, drenaje, revisión de temperatura de ida/retorno | 2-3 hrs', unit: 'servicio', bp: 2800 },
  { name: 'Limpieza de condensadora (split/VRF)', desc: 'Limpieza química de serpentín de condensadora | Incluye: aplicación de químico desengrasante, lavado a presión con hidrolavadora, enderezamiento de aletas con peine, revisión de ventilador y capacitor, medición de amperajes | 1-2 hrs', unit: 'servicio', bp: 1800 },
  { name: 'Limpieza química de serpentín evaporador', desc: 'Limpieza química profunda de serpentín evaporador | Incluye: desmontaje, aplicación de químico alcalino/ácido según tipo de suciedad, lavado a presión, enjuague, armado, prueba de drenaje | 3-4 hrs', unit: 'servicio', bp: 3200 },
  { name: 'Limpieza química de serpentín condensador', desc: 'Limpieza química profunda de serpentín condensador en azotea | Incluye: químico desengrasante, lavado a presión, enderezamiento de aletas, revisión de ventilador, medición de presión de descarga y amperajes | 2-3 hrs', unit: 'servicio', bp: 3200 },
  { name: 'Destape de drenaje de minisplit', desc: 'Destape de drenaje obstruido en minisplit | Incluye: aspiración con aspiradora industrial, soplido con nitrógeno, limpieza de bandeja de drenaje, verificación de flujo, aplicación de bactericida | 1 hr', unit: 'servicio', bp: 600 },
  { name: 'Detección de fugas de refrigerante (electrónica)', desc: 'Detección de fugas con detector electrónico TIF/Inficon | Incluye: barrido completo del sistema, identificación y marcado de puntos de fuga, reporte | 1-2 hrs', unit: 'servicio', bp: 1500 },
  { name: 'Detección de fugas de refrigerante (presurización N2)', desc: 'Detección de fugas por presurización con nitrógeno seco | Incluye: tanque de N2 con manómetro, presurización a 150-300 PSIG según equipo, reposo 30 min, detección con agua jabonosa, reporte | 2-3 hrs', unit: 'servicio', bp: 2000 },
  { name: 'Detección de fugas de refrigerante (ultrasónico)', desc: 'Detección de fugas con equipo ultrasónico AccuTrak | Para fugas en tubería oculta en losa o plafón, pared, ductería | Incluye barrido completo, marcado de puntos, reporte | 2-3 hrs', unit: 'servicio', bp: 3000 },
  { name: 'Detección de fugas de refrigerante (tinte UV)', desc: 'Detección de fugas con tinte ultravioleta | Incluye: aplicación de tinte UV al sistema, lámpara UV de alta intensidad, gafas, barrido, identificación de puntos, reporte | 2-3 hrs', unit: 'servicio', bp: 2200 },
  { name: 'Carga de gas refrigerante R-410A (1 kg)', desc: 'Carga de gas refrigerante R-410A | Incluye: 1 kg de gas R-410A, instalación con manómetros, revisión de fugas, purga de mangueras, carga en fase líquida, verificación de superheat/subcool, prueba de funcionamiento | No incluye reparación de fugas', unit: 'servicio', bp: 1600 },
  { name: 'Carga de gas refrigerante R-32 (1 kg)', desc: 'Carga de gas refrigerante R-32 | Incluye: 1 kg de gas R-32, instalación, revisión de fugas, carga en fase gas, verificación de superheat, prueba de funcionamiento | No incluye reparación de fugas', unit: 'servicio', bp: 1300 },
  { name: 'Carga de gas refrigerante R-22 (1 kg)', desc: 'Carga de gas refrigerante R-22 | Incluye: 1 kg de gas R-22, instalación, revisión de fugas, carga, verificación, prueba | No incluye reparación de fugas', unit: 'servicio', bp: 2200 },
  { name: 'Recuperación de gas refrigerante', desc: 'Recuperación de gas refrigerante con equipo recuperador certificado | Incluye: conexión, recuperación a cilindro de almacenamiento, pesaje, etiquetado del cilindro | No incluye cilindro de almacenamiento', unit: 'servicio', bp: 2000 },
  { name: 'Revisión de presiones y amperajes', desc: 'Revisión completa de presiones de succión y descarga, amperajes de compresor y ventiladores, voltajes, temperaturas de línea de líquido y succión, superheat/subcool | Reporte', unit: 'servicio', bp: 700 },
  { name: 'Balanceo de sistema de aire (por difusor)', desc: 'Medición de flujo de aire en difusores con anemómetro de hilo caliente, balanceo de compuetas de regulación, medición de CFM, temperatura y velocidad | Reporte por difusor', unit: 'difusor', bp: 300 },
  { name: 'Análisis de agua para torre de enfriamiento', desc: 'Análisis químico completo de agua de torre de enfriamiento | Incluye: pH, TDS, conductividad, dureza total, alcalinidad, cloruros, sílice, hierro, recuento bacteriológico | Reporte con recomendaciones de tratamiento', unit: 'muestra', bp: 1200 },
  { name: 'Limpieza o cambio de filtros HVAC (por equipo)', desc: 'Limpieza con aspiradora HEPA o reemplazo de filtros de retorno y suministro | Incluye: retiro, limpieza o instalación de filtro nuevo, limpieza de marco y soporte, reinstalación | Por equipo', unit: 'equipo', bp: 250 },
  { name: 'Limpieza de intercambiador de calor de caldera', desc: 'Limpieza mecánica y química de intercambiador de calor de caldera | Incluye: desmontaje de puertas, cepillado mecánico de tubos, lavado químico, enjuague, armado, prueba de hermeticidad, puesta en marcha | 4-6 hrs', unit: 'servicio', bp: 5500 },
  { name: 'Análisis de combustión de caldera', desc: 'Análisis de gases de combustión con analizador electrónico | Incluye: medición de O2, CO2, CO, NOx, temperatura de gases, tiro, eficiencia de combustión | Reporte', unit: 'servicio', bp: 2000 },
  { name: 'Limpieza de quemadores de caldera', desc: 'Limpieza completa de quemadores de caldera | Incluye: desmontaje, limpieza de boquillas con solvente, calibración de electrodos, ajuste de presión de gas, verificación de llama, prueba, puesta en marcha | 3-4 hrs', unit: 'servicio', bp: 3500 },
  { name: 'Revisión y calibración de presostatos y termostatos de seguridad', desc: 'Revisión y calibración de presostatos y termostatos de seguridad en sistemas HVAC | Incluye: verificación de punto de disparo, ajuste, prueba funcional, reporte', unit: 'servicio', bp: 700 },
  { name: 'Cambio de filtros MERV 13 o HEPA (por filtro)', desc: 'Suministro y reemplazo de filtros MERV 13 o HEPA en AHU o manejadora | Incluye: filtro grado hospitalario, instalación, sellado, registro', unit: 'pieza', bp: 500 },
];

// ─── 4. Servicios Correctivos ─────────────────────────────────────────────
const serviciosCorrectivos = [
  { name: 'Cambio de compresor minisplit 1-2 TR', desc: 'Reemplazo de compresor rotativo 1-2 TR | Incluye: mano de obra, gas refrigerante R-410A/R-32, filtro deshidratador, vacío profundo <500 micras, carga de refrigerante, prueba de funcionamiento, medición de amperajes | No incluye compresor | Garantía 6 meses en instalación', unit: 'servicio', bp: 5800 },
  { name: 'Cambio de compresor minisplit 3-5 TR', desc: 'Reemplazo de compresor rotativo 3-5 TR | Incluye: mano de obra, gas refrigerante, filtro deshidratador, vacío, carga, prueba | No incluye compresor | Garantía 6 meses', unit: 'servicio', bp: 8500 },
  { name: 'Cambio de compresor scroll 5-10 TR', desc: 'Reemplazo de compresor scroll 5-10 TR en rooftop/paquete | Incluye: mano de obra, gas refrigerante, filtro deshidratador, aceite, vacuómetro, prueba | No incluye compresor', unit: 'servicio', bp: 12000 },
  { name: 'Cambio de compresor de chiller (completo con refacción)', desc: 'Reemplazo completo de compresor de chiller (scroll/tornillo/centrífugo) | Incluye: compresor nuevo, aceite, filtros, gas refrigerante, secuencia de arranque, puesta en marcha, comisionamiento | Precio estimado para <100 TR, consultar para mayores capacidades', unit: 'servicio', bp: 120000 },
  { name: 'Reemplazo de motor de ventilador (condensadora)', desc: 'Cambio de motor de ventilador de condensadora | Incluye: motor nuevo de 1/3-1 HP, capacitor, mano de obra, conexión eléctrica, prueba de funcionamiento, medición de amperajes', unit: 'servicio', bp: 3200 },
  { name: 'Reemplazo de motor de ventilador (evaporadora)', desc: 'Cambio de motor de ventilador de evaporadora (tipo turbo) | Incluye: motor nuevo, capacitor, mano de obra, conexión, balanceo, prueba', unit: 'servicio', bp: 2800 },
  { name: 'Reemplazo de capacitor de arranque/operación', desc: 'Cambio de capacitor de arranque o de operación en minisplit/rooftop | Incluye: capacitor nuevo (MFD según especificación), instalación, medición de microfaradios, prueba de funcionamiento', unit: 'servicio', bp: 700 },
  { name: 'Reemplazo de placa controladora (tarjeta electrónica)', desc: 'Cambio de tarjeta de control principal de minisplit/VRF/paquete | Incluye: mano de obra, configuración de DIP switches, parametrización, prueba de funcionamiento de modos frío/calor/ventilador | No incluye tarjeta', unit: 'servicio', bp: 2000 },
  { name: 'Reemplazo de termostato de pared', desc: 'Cambio de termostato de pared analógico o digital básico | Incluye: termostato, instalación, cableado, configuración de modos y programación, prueba de ciclo', unit: 'servicio', bp: 1000 },
  { name: 'Reemplazo de termostato WiFi/inteligente', desc: 'Cambio de termostato WiFi programable tipo Nest/Honeywell/Sensibo | Incluye: termostato, instalación, configuración de app, conexión WiFi, programación de horarios, prueba remota', unit: 'servicio', bp: 3500 },
  { name: 'Reemplazo de válvula de expansión (TXV)', desc: 'Cambio de válvula de expansión termostática | Incluye: válvula TXV, mano de obra, vacío, carga de refrigerante, ajuste de superheat (8-12°F), prueba', unit: 'servicio', bp: 4500 },
  { name: 'Reemplazo de válvula de zona motorizada', desc: 'Cambio de válvula de zona motorizada 2/3 vías para agua helada | Incluye: válvula con actuador, instalación, conexión eléctrica, prueba de apertura/cierre, balanceo', unit: 'servicio', bp: 2000 },
  { name: 'Reemplazo de actuador de compuerta', desc: 'Cambio de actuador de compuerta de regulación de aire (Belimo/Siemens) | Incluye: actuador, instalación, calibración de carrera, prueba de posición, verificación de señal 0-10V/4-20mA', unit: 'servicio', bp: 3000 },
  { name: 'Limpieza de línea de drenaje completa', desc: 'Destape de línea de drenaje de equipo HVAC con aspiradora industrial | Incluye: aspiración desde bandeja y extremo, soplido, limpieza de bandeja, verificación de flujo, aplicación de pastilla bactericida', unit: 'servicio', bp: 900 },
  { name: 'Reparación de fuga de agua en tubería', desc: 'Reparación de fuga en tubería de agua helada/condensado HVAC | Incluye: localización, drenaje, corte, reparación con acople/reemplazo de tramo, prueba hidrostática, aislamiento térmico', unit: 'servicio', bp: 2000 },
  { name: 'Sellado de fugas de aire en ductería', desc: 'Sellado de fugas de aire en ductería con mastic sellador y cinta foil | Incluye: limpieza de superficie, aplicación de mastic, refuerzo con cinta foil | Por punto de fuga', unit: 'punto', bp: 200 },
  { name: 'Aislamiento térmico de tubería (por metro lineal)', desc: 'Aislamiento de tubería de refrigerante/agua helada con espuma elastomérica Armaflex | Incluye: material (1/2" a 1" espesor según diámetro), instalación, sellado de juntas con pegamento | Por metro lineal', unit: 'm', bp: 150 },
  { name: 'Prueba de estanqueidad con presurización de N2', desc: 'Prueba de presión con nitrógeno seco a sistema HVAC | Incluye: tanque de N2, manómetro certificado, presurización a 150-500 PSIG según tipo de sistema, reposo mínimo 30 min, reporte con gráfica de presión vs tiempo', unit: 'servicio', bp: 2500 },
  { name: 'Vacío profundo de sistema HVAC', desc: 'Vacío profundo de sistema HVAC con vacuómetro electrónico digital | Incluye: bomba de vacío de 2 etapas, vacuómetro <500 micras, prueba de retención de vacío (rise test), reporte | Previo a carga de refrigerante', unit: 'servicio', bp: 2000 },
  { name: 'Puesta en marcha de equipo HVAC nuevo', desc: 'Comisionamiento y puesta en marcha de equipo HVAC nuevo | Incluye: verificación de instalación, conexiones eléctricas, torque de conexiones, vacío, carga de refrigerante, medición de presiones, amperajes, temperaturas, superheat/subcool, secuencia de operación, control | Reporte de comisionamiento', unit: 'servicio', bp: 3500 },
  { name: 'Programación de control centralizado/BMS', desc: 'Programación de lógica de control para sistema BMS/centralizado (Johnson, Siemens, Honeywell, Distech) | Incluye: configuración de puntos, secuencias de operación, alarmas, tendencias, schedulers, interlocking | Por punto de control', unit: 'servicio', bp: 6500 },
  { name: 'Actualización de firmware de sistema VRF', desc: 'Actualización de firmware de sistema VRF (Daikin/Mitsubishi/LG) para optimización de rendimiento | Incluye: conexión a BCU/central controller, backup de configuración, carga de firmware, verificación de comunicación con todas las unidades, prueba de operación', unit: 'servicio', bp: 4500 },
  { name: 'Corrección de voltaje/fase en equipo trifásico', desc: 'Corrección de problema de voltaje, fase faltante o desbalanceo en equipo HVAC trifásico | Incluye: medición de voltajes L-L y L-N, verificación de secuencia de fases, diagnóstico de protección, coordinación con eléctrica | No incluye materiales eléctricos mayores', unit: 'servicio', bp: 2000 },
  { name: 'Reparación de fuga de agua en minisplit (drenaje)', desc: 'Reparación de fuga de agua en minisplit por drenaje obstruido o instalación incorrecta | Incluye: diagnóstico, limpieza de drenaje, corrección de pendiente, sellado, prueba con agua', unit: 'servicio', bp: 800 },
  { name: 'Cambio de banda de ventilador', desc: 'Cambio de banda de ventilador en AHU/rooftop/extractor | Incluye: banda nueva (tipo A/B/C según medida), tensionado con tensiómetro, alineación de poleas, medición de amperajes, verificación de RPM | Por juego de bandas', unit: 'servicio', bp: 1500 },
  { name: 'Cambio de rodamientos de ventilador', desc: 'Cambio de rodamientos de ventilador en AHU/extractor/rooftop | Incluye: rodamientos nuevos, mano de obra, lubricación con grasa de alta temperatura, alineación, medición de vibraciones, prueba de funcionamiento', unit: 'servicio', bp: 3200 },
];

// ─── 5. Gas Refrigerante - Precios reales mercado Mexicano 2026 ─────────
// Fuentes: Refrigeracion Lozano, ClimasMonterrey, Mercado Libre México, 
//          REACSA, distribuidores Carrier/Trane. Precios al mayoreo con descuento
//          por volumen. Ajustados a tipo de cambio USD/MXN ~20.50
const GAS_PRECIOS_REALES = {
  'R-410A': 320, 'R-32': 220, 'R-22': 500, 'R-134a': 300,
  'R-404A': 290, 'R-407C': 310, 'R-290': 160, 'R-600a': 180,
  'R-448A': 420, 'R-449A': 680, 'R-454B': 550, 'R-1234yf': 1400,
  'R-513A': 720, 'R-452A': 600, 'R-507': 380, 'R-515B': 820,
  'R-1233zd': 1050, 'R-245fa': 880, 'R-141b': 600, 'R-142b': 780,
  'R-124': 680, 'R-1270': 400, 'R-407H': 880, 'R-744': 400,
};

// ─── APPLY CHANGES ────────────────────────────────────────────────────────
console.log('Current items:', data.length);

// Remove categories we fully regenerate
const removeCats = ['Instalacion Equipos', 'Instalación Equipos', 'Planes de Mantenimiento', 'Pólizas de Mantenimiento', 'Polizas de Mantenimiento'];
const removedByCat = {};
data = data.filter(item => {
  if (removeCats.includes(item.category)) {
    removedByCat[item.category] = (removedByCat[item.category] || 0) + 1;
    return false;
  }
  return true;
});
Object.entries(removedByCat).forEach(([cat, count]) => {
  console.log(`Removed ${cat}: ${count} items`);
});

// Fix gas refrigerant prices with correct Mexican market rates
let gasFixed = 0;
data.forEach(item => {
  if (item.category === 'Gas Refrigerante' && item.name && item.basePrice != null) {
    for (const [gas, precioKg] of Object.entries(GAS_PRECIOS_REALES)) {
      if (item.name.includes(gas)) {
        let kg = 1;
        const kgMatch = item.name.match(/([\d.]+)\s*(kg|g)\b/i);
        if (kgMatch) {
          const val = parseFloat(kgMatch[1]);
          kg = kgMatch[2].toLowerCase() === 'g' ? val / 1000 : val;
        }

        const isContainer = /Cilindro|Boya|Tanque/i.test(item.name);
        const isSmallCan = /Lata/i.test(item.name);
        
        if (isContainer && kg > 1) {
          item.unit = 'pieza';
          item.basePrice = Math.round(precioKg * kg * 0.95);
          item.costPrice = Math.round(item.basePrice * 0.75);
          gasFixed++;
        } else if (isSmallCan && kg <= 1) {
          item.unit = 'pieza';
          item.basePrice = Math.round(precioKg * kg * 1.25);
          item.costPrice = Math.round(item.basePrice * 0.75);
          gasFixed++;
        } else if (item.unit === 'pieza' && kg > 1 && !isContainer && !isSmallCan) {
          item.basePrice = Math.round(precioKg * kg * 0.95);
          item.costPrice = Math.round(item.basePrice * 0.75);
          gasFixed++;
        } else if (item.unit === 'kg' || kg <= 1) {
          item.unit = 'kg';
          item.basePrice = precioKg;
          item.costPrice = Math.round(precioKg * 0.75);
          gasFixed++;
        }
        break;
      }
    }
  }
});
console.log('Gas refrigerant prices fixed:', gasFixed);

// Add new items
data = data.concat(instalacionItems);
console.log('Added installation items:', instalacionItems.length);

data = data.concat(polizaItems);
console.log('Added maintenance policy items:', polizaItems.length);

data = data.concat(serviciosMantto);
console.log('Added maintenance service items:', serviciosMantto.length);

data = data.concat(serviciosCorrectivos);
console.log('Added corrective service items:', serviciosCorrectivos.length);

// ─── DEDUP BY NAME ────────────────────────────────────────────────────────
const seen = new Map();
const deduped = [];
data.forEach(item => {
  const key = item.name.toUpperCase().trim();
  if (seen.has(key)) {
    const existing = seen.get(key);
    const existingScore = (existing.basePrice != null ? 1 : 0) + (existing.description ? existing.description.length : 0);
    const newScore = (item.basePrice != null ? 1 : 0) + (item.description ? item.description.length : 0);
    if (newScore >= existingScore) {
      const idx = deduped.indexOf(existing);
      deduped[idx] = item;
      seen.set(key, item);
    }
  } else {
    seen.set(key, item);
    deduped.push(item);
  }
});
console.log('After dedup:', deduped.length);

// Fix any null categories
deduped.forEach(item => { if (!item.category) item.category = 'Sin Categoria'; });

// Sort by category then name
deduped.sort((a, b) => {
  const ca = a.category || '';
  const cb = b.category || '';
  if (ca !== cb) return ca.localeCompare(cb);
  return (a.name || '').localeCompare(b.name || '');
});

// ─── WRITE ────────────────────────────────────────────────────────────────
const output = JSON.stringify(deduped, null, 2);
['backend/scripts/catalog_import.json', 'scripts/catalog_import.json', 'backend/public/catalog_import.json'].forEach(loc => {
  fs.writeFileSync(path.join(__dirname, '..', loc), output, 'utf8');
  console.log('Written to:', loc);
});

console.log('Total items:', deduped.length);

// Summary
const cats = [...new Set(deduped.map(i => i.category))].sort();
console.log('\nCategories:');
cats.forEach(c => {
  const count = deduped.filter(i => i.category === c).length;
  const items = deduped.filter(i => i.category === c && i.basePrice != null);
  const min = items.length ? Math.min(...items.map(i => i.basePrice)) : 0;
  const max = items.length ? Math.max(...items.map(i => i.basePrice)) : 0;
  console.log(`  ${c}: ${count} items, $${min.toLocaleString()} - $${max.toLocaleString()}`);
});
