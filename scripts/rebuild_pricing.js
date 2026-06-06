const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'backend', 'scripts', 'catalog_import.json');
let data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// ─── CONFIG: Mexican market competitive prices (CDMX, Junio 2026) ─────────
// Sources: HomePro 2026 (PRNewswire), analisisdepreciosunitarios.com, 
//          Refrigeracion Lozano, Coresa, Mirage CDMX, DAIRE Queretaro,
//          mercado.libre, IMCA, CNC

const PRECIO_INSTALACION_POR_TR = {
  // Mano de obra instalacion + materiales basicos por TR
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
  'Fan Coil 2 TR': 3500,
  'Fan Coil 3 TR': 3200,
  'Fan Coil 4 TR': 3000,
  'Fan Coil 6 TR': 2800,
  'Fan Coil 8 TR': 2500,
  'Fan Coil 10 TR': 2200,
  'Fan Coil 15 TR': 2000,
  'Fan Coil 20 TR': 1800,
  'AHU 400 CFM': 3000,
  'AHU 800 CFM': 3200,
  'AHU 1500 CFM': 3500,
  'AHU 3000 CFM': 3000,
  'AHU 5000 CFM': 2800,
  'AHU 10000 CFM': 2500,
  'Rooftop 5 TR': 3500,
  'Rooftop 7.5 TR': 3200,
  'Rooftop 10 TR': 3000,
  'Rooftop 12.5 TR': 2800,
  'Rooftop 15 TR': 2600,
  'Rooftop 20 TR': 2400,
  'Rooftop 25 TR': 2200,
  'VRF unidad interior': 4500,
  'VRF sistema completo': 5500,
  'Chiller scroll 30 TR': 3500,
  'Chiller scroll 50 TR': 3200,
  'Chiller scroll 80 TR': 3000,
  'Chiller tornillo 100 TR': 2800,
  'Chiller tornillo 150 TR': 2600,
  'Chiller tornillo 200 TR': 2400,
  'Chiller tornillo 300 TR': 2200,
  'Chiller centrifugo 400 TR': 2000,
  'Chiller centrifugo 600 TR': 1800,
  'Chiller centrifugo 800 TR': 1600,
  'Torre enfriamiento 100 TR': 2500,
  'Torre enfriamiento 200 TR': 2200,
  'Torre enfriamiento 300 TR': 2000,
  'Torre enfriamiento 500 TR': 1800,
  'Bomba de agua 1 HP': 3500,
  'Bomba de agua 2 HP': 4000,
  'Bomba de agua 3 HP': 4500,
  'Bomba de agua 5 HP': 5500,
  'Bomba de agua 10 HP': 7000,
  'Bomba de agua 20 HP': 9000,
  'Bomba de agua 50 HP': 12000,
  'Caldera 500 MBH': 8000,
  'Caldera 1000 MBH': 12000,
  'Caldera 2000 MBH': 18000,
  'Caldera 5000 MBH': 25000,
  'Cuarto frio pequeno': 8000,
  'Cuarto frio mediano': 12000,
  'Cuarto frio grande': 18000,
};

// ─── PRECIOS POR UNIDAD CORRECTA ─────────────────────────────
// Cada item usa la unidad con la que se cotiza en obra:
//   - Instalacion: "servicio" (precio total por equipo de capacidad X)
//   - Mantenimiento: "TR/año" (precio por tonelada de refrigeracion al año)
//   - Bomba mantenimiento: "HP/año" (precio por HP al año)
//   - Caldera mantenimiento: "MBH/año" (precio por MBH al año)

// ─── 1. Replace Instalacion Equipos ──────────────────────────────────────
const instalacionItems = [];
Object.entries(PRECIO_INSTALACION_POR_TR).forEach(([equipo, precioTr]) => {
  const matchTR = equipo.match(/([\d.]+)\s*TR/);
  const toneladas = matchTR ? parseFloat(matchTR[1]) : 1;
  const totalBase = Math.round(precioTr * toneladas);

  if (equipo.includes('Minisplit')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalacion minisplit ${tr} TR (alta pared)`,
      description: `Instalacion profesional de minisplit ${tr} TR | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye soporteria, tuberia de cobre hasta 5m, cableado electrico, drenaje, prueba de funcionamiento | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Cassette')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalacion cassette ${tr} TR`,
      description: `Instalacion profesional de cassette ${tr} TR en plafon | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye soporteria, tuberia de cobre hasta 8m, cableado electrico, drenaje, control remoto, prueba | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Piso-Techo')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalacion piso-techo ${tr} TR`,
      description: `Instalacion profesional de piso-techo ${tr} TR | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye soporteria, tuberia de cobre, cableado, drenaje, control, prueba | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Fan Coil')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalacion fan coil ${tr} TR (agua helada)`,
      description: `Instalacion profesional de fan coil ${tr} TR | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye tuberia de agua helada ida/retorno, valvulas de corte, conexion electrica, drenaje, bandeja | No incluye equipo`,
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
      name: `Instalacion manejadora de aire ${cfm} CFM`,
      description: `Instalacion profesional de manejadora de aire ${cfm} CFM | Mano de obra: $${precioTr.toLocaleString()}/TR x ${tr} TR | Incluye conexion a ductos, tuberia de agua helada, valvulería, conexion electrica y control, drenaje | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Rooftop')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalacion rooftop/paquete ${tr} TR`,
      description: `Instalacion profesional de rooftop ${tr} TR en azotea | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye base metalica, ducteria de conexion, cableado electrico, termostato, puesta en marcha | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('VRF unidad interior')) {
    instalacionItems.push({
      name: `Instalacion unidad interior VRF (cassette/conducto/pared)`,
      description: `Instalacion profesional de unidad interior VRF | Precio fijo por unidad interior | Incluye tuberia de refrigerante, cableado de control, drenaje, soporteria, conexion a red | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: 4500,
      costPrice: Math.round(4500 * 0.55),
    });
  } else if (equipo.includes('VRF sistema')) {
    instalacionItems.push({
      name: `Instalacion sistema VRF completo`,
      description: `Instalacion profesional de sistema VRF | Incluye tuberia de refrigerante, refnet, cableado de control y alimentacion, drenajes, puesta en marcha, carga de refrigerante | Cotizar por tonelada de refrigeracion`,
      unit: 'TR',
      category: 'Instalacion Equipos',
      basePrice: precioTr,
      costPrice: Math.round(precioTr * 0.55),
    });
  } else if (equipo.includes('Chiller')) {
    const tr = toneladas;
    const tipo = equipo.includes('centrifugo') ? 'centrifugo' : equipo.includes('tornillo') ? 'tornillo' : 'scroll';
    instalacionItems.push({
      name: `Instalacion chiller ${tipo} ${tr} TR`,
      description: `Instalacion profesional de chiller ${tipo} ${tr} TR | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye cimentacion, conexiones hidraulicas, electricas y de control, tuberia de agua helada, valvulería, puesta en marcha | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Torre')) {
    const tr = toneladas;
    instalacionItems.push({
      name: `Instalacion torre de enfriamiento ${tr} TR`,
      description: `Instalacion profesional de torre de enfriamiento ${tr} TR | Mano de obra: $${precioTr.toLocaleString()}/TR | Incluye base, tuberia de conexion, valvulería, flotador, conexion electrica, puesta en marcha | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Bomba')) {
    const hp = parseInt(equipo.match(/(\d+)\s*HP/)[1]);
    instalacionItems.push({
      name: `Instalacion bomba de agua HVAC ${hp} HP`,
      description: `Instalacion profesional de bomba de agua ${hp} HP | Mano de obra: $${precioTr.toLocaleString()} fijo | Incluye tuberia de succion y descarga, valvulas de compuerta y check, conexion electrica, base, acoplamiento, alineacion | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Caldera')) {
    const mbh = parseInt(equipo.match(/(\d+)\s*MBH/)[1]);
    instalacionItems.push({
      name: `Instalacion caldera ${mbh} MBH`,
      description: `Instalacion profesional de caldera ${mbh} MBH | Incluye conexion de gas, chimenea/venteo, tuberia de agua caliente, valvulería de seguridad, conexion electrica y control | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  } else if (equipo.includes('Cuarto')) {
    const tam = equipo.includes('pequeno') ? 'pequeno' : equipo.includes('mediano') ? 'mediano' : 'grande';
    instalacionItems.push({
      name: `Instalacion cuarto frio ${tam}`,
      description: `Instalacion profesional de cuarto frio ${tam} | Incluye panel aislante, puerta, unidad condensadora, evaporador, tuberia de refrigerante, control, iluminacion | No incluye equipo`,
      unit: 'servicio',
      category: 'Instalacion Equipos',
      basePrice: totalBase,
      costPrice: Math.round(totalBase * 0.55),
    });
  }
});

// ─── 2. Polizas de Mantenimiento ──────────────────────────────────────────
// PRECIOS BASADOS EN HOMEPRO FEBRERO 2026 + MERCADO CDMX
// Precios reales y competitivos por tonelada de refrigeracion al año (MXN)
// Fuente: HomePro Indice Costos Mano Obra Feb 2026 (PRNewswire),
//         analisisdepreciosunitarios.com, AireyClimas CDMX 2026
//
// HomePro 2026 (precios por visita preventiva):
//   Minisplit 1 TR: $2,500 | 2 TR: $2,600 | 3 TR: $2,700
//   Cassette 2-4 TR: $2,700-$3,200 | Piso techo 5 TR: $2,800
//   Fan Coil 4.5 TR: $3,600 | VRF: $2,800-$4,500/unidad
//   Chiller: desde $15,000 | Rooftop: $4,000-$9,000
//
// Poliza = precio por visita x visitas anuales x descuento por contrato
const MANT_POR_TR_ANUAL = {
  // Equipo:              basico(2vis)  estandar(4vis)  premium(4vis+emerg)
  'Minisplit':                              { basico: 3400, estandar: 6400, premium: 8400 },
  'Cassette':                               { basico: 3000, estandar: 5800, premium: 7600 },
  'Fan Coil (agua helada)':                 { basico: 3700, estandar: 7000, premium: 9200 },
  'AHU/Manejadora de aire':                 { basico: 2600, estandar: 4800, premium: 6300 },
  'Rooftop/Paquete':                        { basico: 3100, estandar: 5800, premium: 7600 },
  'VRF':                                    { basico: 2000, estandar: 3800, premium: 5000 },
  'Chiller':                                { basico: 1400, estandar: 2600, premium: 3400 },
  'Torre de enfriamiento':                  { basico: 1000, estandar: 1900, premium: 2500 },
  'Sistema agua helada completo':           { basico: 1200, estandar: 2200, premium: 2900 },
  'Bomba de agua HVAC':                     { basico: 850,  estandar: 1600, premium: 0 },
};

const DESCRIPCIONES_MANT = {
  'Minisplit':                    'minisplit',
  'Cassette':                     'cassette',
  'Fan Coil (agua helada)':       'fan coil de agua helada',
  'AHU/Manejadora de aire':       'manejadora de aire',
  'Rooftop/Paquete':              'rooftop/paquete',
  'VRF':                          'sistema VRF',
  'Chiller':                      'chiller',
  'Torre de enfriamiento':        'torre de enfriamiento',
  'Sistema agua helada completo': 'sistema de agua helada completo',
  'Bomba de agua HVAC':           'bomba de agua HVAC',
};

const VISITAS_MANT = {
  'basico':   '2 visitas preventivas/año',
  'estandar': '4 visitas preventivas/año',
  'premium':  '4 visitas preventivas + emergencias 24/7 sin costo',
};

const INCLUYE_MANT = {
  'basico':   'limpieza completa, revision de componentes, reporte digital, 10% descuento en refacciones, mano de obra correctiva con 15% descuento',
  'estandar': 'limpieza completa, revision de componentes, reporte digital, 15% descuento en refacciones, mano de obra correctiva con 20% descuento, respuesta prioritaria < 24 hrs',
  'premium':  'limpieza completa, revision de componentes, reporte ejecutivo, 20% descuento en refacciones, mano de obra correctiva sin costo, respuesta inmediata < 4 hrs, atencion 24/7/365, monitoreo remoto',
};

const DETALLE_MANT_EQUIPO = {
  'Minisplit':                    'Limpieza de filtros, evaporadora, condensadora, bandeja de drenaje, ventilador | Revision de presiones, amperajes, carga de refrigerante, conexiones electricas, control remoto, drenaje',
  'Cassette':                     'Limpieza de filtros, evaporadora, condensadora, bandeja de drenaje, bomba de condensados, ventilador | Revision de presiones, amperajes, carga de refrigerante, conexiones electricas, control remoto',
  'Fan Coil (agua helada)':       'Limpieza de serpentin de agua helada, bandeja de condensados, filtros, ventilador, valvulas de control | Revision de temperatura de impulsión y retorno, conexiones hidraulicas, actuadores',
  'AHU/Manejadora de aire':       'Limpieza de serpentines de enfriamiento y calefaccion, filtros, ventiladores, compuertas de mezcla, drenaje | Revision de transmisiones, bandas, poleas, conexiones electricas, controles, sensores',
  'Rooftop/Paquete':              'Limpieza de serpentines de condensador y evaporador, filtros, quemadores (calefaccion), ventiladores, drenaje | Revision de presiones, amperajes, carga de refrigerante, controles, termostato, secuencia de operacion',
  'VRF':                          'Limpieza de condensadoras, evaporadoras, filtros de aire, drenajes | Revision de tuberia de refrigerante, deteccion de fugas, carga de refrigerante, presiones, controles de red, cableado de comunicacion BCU',
  'Chiller':                      'Limpieza de condensador y evaporador, cambio de aceite y filtros, revision de compresor | Analisis de refrigerante, presiones, temperaturas, controles, bombas, torre de enfriamiento, bombas de agua helada, valvulería',
  'Torre de enfriamiento':        'Limpieza de relleno, eliminador de arrastre, boquillas, bandeja, flotador, valvula de llenado | Revision de motor, ventilador, transmision, analisis de agua (pH, TDS, dureza), tratamiento quimico dosificador',
  'Sistema agua helada completo': 'Mantenimiento completo de todo el sistema: chiller, bombas de agua helada y condensado, torre de enfriamiento, fan coils o manejadoras, valvulería, controles, sensores | Reporte ejecutivo de eficiencia',
  'Bomba de agua HVAC':           'Lubricacion de baleros y chumaceras, revision de sellos mecanicos, acoplamiento, motor, valvulas de succion y descarga, presiones, amperajes, alineacion, base y nivelacion',
};

const mantenimientoItems = [];
Object.entries(MANT_POR_TR_ANUAL).forEach(([equipo, planes]) => {
  Object.entries(planes).forEach(([nivel, precioUnitario]) => {
    if (precioUnitario === 0) return;

    const visits = VISITAS_MANT[nivel];
    const incluye = INCLUYE_MANT[nivel];
    const detalles = DETALLE_MANT_EQUIPO[equipo];
    const equipoLower = DESCRIPCIONES_MANT[equipo];
    const unidad = equipo === 'Bomba de agua HVAC' ? 'HP/año' : 'TR/año';
    const descUnidad = equipo === 'Bomba de agua HVAC' ? 'HP' : 'TR';

    const nivelLabel = nivel.charAt(0).toUpperCase() + nivel.slice(1);
    const visitCount = nivel === 'basico' ? '2 visitas' : '4 visitas';

    mantenimientoItems.push({
      name: `Poliza mantenimiento ${equipo} - ${nivelLabel}`,
      description: `Poliza de mantenimiento ${nivelLabel} para ${equipoLower} | ${visits} | $${precioUnitario.toLocaleString()}/${descUnidad}/año | Incluye: ${incluye} | Detalle tecnico: ${detalles} | Reporte digital incluido | Cotizar: cantidad de ${descUnidad} x $${precioUnitario.toLocaleString()}/${descUnidad}/año | Precios basados en HomePro CDMX 2026`,
      unit: unidad,
      category: 'Polizas de Mantenimiento',
      basePrice: precioUnitario,
      costPrice: Math.round(precioUnitario * 0.55),
    });
  });
});

// Add servicios individuales de mantenimiento
const serviciosMantto = [
  { name: 'Diagnostico y visita tecnica HVAC', desc: 'Visita de diagnostico tecnico a equipo HVAC | Incluye revision general, medicion de presiones, temperaturas, amperajes | Reporte de diagnostico', unit: 'servicio', bp: 600 },
  { name: 'Limpieza profunda de minisplit 1 TR', desc: 'Limpieza profunda de minisplit 1 TR | Desmontaje, limpieza de evaporadora, condensadora, filtros, bandeja, drenaje, sanitizacion', unit: 'servicio', bp: 1200 },
  { name: 'Limpieza profunda de minisplit 2 TR', desc: 'Limpieza profunda de minisplit 2 TR | Desmontaje, limpieza completa, sanitizacion, revision de presiones y amperajes', unit: 'servicio', bp: 1500 },
  { name: 'Limpieza profunda de minisplit 3 TR', desc: 'Limpieza profunda de minisplit 3 TR | Desmontaje, limpieza completa, sanitizacion, revision de presiones y amperajes', unit: 'servicio', bp: 1800 },
  { name: 'Limpieza profunda de minisplit 5 TR', desc: 'Limpieza profunda de minisplit 5 TR | Desmontaje, limpieza completa, sanitizacion', unit: 'servicio', bp: 2500 },
  { name: 'Limpieza de cassette 2-4 TR', desc: 'Limpieza profunda de cassette | Incluye filtros, evaporadora, bandeja, bomba de drenaje', unit: 'servicio', bp: 2800 },
  { name: 'Limpieza de fan coil (agua helada)', desc: 'Limpieza profunda de fan coil | Serpentin, bandeja, filtros, ventilador, valvulas', unit: 'servicio', bp: 2000 },
  { name: 'Limpieza de condensadora (split/VRF)', desc: 'Limpieza quimica de serpentin condensador | Incluye aplicacion de quimico, lavado a presion, revision de ventilador', unit: 'servicio', bp: 1500 },
  { name: 'Limpieza quimica de serpentin evaporador', desc: 'Limpieza quimica profunda de serpentin evaporador | Desmontaje, quimico, lavado, armado', unit: 'servicio', bp: 2500 },
  { name: 'Limpieza quimica de serpentin condensador', desc: 'Limpieza quimica profunda de serpentin condensador | Quimico desengrasante, lavado a presion, revision de aletas', unit: 'servicio', bp: 2500 },
  { name: 'Destapar drenaje de minisplit', desc: 'Destape de drenaje obstruido en minisplit | Incluye aspiracion, soplido, limpieza de bandeja', unit: 'servicio', bp: 500 },
  { name: 'Deteccion de fugas de refrigerante (electronica)', desc: 'Deteccion de fugas con detector electronico | Resumen de puntos sospechosos', unit: 'servicio', bp: 1200 },
  { name: 'Deteccion de fugas de refrigerante (N2 presurizacion)', desc: 'Deteccion de fugas por presurizacion con nitrogeno | Incluye tanque de N2 y manometro', unit: 'servicio', bp: 1500 },
  { name: 'Deteccion de fugas de refrigerante (ultrasonico)', desc: 'Deteccion de fugas con equipo ultrasonico | Para fugas en tuberia oculta o en losa', unit: 'servicio', bp: 2500 },
  { name: 'Deteccion de fugas de refrigerante (tinte UV)', desc: 'Deteccion de fugas con tinte ultravioleta | Incluye aplicacion de tinte y lampara UV', unit: 'servicio', bp: 1800 },
  { name: 'Carga de gas refrigerante R-410A (1 kg)', desc: 'Carga de gas refrigerante R-410A | Incluye 1 kg de gas, instalacion, revision de fugas, prueba de funcionamiento', unit: 'servicio', bp: 1200 },
  { name: 'Carga de gas refrigerante R-32 (1 kg)', desc: 'Carga de gas refrigerante R-32 | Incluye 1 kg de gas, instalacion, revision de fugas, prueba', unit: 'servicio', bp: 1000 },
  { name: 'Carga de gas refrigerante R-22 (1 kg)', desc: 'Carga de gas refrigerante R-22 | Incluye 1 kg de gas, instalacion, revision de fugas, prueba', unit: 'servicio', bp: 1800 },
  { name: 'Recuperacion de gas refrigerante', desc: 'Recuperacion de gas refrigerante con equipo recuperador | Incluye cilindro de almacenamiento', unit: 'servicio', bp: 1500 },
  { name: 'Revision de presiones y amperajes', desc: 'Revision completa de presiones de succion y descarga, amperajes, temperaturas | Reporte', unit: 'servicio', bp: 500 },
  { name: 'Balanceo de sistema de aire (por difusor)', desc: 'Medicion de flujo de aire en difusores, balanceo de compuertas, reporte de CFM por difusor', unit: 'difusor', bp: 250 },
  { name: 'Analisis de agua para torre de enfriamiento', desc: 'Analisis quimico de agua de torre | pH, TDS, dureza, alcalinidad, conductividad | Reporte', unit: 'muestra', bp: 800 },
  { name: 'Limpieza de filtros HVAC (por equipo)', desc: 'Limpieza o reemplazo de filtros de retorno y suministro | Por equipo', unit: 'equipo', bp: 200 },
  { name: 'Limpieza de intercambiador de calor de caldera', desc: 'Limpieza mecanica/quimica de intercambiador de calor de caldera | Desmontaje, limpieza, armado, prueba', unit: 'servicio', bp: 4000 },
  { name: 'Revision de combustion de caldera', desc: 'Analisis de gases de combustion, eficiencia, CO, O2, temperatura de chimenea | Reporte', unit: 'servicio', bp: 1500 },
  { name: 'Limpieza de quemadores de caldera', desc: 'Limpieza de quemadores, boquillas, filtros de gas, presion de gas', unit: 'servicio', bp: 2500 },
  { name: 'Mantenimiento de presostato/termostato de seguridad', desc: 'Revision y calibracion de presostatos y termostatos de seguridad en sistemas HVAC', unit: 'servicio', bp: 500 },
  { name: 'Cambio de filtros MERV 13/HEPA', desc: 'Suministro y reemplazo de filtros MERV 13 o HEPA en AHU | Por filtro', unit: 'pieza', bp: 350 },
];

// Servicios correctivos
const serviciosCorrectivos = [
  { name: 'Cambio de compresor minisplit 1-2 TR', desc: 'Reemplazo de compresor rotativo 1-2 TR | Incluye mano de obra, gas refrigerante, filtro deshidratador, vacio, prueba | No incluye compresor', unit: 'servicio', bp: 4500 },
  { name: 'Cambio de compresor minisplit 3-5 TR', desc: 'Reemplazo de compresor rotativo 3-5 TR | Incluye mano de obra, gas refrigerante, filtro, vacio, prueba | No incluye compresor', unit: 'servicio', bp: 6500 },
  { name: 'Cambio de compresor scroll 5-10 TR', desc: 'Reemplazo de compresor scroll 5-10 TR | Incluye mano de obra, gas, filtro, vacuometro, prueba | No incluye compresor', unit: 'servicio', bp: 9000 },
  { name: 'Cambio de compresor chiller (refaccion + mano de obra)', desc: 'Reemplazo completo de compresor de chiller | Incluye compresor, aceite, filtros, gas, secuencia de arranque, puesta en marcha', unit: 'servicio', bp: 85000 },
  { name: 'Reemplazo de motor de ventilador (condensadora)', desc: 'Cambio de motor de ventilador de condensadora | Incluye motor, capacitor, mano de obra, prueba', unit: 'servicio', bp: 2500 },
  { name: 'Reemplazo de motor de ventilador (evaporadora)', desc: 'Cambio de motor de ventilador de evaporadora | Incluye motor, capacitor, mano de obra, prueba', unit: 'servicio', bp: 2000 },
  { name: 'Reemplazo de capacitor de arranque/operacion', desc: 'Cambio de capacitor de arranque o de operacion en minisplit/rooftop | Incluye capacitor y mano de obra', unit: 'servicio', bp: 500 },
  { name: 'Reemplazo de placa controladora (tarjeta electronica)', desc: 'Cambio de tarjeta de control principal de minisplit/VRF | Incluye mano de obra, configuracion, prueba', unit: 'servicio', bp: 1500 },
  { name: 'Reemplazo de termostato de pared', desc: 'Cambio de termostato de pared analogico/digital | Incluye termostato, instalacion, configuracion, prueba', unit: 'servicio', bp: 800 },
  { name: 'Reemplazo de termostato WiFi/inteligente', desc: 'Cambio de termostato WiFi programable | Incluye termostato, instalacion, configuracion de app, prueba', unit: 'servicio', bp: 2500 },
  { name: 'Reemplazo de valvula de expansion (TXV)', desc: 'Cambio de valvula de expansion termostatica | Incluye valvula, mano de obra, carga de gas, prueba', unit: 'servicio', bp: 3500 },
  { name: 'Reemplazo de valvula de zona (motorizada)', desc: 'Cambio de valvula de zona motorizada 2/3 vias | Incluye valvula, actuador, instalacion, prueba', unit: 'servicio', bp: 1500 },
  { name: 'Reemplazo de actuador de compuerta', desc: 'Cambio de actuador de compuerta de regulacion | Incluye actuador, instalacion, calibracion, prueba', unit: 'servicio', bp: 2200 },
  { name: 'Limpieza de drenaje general (linea completa)', desc: 'Destape de linea de drenaje de equipo HVAC | Incluye aspiradora industrial, soplido, limpieza de bandeja', unit: 'servicio', bp: 800 },
  { name: 'Reparacion de fuga de agua en tuberia', desc: 'Reparacion de fuga en tuberia de agua helada/condensado | Incluye drenaje, corte, reparacion, prueba', unit: 'servicio', bp: 1500 },
  { name: 'Sellado de ductos (fugas de aire)', desc: 'Sellado de fugas de aire en ducteria con mastic/foil | Por punto de fuga', unit: 'punto', bp: 150 },
  { name: 'Aislamiento termico de tuberia (por metro)', desc: 'Aislamiento de tuberia de refrigerante/agua helada con armaflex | Incluye material y mano de obra | Por metro lineal', unit: 'metro', bp: 120 },
  { name: 'Prueba de estanqueidad de sistema (presurizacion)', desc: 'Prueba de presion con nitrogeno a sistema HVAC | Incluye manometro, N2, reporte', unit: 'servicio', bp: 2000 },
  { name: 'Vacio de sistema HVAC (micronico)', desc: 'Vacio profundo de sistema HVAC con vacuometro electronico < 500 micrones', unit: 'servicio', bp: 1500 },
  { name: 'Revision de arranque (puesta en marcha) de equipo nuevo', desc: 'Puesta en marcha de equipo HVAC nuevo | Verificacion de instalacion, presiones, amperajes, temperaturas, control, reporte', unit: 'servicio', bp: 2500 },
  { name: 'Programacion de control centralizado/BMS', desc: 'Programacion de logica de control para sistema BMS/centralizado | Incluye configuracion de puntos, secuencias, alarmas', unit: 'servicio', bp: 5000 },
  { name: 'Actualizacion de firmware de VRF', desc: 'Actualizacion de firmware de sistema VRF para optimizacion de rendimiento', unit: 'servicio', bp: 3500 },
  { name: 'Correccion de voltaje/fase en equipo trifasico', desc: 'Correccion de problema de voltaje, fase faltante o desbalanceo en equipo HVAC trifasico', unit: 'servicio', bp: 1500 },
  { name: 'Reparacion de漏水 (fuga de agua) en minisplit', desc: 'Reparacion de fuga de agua en minisplit por drenaje obstruido o installing incorrecta', unit: 'servicio', bp: 600 },
  { name: 'Cambio de banda de ventilador', desc: 'Cambio de banda de ventilador en AHU/rooftop | Incluye banda, tensionado, alineacion | Por juego', unit: 'servicio', bp: 1200 },
  { name: 'Cambio de rodamientos de ventilador', desc: 'Cambio de rodamientos de ventilador en AHU/extractor | Incluye rodamientos, mano de obra, alineacion, lubricacion', unit: 'servicio', bp: 2500 },
];

// ─── 3. Fix Gas Refrigerante con precios reales de mercado ─────────────
const GAS_PRECIOS_REALES = {
  'R-410A': 280, 'R-32': 200, 'R-22': 450, 'R-134a': 270,
  'R-404A': 265, 'R-407C': 285, 'R-290': 130, 'R-600a': 150,
  'R-448A': 380, 'R-449A': 620, 'R-454B': 500, 'R-1234yf': 1200,
  'R-513A': 650, 'R-452A': 550, 'R-507': 350, 'R-515B': 750,
  'R-1233zd': 950, 'R-245fa': 800, 'R-141b': 550, 'R-142b': 700,
  'R-124': 600, 'R-1270': 350, 'R-407H': 800, 'R-744': 350,
};

// ─── APPLY CHANGES ────────────────────────────────────────────────────────
console.log('Current items:', data.length);

// Remove categories we fully regenerate (Instalacion Equipos + Planes de Mantenimiento)
const removeCats = ['Instalacion Equipos', 'Instalación Equipos', 'Planes de Mantenimiento', 'Polizas de Mantenimiento'];
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

// Fix gas refrigerant prices
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
          item.basePrice = Math.round(precioKg * kg * 1.2);
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

data = data.concat(mantenimientoItems);
console.log('Added maintenance plan items:', mantenimientoItems.length);

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
  const min = Math.min(...deduped.filter(i => i.category === c && i.basePrice != null).map(i => i.basePrice));
  const max = Math.max(...deduped.filter(i => i.category === c && i.basePrice != null).map(i => i.basePrice));
  console.log(`  ${c}: ${count} items, $${min} - $${max}`);
});
