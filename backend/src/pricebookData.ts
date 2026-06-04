export interface VolumeTier {
  minQty: number;
  discountPct: number;
}

export interface ItemDef {
  sku: string;
  name: string;
  description: string;
  unit: string;
  basePrice: number;
  costPrice: number;
  categoryKey: string;
  volumeTiers: VolumeTier[];
}

export interface CategoryDef {
  key: string;
  name: string;
  sortOrder: number;
  description: string;
}

export const categories: CategoryDef[] = [
  { key: 'catInst', name: 'Instalación', sortOrder: 1, description: 'Instalacion de equipos de climatizacion y refrigeracion' },
  { key: 'catMant', name: 'Mantenimiento', sortOrder: 2, description: 'Servicios de mantenimiento preventivo y correctivo' },
  { key: 'catDiag', name: 'Diagnóstico', sortOrder: 3, description: 'Servicios de diagnostico y evaluacion tecnica' },
  { key: 'catRep', name: 'Reparación', sortOrder: 4, description: 'Servicios de reparacion de equipos y sistemas' },
  { key: 'catRef', name: 'Refacciones', sortOrder: 5, description: 'Partes y componentes originales y equivalentes' },
  { key: 'catDuct', name: 'Ductos y Aire', sortOrder: 6, description: 'Fabricacion e instalacion de ducteria y difusion de aire' },
  { key: 'catRefr', name: 'Refrigeración Comercial', sortOrder: 7, description: 'Sistemas de refrigeracion comercial e industrial' },
  { key: 'catCal', name: 'Calefacción', sortOrder: 8, description: 'Sistemas de calefaccion y calentadores de agua' },
  { key: 'catGas', name: 'Gas Refrigerante', sortOrder: 9, description: 'Suministro de gases refrigerantes' },
  { key: 'catCtrl', name: 'Control y Automatización', sortOrder: 10, description: 'Sistemas de control, BMS y automatizacion' },
  { key: 'catLim', name: 'Limpieza Especializada', sortOrder: 11, description: 'Servicios de limpieza profunda y sanitizacion' },
  { key: 'catRet', name: 'Retiro y Desmontaje', sortOrder: 12, description: 'Retiro y disposicion de equipos' },
  { key: 'catIng', name: 'Diseño e Ingeniería', sortOrder: 13, description: 'Diseno de sistemas HVAC y calculo de cargas' },
  { key: 'catPm', name: 'Puesta en Marcha', sortOrder: 14, description: 'Comisionamiento y puesta en operacion' },
  { key: 'catEf', name: 'Eficiencia Energética', sortOrder: 15, description: 'Auditorias y mejoras de eficiencia energetica' },
  { key: 'catObra', name: 'Obra Civil y Soportería', sortOrder: 16, description: 'Obra civil, bases y estructuras de soporte' },
];

const volTier = (d: number) => [
  { minQty: 1, discountPct: 0 },
  { minQty: 5, discountPct: Math.min(d * 0.5, 8) },
  { minQty: 10, discountPct: Math.min(d, 12) },
  { minQty: 20, discountPct: Math.min(d * 1.5, 18) },
];

const MSP_TR = [
  { tr: '1', name: '1 TR (12,000 BTU/h)', price: 3500, cost: 2100 },
  { tr: '1.5', name: '1.5 TR (18,000 BTU/h)', price: 4200, cost: 2500 },
  { tr: '2', name: '2 TR (24,000 BTU/h)', price: 4800, cost: 2900 },
  { tr: '2.5', name: '2.5 TR (30,000 BTU/h)', price: 5500, cost: 3300 },
  { tr: '3', name: '3 TR (36,000 BTU/h)', price: 6500, cost: 3900 },
  { tr: '4', name: '4 TR (48,000 BTU/h)', price: 8500, cost: 5100 },
  { tr: '5', name: '5 TR (60,000 BTU/h)', price: 12000, cost: 7200 },
];

const COMP_TR = [
  { tr: '1', name: '1 TR (12,000 BTU/h)', price: 4800, cost: 2900 },
  { tr: '1.5', name: '1.5 TR (18,000 BTU/h)', price: 5500, cost: 3300 },
  { tr: '2', name: '2 TR (24,000 BTU/h)', price: 6500, cost: 3900 },
  { tr: '3', name: '3 TR (36,000 BTU/h)', price: 8500, cost: 5100 },
  { tr: '4', name: '4 TR (48,000 BTU/h)', price: 10000, cost: 6000 },
  { tr: '5', name: '5 TR (60,000 BTU/h)', price: 14000, cost: 8400 },
];

const MOTOR_HP = [
  { tr: '0.33', name: '1/3 HP', price: 2500, cost: 1500 },
  { tr: '0.5', name: '1/2 HP', price: 2800, cost: 1700 },
  { tr: '0.75', name: '3/4 HP', price: 3200, cost: 1900 },
  { tr: '1', name: '1 HP', price: 3800, cost: 2300 },
  { tr: '2', name: '2 HP', price: 4800, cost: 2900 },
  { tr: '3', name: '3 HP', price: 5800, cost: 3500 },
  { tr: '5', name: '5 HP', price: 7500, cost: 4500 },
  { tr: '10', name: '10 HP', price: 12000, cost: 7200 },
];

export const items: ItemDef[] = [
  // ═══════════════════════════════════════════════
  // INSTALACION - 1
  // ═══════════════════════════════════════════════

  ...makeInstItems('MSP', 'Minisplit', MSP_TR, 'Instalacion completa de sistema de aire acondicionado tipo MINISPLIT de $TR ($NAME). Incluye: montaje de unidad evaporadora en muro con soporteria nivelada, instalacion de unidad condensadora en azotea o muro exterior con soporte de acero, linea refrigerante de cobre tipo L con aislamiento termico elastomerico, cableado electrico desde el centro de carga con termomagnetico dedicado y calibre segun capacidad, drenaje de condensados con tuberia PVC y union universal, conexion de tuberia con soldadura de aleacion de plata al 15%, prueba de vacio con micronometro hasta 500 micras, carga de refrigerante R-410A o R-32 segun equipo, instalacion de control remoto y soporte, arranque y prueba de funcionamiento en modo frio y calor con medicion de temperaturas. No incluye: equipo de aire acondicionado, trabajos de albanileria, perforacion de losa de concreto, canaleta decorativa, instalacion electrica desde el medidor.'),

  ...makeInstItems('MSP-INV', 'Minisplit Inverter', [
    { tr: '1', name: '1 TR (12,000 BTU/h)', price: 4000, cost: 2400 },
    { tr: '1.5', name: '1.5 TR (18,000 BTU/h)', price: 4800, cost: 2900 },
    { tr: '2', name: '2 TR (24,000 BTU/h)', price: 5500, cost: 3300 },
    { tr: '2.5', name: '2.5 TR (30,000 BTU/h)', price: 6200, cost: 3700 },
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 7500, cost: 4500 },
    { tr: '4', name: '4 TR (48,000 BTU/h)', price: 9500, cost: 5700 },
    { tr: '5', name: '5 TR (60,000 BTU/h)', price: 13500, cost: 8100 },
  ], 'Instalacion completa de sistema de aire acondicionado tipo MINISPLIT INVERTER de $TR ($NAME). Incluye: montaje de unidad evaporadora y condensadora, linea refrigerante de cobre con aislamiento de 1/2 y 3/8 para alta eficiencia, cableado electrico con calibre y termomagnetico, drenaje PVC, conexion de comunicacion entre unidades, soldadura con aleacion de plata, prueba de vacio profundo hasta 300 micras, carga de refrigerante R-32 o R-410A, configuracion de modo inverter, arranque y prueba con medicion de consumo electrico. No incluye: equipo, obra civil, canaleta, instalacion electrica principal.'),

  ...makeInstItems('CST', 'Cassette', [
    { tr: '1', name: '1 TR (12,000 BTU/h)', price: 4500, cost: 2700 },
    { tr: '1.5', name: '1.5 TR (18,000 BTU/h)', price: 5200, cost: 3100 },
    { tr: '2', name: '2 TR (24,000 BTU/h)', price: 5800, cost: 3500 },
    { tr: '2.5', name: '2.5 TR (30,000 BTU/h)', price: 6500, cost: 3900 },
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 7500, cost: 4500 },
  ], 'Instalacion de equipo tipo CASSETTE de $TR ($NAME). Incluye: montaje en plafon con refuerzo estructural de perfiles de acero, soporteria nivelada con nivel laser, instalacion y conexion de bomba de condensados con tuberia de alta presion, linea refrigerante de cobre con aislamiento, cableado electrico con termomagnetico y cable de comunicacion, drenaje, conexion con soldadura de plata, prueba de vacio, carga de refrigerante, panel decorativo, control remoto inalambrico, arranque y prueba en todos los modos. No incluye: equipo, plafon, obra civil, instalacion electrica principal.'),

  ...makeInstItems('PT', 'Piso-Techo', [
    { tr: '2', name: '2 TR (24,000 BTU/h)', price: 5800, cost: 3500 },
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 7200, cost: 4300 },
    { tr: '4', name: '4 TR (48,000 BTU/h)', price: 8800, cost: 5300 },
    { tr: '5', name: '5 TR (60,000 BTU/h)', price: 10000, cost: 6000 },
  ], 'Instalacion de equipo tipo PISO-TECHO de $TR ($NAME). Incluye: montaje en piso o suspendido en muro con soporteria industrial, conexion de ductos de suministro y retorno con plenum, linea refrigerante de cobre con aislamiento, cableado electrico trifasico o monofasico, termostato digital de pared, conexiones con soldadura de plata, drenaje, prueba de vacio, carga de refrigerante, arranque y prueba de funcionamiento. No incluye: equipo, ducteria, obra civil.'),

  ...makeInstItems('FANCOIL', 'Fan Coil', [
    { tr: '1', name: '1 TR (12,000 BTU/h)', price: 3800, cost: 2300 },
    { tr: '1.5', name: '1.5 TR (18,000 BTU/h)', price: 4500, cost: 2700 },
    { tr: '2', name: '2 TR (24,000 BTU/h)', price: 5200, cost: 3100 },
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 6200, cost: 3700 },
    { tr: '4', name: '4 TR (48,000 BTU/h)', price: 7200, cost: 4300 },
    { tr: '5', name: '5 TR (60,000 BTU/h)', price: 8500, cost: 5100 },
  ], 'Instalacion de FAN COIL de $TR ($NAME) para sistema de agua helada. Incluye: montaje en plafon o muro con soporteria, conexion de tuberia de agua helada con aislamiento termico, valvula de control de 2 o 3 vias, conexion hidraulica con flexibles y purga de aire, drenaje de condensados, cableado electrico con termostato de pared o de ducto, arranque y prueba de flujo de aire y temperatura. No incluye: equipo, tuberia de agua helada principal, bomba, valvulas de balanceo.'),

  ...makeInstItems('PRECISO', 'Equipo de Precision', [
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 12000, cost: 7200 },
    { tr: '5', name: '5 TR (60,000 BTU/h)', price: 16000, cost: 9600 },
    { tr: '8', name: '8 TR (96,000 BTU/h)', price: 20000, cost: 12000 },
    { tr: '10', name: '10 TR (120,000 BTU/h)', price: 25000, cost: 15000 },
  ], 'Instalacion de equipo de climatizacion de PRECISION de $TR ($NAME) para data center o sala de servidores. Incluye: montaje con aislamiento sismico y piso tecnico, conexion de tuberia de refrigerante con valvula de servicio, drenaje de condensados con bomba de alta presion, cableado electrico trifasico y de control, humidificador por electrodos, sensores de temperatura servo-control, configuracion de parametros de precision (+-0.5 C), arranque y prueba de carga. No incluye: equipo, piso tecnico, instalacion electrica, obra civil.'),

  // Single-install items (not per-TR)
  { sku: 'INST-VRF', name: 'Instalación de Sistema VRF/VRV hasta 12 TR', description: 'Instalacion de sistema de volumen de refrigerante variable (VRV/VRF). Incluye: montaje de unidad condensadora en azotea con base de acero, instalacion de hasta 8 unidades evaporadoras, tuberia de cobre con derivaciones tipo refnet, cableado de comunicacion y control, drenajes individuales, carga precisa de refrigerante R-410A, direccionamiento del sistema, arranque y puesta en marcha, prueba de capacidad simultanea. No incluye: equipos, obra civil, instalacion electrica, ducteria.', unit: 'pza', basePrice: 18000, costPrice: 10800, categoryKey: 'catInst', volumeTiers: volTier(15) },

  { sku: 'INST-CHILL-20', name: 'Instalación de Chiller hasta 20 TR', description: 'Instalacion de chiller enfriado por aire de hasta 20 toneladas. Incluye: montaje en base de concreto con aisladores de vibracion, conexion de lineas de agua helada con aislamiento termico de 1 pulgada, instalacion de bomba de agua helada, valvulas de compuerta y retencion, conexiones electricas trifasicas con arrancador, llenado y purga del sistema hidronico, tratamiento quimico inicial, arranque y prueba de capacidad.', unit: 'pza', basePrice: 25000, costPrice: 15000, categoryKey: 'catInst', volumeTiers: volTier(15) },
  { sku: 'INST-CHILL-50', name: 'Instalación de Chiller 20-50 TR', description: 'Instalacion de chiller enfriado por aire de 20 a 50 toneladas. Incluye: montaje en base con aisladores, conexion de lineas de agua helada con aislamiento termico, bombas, manifold de valvulas, conexiones electricas trifasicas con gabinete de control y arrancador, llenado y purga, tratamiento quimico, arranque y prueba de capacidad nominal.', unit: 'pza', basePrice: 35000, costPrice: 21000, categoryKey: 'catInst', volumeTiers: volTier(15) },
  { sku: 'INST-CHILL-100', name: 'Instalación de Chiller 50-100 TR', description: 'Instalacion de chiller de 50 a 100 toneladas. Incluye: montaje con grua, base estructural, tuberia de agua helada con aislamiento, valvulas de balanceo automaticas, bombas primarias y secundarias, conexion electrica trifasica con arrancador suave, sistema de control, llenado, purga, tratamiento quimico, arranque y certificacion de capacidad.', unit: 'pza', basePrice: 55000, costPrice: 33000, categoryKey: 'catInst', volumeTiers: volTier(15) },

  { sku: 'INST-UMA', name: 'Instalación de Unidad Manejadora de Aire (UMA)', description: 'Instalacion de unidad manejadora de aire de 2,000 a 10,000 CFM. Incluye: montaje sobre base de concreto con aisladores, conexion de ductos de suministro y retorno, bateria de enfriamiento, conexiones hidronicas con valvulas de control y balanceo, drenaje con trampa "P", cableado electrico trifasico, sensores de temperatura y presion, arranque y prueba.', unit: 'pza', basePrice: 8500, costPrice: 5100, categoryKey: 'catInst', volumeTiers: volTier(12) },

  { sku: 'INST-PAQUETE', name: 'Instalación de Equipo Paquete (Rooftop)', description: 'Instalacion de equipo paquete tipo rooftop de 5 a 20 toneladas. Incluye: montaje en base estructural con rieles de acero, ductos de suministro y retorno con plenum de transicion, conexion electrica trifasica en gabinete sellado, termostato digital programable, arranque y puesta en marcha, prueba de capacidad.', unit: 'pza', basePrice: 12000, costPrice: 7200, categoryKey: 'catInst', volumeTiers: volTier(12) },

  // ═══════════════════════════════════════════════
  // MANTENIMIENTO - 2
  // ═══════════════════════════════════════════════

  ...makeMantItems('MSP', 'Minisplit', [
    { tr: '1', name: '1 TR (12,000 BTU/h)', price: 1800, cost: 900 },
    { tr: '1.5', name: '1.5 TR (18,000 BTU/h)', price: 2000, cost: 1000 },
    { tr: '2', name: '2 TR (24,000 BTU/h)', price: 2200, cost: 1100 },
    { tr: '2.5', name: '2.5 TR (30,000 BTU/h)', price: 2500, cost: 1250 },
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 2800, cost: 1400 },
    { tr: '4', name: '4 TR (48,000 BTU/h)', price: 3500, cost: 1750 },
    { tr: '5', name: '5 TR (60,000 BTU/h)', price: 4200, cost: 2100 },
  ], 'Mantenimiento preventivo para MINISPLIT de $TR ($NAME). Incluye: limpieza quimica de filtros de aire lavables, limpieza de serpentin evaporador con espuma desengrasante, limpieza de serpentin condensador con cepillo y agua a presion regulada, revision de presiones de succion y descarga con manifold digital, medicion de superheat y subcooling, revision de amperaje de compresor y ventiladores, inspeccion de conexiones electricas y termomagnetico, lubricacion de ventiladores, revision de drenaje y vertido, revision de soporteria y nivelacion, reporte fotografico y escrito.'),

  ...makeMantItems('CST', 'Cassette', [
    { tr: '1', name: '1 TR (12,000 BTU/h)', price: 2500, cost: 1250 },
    { tr: '1.5', name: '1.5 TR (18,000 BTU/h)', price: 2800, cost: 1400 },
    { tr: '2', name: '2 TR (24,000 BTU/h)', price: 3200, cost: 1600 },
    { tr: '2.5', name: '2.5 TR (30,000 BTU/h)', price: 3500, cost: 1750 },
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 3800, cost: 1900 },
  ], 'Mantenimiento preventivo para equipo CASSETTE de $TR ($NAME). Incluye: limpieza de filtros de aire, limpieza de serpentin evaporador, limpieza de bandeja de drenaje, revision y limpieza de bomba de condensados con prueba de flujo, revision de presiones y temperaturas, medicion de amperajes, inspeccion de panel decorativo, conexiones electricas, lubricacion de ventiladores, reporte tecnico.'),

  ...makeMantItems('PT', 'Piso-Techo', [
    { tr: '2', name: '2 TR (24,000 BTU/h)', price: 3000, cost: 1500 },
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 3500, cost: 1750 },
    { tr: '4', name: '4 TR (48,000 BTU/h)', price: 4000, cost: 2000 },
    { tr: '5', name: '5 TR (60,000 BTU/h)', price: 4800, cost: 2400 },
  ], 'Mantenimiento preventivo para equipo PISO-TECHO de $TR ($NAME). Incluye: limpieza de filtros, limpieza de serpentin evaporador y condensador, revision de presiones, medicion de amperajes, inspeccion de ductos y conexiones, lubricacion de ventiladores, revision de drenaje, termostato, reporte.'),

  ...makeMantItems('FANCOIL', 'Fan Coil', [
    { tr: '1', name: '1 TR (12,000 BTU/h)', price: 1800, cost: 900 },
    { tr: '2', name: '2 TR (24,000 BTU/h)', price: 2200, cost: 1100 },
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 2800, cost: 1400 },
    { tr: '4', name: '4 TR (48,000 BTU/h)', price: 3200, cost: 1600 },
    { tr: '5', name: '5 TR (60,000 BTU/h)', price: 3800, cost: 1900 },
  ], 'Mantenimiento preventivo para FAN COIL de $TR ($NAME). Incluye: limpieza de filtros lavables, limpieza de serpentin de agua helada con cepillo y quimico, revision de valvula de control y actuador, purga de aire del circuito, limpieza de bandeja de drenaje, lubricacion de ventilador, medicion de amperaje, revision de termostato, reporte.'),

  ...makeMantItems('PRECISO', 'Equipo de Precision', [
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 4500, cost: 2250 },
    { tr: '5', name: '5 TR (60,000 BTU/h)', price: 5500, cost: 2750 },
    { tr: '8', name: '8 TR (96,000 BTU/h)', price: 7000, cost: 3500 },
    { tr: '10', name: '10 TR (120,000 BTU/h)', price: 8500, cost: 4250 },
  ], 'Mantenimiento preventivo de equipo de PRECISION de $TR ($NAME) para data center. Incluye: limpieza de serpentines, reemplazo de filtros HEPA, revision de humidificador por electrodos y cambio de canister, calibracion de sensores de temperatura y humedad, revision de presiones de refrigerante, inspeccion de resistencias de calefaccion, reporte de condiciones ambientales con certificacion.'),

  // Single-item maint
  { sku: 'MANT-VRF', name: 'Mantenimiento Preventivo VRF/VRV por Unidad Evaporadora', description: 'Mantenimiento preventivo para sistema VRF por unidad evaporadora. Incluye: limpieza de filtros y serpentines, revision de carga refrigerante, inspeccion de cajas de derivacion refnet, verificacion de comunicacion entre unidades, limpieza de tarjetas de control electronico, medicion de amperajes, reporte de rendimiento por zona.', unit: 'pza', basePrice: 3500, costPrice: 1750, categoryKey: 'catMant', volumeTiers: volTier(15) },

  { sku: 'MANT-CHILL-20', name: 'Mantenimiento Preventivo Chiller hasta 20 TR', description: 'Mantenimiento preventivo para chiller de hasta 20 toneladas. Incluye: limpieza quimica de serpentin condensador, revision de presiones de refrigerante y aceite, reemplazo de filtros secadores, revision de valvula de expansion y contactores, medicion de voltajes y amperajes, limpieza de tablero electrico, analisis de aceite, reporte tecnico.', unit: 'pza', basePrice: 8500, costPrice: 4250, categoryKey: 'catMant', volumeTiers: volTier(12) },
  { sku: 'MANT-CHILL-50', name: 'Mantenimiento Preventivo Chiller 20-50 TR', description: 'Mantenimiento preventivo para chiller de 20 a 50 toneladas. Incluye: limpieza quimica de serpentin, analisis de aceite, reemplazo de filtros secadores y visor, revision de valvula de expansion electronica, limpieza de tablero, medicion de eficiencia, reporte.', unit: 'pza', basePrice: 12000, costPrice: 6000, categoryKey: 'catMant', volumeTiers: volTier(12) },
  { sku: 'MANT-CHILL-100', name: 'Mantenimiento Preventivo Chiller 50-100 TR', description: 'Mantenimiento preventivo para chiller de 50 a 100 toneladas. Incluye: limpieza quimica de condensador, analisis de aceite y refrigerante, cambio de filtros, revision de bombas de agua, valvulas de control, tablero electrico, arrancadores, reporte de eficiencia.', unit: 'pza', basePrice: 18000, costPrice: 9000, categoryKey: 'catMant', volumeTiers: volTier(10) },

  { sku: 'MANT-UMA', name: 'Mantenimiento Preventivo de UMA', description: 'Mantenimiento preventivo para unidad manejadora de aire. Incluye: limpieza de serpentines de enfriamiento y calefaccion, reemplazo de filtros de aire, lubricacion de ventiladores, tension y alineacion de correas, limpieza de bandeja de drenaje, revision de valvulas de control, sensores, reporte.', unit: 'pza', basePrice: 5500, costPrice: 2750, categoryKey: 'catMant', volumeTiers: volTier(12) },

  { sku: 'MANT-TORRE', name: 'Mantenimiento de Torre de Enfriamiento hasta 100 TR', description: 'Mantenimiento de torre de enfriamiento. Incluye: limpieza de relleno y distribuidores de agua, revision de motor y ventilador, tratamiento quimico del agua con biocida y antincrustante, limpieza de charola, purga de solidos, reporte de calidad de agua con parametros.', unit: 'pza', basePrice: 8000, costPrice: 4000, categoryKey: 'catMant', volumeTiers: volTier(10) },

  { sku: 'MANT-CFRIO', name: 'Mantenimiento Preventivo Cámara Fría', description: 'Mantenimiento preventivo para camara de refrigeracion. Incluye: limpieza de evaporador y condensador, revision de puertas y empaques magneticos, verificacion de temperatura y descongelamiento, revision de refrigerante y presiones, limpieza de conexiones electricas y control, reporte.', unit: 'pza', basePrice: 4500, costPrice: 2250, categoryKey: 'catMant', volumeTiers: volTier(12) },

  { sku: 'MANT-BOMBACAL', name: 'Mantenimiento de Bomba de Calor', description: 'Mantenimiento preventivo para bomba de calor residencial o comercial. Incluye: limpieza de serpentines, revision de presiones y temperaturas en ciclo de calefaccion y enfriamiento, medicion de COP, revision de valvula de 4 vias, conexiones electricas, reporte.', unit: 'pza', basePrice: 3500, costPrice: 1750, categoryKey: 'catMant', volumeTiers: volTier(12) },

  { sku: 'MANT-CALDERA', name: 'Mantenimiento de Calentador o Caldera', description: 'Mantenimiento preventivo para calentador de paso o caldera. Incluye: limpieza de quemadores y pilot, revision de termopar y valvula de gas, medicion de presion de agua, purga del sistema, medicion de eficiencia de combustion con analizador de gases, reporte.', unit: 'pza', basePrice: 3800, costPrice: 1900, categoryKey: 'catMant', volumeTiers: volTier(12) },

  // ═══════════════════════════════════════════════
  // DIAGNOSTICO - 3
  // ═══════════════════════════════════════════════

  { sku: 'DIAG-BAS', name: 'Diagnóstico Básico de Sistema HVAC', description: 'Evaluacion tecnica basica de sistema HVAC. Incluye: inspeccion visual completa de componentes, medicion de presiones de succion y descarga con manifold digital, calculo de superheat y subcooling, medicion de temperaturas de entrada y salida, medicion de amperaje de compresor y ventiladores, deteccion de fugas con detector electronico, reporte tecnico con diagnostico y recomendaciones.', unit: 'pza', basePrice: 800, costPrice: 400, categoryKey: 'catDiag', volumeTiers: volTier(10) },
  { sku: 'DIAG-AVAN', name: 'Diagnóstico Avanzado (Presiones, Fugas, Eléctrico)', description: 'Diagnostico avanzado de sistema HVAC. Incluye: prueba de presiones con nitrogeno a 150-300 psig, deteccion electronica de fugas con detector de haluro, analisis de circuito electrico con megometro, medicion de resistencia de aislamiento motor compresor, revision de capacitores con ESR, termografia de tablero electrico, reporte detallado con plan de accion.', unit: 'pza', basePrice: 2200, costPrice: 1100, categoryKey: 'catDiag', volumeTiers: volTier(10) },
  { sku: 'DIAG-TERMO', name: 'Diagnóstico Termográfico de Instalaciones', description: 'Estudio termografico infrarrojo de instalaciones HVAC. Incluye: barrido termico de tableros electricos, motores, compresores y componentes, identificacion de puntos calientes con clasificacion por criticidad, reporte con imagenes termicas radiometricas y recomendaciones de accion correctiva.', unit: 'pza', basePrice: 3500, costPrice: 1750, categoryKey: 'catDiag', volumeTiers: volTier(10) },
  { sku: 'DIAG-AIRE', name: 'Análisis de Calidad de Aire Interior', description: 'Evaluacion de calidad de aire interior en espacios climatizados. Incluye: medicion de CO2 con sensor NDIR, temperatura y humedad relativa, conteo de particulas PM2.5 y PM10, deteccion de compuestos organicos volatiles COVs, medicion de velocidad de aire, reporte con recomendaciones de ventilacion y filtracion.', unit: 'pza', basePrice: 4500, costPrice: 2250, categoryKey: 'catDiag', volumeTiers: volTier(10) },
  { sku: 'DIAG-VIB', name: 'Análisis de Vibraciones en Equipos Rotativos', description: 'Analisis de vibraciones en motores, ventiladores, compresores y bombas HVAC. Incluye: medicion con acelerometro triaxial en puntos criticos, analisis espectral FFT, diagnostico de desbalanceo, desalineacion, rodamientos danados, reporte con recomendaciones.', unit: 'pza', basePrice: 3800, costPrice: 1900, categoryKey: 'catDiag', volumeTiers: volTier(10) },
  { sku: 'DIAG-ESTRUCT', name: 'Diagnóstico Estructural de Soportería', description: 'Evaluacion estructural de soporteria de equipos HVAC. Incluye: inspeccion visual de corrosion y fatiga, verificacion de anclajes y niveles, deteccion de puntos debiles, reporte de condiciones con fotografias y recomendaciones de refuerzo.', unit: 'pza', basePrice: 2500, costPrice: 1250, categoryKey: 'catDiag', volumeTiers: volTier(10) },
  { sku: 'DIAG-CARGA', name: 'Análisis de Carga Térmica y Balance de Sistema', description: 'Analisis detallado de carga termica por metodo CARRIER (ASHRAE). Incluye: medicion de temperaturas y flujos en campo, calculo de carga actual vs diseno, identificacion de desviaciones, reporte con recomendaciones de optimizacion de capacidad.', unit: 'pza', basePrice: 5000, costPrice: 2500, categoryKey: 'catDiag', volumeTiers: volTier(10) },
  { sku: 'DIAG-PRES', name: 'Prueba de Presión en Circuito Refrigerante', description: 'Prueba de presion con nitrogeno en circuito refrigerante. Incluye: presurizacion a 150-300 psig segun tipo de sistema, tiempo de retencion de 30 minutos, deteccion de caidas de presion con manometro digital, identificacion de fugas con solucion jabonosa, reporte de resultados.', unit: 'pza', basePrice: 1500, costPrice: 750, categoryKey: 'catDiag', volumeTiers: volTier(10) },

  // ═══════════════════════════════════════════════
  // REPARACION - 4
  // ═══════════════════════════════════════════════

  ...makeCompItems(COMP_TR, 'Reemplazo de compresor de $TR ($NAME) para sistema HVAC. Incluye: diagnostico y confirmacion de falla, recuperacion de refrigerante con equipo certificado, retiro de compresor danado, instalacion de compresor nuevo, reemplazo de filtro secador y visor de liquido, vacio profundo con micronometro hasta 300 micras, carga de refrigerante R-410A o R-32, ajuste de superheat y subcooling, prueba de funcionamiento y medicion de amperaje. No incluye: compresor, refrigerante, filtro secador.'),

  ...makeMotorItems(MOTOR_HP, 'Reemplazo de motor de ventilador de $TR ($NAME) para equipo HVAC. Incluye: diagnostico de falla, retiro de motor danado, instalacion de motor nuevo, conexiones electricas con capacitor, balanceo de aspa, medicion de amperaje a plena carga, prueba de funcionamiento en todas las velocidades. No incluye: motor ventilador, aspa.'),

  { sku: 'REP-FUGA', name: 'Detección y Reparación de Fugas de Refrigerante', description: 'Servicio integral de deteccion y reparacion de fugas de refrigerante en sistemas HVAC. Incluye: inspeccion visual de todo el circuito, prueba de presion con nitrogeno, deteccion electronica con detector de haluro, reparacion con soldadura de aleacion de plata al 15%, filtro secador nuevo, vacio profundo, carga de refrigerante, tinte UV trazador para futura deteccion.', unit: 'pza', basePrice: 4500, costPrice: 2250, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-TARJ', name: 'Reparación o Reemplazo de Tarjeta de Control', description: 'Diagnostico y reparacion o reemplazo de tarjeta de control de equipo HVAC. Incluye: diagnostico de falla electronica, reparacion de componentes electronicos (capacitores, relays, triac) o reemplazo de tarjeta completa, programacion de parametros, prueba de funcionamiento en todos los modos.', unit: 'pza', basePrice: 3200, costPrice: 1600, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-VALV', name: 'Reemplazo de Válvula de Expansión', description: 'Reemplazo de valvula de expansion termostatica o electronica. Incluye: diagnostico de falla, recuperacion de refrigerante, instalacion de valvula nueva con bulbo sensor y ecualizador, filtro secador nuevo, vacio, carga de refrigerante, ajuste de superheat al valor objetivo.', unit: 'pza', basePrice: 2200, costPrice: 1100, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-VENT', name: 'Reemplazo de Ventilador Completo', description: 'Reemplazo de ventilador completo de evaporadora o condensadora. Incluye: diagnostico de falla, retiro de ventilador danado, instalacion de ventilador nuevo con aspa y rejilla, conexiones electricas, balanceo, medicion de RPM y amperaje, prueba de funcionamiento.', unit: 'pza', basePrice: 2800, costPrice: 1400, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-BOMBA', name: 'Reemplazo de Bomba de Agua Helada o Condensados', description: 'Reemplazo de bomba de agua helada, condensados o drenaje. Incluye: diagnostico de falla, retiro de bomba danada, instalacion de bomba nueva, conexiones hidraulicas y electricas, purga del sistema, prueba de flujo y presion, medicion de amperaje.', unit: 'pza', basePrice: 3500, costPrice: 1750, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-CONTACT', name: 'Reemplazo de Contactores y Arrancadores', description: 'Reemplazo de contactores y arrancadores en tablero electrico de equipo HVAC. Incluye: diagnostico de falla, retiro de componente danado, instalacion de componente nuevo, calibracion de proteccion termica, ajuste de torque en conexiones, prueba de funcionamiento y medicion de caida de voltaje.', unit: 'pza', basePrice: 1500, costPrice: 750, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-PRESOST', name: 'Reemplazo de Presostato', description: 'Reemplazo de presostato de alta o baja presion. Incluye: diagnostico, recuperacion de refrigerante, instalacion de presostato nuevo con rango correcto, calibracion de setpoint de disparo y restablecimiento, vacio, carga de refrigerante, prueba de ciclo.', unit: 'pza', basePrice: 1200, costPrice: 600, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-TERM', name: 'Reemplazo de Termostato o Sensor', description: 'Reemplazo de termostato analogico, digital o sensor de temperatura. Incluye: diagnostico, retiro de termostato danado, instalacion de termostato o sensor nuevo, cableado de 4-6 hilos, configuracion de parametros, calibracion, prueba de ciclos de frio/calor.', unit: 'pza', basePrice: 900, costPrice: 450, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-CORREA', name: 'Reemplazo de Correas y Poleas', description: 'Reemplazo de correas de transmision y poleas en ventiladores y motores HVAC. Incluye: diagnostico de desgaste, retiro de correas danadas, instalacion de correas nuevas de perfil y longitud correctos, alineacion de poleas con laser, tensionado con medidor de tension, medicion de amperaje.', unit: 'pza', basePrice: 1800, costPrice: 900, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-DREN', name: 'Reparación de Drenaje y Bandeja de Condensados', description: 'Reparacion de bandeja de drenaje obstruida o danada. Incluye: destape de linea de drenaje con equipo aspirador o soplo CO2, limpieza y desinfeccion de bandeja, reparacion de fugas en bandeja con sellador, prueba de vertido con agua.', unit: 'pza', basePrice: 1500, costPrice: 750, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-VALVULA4V', name: 'Reemplazo de Válvula de 4 Vías (Bomba de Calor)', description: 'Reemplazo de valvula de 4 vias para bomba de calor. Incluye: diagnostico de falla, recuperacion de refrigerante, soldadura de valvula nueva con proteccion termica, filtro secador, vacio, carga de refrigerante, prueba de ciclos frio/calor.', unit: 'pza', basePrice: 3500, costPrice: 1750, categoryKey: 'catRep', volumeTiers: volTier(12) },
  { sku: 'REP-TRANSFO', name: 'Reemplazo de Transformador de Control', description: 'Reemplazo de transformador de 24V para circuito de control HVAC. Incluye: diagnostico de falla, retiro de transformador danado, instalacion de transformador nuevo con proteccion termica, conexiones electricas, medicion de voltaje, prueba de circuito.', unit: 'pza', basePrice: 800, costPrice: 400, categoryKey: 'catRep', volumeTiers: volTier(12) },

  // ═══════════════════════════════════════════════
  // REFACCIONES - 5
  // ═══════════════════════════════════════════════

  { sku: 'REF-FILTROSEC', name: 'Filtro Secador para Línea Refrigerante', description: 'Suministro e instalacion de filtro secador para linea refrigerante segun capacidad del sistema. Incluye: seleccion del filtro segun refrigerante y capacidad, corte y soldadura con aleacion de plata al 15%, prueba de presion, vacio, registro.', unit: 'pza', basePrice: 550, costPrice: 280, categoryKey: 'catRef', volumeTiers: volTier(15) },
  { sku: 'REF-CAPACITOR', name: 'Capacitor de Arranque o Marcha para Motor HVAC', description: 'Suministro de capacitor de arranque o marcha para motores HVAC. Incluye: verificacion con multimetro, seleccion de capacitancia y voltaje correctos segun especificacion, instalacion y prueba de funcionamiento.', unit: 'pza', basePrice: 350, costPrice: 175, categoryKey: 'catRef', volumeTiers: volTier(15) },
  { sku: 'REF-TUBOCOBRE', name: 'Tubería de Cobre Tipo L para Refrigerante por Metro', description: 'Suministro de tuberia de cobre tipo L para linea refrigerante de 1/4 a 7/8 pulgadas. Incluye: corte a medida con cortatubos, debastado interior y exterior, limpieza con lija fina, taponamiento temporal de extremos.', unit: 'm', basePrice: 220, costPrice: 110, categoryKey: 'catRef', volumeTiers: volTier(15) },
  { sku: 'REF-AISLA', name: 'Aislamiento Térmico Elastomérico para Tubería por Metro', description: 'Suministro e instalacion de aislamiento termico elastomerico para tuberia de refrigerante de 1/2 a 1-1/8 pulg. Incluye: corte a medida con cuchilla, instalacion con pegamento especial, sellado de juntas longitudinales y transversales con cinta.', unit: 'm', basePrice: 160, costPrice: 80, categoryKey: 'catRef', volumeTiers: volTier(15) },
  { sku: 'REF-BALERO', name: 'Baleros y Rodamientos para Motor HVAC', description: 'Suministro de baleros o rodamientos para motores y ventiladores HVAC. Incluye: seleccion del balero correcto segun catalogo del fabricante, instalacion con extractor y prensa hidraulica, lubricacion con grasa de alta temperatura.', unit: 'pza', basePrice: 320, costPrice: 160, categoryKey: 'catRef', volumeTiers: volTier(15) },
  { sku: 'REF-CORREAS', name: 'Correas de Transmisión para Ventilador', description: 'Suministro de correas de transmision tipo V o dentadas para ventiladores HVAC. Incluye: seleccion de perfil y longitud correctos segun catalogo, instalacion y tensionado con medidor de tension.', unit: 'pza', basePrice: 220, costPrice: 110, categoryKey: 'catRef', volumeTiers: volTier(15) },
  { sku: 'REF-FILTROAIRE', name: 'Filtro de Aire Plisado para Retorno', description: 'Suministro de filtro de aire plisado para retorno de equipo HVAC de 12x24 a 24x24 pulgadas. Incluye: seleccion de MERV 8-13 segun requerimiento, retiro de filtro usado, instalacion de filtro nuevo con direccion de flujo.', unit: 'pza', basePrice: 180, costPrice: 90, categoryKey: 'catRef', volumeTiers: volTier(15) },
  { sku: 'REF-VISOR', name: 'Visor de Líquido con Indicador de Humedad', description: 'Suministro e instalacion de visor de liquido con indicador de humedad para linea refrigerante. Incluye: seleccion del diametro correcto, instalacion con soldadura de aleacion de plata, prueba de presion, vacio, registro.', unit: 'pza', basePrice: 380, costPrice: 190, categoryKey: 'catRef', volumeTiers: volTier(15) },
  { sku: 'REF-SENSOR', name: 'Sensor de Temperatura o Presión para HVAC', description: 'Suministro de sensor de temperatura NTC/PT1000 o transductor de presion para sistema HVAC. Incluye: seleccion del sensor correcto, instalacion, conexion electrica con blindaje, calibracion contra patron, prueba de lectura.', unit: 'pza', basePrice: 500, costPrice: 250, categoryKey: 'catRef', volumeTiers: volTier(15) },
  { sku: 'REF-ACEITE', name: 'Aceite Sintético para Compresor por Litro', description: 'Suministro de aceite sintetico POE o mineral para compresor HVAC segun refrigerante. Incluye: seleccion del tipo correcto, cambio de aceite con recuperacion de aceite usado, registro de nivel y presion.', unit: 'litro', basePrice: 320, costPrice: 160, categoryKey: 'catRef', volumeTiers: volTier(15) },

  // ═══════════════════════════════════════════════
  // DUCTOS Y AIRE - 6
  // ═══════════════════════════════════════════════

  { sku: 'DUCT-LAMINA', name: 'Ducto de Lámina Galvanizada por m²', description: 'Fabricacion e instalacion de ducto de lamina galvanizada para sistema de aire acondicionado. Incluye: corte y armado de ducto rectangular con maquina plegadora, refuerzos transversales cada 1.2 m, bridas de conexion, sellado de juntas con masilla y cinta, soporteria colgante con varilla roscada cada 2 m, instalacion en techo.', unit: 'm2', basePrice: 420, costPrice: 250, categoryKey: 'catDuct', volumeTiers: volTier(15) },
  { sku: 'DUCT-FLEX', name: 'Ducto Flexible Aislado por Metro Lineal', description: 'Instalacion de ducto flexible con aislamiento termico para sistema de aire acondicionado. Incluye: ducto flexible con capa de aislamiento de fibra de vidrio y barrera de vapor, conexion a difusor y plenum con cinchos y abrazaderas, cinta de aluminio en juntas.', unit: 'ml', basePrice: 160, costPrice: 95, categoryKey: 'catDuct', volumeTiers: volTier(15) },
  { sku: 'DUCT-DIFUSOR', name: 'Difusor de Aire Cuadrangular o Lineal', description: 'Suministro e instalacion de difusor de aire tipo cuadrangular o lineal para cielo raso. Incluye: difusor de aluminio con plenum de conexion, conexion a ducto flexible, instalacion en cielo raso, ajuste de aspas de direccionamiento, balanceo de flujo.', unit: 'pza', basePrice: 320, costPrice: 190, categoryKey: 'catDuct', volumeTiers: volTier(12) },
  { sku: 'DUCT-REJILLA', name: 'Rejilla de Retorno con Filtro', description: 'Suministro e instalacion de rejilla de retorno de aire con filtro lavable integrado. Incluye: rejilla de aluminio o acero con filtro lavable, instalacion en muro o cielo raso, conexion a ducto de retorno, sello perimetral.', unit: 'pza', basePrice: 280, costPrice: 170, categoryKey: 'catDuct', volumeTiers: volTier(12) },
  { sku: 'DUCT-DAMPER', name: 'Compuerta de Regulación de Flujo (Damper)', description: 'Suministro e instalacion de compuerta de regulacion de flujo de aire tipo damper de cuchilla opuesta. Incluye: damper con marco de angulo de acero, cuchillas de lamina, actuador manual o motorizado, instalacion en ducto, ajuste y balanceo de flujo.', unit: 'pza', basePrice: 380, costPrice: 230, categoryKey: 'catDuct', volumeTiers: volTier(12) },
  { sku: 'DUCT-CAMPANA', name: 'Campana de Extracción en Acero Inoxidable', description: 'Fabricacion e instalacion de campana de extraccion para cocina o laboratorio en lamina de acero inoxidable calibre 20. Incluye: diseno a medida, fabricacion con soldadura TIG, filtros de grasa tipo baffle, instalacion y conexion a ducto de extraccion, iluminacion LED.', unit: 'pza', basePrice: 5200, costPrice: 3100, categoryKey: 'catDuct', volumeTiers: volTier(10) },
  { sku: 'DUCT-EXTRAC', name: 'Extractor de Aire Axial o Centrífugo', description: 'Instalacion de extractor de aire tipo ventilador axial o centrifugo. Incluye: montaje en muro, ventana o ducto con soporteria, conexion electrica con interruptor o timer programable, arranque y prueba de capacidad de extraccion en CFM.', unit: 'pza', basePrice: 1600, costPrice: 960, categoryKey: 'catDuct', volumeTiers: volTier(12) },
  { sku: 'DUCT-LOUVER', name: 'Louver o Toma de Aire Exterior', description: 'Suministro e instalacion de louver de ventilacion para toma de aire exterior. Incluye: louver de aluminio extruido con malla protectora, instalacion en muro exterior, sello perimetral con silicon, conexion a ducto de aire exterior.', unit: 'pza', basePrice: 450, costPrice: 270, categoryKey: 'catDuct', volumeTiers: volTier(12) },
  { sku: 'DUCT-AISLA', name: 'Aislamiento de Ductos con Fibra de Vidrio por m²', description: 'Aislamiento termico de ductos de aire acondicionado con fibra de vidrio y barrera de vapor. Incluye: suministro e instalacion de manta de fibra de vidrio de 1 pulgada, fijacion con clavos de impacto y arandelas, cinta aluminizada en juntas, sellador.', unit: 'm2', basePrice: 220, costPrice: 130, categoryKey: 'catDuct', volumeTiers: volTier(15) },
  { sku: 'DUCT-PLENO', name: 'Plenum de Lamina Galvanizada para Difusor', description: 'Fabricacion e instalacion de plenum de lamina galvanizada para difusor o rejilla. Incluye: corte y armado de plenum con conexion para ducto flexible de 6 o 8 pulg, instalacion en cielo raso, sellado de juntas con masilla.', unit: 'pza', basePrice: 350, costPrice: 210, categoryKey: 'catDuct', volumeTiers: volTier(12) },

  // ═══════════════════════════════════════════════
  // REFRIGERACION COMERCIAL - 7
  // ═══════════════════════════════════════════════

  { sku: 'REFR-CFAB', name: 'Instalación de Cámara Fría Panel Sandwich Modular', description: 'Instalacion de camara de refrigeracion con panel sandwich modular hasta 50 m². Incluye: armado de paneles de poliuretano de 80 mm, piso sanitario de acero inoxidable, puerta con bisagras y cierre, unidad condensadora de media temperatura, evaporador de tiro forzado, control electronico de temperatura y descongelamiento, tuberia de cobre con aislamiento, cableado electrico con protecciones, arranque y prueba de temperatura.', unit: 'pza', basePrice: 18000, costPrice: 10800, categoryKey: 'catRefr', volumeTiers: volTier(10) },
  { sku: 'REFR-CONSERV', name: 'Instalación de Cuarto de Conservación (0 a 8°C)', description: 'Instalacion de cuarto de conservacion de 0 a 8 grados Celsius para alimentos o farmacos. Incluye: panel sandwich de 60 mm, puerta con cerradura de seguridad, unidad condensadora hermética de media temperatura, evaporador con termostato, control digital, tuberia, conexiones electricas, arranque y calibracion.', unit: 'pza', basePrice: 15000, costPrice: 9000, categoryKey: 'catRefr', volumeTiers: volTier(10) },
  { sku: 'REFR-CONGEL', name: 'Instalación de Cuarto de Congelación (< -18°C)', description: 'Instalacion de cuarto de congelacion con temperatura menor a -18 grados Celsius. Incluye: panel sandwich de 120-150 mm, puerta de congelacion con calefactor, unidad condensadora de baja temperatura con presostato, evaporador con resistencias de descongelamiento, control electronico, tuberia, electrico, arranque.', unit: 'pza', basePrice: 22000, costPrice: 13200, categoryKey: 'catRefr', volumeTiers: volTier(10) },
  { sku: 'REFR-UNICOND', name: 'Instalación de Unidad Condensadora Comercial', description: 'Instalacion de unidad condensadora comercial de 1 a 10 HP para refrigeracion. Incluye: montaje en base de acero, conexion de linea de succion y liquido con tuberia de cobre, filtro secador, valvula de servicio, cableado electrico con protecciones, arranque y ajuste de presostato.', unit: 'pza', basePrice: 5000, costPrice: 3000, categoryKey: 'catRefr', volumeTiers: volTier(12) },
  { sku: 'REFR-EVAP', name: 'Instalación de Evaporador Comercial de Tiro Forzado', description: 'Instalacion de evaporador comercial de tiro forzado de 1 a 10 HP. Incluye: montaje en soporteria de acero, conexion de linea de liquido y succion, valvula de expansion termostatica, resistencia de descongelamiento, drenaje electrico, cableado, arranque y ajuste de ciclo.', unit: 'pza', basePrice: 4200, costPrice: 2500, categoryKey: 'catRefr', volumeTiers: volTier(12) },
  { sku: 'REFR-VITRINA', name: 'Mantenimiento de Vitrina Refrigerada', description: 'Mantenimiento preventivo de vitrina refrigerada comercial. Incluye: limpieza de serpentines de evaporador y condensador, revision de compresor y presiones, descongelamiento manual, calibracion de termostato, limpieza de filtros, revision de ventiladores, reporte.', unit: 'pza', basePrice: 2200, costPrice: 1100, categoryKey: 'catRefr', volumeTiers: volTier(12) },
  { sku: 'REFR-HIELO', name: 'Mantenimiento de Máquina de Hielo', description: 'Mantenimiento preventivo de maquina de hielo. Incluye: limpieza del sistema con solucion desincrustante y sanitizante, reemplazo de filtro de agua, revision de ciclo de cosecha, limpieza de condensador, revision de nivel de refrigerante, calibracion de espesor de hielo.', unit: 'pza', basePrice: 2000, costPrice: 1000, categoryKey: 'catRefr', volumeTiers: volTier(12) },
  { sku: 'REFR-EXPAN', name: 'Reemplazo de Válvula de Expansión Comercial', description: 'Reemplazo de valvula de expansion termostatica para sistema de refrigeracion comercial. Incluye: diagnostico, recuperacion de refrigerante con equipo certificado, instalacion de valvula nueva con bulbo y ecualizador, filtro secador, vacio, carga de refrigerante, ajuste de superheat.', unit: 'pza', basePrice: 2500, costPrice: 1250, categoryKey: 'catRefr', volumeTiers: volTier(12) },
  { sku: 'REFR-PUERTA', name: 'Reparación de Puerta de Cámara Fría', description: 'Reparacion de puerta de camara fria. Incluye: ajuste de bisagras y alineacion, reemplazo de empaque magnetico, reparacion de cerradura, ajuste de cierre automatico, prueba de sellado con prueba de humo y temperatura.', unit: 'pza', basePrice: 3200, costPrice: 1600, categoryKey: 'catRefr', volumeTiers: volTier(12) },
  { sku: 'REFR-CORTINA', name: 'Instalación de Cortina de Aire para Cámara Fría', description: 'Instalacion de cortina de aire para entrada de camara fria. Incluye: suministro e instalacion de cortina de aire de longitud segun ancho de puerta, conexion electrica, ajuste de flujo y direccion, prueba de temperatura y proteccion termica.', unit: 'pza', basePrice: 2200, costPrice: 1100, categoryKey: 'catRefr', volumeTiers: volTier(12) },
  { sku: 'REFR-CONTROL', name: 'Reemplazo de Control Electrónico de Refrigeración', description: 'Reemplazo de control electronico de temperatura y descongelamiento para camara o vitrina. Incluye: diagnostico, retiro de control danado, instalacion de control nuevo, programacion de parametros, calibracion de sensor, prueba de ciclo de refrigeracion y descongelamiento.', unit: 'pza', basePrice: 2000, costPrice: 1000, categoryKey: 'catRefr', volumeTiers: volTier(12) },
  { sku: 'REFR-FUGA', name: 'Detección y Reparación de Fuga en Sistema Comercial', description: 'Deteccion y reparacion de fugas de refrigerante en sistemas comerciales. Incluye: presurizacion con nitrogeno, deteccion electronica, reparacion con soldadura, filtro secador, vacio, carga de refrigerante, prueba de ciclo y temperatura.', unit: 'pza', basePrice: 4000, costPrice: 2000, categoryKey: 'catRefr', volumeTiers: volTier(12) },

  // ═══════════════════════════════════════════════
  // CALEFACCION - 8
  // ═══════════════════════════════════════════════

  ...makeInstItems('CAL-BOMBACAL', 'Bomba de Calor', [
    { tr: '1.5', name: '1.5 TR (18,000 BTU/h)', price: 5800, cost: 3500 },
    { tr: '2', name: '2 TR (24,000 BTU/h)', price: 6500, cost: 3900 },
    { tr: '2.5', name: '2.5 TR (30,000 BTU/h)', price: 7200, cost: 4300 },
    { tr: '3', name: '3 TR (36,000 BTU/h)', price: 8000, cost: 4800 },
    { tr: '4', name: '4 TR (48,000 BTU/h)', price: 9500, cost: 5700 },
    { tr: '5', name: '5 TR (60,000 BTU/h)', price: 12000, cost: 7200 },
  ], 'Instalacion de BOMBA DE CALOR AIRE-AIRE de $TR ($NAME) residencial o comercial. Incluye: montaje de unidad interior y exterior, linea refrigerante de cobre con aislamiento, drenaje de condensados, cableado electrico con termomagnetico, termostato digital con soporte para bomba de calor, conexion con soldadura de plata, prueba de vacio, carga de refrigerante, arranque y prueba en modo calefaccion y enfriamiento con medicion de temperaturas. No incluye: equipo, obra civil, instalacion electrica principal.'),

  { sku: 'CAL-PISO', name: 'Calefacción por Piso Radiante por m²', description: 'Instalacion de sistema de calefaccion por piso radiante hidronico. Incluye: tendido de tuberia PEX sobre malla electro-soldada, conexion a manifold con valvulas de control, instalacion de caldera o bomba de calor para ACS, purga del sistema, prueba de presion a 6 bar, registro.', unit: 'm2', basePrice: 550, costPrice: 330, categoryKey: 'catCal', volumeTiers: volTier(12) },
  { sku: 'CAL-CALENT', name: 'Instalación de Calentador de Agua de Paso (Gas)', description: 'Instalacion de calentador de agua de paso (instantaneo) de gas LP o natural. Incluye: montaje en muro con taquetes nivelados, conexion de gas con tuberia de cobre o flexible certificado, conexion hidraulica con valvulas de esfera, conexion de ventilacion al exterior, arranque y calibracion de temperatura, prueba de combustion.', unit: 'pza', basePrice: 3200, costPrice: 1900, categoryKey: 'catCal', volumeTiers: volTier(12) },
  { sku: 'CAL-CALDERA', name: 'Instalación de Caldera de Agua Caliente', description: 'Instalacion de caldera para sistema de calefaccion hidronica o agua caliente sanitaria. Incluye: montaje en base, conexion hidraulica con valvulas de seguridad y retencion, conexion de gas con tuberia de acero, chimenea o ventilacion, termostato de ambiente o de inmersion, arranque y ajuste de combustion con analizador de gases.', unit: 'pza', basePrice: 7500, costPrice: 4500, categoryKey: 'catCal', volumeTiers: volTier(12) },
  { sku: 'CAL-ELECTR', name: 'Instalación de Calefactor Eléctrico de Ambiente', description: 'Instalacion de calefactor electrico de ambiente tipo muro o techo. Incluye: montaje en soporteria con taquetes, conexion electrica con linea dedicada y termomagnetico, termostato de ambiente integrado, arranque y prueba de temperatura.', unit: 'pza', basePrice: 1000, costPrice: 600, categoryKey: 'catCal', volumeTiers: volTier(12) },
  { sku: 'CAL-MANT', name: 'Mantenimiento de Sistema de Calefacción Central', description: 'Mantenimiento preventivo de sistema de calefaccion central. Incluye: limpieza de quemadores y pilot, revision de intercambiador de calor, medicion de eficiencia de combustion, purga de radiadores o fan coils, revision de termostato, reporte de eficiencia.', unit: 'pza', basePrice: 3200, costPrice: 1600, categoryKey: 'catCal', volumeTiers: volTier(12) },
  { sku: 'CAL-RADIAD', name: 'Radiador de Agua Caliente para Calefacción', description: 'Suministro e instalacion de radiador de agua caliente para calefaccion. Incluye: radiador de panel de acero de 600x1000 mm, valvula termostatica, purgador automatico, soporteria, conexion hidraulica con tuberia de cobre, purga y prueba.', unit: 'pza', basePrice: 2600, costPrice: 1500, categoryKey: 'catCal', volumeTiers: volTier(12) },
  { sku: 'CAL-TANQUE', name: 'Instalación de Tanque de Agua Caliente con Aislamiento', description: 'Instalacion de tanque de almacenamiento de agua caliente con aislamiento termico de 50 a 200 litros. Incluye: montaje en base, conexion hidraulica con valvulas de retencion y seguridad, entrada de agua fria y salida de agua caliente, purga, prueba de presion.', unit: 'pza', basePrice: 4200, costPrice: 2500, categoryKey: 'catCal', volumeTiers: volTier(12) },
  { sku: 'CAL-DIAG', name: 'Diagnóstico de Sistema de Calefacción', description: 'Evaluacion tecnica de sistema de calefaccion. Incluye: inspeccion de componentes, medicion de eficiencia de combustion con analizador, analisis de gases de combustion, deteccion de fugas de gas con detector, reporte con diagnostico y recomendaciones.', unit: 'pza', basePrice: 1400, costPrice: 700, categoryKey: 'catCal', volumeTiers: volTier(10) },

  // ═══════════════════════════════════════════════
  // GAS REFRIGERANTE - 9
  // ═══════════════════════════════════════════════

  ...makeGasItems([
    { key: 'R410A', name: 'R-410A', price: 320, cost: 250 },
    { key: 'R32', name: 'R-32', price: 350, cost: 280 },
    { key: 'R134A', name: 'R-134A', price: 420, cost: 330 },
    { key: 'R404A', name: 'R-404A', price: 400, cost: 310 },
    { key: 'R407C', name: 'R-407C', price: 360, cost: 280 },
    { key: 'R22', name: 'R-22 Reciclado', price: 480, cost: 380 },
    { key: 'R717', name: 'Amoniaco R-717', price: 100, cost: 60 },
  ]),

  { sku: 'GAS-RECUP', name: 'Servicio de Recuperación de Gas Refrigerante por kg', description: 'Servicio de recuperacion de gas refrigerante de sistemas HVAC. Incluye: equipo recuperador certificado, cilindro de almacenamiento, filtracion del gas, registro de cantidad recuperada, certificado de disposicion final.', unit: 'kg', basePrice: 140, costPrice: 70, categoryKey: 'catGas', volumeTiers: volTier(15) },

  // ═══════════════════════════════════════════════
  // CONTROL Y AUTOMATIZACION - 10
  // ═══════════════════════════════════════════════

  { sku: 'CTRL-TERM', name: 'Termostato Digital Programable', description: 'Instalacion de termostato digital programable para sistema HVAC. Incluye: retiro de termostato existente, instalacion de termostato nuevo con soporte para calor/frio automatico, cableado de 4-6 hilos, configuracion de programa semanal, prueba de ciclo.', unit: 'pza', basePrice: 1100, costPrice: 550, categoryKey: 'catCtrl', volumeTiers: volTier(12) },
  { sku: 'CTRL-ZONA', name: 'Sistema de Control por Zonas HVAC', description: 'Instalacion de sistema de zonificacion para HVAC de 2 a 4 zonas. Incluye: panel de control maestro, compuertas motorizadas por zona con actuador, termostatos por zona, cableado de control, configuracion y calibracion de temperatura por zona.', unit: 'pza', basePrice: 3500, costPrice: 1750, categoryKey: 'catCtrl', volumeTiers: volTier(12) },
  { sku: 'CTRL-DDC', name: 'Control Directo Digital (DDC) para UMA', description: 'Instalacion de control directo digital (DDC) para unidad manejadora de aire. Incluye: controlador programable con entradas/salidas, sensores de temperatura de suministro y retorno, sensor de presion diferencial, actuadores de valvula de 0-10V, cableado de control, programacion de logica PID, arranque y calibracion.', unit: 'pza', basePrice: 5200, costPrice: 2600, categoryKey: 'catCtrl', volumeTiers: volTier(10) },
  { sku: 'CTRL-PLC', name: 'Programación de PLC para Sistema HVAC', description: 'Programacion de controlador logico programable (PLC) para sistema HVAC. Incluye: diseno de logica de control en diagrama de escalera o bloques, configuracion de E/S, implementacion de secuencias de operacion, HMI basico, pruebas en sitio y puesta en marcha.', unit: 'pza', basePrice: 8000, costPrice: 4000, categoryKey: 'catCtrl', volumeTiers: volTier(10) },
  { sku: 'CTRL-SENSOR', name: 'Sensor de CO₂, Temperatura y Humedad', description: 'Instalacion de sensor multiplex de CO2, temperatura y humedad para demanda de ventilacion DCV. Incluye: sensor de CO2 NDIR, temperatura y HR, montaje en muro o ducto, cableado de 0-10V o Modbus, configuracion de rango, calibracion.', unit: 'pza', basePrice: 750, costPrice: 375, categoryKey: 'catCtrl', volumeTiers: volTier(12) },
  { sku: 'CTRL-SCADA', name: 'Configuración de SCADA o BMS Local', description: 'Configuracion de sistema SCADA o BMS para monitoreo y control de edificios. Incluye: instalacion de software de supervision, creacion de puntos de monitoreo, configuracion de alarmas via email/SMS, graficos de tendencias historicas, reportes programados, prueba de comunicacion.', unit: 'pza', basePrice: 11000, costPrice: 5500, categoryKey: 'catCtrl', volumeTiers: volTier(8) },
  { sku: 'CTRL-VFD', name: 'Variador de Frecuencia (VFD) para Motor HVAC', description: 'Instalacion y programacion de variador de frecuencia (VFD) para motor de ventilador o bomba HVAC. Incluye: montaje de VFD, cableado de potencia y control, parametrizacion de rampas, frenado y limites, arranque y prueba, medicion de ahorro de energia.', unit: 'pza', basePrice: 3200, costPrice: 1600, categoryKey: 'catCtrl', volumeTiers: volTier(12) },
  { sku: 'CTRL-MONITOR', name: 'Configuración de Monitoreo Remoto IoT para HVAC', description: 'Configuracion de gateway IoT para monitoreo remoto de equipos HVAC. Incluye: instalacion de gateway de comunicacion celular o WiFi, configuracion de conexion a internet, alta en plataforma cloud, configuracion de alarmas por email/SMS, prueba de comunicacion bidireccional.', unit: 'pza', basePrice: 4200, costPrice: 2100, categoryKey: 'catCtrl', volumeTiers: volTier(10) },
  { sku: 'CTRL-CALIB', name: 'Calibración de Sensores e Instrumentos HVAC', description: 'Calibracion de sensores de temperatura, presion y humedad para sistemas de control HVAC. Incluye: calibracion contra patron certificado con trazabilidad, ajuste de offset y ganancia, certificado de calibracion, etiquetado con fecha de vigencia.', unit: 'pza', basePrice: 1400, costPrice: 700, categoryKey: 'catCtrl', volumeTiers: volTier(12) },
  { sku: 'CTRL-COMUN', name: 'Red de Comunicación BACnet/Modbus', description: 'Instalacion de red de comunicacion para integracion de equipos HVAC por protocolo BACnet MS/TP o Modbus RTU. Incluye: cableado de bus RS-485 con topologia de daisy chain, configuracion de IDs de dispositivos, terminacion de red, prueba de comunicacion, integracion con BMS.', unit: 'pza', basePrice: 3500, costPrice: 1750, categoryKey: 'catCtrl', volumeTiers: volTier(10) },

  // ═══════════════════════════════════════════════
  // LIMPIEZA ESPECIALIZADA - 11
  // ═══════════════════════════════════════════════

  { sku: 'LIMP-EVAP', name: 'Limpieza Química de Serpentín Evaporador', description: 'Limpieza quimica profunda de serpentin evaporador de equipo HVAC. Incluye: aplicacion de espuma desengrasante alcalina, cepillado manual de aletas, enjuague a presion controlada, aplicacion de inhibidor de corrosion, prueba de flujo de aire y temperatura.', unit: 'pza', basePrice: 2000, costPrice: 1000, categoryKey: 'catLim', volumeTiers: volTier(12) },
  { sku: 'LIMP-COND', name: 'Limpieza Química de Condensador', description: 'Limpieza quimica profunda de serpentin condensador de equipo HVAC. Incluye: proteccion de motores y componentes electricos con plastico, aplicacion de detergente alcalino o acido debil, cepillado en contracorriente, enjuague a presion, aplicacion de sellador antipolvo, medicion de presiones.', unit: 'pza', basePrice: 2300, costPrice: 1150, categoryKey: 'catLim', volumeTiers: volTier(12) },
  { sku: 'LIMP-TORRE', name: 'Limpieza y Desinfección de Torre de Enfriamiento', description: 'Limpieza y desinfeccion de torre de enfriamiento de hasta 100 TR. Incluye: drenaje del sistema, limpieza mecanica de relleno y distribuidores, limpieza de charola con hidrolavadora, desinfeccion con cloro o biocida, llenado, tratamiento quimico inicial.', unit: 'pza', basePrice: 6000, costPrice: 3000, categoryKey: 'catLim', volumeTiers: volTier(10) },
  { sku: 'LIMP-DUCTO', name: 'Limpieza de Ductos de Aire por Succión por m²', description: 'Limpieza de ductos de aire acondicionado por succion con equipo de alta eficiencia. Incluye: aspiracion con camion de vacio HEPA, cepillado mecanico de ductos con robot, limpieza de difusores y rejillas, sanitizacion opcional con EPA, reporte fotografico.', unit: 'm2', basePrice: 3200, costPrice: 1600, categoryKey: 'catLim', volumeTiers: volTier(10) },
  { sku: 'LIMP-SANIT', name: 'Sanitización de Sistema HVAC con Ozono o UV-C', description: 'Sanitizacion del sistema de climatizacion mediante generacion de ozono o lamparas UV-C. Incluye: despeje del area, generacion de ozono o activacion de UV-C en serpentines y ductos, tiempo de exposicion controlado, ventilacion del area, verificacion de niveles seguros.', unit: 'pza', basePrice: 2500, costPrice: 1250, categoryKey: 'catLim', volumeTiers: volTier(12) },
  { sku: 'LIMP-BANDEJA', name: 'Limpieza y Desinfección de Bandeja de Drenaje', description: 'Limpieza y desinfeccion de bandeja de drenaje de equipo HVAC. Incluye: retiro de agua estancada, cepillado de bandeja con desengrasante, aplicacion de desinfectante bactericida, limpieza de linea de drenaje con presion, prueba de vertido.', unit: 'pza', basePrice: 750, costPrice: 375, categoryKey: 'catLim', volumeTiers: volTier(12) },
  { sku: 'LIMP-FILTRO', name: 'Limpieza Profunda de Filtros de Aire por Pieza', description: 'Limpieza profunda de filtros de aire lavables de equipo HVAC. Incluye: retiro de filtros, lavado con agua y detergente desengrasante, enjuague, secado al aire, inspeccion de integridad, reinstalacion.', unit: 'pza', basePrice: 140, costPrice: 70, categoryKey: 'catLim', volumeTiers: volTier(15) },
  { sku: 'LIMP-DREN', name: 'Destape y Limpieza de Línea de Drenaje', description: 'Destape y limpieza de linea de drenaje de equipo HVAC. Incluye: aspiracion de obstruccion con equipo de vacio, lavado con agua a presion, aplicacion de pastilla antialgas, verificacion de flujo de drenaje.', unit: 'pza', basePrice: 450, costPrice: 225, categoryKey: 'catLim', volumeTiers: volTier(12) },

  // ═══════════════════════════════════════════════
  // RETIRO Y DESMONTAJE - 12
  // ═══════════════════════════════════════════════

  { sku: 'RET-MSP-1', name: 'Retiro de Minisplit 1-2 TR', description: 'Retiro de minisplit de 1 a 2 toneladas. Incluye: recuperacion de refrigerante con equipo certificado, desconexion electrica, retiro de condensadora y evaporadora, retiro de soporteria, tapado de conexiones, carga de materiales a camion, limpieza del area.', unit: 'pza', basePrice: 1400, costPrice: 700, categoryKey: 'catRet', volumeTiers: volTier(12) },
  { sku: 'RET-MSP-3', name: 'Retiro de Minisplit 3-5 TR', description: 'Retiro de minisplit de 3 a 5 toneladas. Incluye: recuperacion de refrigerante, desconexion electrica, desmontaje de condensadora y evaporadora, retiro de soporteria, tapado de conexiones, carga, limpieza.', unit: 'pza', basePrice: 2200, costPrice: 1100, categoryKey: 'catRet', volumeTiers: volTier(12) },
  { sku: 'RET-VRF', name: 'Retiro de Sistema VRF Completo', description: 'Retiro completo de sistema VRF incluyendo tuberia. Incluye: recuperacion de refrigerante, retiro de todas las unidades evaporadoras y condensadora, retiro de tuberia de cobre y derivaciones, retiro de soporteria, manejo y carga de materiales.', unit: 'pza', basePrice: 5000, costPrice: 2500, categoryKey: 'catRet', volumeTiers: volTier(10) },
  { sku: 'RET-CHILL', name: 'Retiro de Chiller hasta 50 TR', description: 'Retiro de chiller enfriado por aire de hasta 50 toneladas. Incluye: recuperacion de refrigerante, desconexion electrica trifasica, desconexion hidraulica, izaje con grua, carga a camion de plataforma, manejo de materiales.', unit: 'pza', basePrice: 14000, costPrice: 7000, categoryKey: 'catRet', volumeTiers: volTier(8) },
  { sku: 'RET-DUCTO', name: 'Retiro de Ductería por m²', description: 'Retiro de ducteria de lamina galvanizada de sistemas HVAC. Incluye: desconexion de difusores y rejillas, desmontaje de ductos por secciones, retiro de soporteria colgante, manejo y carga de materiales.', unit: 'm2', basePrice: 160, costPrice: 80, categoryKey: 'catRet', volumeTiers: volTier(15) },
  { sku: 'RET-CFRIO', name: 'Retiro de Cámara Fría Panel Sandwich', description: 'Retiro de camara de refrigeracion de panel sandwich. Incluye: desmontaje de paneles, retiro de puerta y marco, recuperacion de refrigerante, retiro de unidad condensadora y evaporador, manejo y carga de materiales.', unit: 'pza', basePrice: 8000, costPrice: 4000, categoryKey: 'catRet', volumeTiers: volTier(10) },
  { sku: 'RET-CALDERA', name: 'Retiro de Caldera o Calentador Industrial', description: 'Retiro de caldera o calentador de agua industrial. Incluye: desconexion de gas con tapon, desconexion hidraulica, desconexion electrica, retiro de equipo, manejo de materiales.', unit: 'pza', basePrice: 4200, costPrice: 2100, categoryKey: 'catRet', volumeTiers: volTier(10) },
  { sku: 'RET-UMA', name: 'Retiro de Unidad Manejadora de Aire', description: 'Retiro de unidad manejadora de aire de hasta 10,000 CFM. Incluye: desconexion de ductos, desconexion hidronica y electrica, retiro de la unidad con patin hidraulico, retiro de soporteria, manejo de materiales.', unit: 'pza', basePrice: 4800, costPrice: 2400, categoryKey: 'catRet', volumeTiers: volTier(10) },
  { sku: 'RET-PAQ', name: 'Retiro de Equipo de Ventana o Paquete', description: 'Retiro de equipo de ventana o paquete. Incluye: desconexion electrica, retiro del equipo del hueco o base estructural, tapado de abertura, manejo y carga de materiales, limpieza del area.', unit: 'pza', basePrice: 550, costPrice: 275, categoryKey: 'catRet', volumeTiers: volTier(12) },

  // ═══════════════════════════════════════════════
  // DISENO E INGENIERIA - 13
  // ═══════════════════════════════════════════════

  { sku: 'ING-CARGAS', name: 'Cálculo de Carga Térmica (Método CARRIER/ASHRAE)', description: 'Calculo de carga termica para diseno de sistema HVAC por metodo CARRIER basado en ASHRAE. Incluye: visita de levantamiento de 2 horas, ingreso de datos de edificio (orientacion, materiales, ocupacion, equipos), calculo de ganancias de calor sensible y latente, seleccion preliminar de equipos, informe tecnico.', unit: 'pza', basePrice: 5500, costPrice: 2750, categoryKey: 'catIng', volumeTiers: volTier(10) },
  { sku: 'ING-PROY', name: 'Proyecto Ejecutivo HVAC hasta 500 m²', description: 'Elaboracion de proyecto ejecutivo de sistema de climatizacion para areas de hasta 500 m². Incluye: memorias de calculo de carga termica, planos de instalacion arquitectonicos, isometricos de refrigerante y drenajes, diagramas electricos y de control, especificaciones tecnicas, lista de materiales, presupuesto.', unit: 'pza', basePrice: 14000, costPrice: 7000, categoryKey: 'catIng', volumeTiers: volTier(8) },
  { sku: 'ING-PLANOS', name: 'Planos de Instalación HVAC', description: 'Elaboracion de planos arquitectonicos de instalacion HVAC. Incluye: planos de planta con ubicacion de equipos, cortes y detalles de instalacion, isometricos de linea refrigerante y drenajes, diagramas electricos unifilares, diagramas de control.', unit: 'pza', basePrice: 8000, costPrice: 4000, categoryKey: 'catIng', volumeTiers: volTier(10) },
  { sku: 'ING-MEMORIA', name: 'Memoria de Cálculo y Especificaciones Técnicas', description: 'Elaboracion de memoria de calculo completa y especificaciones tecnicas para sistema HVAC. Incluye: calculo de carga termica detallado, seleccion de equipos con justificacion, calculo de ductos por metodo de friccion constante, balance hidronico, especificaciones tecnicas de equipos y materiales.', unit: 'pza', basePrice: 11000, costPrice: 5500, categoryKey: 'catIng', volumeTiers: volTier(8) },
  { sku: 'ING-VENT', name: 'Diseño de Sistema de Ventilación y Extracción', description: 'Diseno de sistema de ventilacion mecanica y extraccion de aire. Incluye: calculo de caudales segun NOM-001-SEDE y ASHRAE 62.1, diseno de ducteria, seleccion de ventiladores, planos de planta e isometricos, especificaciones.', unit: 'pza', basePrice: 5000, costPrice: 2500, categoryKey: 'catIng', volumeTiers: volTier(10) },
  { sku: 'ING-CFRIO', name: 'Diseño de Cámara de Refrigeración o Congelación', description: 'Diseno de camara de refrigeracion o congelacion para aplicacion comercial o industrial. Incluye: calculo de carga termica del producto y envolvente, seleccion de paneles y espesor, seleccion de equipos de refrigeracion, planos de planta y detalles, especificaciones.', unit: 'pza', basePrice: 7500, costPrice: 3750, categoryKey: 'catIng', volumeTiers: volTier(10) },
  { sku: 'ING-ENER', name: 'Diagnóstico Energético de Sistema HVAC', description: 'Diagnostico energetico de sistema de climatizacion existente. Incluye: auditoria de consumo electrico historico, evaluacion de eficiencia de equipos en sitio, identificacion de oportunidades de ahorro, calculo de retorno de inversion, informe ejecutivo con recomendaciones priorizadas.', unit: 'pza', basePrice: 9500, costPrice: 4750, categoryKey: 'catIng', volumeTiers: volTier(10) },
  { sku: 'ING-ESPEC', name: 'Especificación Técnica para Compra de Equipos', description: 'Elaboracion de especificacion tecnica detallada para adquisicion de equipos HVAC. Incluye: requisitos de capacidad, eficiencia SEER/COP, tipo de refrigerante, dimensiones, conexiones, garantias, criterios de aceptacion en sitio.', unit: 'pza', basePrice: 3200, costPrice: 1600, categoryKey: 'catIng', volumeTiers: volTier(12) },

  // ═══════════════════════════════════════════════
  // PUESTA EN MARCHA - 14
  // ═══════════════════════════════════════════════

  { sku: 'PM-CHILL', name: 'Puesta en Marcha de Chiller', description: 'Comisionamiento y puesta en marcha de chiller enfriado por aire. Incluye: revision de instalacion mecanica y electrica, conexiones de control, llenado del sistema hidronico, purga de aire, arranque inicial, ajuste de parametros de operacion, verificacion de capacidad nominal, reporte de puesta en marcha.', unit: 'pza', basePrice: 7500, costPrice: 3750, categoryKey: 'catPm', volumeTiers: volTier(10) },
  { sku: 'PM-VRF', name: 'Puesta en Marcha de Sistema VRF/VRV', description: 'Puesta en marcha de sistema VRF/VRV. Incluye: prueba de presion con nitrogeno a 450 psig por 24 horas, vacio profundo con micronometro, carga de refrigerante por calculo de tuberia, configuracion de direcciones de evaporadoras, arranque de todas las unidades, verificacion de capacidad, ajuste de parametros.', unit: 'pza', basePrice: 6000, costPrice: 3000, categoryKey: 'catPm', volumeTiers: volTier(10) },
  { sku: 'PM-UMA', name: 'Puesta en Marcha de UMA con Control DDC', description: 'Puesta en marcha de unidad manejadora de aire con control DDC. Incluye: verificacion de conexiones electricas y de control, secuencia de arranque, calibracion de sensores de temperatura y presion, calibracion de actuadores, verificacion de puntos de control, ajuste de setpoints, reporte.', unit: 'pza', basePrice: 4200, costPrice: 2100, categoryKey: 'catPm', volumeTiers: volTier(10) },
  { sku: 'PM-CFRIO', name: 'Puesta en Marcha de Cámara Fría', description: 'Puesta en marcha de camara de refrigeracion. Incluye: sellado de panel y puertas, arranque de sistema de refrigeracion, ajuste de parametros de control y descongelamiento, verificacion de temperatura de regimen, registro de ciclo, reporte de puesta en marcha.', unit: 'pza', basePrice: 5000, costPrice: 2500, categoryKey: 'catPm', volumeTiers: volTier(10) },
  { sku: 'PM-CALDERA', name: 'Puesta en Marcha de Caldera', description: 'Puesta en marcha de caldera de agua caliente. Incluye: revision de instalacion de gas y electrica, purga de aire del sistema, encendido, ajuste de combustion, analisis de gases con cromatografo, calibracion de temperatura de operacion, reporte de eficiencia.', unit: 'pza', basePrice: 3800, costPrice: 1900, categoryKey: 'catPm', volumeTiers: volTier(10) },
  { sku: 'PM-BOMBACAL', name: 'Puesta en Marcha de Bomba de Calor', description: 'Puesta en marcha de bomba de calor. Incluye: verificacion de instalacion, configuracion del termostato, arranque en modo enfriamiento y calefaccion, medicion de presiones y temperaturas, verificacion de valvula de 4 vias, reporte de funcionamiento.', unit: 'pza', basePrice: 3200, costPrice: 1600, categoryKey: 'catPm', volumeTiers: volTier(10) },
  { sku: 'PM-AIRBAL', name: 'Balanceo de Aire para Sistema HVAC', description: 'Balanceo de aire para sistema de climatizacion y ventilacion. Incluye: medicion de flujo de aire en cada difusor con anemometro de hilo caliente, ajuste de dampers de balanceo, medicion de flujo total del sistema, balance a condiciones de diseno, reporte de balanceo certificado.', unit: 'pza', basePrice: 5500, costPrice: 2750, categoryKey: 'catPm', volumeTiers: volTier(10) },
  { sku: 'PM-HIDRO', name: 'Balanceo Hidrónico de Sistema de Agua Helada', description: 'Balanceo hidronico de sistema de agua helada. Incluye: verificacion de valvulas de balanceo automaticas, medicion de flujo en cada fan coil o UMA, ajuste de valvulas de balanceo, medicion de temperaturas de entrada y salida, balance a condiciones de diseno, reporte.', unit: 'pza', basePrice: 5200, costPrice: 2600, categoryKey: 'catPm', volumeTiers: volTier(10) },

  // ═══════════════════════════════════════════════
  // EFICIENCIA ENERGETICA - 15
  // ═══════════════════════════════════════════════

  { sku: 'EF-AUDIT', name: 'Auditoría Energética Integral HVAC', description: 'Auditoria energetica completa de sistemas de climatizacion. Incluye: analisis de facturacion electrica de 12 meses, medicion de consumo de equipos con analizador de redes, evaluacion de eficiencia operativa, identificacion de oportunidades de mejora, calculo de ahorros potenciales y retorno de inversion.', unit: 'pza', basePrice: 11000, costPrice: 5500, categoryKey: 'catEf', volumeTiers: volTier(8) },
  { sku: 'EF-RETRO', name: 'Análisis de Retrofit para Equipos Existentes', description: 'Analisis tecnico-economico para retrofit de equipos HVAC existentes. Incluye: evaluacion de equipos actuales y su eficiencia, propuesta de alternativas de reemplazo, calculo de ahorros energeticos por alternativa, analisis de retorno de inversion, recomendaciones.', unit: 'pza', basePrice: 7000, costPrice: 3500, categoryKey: 'catEf', volumeTiers: volTier(10) },
  { sku: 'EF-VFD', name: 'Instalación de VFD para Ahorro Energético', description: 'Instalacion de variador de frecuencia en bombas o ventiladores para ahorro de energia. Incluye: VFD de 1-10 HP segun aplicacion, cableado de potencia y control, parametrizacion, arranque, medicion de consumo antes/despues, reporte de ahorro.', unit: 'pza', basePrice: 8000, costPrice: 4000, categoryKey: 'catEf', volumeTiers: volTier(10) },
  { sku: 'EF-CONTROL', name: 'Optimización de Setpoints y Programación de Control', description: 'Optimizacion de parametros de operacion de sistemas HVAC. Incluye: revision de programacion actual de control, ajuste de setpoints de temperatura por zona, configuracion de bandas muertas, horarios de operacion, reporte de ahorros proyectados.', unit: 'pza', basePrice: 3200, costPrice: 1600, categoryKey: 'catEf', volumeTiers: volTier(10) },
  { sku: 'EF-FREECOOL', name: 'Implementación de Economizador (Free Cooling)', description: 'Diseno e implementacion de sistema de free cooling o economizador. Incluye: evaluacion de viabilidad, integracion de compuertas motorizadas de aire exterior, sensores de temperatura y entalpia, actuadores, logica de control, puesta en marcha.', unit: 'pza', basePrice: 5000, costPrice: 2500, categoryKey: 'catEf', volumeTiers: volTier(10) },
  { sku: 'EF-REFRIG', name: 'Optimización de Carga de Refrigerante', description: 'Analisis y optimizacion de carga de refrigerante en sistema HVAC. Incluye: medicion de superheat y subcooling, ajuste de carga de refrigerante, registro de presiones y temperaturas, reporte de eficiencia con carga optima.', unit: 'pza', basePrice: 2200, costPrice: 1100, categoryKey: 'catEf', volumeTiers: volTier(12) },
  { sku: 'EF-AISLA', name: 'Diagnóstico y Mejora de Aislamiento Térmico', description: 'Diagnostico de aislamiento termico en tuberias y ductos HVAC. Incluye: inspeccion visual y termografica infrarroja, deteccion de puntos de perdida termica, propuesta de mejora, instalacion o reemplazo de aislamiento, reporte de reduccion de perdidas.', unit: 'pza', basePrice: 2800, costPrice: 1400, categoryKey: 'catEf', volumeTiers: volTier(10) },
  { sku: 'EF-REPORTE', name: 'Reporte de Línea Base y Ahorros (IPMVP)', description: 'Elaboracion de reporte de linea base de consumo y ahorros de energia segun protocolo IPMVP. Incluye: recopilacion de datos historicos, establecimiento de linea base ajustada por variables independientes, calculo de ahorros verificados, reporte ejecutivo.', unit: 'pza', basePrice: 8000, costPrice: 4000, categoryKey: 'catEf', volumeTiers: volTier(10) },

  // ═══════════════════════════════════════════════
  // OBRA CIVIL Y SOPORTERIA - 16
  // ═══════════════════════════════════════════════

  { sku: 'OBRA-BASE', name: 'Base de Concreto para Equipo 1-5 TR', description: 'Construccion de base de concreto armado para equipo HVAC de 1 a 5 toneladas. Incluye: excavacion a 30 cm, armado de acero de refuerzo, cimbra de madera, colado de concreto fc 150 kg/cm2, nivelacion con nivel de mano, curado por 7 dias.', unit: 'pza', basePrice: 2200, costPrice: 1100, categoryKey: 'catObra', volumeTiers: volTier(12) },
  { sku: 'OBRA-BASECH', name: 'Base de Concreto para Chiller hasta 50 TR', description: 'Construccion de base de concreto armado para chiller de 20 a 50 toneladas. Incluye: excavacion a 50 cm, armado de acero de refuerzo con varilla de 3/8, cimbra, colado de concreto fc 200 kg/cm2, nivelacion de precision con nivel laser, curado.', unit: 'pza', basePrice: 7500, costPrice: 3750, categoryKey: 'catObra', volumeTiers: volTier(10) },
  { sku: 'OBRA-SOPORT', name: 'Soporte Metálico para Condensadora', description: 'Fabricacion e instalacion de soporte metalico tipo base de acero estructural para unidad condensadora. Incluye: diseno a medida segun dimensiones de equipo, corte y soldadura con electrodo 7018, acabado anticorrosivo con esmalte, anclaje a losa con expansivas de 1/2, nivelacion.', unit: 'pza', basePrice: 3200, costPrice: 1600, categoryKey: 'catObra', volumeTiers: volTier(12) },
  { sku: 'OBRA-STRUCT', name: 'Refuerzo Estructural para Equipo de Techo', description: 'Diseno e instalacion de refuerzo estructural para montaje de equipo HVAC en techo. Incluye: calculo estructural simple, fabricacion de viguetas de acero de 4 pulg, soldadura a estructura existente, prueba de carga.', unit: 'pza', basePrice: 5000, costPrice: 2500, categoryKey: 'catObra', volumeTiers: volTier(10) },
  { sku: 'OBRA-PENET', name: 'Perforación de Losa para Tubería/Ducto', description: 'Perforacion de losa de concreto para paso de tuberia de refrigerante, drenaje o ductos. Incluye: localizacion de acero de refuerzo con detector, perforacion con broca de diamante de 2-6 pulg, sellado perimetral con mortero expansivo, impermeabilizacion.', unit: 'pza', basePrice: 320, costPrice: 160, categoryKey: 'catObra', volumeTiers: volTier(12) },
  { sku: 'OBRA-ZAPATA', name: 'Zapata o Dado de Concreto para Soporte', description: 'Construccion de zapata aislada o dado de concreto para soporte de equipo HVAC. Incluye: excavacion, armado de acero con plantilla, cimbra, colado de concreto con anclas niveladas, curado.', unit: 'pza', basePrice: 1600, costPrice: 800, categoryKey: 'catObra', volumeTiers: volTier(12) },
  { sku: 'OBRA-PLACA', name: 'Placa Antivibración con Aislamiento Sísmico', description: 'Suministro e instalacion de placa antivibracion con aisladores sismicos para equipo HVAC. Incluye: placa de acero estructural de 1/4, aisladores tipo resorte de neopreno, nivelacion de precision, prueba de aislamiento.', unit: 'pza', basePrice: 2000, costPrice: 1000, categoryKey: 'catObra', volumeTiers: volTier(12) },
  { sku: 'OBRA-IZAJE', name: 'Gancho de Izaje para Equipo Pesado', description: 'Fabricacion e instalacion de gancho de izaje tipo ancla quimica o expansiva para equipo HVAC pesado. Incluye: calculo de capacidad de carga, perforacion con broca de diamante, instalacion de ancla con resina epoxica, prueba de carga con factor de seguridad 5:1.', unit: 'pza', basePrice: 2600, costPrice: 1300, categoryKey: 'catObra', volumeTiers: volTier(12) },
  { sku: 'OBRA-GRUA', name: 'Renta de Grúa Pluma para Izaje por Hora', description: 'Renta de grua pluma o montacargas para izaje de equipos HVAC a azoteas. Incluye: operador certificado, maniobras de izaje, seguros de carga, maniobras de posicionamiento.', unit: 'hora', basePrice: 1400, costPrice: 700, categoryKey: 'catObra', volumeTiers: volTier(10) },
  { sku: 'OBRA-ANDAMIO', name: 'Renta de Andamio o Plataforma de Trabajo por Día', description: 'Renta de andamio tubular o plataforma de trabajo tipo tijera para mantenimiento e instalacion HVAC. Incluye: traslado, armado, seguro de proteccion perimetral, desarmado y retiro.', unit: 'dia', basePrice: 750, costPrice: 375, categoryKey: 'catObra', volumeTiers: volTier(10) },
];

// ═══════════════════════════════════════════════
// HELPER FUNCTIONS (hoisted with `function` keyword)
// ═══════════════════════════════════════════════

function makeInstItems(prefix: string, typeName: string, variants: { tr: string; name: string; price: number; cost: number }[], descTmpl: string): ItemDef[] {
  return variants.map(v => {
    const desc = descTmpl.replace(/\$TR/g, v.tr).replace(/\$NAME/g, v.name).replace(/\$TYPE/g, typeName);
    return {
      sku: `INST-${prefix}-${v.tr}TR`,
      name: `Instalacion de ${typeName} ${v.tr} TR`,
      description: desc,
      unit: 'pza',
      basePrice: v.price,
      costPrice: v.cost,
      categoryKey: 'catInst',
      volumeTiers: volTier(12),
    };
  });
}

function makeMantItems(prefix: string, typeName: string, variants: { tr: string; name: string; price: number; cost: number }[], descTmpl: string): ItemDef[] {
  return variants.map(v => {
    const desc = descTmpl.replace(/\$TR/g, v.tr).replace(/\$NAME/g, v.name).replace(/\$TYPE/g, typeName);
    return {
      sku: `MANT-${prefix}-${v.tr}TR`,
      name: `Mantenimiento de ${typeName} ${v.tr} TR`,
      description: desc,
      unit: 'pza',
      basePrice: v.price,
      costPrice: v.cost,
      categoryKey: 'catMant',
      volumeTiers: volTier(12),
    };
  });
}

function makeCompItems(variants: { tr: string; name: string; price: number; cost: number }[], descTmpl: string): ItemDef[] {
  return variants.map(v => {
    const desc = descTmpl.replace(/\$TR/g, v.tr).replace(/\$NAME/g, v.name);
    return {
      sku: `REP-COMP-${v.tr}TR`,
      name: `Reemplazo de Compresor ${v.tr} TR`,
      description: desc,
      unit: 'pza',
      basePrice: v.price,
      costPrice: v.cost,
      categoryKey: 'catRep',
      volumeTiers: volTier(12),
    };
  });
}

function makeMotorItems(variants: { tr: string; name: string; price: number; cost: number }[], descTmpl: string): ItemDef[] {
  return variants.map(v => {
    const desc = descTmpl.replace(/\$TR/g, v.tr).replace(/\$NAME/g, v.name);
    return {
      sku: `REP-MOTOR-${v.tr.replace('.', '_')}HP`,
      name: `Reemplazo de Motor Ventilador ${v.name}`,
      description: desc,
      unit: 'pza',
      basePrice: v.price,
      costPrice: v.cost,
      categoryKey: 'catRep',
      volumeTiers: volTier(12),
    };
  });
}

function makeGasItems(variants: { key: string; name: string; price: number; cost: number }[]): ItemDef[] {
  return variants.map(v => ({
    sku: `GAS-${v.key}`,
    name: `Suministro de Refrigerante ${v.name} por kg`,
    description: `Suministro de refrigerante ${v.name} virgen para recarga de sistemas HVAC. Incluye: cilindro con certificado de pureza, dosificacion con bascula electronica, registro de carga, manifiesto de transferencia.`,
    unit: 'kg',
    basePrice: v.price,
    costPrice: v.cost,
    categoryKey: 'catGas',
    volumeTiers: volTier(12),
  }));
}
