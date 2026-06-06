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

// ─── 1. Replace Instalacion Equipos ──────────────────────────────────────
const instalacionItems = [];
Object.entries(PRECIO_INSTALACION_POR_TR).forEach(([equipo, precioTr]) => {
  const matchTR = equipo.match(/([\d.]+)\s*TR/);
  const toneladas = matchTR ? parseFloat(matchTR[1]) : 1;
  const totalBase = Math.round(precioTr * toneladas);

  let name, desc, unit, bp;
  
  if (equipo.includes('Minisplit')) {
    const tr = toneladas;
    name = `Instalacion de minisplit ${tr} TR (alta pared)`;
    desc = `Instalacion profesional de minisplit ${tr} TR | Incluye soporteria, tuberia de cobre hasta 5m, cableado electrico, drenaje, prueba de funcionamiento | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else if (equipo.includes('Cassette')) {
    const tr = toneladas;
    name = `Instalacion de cassette ${tr} TR`;
    desc = `Instalacion profesional de cassette ${tr} TR en plafon | Incluye soporteria, tuberia de cobre hasta 8m, cableado electrico, drenaje, control remoto, prueba | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else if (equipo.includes('Piso-Techo')) {
    const tr = toneladas;
    name = `Instalacion de piso-techo ${tr} TR`;
    desc = `Instalacion profesional de piso-techo ${tr} TR | Incluye soporteria, tuberia de cobre, cableado, drenaje, control, prueba | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else if (equipo.includes('Fan Coil')) {
    const tr = toneladas;
    name = `Instalacion de fan coil ${tr} TR (agua helada)`;
    desc = `Instalacion profesional de fan coil ${tr} TR | Incluye tuberia de agua helada ida/retorno, valvulas de corte, conexion electrica, drenaje, bandeja | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else if (equipo.includes('AHU')) {
    const cfm = parseInt(equipo.match(/(\d+)\s*CFM/)[1]);
    name = `Instalacion de manejadora de aire ${cfm} CFM`;
    desc = `Instalacion profesional de manejadora de aire ${cfm} CFM | Incluye conexion a ductos, tuberia de agua helada, valvulería, conexion electrica y control, drenaje | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else if (equipo.includes('Rooftop')) {
    const tr = toneladas;
    name = `Instalacion de rooftop/paquete ${tr} TR`;
    desc = `Instalacion profesional de rooftop ${tr} TR en azotea | Incluye base metalica, ducteria de conexion, cableado electrico, termostato, puesta en marcha | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else if (equipo.includes('VRF unidad interior')) {
    name = `Instalacion de unidad interior VRF (cassette/conducto/pared)`;
    desc = `Instalacion profesional de unidad interior VRF | Incluye tuberia de refrigerante, cableado de control, drenaje, soporteria, conexion a red | No incluye equipo`;
    unit = 'servicio';
    bp = 4500;
  } else if (equipo.includes('VRF sistema')) {
    name = `Instalacion de sistema VRF completo (por TR)`;
    desc = `Instalacion profesional de sistema VRF | Incluye tuberia de refrigerante, refnet, cableado de control y alimentacion, drenajes, puesta en marcha, carga de refrigerante | Por tonelada de refrigeracion`;
    unit = 'TR';
    bp = precioTr;
  } else if (equipo.includes('Chiller')) {
    const tr = toneladas;
    const tipo = equipo.includes('centrifugo') ? 'centrifugo' : equipo.includes('tornillo') ? 'tornillo' : 'scroll';
    name = `Instalacion de chiller ${tipo} ${tr} TR`;
    desc = `Instalacion profesional de chiller ${tipo} ${tr} TR | Incluye cimentacion, conexiones hidraulicas, electricas y de control, tuberia de agua helada, valvulería, puesta en marcha | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else if (equipo.includes('Torre')) {
    const tr = toneladas;
    name = `Instalacion de torre de enfriamiento ${tr} TR`;
    desc = `Instalacion profesional de torre de enfriamiento ${tr} TR | Incluye base, tuberia de conexion, valvulería, flotador, conexion electrica, puesta en marcha | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else if (equipo.includes('Bomba')) {
    const hp = parseInt(equipo.match(/(\d+)\s*HP/)[1]);
    name = `Instalacion de bomba de agua HVAC ${hp} HP`;
    desc = `Instalacion profesional de bomba de agua ${hp} HP | Incluye tuberia de succion y descarga, valvulas de compuerta y check, conexion electrica, base, acoplamiento, alineacion | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else if (equipo.includes('Caldera')) {
    const mbh = parseInt(equipo.match(/(\d+)\s*MBH/)[1]);
    name = `Instalacion de caldera ${mbh} MBH`;
    desc = `Instalacion profesional de caldera ${mbh} MBH | Incluye conexion de gas, chimenea/venteo, tuberia de agua caliente, valvulería de seguridad, conexion electrica y control | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else if (equipo.includes('Cuarto')) {
    const tam = equipo.includes('pequeno') ? 'pequeno' : equipo.includes('mediano') ? 'mediano' : 'grande';
    name = `Instalacion de cuarto frio ${tam}`;
    desc = `Instalacion profesional de cuarto frio ${tam} | Incluye panel aislante, puerta, unidad condensadora, evaporador, tuberia de refrigerante, control, iluminacion | No incluye equipo`;
    unit = 'servicio';
    bp = totalBase;
  } else {
    name = `Instalacion de ${equipo}`;
    desc = `Instalacion profesional de ${equipo}`;
    unit = 'servicio';
    bp = totalBase;
  }

  instalacionItems.push({
    name,
    description: desc,
    unit,
    category: 'Instalacion Equipos',
    basePrice: bp,
    costPrice: Math.round(bp * 0.55),
  });
});

// ─── 2. Replace Planes de Mantenimiento ─────────────────────────────────
// Precios por tonelada de refrigeracion al año (MXN)
const MANT_POR_TR_ANUAL = {
  'Minisplit - Plan basico (2 visitas/año)': { basico: 1200, estandar: 0, premium: 0 },
  'Minisplit - Plan estandar (4 visitas/año)': { basico: 0, estandar: 1800, premium: 0 },
  'Minisplit - Plan premium (4 visitas + emergencia)': { basico: 0, estandar: 0, premium: 2800 },
  'Cassette - Plan basico (2 visitas/año)': { basico: 1500, estandar: 0, premium: 0 },
  'Cassette - Plan estandar (4 visitas/año)': { basico: 0, estandar: 2200, premium: 0 },
  'Cassette - Plan premium (4 visitas + emergencia)': { basico: 0, estandar: 0, premium: 3200 },
  'Fan Coil - Plan basico (2 visitas/año)': { basico: 1000, estandar: 0, premium: 0 },
  'Fan Coil - Plan estandar (4 visitas/año)': { basico: 0, estandar: 1600, premium: 0 },
  'Fan Coil - Plan premium (4 visitas + emergencia)': { basico: 0, estandar: 0, premium: 2500 },
  'AHU/Manejadora - Plan basico (2 visitas/año)': { basico: 1200, estandar: 0, premium: 0 },
  'AHU/Manejadora - Plan estandar (4 visitas/año)': { basico: 0, estandar: 1800, premium: 0 },
  'AHU/Manejadora - Plan premium (4 visitas + emergencia)': { basico: 0, estandar: 0, premium: 3000 },
  'Rooftop/Paquete - Plan basico (2 visitas/año)': { basico: 1100, estandar: 0, premium: 0 },
  'Rooftop/Paquete - Plan estandar (4 visitas/año)': { basico: 0, estandar: 1700, premium: 0 },
  'Rooftop/Paquete - Plan premium (4 visitas + emergencia)': { basico: 0, estandar: 0, premium: 2600 },
  'VRF - Plan basico (2 visitas/año)': { basico: 1400, estandar: 0, premium: 0 },
  'VRF - Plan estandar (4 visitas/año)': { basico: 0, estandar: 2200, premium: 0 },
  'VRF - Plan premium (4 visitas + emergencia 24/7)': { basico: 0, estandar: 0, premium: 3500 },
  'Chiller - Plan basico (2 visitas/año)': { basico: 800, estandar: 0, premium: 0 },
  'Chiller - Plan estandar (4 visitas/año)': { basico: 0, estandar: 1400, premium: 0 },
  'Chiller - Plan premium (4 visitas + monitoreo 24/7)': { basico: 0, estandar: 0, premium: 2500 },
  'Torre enfriamiento - Plan basico (2 visitas/año)': { basico: 600, estandar: 0, premium: 0 },
  'Torre enfriamiento - Plan estandar (4 visitas/año)': { basico: 0, estandar: 1000, premium: 0 },
  'Torre enfriamiento - Plan premium (4 visitas + analisis agua)': { basico: 0, estandar: 0, premium: 1800 },
  'Bomba de agua - Plan basico (2 visitas/año)': { basico: 500, estandar: 0, premium: 0 },
  'Bomba de agua - Plan estandar (4 visitas/año)': { basico: 0, estandar: 900, premium: 0 },
  'Sistema agua helada completo - Plan basico': { basico: 700, estandar: 0, premium: 0 },
  'Sistema agua helada completo - Plan estandar': { basico: 0, estandar: 1200, premium: 0 },
  'Sistema agua helada completo - Plan premium': { basico: 0, estandar: 0, premium: 2200 },
};

const mantenimientoItems = [];
Object.entries(MANT_POR_TR_ANUAL).forEach(([nombre, planes]) => {
  // Generate for common capacities
  const capacidades = [1, 2, 3, 5, 10, 15, 20, 30, 50, 100, 200, 300, 500];
  
  Object.entries(planes).forEach(([nivel, precioTr]) => {
    if (precioTr === 0) return;
    
    const nivelName = nivel.match(/basico|estandar|premium/)[0];
    const visits = nivel.includes('2 visitas') ? 2 : nivel.includes('4 visitas') ? 4 : nivel.includes('emergencia') ? '4 + emergencia' : 2;
    
    if (nombre.includes('Minisplit')) {
      for (const tr of [1, 2, 3, 5]) {
        const total = Math.round(precioTr * tr);
        mantenimientoItems.push({
          name: `Plan mantenimiento ${nombre} - ${tr} TR (${nivelName})`,
          description: `Mantenimiento preventivo ${nivelName} para minisplit ${tr} TR | ${visits} visitas anuales | Incluye limpieza de filtros, evaporadora, condensadora, revision electrica, presiones, drenaje | Reporte digital`,
          unit: 'plan/anual',
          category: 'Planes de Mantenimiento',
          basePrice: total,
          costPrice: Math.round(total * 0.55),
        });
      }
    } else if (nombre.includes('Cassette')) {
      for (const tr of [2, 3, 4]) {
        const total = Math.round(precioTr * tr);
        mantenimientoItems.push({
          name: `Plan mantenimiento ${nombre} - ${tr} TR (${nivelName})`,
          description: `Mantenimiento preventivo ${nivelName} para cassette ${tr} TR | ${visits} visitas anuales | Incluye limpieza de filtros, evaporadora, condensadora, bandeja de drenaje, control remoto | Reporte digital`,
          unit: 'plan/anual',
          category: 'Planes de Mantenimiento',
          basePrice: total,
          costPrice: Math.round(total * 0.55),
        });
      }
    } else if (nombre.includes('Fan Coil')) {
      for (const tr of [2, 3, 4, 6, 8, 10, 15, 20]) {
        const total = Math.round(precioTr * tr);
        mantenimientoItems.push({
          name: `Plan mantenimiento ${nombre} - ${tr} TR (${nivelName})`,
          description: `Mantenimiento preventivo ${nivelName} para fan coil ${tr} TR | ${visits} visitas anuales | Incluye limpieza de serpentin, bandeja, filtros, ventilador, valvulas, drenaje | Reporte digital`,
          unit: 'plan/anual',
          category: 'Planes de Mantenimiento',
          basePrice: total,
          costPrice: Math.round(total * 0.55),
        });
      }
    } else if (nombre.includes('AHU')) {
      for (const cfm of [400, 800, 1500, 3000, 5000, 10000]) {
        const tr = Math.round(cfm / 400);
        const total = Math.round(precioTr * tr);
        mantenimientoItems.push({
          name: `Plan mantenimiento ${nombre} - ${cfm} CFM (${nivelName})`,
          description: `Mantenimiento preventivo ${nivelName} para manejadora de aire ${cfm} CFM | ${visits} visitas anuales | Incluye limpieza de serpentines, filtros, ventiladores, compuertas, drenaje, cheques electricos | Reporte digital`,
          unit: 'plan/anual',
          category: 'Planes de Mantenimiento',
          basePrice: total,
          costPrice: Math.round(total * 0.55),
        });
      }
    } else if (nombre.includes('Rooftop')) {
      for (const tr of [5, 7.5, 10, 12.5, 15, 20, 25]) {
        const total = Math.round(precioTr * tr);
        mantenimientoItems.push({
          name: `Plan mantenimiento ${nombre} - ${tr} TR (${nivelName})`,
          description: `Mantenimiento preventivo ${nivelName} para rooftop/paquete ${tr} TR | ${visits} visitas anuales | Incluye limpieza de serpentines, filtros, quemadores, ventiladores, drenaje, controles | Reporte digital`,
          unit: 'plan/anual',
          category: 'Planes de Mantenimiento',
          basePrice: total,
          costPrice: Math.round(total * 0.55),
        });
      }
    } else if (nombre.includes('VRF')) {
      for (const tr of [6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 34]) {
        const total = Math.round(precioTr * tr);
        mantenimientoItems.push({
          name: `Plan mantenimiento ${nombre} - ${tr} TR (${nivelName})`,
          description: `Mantenimiento preventivo ${nivelName} para sistema VRF ${tr} TR | ${visits} visitas anuales | Incluye limpieza de condensadoras, evaporadoras, tuberia de refrigerante, revision de fugas, controles, red | Reporte digital`,
          unit: 'plan/anual',
          category: 'Planes de Mantenimiento',
          basePrice: total,
          costPrice: Math.round(total * 0.55),
        });
      }
    } else if (nombre.includes('Chiller')) {
      for (const tr of [30, 50, 80, 100, 150, 200, 300, 400, 600, 800]) {
        const total = Math.round(precioTr * tr);
        mantenimientoItems.push({
          name: `Plan mantenimiento ${nombre} - ${tr} TR (${nivelName})`,
          description: `Mantenimiento preventivo ${nivelName} para chiller ${tr} TR | ${visits} visitas anuales | Incluye revision de compresor, aceite, filtros, refrigerante, controles, bombas, torre | Reporte digital`,
          unit: 'plan/anual',
          category: 'Planes de Mantenimiento',
          basePrice: total,
          costPrice: Math.round(total * 0.55),
        });
      }
    } else if (nombre.includes('Torre')) {
      for (const tr of [100, 200, 300, 500]) {
        const total = Math.round(precioTr * tr);
        mantenimientoItems.push({
          name: `Plan mantenimiento ${nombre} - ${tr} TR (${nivelName})`,
          description: `Mantenimiento preventivo ${nivelName} para torre de enfriamiento ${tr} TR | ${visits} visitas anuales | Incluye limpieza de relleno, boquillas, bandeja, flotador, analisis de agua, motor, ventilador | Reporte digital`,
          unit: 'plan/anual',
          category: 'Planes de Mantenimiento',
          basePrice: total,
          costPrice: Math.round(total * 0.55),
        });
      }
    } else if (nombre.includes('Bomba')) {
      for (const hp of [1, 2, 3, 5, 10, 20, 50]) {
        const total = Math.round(precioTr * hp);
        mantenimientoItems.push({
          name: `Plan mantenimiento ${nombre} - ${hp} HP (${nivelName})`,
          description: `Mantenimiento preventivo ${nivelName} para bomba de agua HVAC ${hp} HP | ${visits} visitas anuales | Incluye lubricacion, revision de sellos, acoplamiento, motor, valvulas, presiones | Reporte digital`,
          unit: 'plan/anual',
          category: 'Planes de Mantenimiento',
          basePrice: total,
          costPrice: Math.round(total * 0.55),
        });
      }
    } else if (nombre.includes('Sistema agua helada')) {
      for (const tr of [50, 100, 150, 200, 300, 500]) {
        const total = Math.round(precioTr * tr);
        mantenimientoItems.push({
          name: `Plan mantenimiento ${nombre} - ${tr} TR (${nivelName})`,
          description: `Mantenimiento preventivo ${nivelName} para sistema agua helada completo ${tr} TR | ${visits} visitas anuales | Incluye chiller, bombas, torre, fan coils, controles, valvulería | Reporte digital ejecutivo`,
          unit: 'plan/anual',
          category: 'Planes de Mantenimiento',
          basePrice: total,
          costPrice: Math.round(total * 0.55),
        });
      }
    }
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

// Track removed
const removeCats = ['Planes de Mantenimiento'];
let removed = 0;
data = data.filter(item => {
  if (removeCats.includes(item.category)) { removed++; return false; }
  return true;
});
console.log('Removed old maintenance plans:', removed);

// Fix gas refrigerant prices
let gasFixed = 0;
data.forEach(item => {
  if (item.category === 'Gas Refrigerante' && item.name && item.basePrice != null) {
    // Check if it's a known refrigerant
    for (const [gas, precioKg] of Object.entries(GAS_PRECIOS_REALES)) {
      if (item.name.includes(gas)) {
        // Parse kg from name or description
        let kg = 1;
        const kgMatch = item.name.match(/([\d.]+)\s*kg/i) || item.description?.match(/([\d.]+)\s*kg/i);
        if (kgMatch) kg = parseFloat(kgMatch[1]);
        
        // If unit is 'kg', price per kg
        if (item.unit === 'kg' && kg === 1) {
          item.basePrice = precioKg;
          item.costPrice = Math.round(precioKg * 0.75);
          gasFixed++;
        } else if (item.unit === 'pieza' && kg > 1) {
          // Price for the container
          item.basePrice = Math.round(precioKg * kg * 0.95); // slight discount for bulk
          item.costPrice = Math.round(item.basePrice * 0.75);
          gasFixed++;
        } else if (kg === 1) {
          // Assume per kg
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
