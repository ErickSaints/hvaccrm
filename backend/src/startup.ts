import prisma from './prisma';
import bcrypt from 'bcryptjs';
import { getCatalogData } from './materialsCatalog';

async function ensureAdmin(): Promise<{ id: number }> {
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    const pwd = await bcrypt.hash('admin123', 10);
    admin = await prisma.user.create({
      data: {
        email: 'admin@hvaccrm.com',
        password: pwd,
        name: 'Admin Principal',
        role: 'ADMIN',
        phone: '555-0100',
        isSuperAdmin: true,
      },
    });
  } else if (!admin.isSuperAdmin) {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: { isSuperAdmin: true },
    });
  }
  return admin;
}

async function ensurePlans(adminId: number) {
  const count = await prisma.subscriptionPlan.count();
  if (count > 0) return;
  console.log('[startup] Creando planes de suscripción por rol...');
  await prisma.subscriptionPlan.createMany({
    data: [
      { name: 'Plan Cliente Mensual', description: 'Para empresas que requieren servicio de atención HVAC. Gestión de tickets, reportes y más.', price: 299, duration: 'MENSUAL', durationDays: 30, targetRole: 'CLIENT', features: 'Gestión de tickets, reportes de servicio, historial de equipos, cotizaciones', active: true, createdById: adminId },
      { name: 'Plan Cliente Anual', description: 'Ahorra 2 meses vs el plan mensual. Ideal para corporativos.', price: 2990, duration: 'ANUAL', durationDays: 365, targetRole: 'CLIENT', features: 'Todo lo del plan mensual + soporte prioritario + respaldo en la nube', active: true, createdById: adminId },
      { name: 'Plan Profesional Mensual', description: 'Para técnicos, ventas, compras y proyectos. Gestión completa del CRM.', price: 199, duration: 'MENSUAL', durationDays: 30, targetRole: 'PROFESIONAL', features: 'Gestión de clientes, tickets, cotizaciones, reportes, pólizas, órdenes de servicio', active: true, createdById: adminId },
      { name: 'Plan Profesional Anual', description: 'Ahorra 2 meses vs el plan mensual. Para uso profesional continuo.', price: 1990, duration: 'ANUAL', durationDays: 365, targetRole: 'PROFESIONAL', features: 'Todo lo del plan mensual + soporte prioritario + respaldo en la nube', active: true, createdById: adminId },
    ],
  });
  console.log('[startup] Planes creados.');
}

async function ensureDemoData() {
  const customerCount = await prisma.customer.count();
  if (customerCount > 0) {
    console.log(`[startup] ${customerCount} clientes existentes — saltando demo data.`);
    return;
  }

  console.log('[startup] Sembrando datos demo (clientes, equipos, tickets, etc.)...');
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })!;
  const tech1 = await prisma.user.findFirst({ where: { email: 'tecnico1@hvaccrm.com' } });
  const tech2 = await prisma.user.findFirst({ where: { email: 'tecnico2@hvaccrm.com' } });
  const sales = await prisma.user.findFirst({ where: { email: 'ventas@hvaccrm.com' } });

  if (!tech1 || !tech2 || !sales) {
    // Users missing entirely — run full seed
    console.log('[startup] Usuarios demo incompletos — ejecutando seed completo...');
    await import('./seed');
    return;
  }

  // Create customers
  const c1 = await prisma.customer.create({
    data: { companyName: 'Hotel Paraíso S.A.', contactName: 'Juan Pérez', email: 'juan@hotelparaiso.com', phone: '555-1001', address: 'Av. Principal 123, Colonia Centro', city: 'Ciudad de México', state: 'CDMX', zipCode: '06000', taxId: 'HPE-123456-ABC', notes: 'Cliente VIP, pago puntual' },
  });
  const c2 = await prisma.customer.create({
    data: { companyName: 'Plaza Comercial del Valle', contactName: 'Ana García', email: 'ana@plazavalle.com', phone: '555-1002', address: 'Blvd. del Valle 456', city: 'Monterrey', state: 'Nuevo León', zipCode: '64000', taxId: 'PCV-789012-DEF' },
  });
  const c3 = await prisma.customer.create({
    data: { companyName: 'Hospital San Rafael', contactName: 'Dr. Luis Mendoza', email: 'lmendoza@sanrafael.com', phone: '555-1003', address: 'Calle de la Salud 789', city: 'Guadalajara', state: 'Jalisco', zipCode: '44100', taxId: 'HSR-345678-GHI', notes: 'Requiere atención 24/7 para áreas críticas' },
  });

  // Equipment
  const e1 = await prisma.equipment.create({ data: { type: 'Chiller', brand: 'Carrier', model: '30RB-200', serialNumber: 'CH-2024-001', capacity: '200 TR', location: 'Sótano - Cuarto de Máquinas', installDate: new Date('2023-06-15'), lastService: new Date('2025-12-20'), customerId: c1.id, notes: 'Equipo principal del hotel' } });
  const e2 = await prisma.equipment.create({ data: { type: 'VRF/VRV', brand: 'Daikin', model: 'VRV IV', serialNumber: 'VRV-2023-045', capacity: '48 TR', location: 'Azotea', installDate: new Date('2023-03-10'), lastService: new Date('2025-11-15'), customerId: c2.id } });
  const e3 = await prisma.equipment.create({ data: { type: 'Unidad Manejo de Aire', brand: 'Trane', model: 'UMA-5000', serialNumber: 'UMA-2022-112', capacity: '5000 CFM', location: 'Piso 3 - Cuarto Técnico', installDate: new Date('2022-08-20'), lastService: new Date('2025-10-30'), customerId: c3.id, notes: 'Área de quirófanos - crítico' } });
  const e4 = await prisma.equipment.create({ data: { type: 'Cámara Fría', brand: 'Thermo King', model: 'TK-500', serialNumber: 'CF-2024-033', capacity: '500 m³', location: 'Cocina - Almacén de Alimentos', installDate: new Date('2024-01-05'), lastService: new Date('2025-12-01'), customerId: c1.id } });

  // Tickets
  const t1 = await prisma.ticket.create({ data: { title: 'Chiller no enfría adecuadamente', description: 'El chiller principal está disparando por alta presión. Temperatura de salida superior a lo normal.', level: 'EMERGENCIA', status: 'EN_PROCESO', customerId: c1.id, equipmentId: e1.id, assignedTo: tech1.id } });
  await prisma.ticket.create({ data: { title: 'Mantenimiento preventivo VRF', description: 'Se requiere mantenimiento preventivo programado del sistema VRF de la plaza comercial.', level: 'PROGRAMAR', status: 'ABIERTO', customerId: c2.id, equipmentId: e2.id } });
  await prisma.ticket.create({ data: { title: 'Fallo en UMA de quirófanos', description: 'La unidad de manejo de aire del piso 3 presenta vibraciones anormales y ruido excesivo.', level: 'ATENCION', status: 'ABIERTO', customerId: c3.id, equipmentId: e3.id } });

  // Quotations
  await prisma.quotation.create({ data: { number: 'COT-202605-0001', title: 'Mantenimiento preventivo Chiller Carrier', subtotal: 25000, tax: 4000, total: 29000, status: 'APROBADA', validUntil: new Date('2026-07-23'), notes: 'Incluye cambio de aceite y filtros', terms: 'Pago a 30 días', customerId: c1.id, createdById: sales!.id, items: { create: [{ description: 'Mantenimiento preventivo Chiller 30RB-200', quantity: 1, unitPrice: 15000, total: 15000 }, { description: 'Cambio de aceite sintético', quantity: 2, unitPrice: 3000, total: 6000 }, { description: 'Filtros secador', quantity: 2, unitPrice: 2000, total: 4000 }] } } });
  await prisma.quotation.create({ data: { number: 'COT-202605-0002', title: 'Reparación UMA Trane', subtotal: 18500, tax: 2960, total: 21460, status: 'ENVIADA', validUntil: new Date('2026-06-23'), customerId: c3.id, createdById: sales!.id, items: { create: [{ description: 'Diagnóstico y reparación de vibraciones', quantity: 1, unitPrice: 8500, total: 8500 }, { description: 'Balero de motor ventilador', quantity: 2, unitPrice: 3500, total: 7000 }, { description: 'Correas de transmisión', quantity: 3, unitPrice: 1000, total: 3000 }] } } });

  // Policies
  await prisma.maintenancePolicy.create({ data: { number: 'POL-202605-0001', name: 'Póliza Premium Hotel Paraíso', description: 'Cobertura completa para todos los equipos del hotel', frequency: 'TRIMESTRAL', visitCount: 4, pricePerVisit: 8500, totalPrice: 34000, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'ACTIVA', customerId: c1.id } });
  await prisma.maintenancePolicy.create({ data: { number: 'POL-202605-0002', name: 'Póliza Básica Hospital San Rafael', description: 'Mantenimiento semestral para UMA', frequency: 'SEMESTRAL', visitCount: 2, pricePerVisit: 12000, totalPrice: 24000, startDate: new Date('2026-03-01'), endDate: new Date('2027-02-28'), status: 'ACTIVA', customerId: c3.id } });

  // Service Order
  const so = await prisma.serviceOrder.create({ data: { number: 'ORD-202605-0001', description: 'Atención a emergencia - Chiller sobrecalentado', scheduledDate: new Date('2026-05-23'), status: 'EN_PROGRESO', customerId: c1.id, equipmentId: e1.id, assignedTo: tech1.id, ticketId: t1.id } });
  await prisma.serviceOrder.create({ data: { number: 'ORD-202605-0002', description: 'Revisión programada VRF Daikin', scheduledDate: new Date('2026-06-01'), status: 'PENDIENTE', customerId: c2.id, equipmentId: e2.id, assignedTo: tech2.id } });

  // Service Report
  await prisma.serviceReport.create({ data: { title: 'Reporte de Servicio - Chiller Carrier', description: 'Atención a emergencia por sobrecalentamiento', diagnosis: 'Condensador obstruido con suciedad, presión alta detectada', workPerformed: 'Limpieza de condensador, revisión de refrigerante, ajuste de presostato', recommendations: 'Programar limpieza trimestral de condensador', arrivalTime: '08:30', departureTime: '12:45', signature: 'Juan Pérez - Recibido', serviceOrderId: so.id, technicianId: tech1.id, customerId: c1.id, equipmentId: e1.id, photos: { create: [{ url: '/uploads/chiller-antes.jpg', caption: 'Condensador antes de limpieza', type: 'ANTES' }, { url: '/uploads/chiller-despues.jpg', caption: 'Condensador después de limpieza', type: 'DESPUES' }] }, usedMaterials: { create: [{ name: 'Desengrasante industrial', quantity: 2, unitPrice: 250, total: 500 }, { name: 'Refrigerante R-134a (kg)', quantity: 5, unitPrice: 450, total: 2250 }] } } });

  // Notifications
  await prisma.notification.createMany({ data: [
    { userId: admin!.id, type: 'ticket', title: 'Ticket EMERGENCIA asignado', message: 'Chiller Hotel Paraíso - Revisión urgente', link: '/tickets/1', read: false },
    { userId: tech1.id, type: 'ticket', title: 'Ticket asignado', message: 'Chiller no enfría adecuadamente - Hotel Paraíso', link: '/tickets/1', read: false },
    { userId: tech1.id, type: 'order', title: 'Nueva orden de servicio', message: 'ORD-202605-0001 - Atención a emergencia', link: '/service-orders/1', read: false },
    { userId: sales!.id, type: 'quotation', title: 'Cotización aprobada', message: 'COT-202605-0001 - Hotel Paraíso - $29,000', link: '/quotations/1', read: false },
  ] });

  console.log('[startup] Datos demo creados exitosamente.');
}

async function startup() {
  console.log('[startup] Iniciando...');

  // 1. Ensure admin user exists
  const admin = await ensureAdmin();

  // 2. Ensure subscription plans exist
  await ensurePlans(admin.id);

  // 3. Ensure demo technicians and sales users exist
  const techPassword = await bcrypt.hash('tecnic0123', 10);
  const existingUsers = await prisma.user.findMany({ where: { role: { in: ['TECHNICIAN', 'SALES', 'PROYECTOS', 'COMPRAS'] } } });
  if (existingUsers.length < 5) {
    const needed = [
      { email: 'tecnico1@hvaccrm.com', name: 'Carlos Técnico', role: 'TECHNICIAN' as const, phone: '555-0101' },
      { email: 'tecnico2@hvaccrm.com', name: 'María López', role: 'TECHNICIAN' as const, phone: '555-0102' },
      { email: 'ventas@hvaccrm.com', name: 'Roberto Ventas', role: 'SALES' as const, phone: '555-0103' },
      { email: 'proyectos@hvaccrm.com', name: 'Ana Proyectos', role: 'PROYECTOS' as const, phone: '555-0104' },
      { email: 'compras@hvaccrm.com', name: 'Luis Compras', role: 'COMPRAS' as const, phone: '555-0105' },
    ];
    const trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    for (const u of needed) {
      const exists = existingUsers.find((eu) => eu.email === u.email);
      if (!exists) {
        await prisma.user.create({ data: { ...u, password: techPassword, trialEndsAt } });
        console.log(`[startup] Usuario creado: ${u.email}`);
      }
    }
  }

  // 4. Ensure demo data (customers, equipment, tickets, etc.)
  await ensureDemoData();

  // 5. Ensure material catalog
  const catalogCount = await prisma.catalogMaterial.count();
  if (catalogCount === 0) {
    console.log('[startup] Sembrando catálogo de materiales HVAC...');
    const catalogData = getCatalogData();
    await prisma.catalogMaterial.createMany({ data: catalogData });
    console.log(`[startup] Catálogo de materiales creado (${catalogData.length} items).`);
  }

  // 6. Ensure regions & states for regional pricing
  const existingRegions = await prisma.region.count();
  if (existingRegions === 0) {
    console.log('[startup] Sembrando regiones y estados para precios regionales...');
    const regions = await Promise.all([
      prisma.region.create({ data: { code: 'NORTE', name: 'Norte', adjustmentFactor: 0.07, description: 'Baja California, Sonora, Chihuahua, Coahuila, Nuevo León, Tamaulipas y estados del norte', sortOrder: 1 } }),
      prisma.region.create({ data: { code: 'CENTRO-N', name: 'Centro-Norte', adjustmentFactor: 0.02, description: 'Aguascalientes, Guanajuato, Querétaro, San Luis Potosí, Zacatecas', sortOrder: 2 } }),
      prisma.region.create({ data: { code: 'CENTRO', name: 'Centro', adjustmentFactor: 0, description: 'CDMX, Estado de México, Hidalgo, Morelos, Puebla, Tlaxcala (base)', sortOrder: 3 } }),
      prisma.region.create({ data: { code: 'BAJIO', name: 'Bajío-Occidente', adjustmentFactor: -0.02, description: 'Colima, Jalisco, Michoacán, Nayarit', sortOrder: 4 } }),
      prisma.region.create({ data: { code: 'SURESTE', name: 'Sur-Sureste', adjustmentFactor: -0.07, description: 'Campeche, Chiapas, Guerrero, Oaxaca, Quintana Roo, Tabasco, Veracruz, Yucatán', sortOrder: 5 } }),
    ]);
    const regionMap: Record<string, number> = {};
    for (const r of regions) regionMap[r.code] = r.id;
    const states = [
      { code: 'BC',  name: 'Baja California',         regionCode: 'NORTE' },
      { code: 'BCS', name: 'Baja California Sur',     regionCode: 'NORTE' },
      { code: 'SON', name: 'Sonora',                  regionCode: 'NORTE' },
      { code: 'CHIH',name: 'Chihuahua',               regionCode: 'NORTE' },
      { code: 'COAH',name: 'Coahuila',                regionCode: 'NORTE' },
      { code: 'NL',  name: 'Nuevo León',              regionCode: 'NORTE' },
      { code: 'TAMPS',name: 'Tamaulipas',             regionCode: 'NORTE' },
      { code: 'DGO', name: 'Durango',                 regionCode: 'NORTE' },
      { code: 'SIN', name: 'Sinaloa',                 regionCode: 'NORTE' },
      { code: 'AGS', name: 'Aguascalientes',          regionCode: 'CENTRO-N' },
      { code: 'GTO', name: 'Guanajuato',              regionCode: 'CENTRO-N' },
      { code: 'QRO', name: 'Querétaro',               regionCode: 'CENTRO-N' },
      { code: 'SLP', name: 'San Luis Potosí',         regionCode: 'CENTRO-N' },
      { code: 'ZAC', name: 'Zacatecas',               regionCode: 'CENTRO-N' },
      { code: 'CDMX',name: 'Ciudad de México',        regionCode: 'CENTRO' },
      { code: 'EDOMEX',name: 'Estado de México',      regionCode: 'CENTRO' },
      { code: 'HGO', name: 'Hidalgo',                 regionCode: 'CENTRO' },
      { code: 'MOR', name: 'Morelos',                 regionCode: 'CENTRO' },
      { code: 'PUE', name: 'Puebla',                  regionCode: 'CENTRO' },
      { code: 'TLAX',name: 'Tlaxcala',                regionCode: 'CENTRO' },
      { code: 'COL', name: 'Colima',                  regionCode: 'BAJIO' },
      { code: 'JAL', name: 'Jalisco',                 regionCode: 'BAJIO' },
      { code: 'MICH',name: 'Michoacán',               regionCode: 'BAJIO' },
      { code: 'NAY', name: 'Nayarit',                 regionCode: 'BAJIO' },
      { code: 'CAMP',name: 'Campeche',                regionCode: 'SURESTE' },
      { code: 'CHIS',name: 'Chiapas',                 regionCode: 'SURESTE' },
      { code: 'GRO', name: 'Guerrero',                regionCode: 'SURESTE' },
      { code: 'OAX', name: 'Oaxaca',                  regionCode: 'SURESTE' },
      { code: 'QR',  name: 'Quintana Roo',            regionCode: 'SURESTE' },
      { code: 'TAB', name: 'Tabasco',                 regionCode: 'SURESTE' },
      { code: 'VER', name: 'Veracruz',                regionCode: 'SURESTE' },
      { code: 'YUC', name: 'Yucatán',                 regionCode: 'SURESTE' },
    ];
    for (const s of states) {
      await prisma.state.create({ data: { code: s.code, name: s.name, regionId: regionMap[s.regionCode] } });
    }
    console.log(`[startup] Regiones: ${regions.length} | Estados: ${states.length} creados.`);
  } else {
    console.log(`[startup] ${existingRegions} regiones ya existen, saltando.`);
  }

  // 7. Ensure sample pricebook catalog items (conceptos de obra con descripciones detalladas)
  const pricebookCount = await prisma.pricebookItem.count();
  if (pricebookCount === 0) {
    console.log('[startup] Sembrando catálogo de precios unitarios HVAC...');
    const catInst = await prisma.pricebookCategory.create({ data: { name: 'Instalación', sortOrder: 1, description: 'Instalación de equipos de climatización y refrigeración' } });
    const catMant = await prisma.pricebookCategory.create({ data: { name: 'Mantenimiento', sortOrder: 2, description: 'Servicios de mantenimiento preventivo y correctivo' } });
    const catRef = await prisma.pricebookCategory.create({ data: { name: 'Refacciones', sortOrder: 3, description: 'Partes y componentes para equipos HVAC-R' } });
    const catDiag = await prisma.pricebookCategory.create({ data: { name: 'Diagnóstico', sortOrder: 4, description: 'Servicios de diagnóstico y evaluación técnica' } });
    const catRep = await prisma.pricebookCategory.create({ data: { name: 'Reparación', sortOrder: 5, description: 'Servicios de reparación de equipos y sistemas' } });

    const catalogItems = [
      { sku: 'INST-MSP-1T', name: 'Instalación de Mini Split 1 Tonelada', description: 'Instalación completa de sistema de aire acondicionado tipo mini split de 1 tonelada (12,000 BTU/h). Incluye: montaje de unidad evaporadora en muro, instalación de unidad condensadora en azotea o muro exterior, tendido de línea refrigerante con tubería de cobre de 1/4" y 1/2" con aislamiento térmico Armaflex de 1/2", cableado eléctrico calibre 12 con termomagnético de 20A, drenaje de condensados con tubería PVC de 1/2", soportería y herrajes de fijación, conexiones mecánicas y eléctricas, prueba de vacío con micronómetro, carga de refrigerante R-410A, arranque y prueba de funcionamiento.', unit: 'pza', goodPrice: 8500, betterPrice: 7225, bestPrice: 6375, costPrice: 5525, categoryId: catInst.id },
      { sku: 'INST-MSP-2T', name: 'Instalación de Mini Split 2 Toneladas', description: 'Instalación completa de sistema de aire acondicionado tipo mini split de 2 toneladas (24,000 BTU/h). Incluye: montaje de evaporadora, instalación de condensadora, línea refrigerante de 3/8" y 5/8" con aislamiento térmico, cableado calibre 10 con termomagnético de 30A, drenaje PVC, soportería, conexiones, prueba de vacío, carga de refrigerante R-410A, arranque y prueba.', unit: 'pza', goodPrice: 12000, betterPrice: 10200, bestPrice: 9000, costPrice: 7800, categoryId: catInst.id },
      { sku: 'INST-MSP-3T', name: 'Instalación de Mini Split 3 Toneladas', description: 'Instalación completa de sistema de aire acondicionado tipo mini split de 3 toneladas (36,000 BTU/h). Incluye: montaje de evaporadora de mayor capacidad, condensadora de alto rendimiento, línea refrigerante de 3/8" y 3/4" con aislamiento de 1/2", cableado calibre 8, termomagnético de 40A, drenaje PVC de 3/4", soportería reforzada, conexiones, vacío profundo con micronómetro, carga de refrigerante R-410A, arranque y prueba de rendimiento térmico.', unit: 'pza', goodPrice: 16500, betterPrice: 14025, bestPrice: 12375, costPrice: 10725, categoryId: catInst.id },
      { sku: 'INST-VRF-4T', name: 'Instalación de Sistema VRF 4 Toneladas', description: 'Instalación de sistema de refrigerante variable (VRF) de 4 toneladas (48,000 BTU/h) con capacidad para 4 evaporadoras. Incluye: montaje de unidad condensadora VRF, instalación de hasta 4 unidades evaporadoras tipo cassette o ducto, tubería de cobre para derivación con cabezales o cajas de derivación (branch boxes), aislamiento térmico en toda la tubería, cableado de comunicación y control (bus de datos), cableado eléctrico trifásico, tarjeta de control central, drenajes individuales por evaporadora, carga precisa de refrigerante R-410A, arranque y puesta en marcha del sistema completo.', unit: 'pza', goodPrice: 45000, betterPrice: 38250, bestPrice: 33750, costPrice: 29250, categoryId: catInst.id },
      { sku: 'INST-CHILL-10T', name: 'Instalación de Chiller 10 Toneladas', description: 'Instalación de chiller enfriado por aire de 10 toneladas (120,000 BTU/h) para climatización central. Incluye: montaje de chiller en base de concreto o estructura metálica, conexión de líneas de agua helada (suministro y retorno) con tubería de acero al carbón cédula 40 con aislamiento térmico, instalación de bomba de agua helada, vaso de expansión, válvulas, conexiones eléctricas trifásicas con arrancador, llenado de sistema, arranque, ajuste de parámetros y prueba de capacidad.', unit: 'pza', goodPrice: 95000, betterPrice: 80750, bestPrice: 71250, costPrice: 61750, categoryId: catInst.id },
      { sku: 'INST-UMA-5K', name: 'Instalación de Unidad de Manejo de Aire 5,000 CFM', description: 'Instalación de unidad de manejo de aire (UMA) con capacidad de 5,000 CFM. Incluye: montaje de UMA, fabricación e instalación de transiciones en lámina galvanizada, conexión de ductos principales, aislamiento térmico exterior, conexión de agua helada, válvula de control de 2 vías con actuador, conexiones eléctricas, arranque, balanceo de aire y prueba de flujo.', unit: 'pza', goodPrice: 68000, betterPrice: 57800, bestPrice: 51000, costPrice: 44200, categoryId: catInst.id },
      { sku: 'INST-CAMFRIA', name: 'Instalación de Cámara Fría 20 m³', description: 'Instalación de cámara de refrigeración de 20 m³. Incluye: montaje de paneles aislantes de poliuretano de 4", instalación de puerta con cerradura de seguridad, ensamble de piso aislante, unidad condensadora remota con evaporador, línea refrigerante, cableado eléctrico, control electrónico de temperatura, iluminación LED, drenaje de deshielo, carga de refrigerante R-404A, arranque y prueba.', unit: 'pza', goodPrice: 125000, betterPrice: 106250, bestPrice: 93750, costPrice: 81250, categoryId: catInst.id },
      { sku: 'MANT-PREV-MSP', name: 'Mantenimiento Preventivo de Mini Split', description: 'Servicio de mantenimiento preventivo para mini split de 1 a 3 toneladas. Incluye: limpieza de filtros de aire, limpieza de serpentines, revisión y ajuste de presiones, medición de amperaje, revisión de conexiones eléctricas, lubricación de motores, revisión de drenaje, aplicación de desinfectante bactericida, reporte fotográfico.', unit: 'pza', goodPrice: 1200, betterPrice: 1020, bestPrice: 900, costPrice: 600, categoryId: catMant.id },
      { sku: 'MANT-PREV-CHILL', name: 'Mantenimiento Preventivo de Chiller', description: 'Servicio de mantenimiento preventivo para chiller de hasta 50 toneladas. Incluye: limpieza química de serpentín, revisión y ajuste de presiones, revisión de aceite, filtros secadores, válvula de expansión, contactores, medición de voltajes y amperajes, limpieza de tablero, revisión de alarmas, reporte técnico.', unit: 'pza', goodPrice: 4500, betterPrice: 3825, bestPrice: 3375, costPrice: 2250, categoryId: catMant.id },
      { sku: 'MANT-PREV-VRF', name: 'Mantenimiento Preventivo de VRF', description: 'Mantenimiento preventivo para sistema VRF. Incluye: limpieza de filtros y serpentines, revisión de carga, inspección de cajas de derivación, verificación de comunicación, limpieza de tarjetas de control, medición de resistencia de aislamiento, prueba de ciclos, reporte de rendimiento.', unit: 'pza', goodPrice: 3800, betterPrice: 3230, bestPrice: 2850, costPrice: 1900, categoryId: catMant.id },
      { sku: 'MANT-CORR-COMP', name: 'Mantenimiento Correctivo de Compresor Scroll', description: 'Reparación o reemplazo de compresor scroll de 1 a 5 toneladas. Incluye: diagnóstico, recuperación de refrigerante, retiro de compresor dañado, instalación de compresor nuevo, filtro secador, visor de líquido, vacío profundo, carga de refrigerante, ajuste de parámetros, prueba de funcionamiento.', unit: 'pza', goodPrice: 6500, betterPrice: 5525, bestPrice: 4875, costPrice: 3900, categoryId: catMant.id },
      { sku: 'MANT-FUGAS', name: 'Detección y Reparación de Fugas de Refrigerante', description: 'Servicio integral de detección y reparación de fugas. Incluye: inspección visual, prueba de presión con nitrógeno, detección electrónica y por espuma, reparación con soldadura de aleación de plata, vacío, carga de refrigerante, tinte UV trazador, reporte.', unit: 'pza', goodPrice: 2800, betterPrice: 2380, bestPrice: 2100, costPrice: 1400, categoryId: catMant.id },
      { sku: 'REF-COMP-SCROLL', name: 'Suministro de Compresor Scroll 3 TR', description: 'Suministro de compresor scroll Copeland 3 toneladas para R-410A. Incluye: compresor con aceite POE precargado, válvula de servicio, tapones de cobre, empaques, soportes antivibración, garantía 12 meses.', unit: 'pza', goodPrice: 9500, betterPrice: 8075, bestPrice: 7125, costPrice: 6650, categoryId: catRef.id },
      { sku: 'REF-FILTRO-CARBON', name: 'Filtro de Carbón Activado 24x24x4', description: 'Filtro de carbón activado para UMA 24"x24"x4", eficiencia 95% en remoción de COV, panel de prefiltro integrado, temperatura máxima 50°C.', unit: 'pza', goodPrice: 380, betterPrice: 323, bestPrice: 285, costPrice: 228, categoryId: catRef.id },
      { sku: 'REF-MOTOR-VENT', name: 'Motor de Ventilador 1/2 HP 3 Velocidades', description: 'Motor eléctrico para evaporadora de 1/2 HP, 3 velocidades, 110V/60Hz, capacitor permanente, eje 1/2", rodamientos sellados, protección térmica, clase B.', unit: 'pza', goodPrice: 2800, betterPrice: 2380, bestPrice: 2100, costPrice: 1680, categoryId: catRef.id },
      { sku: 'REF-TARJETA-MSP', name: 'Tarjeta de Control Universal para Mini Split', description: 'Tarjeta de control universal compatible con marcas principales para mini split de 1 a 3 toneladas. Incluye control de compresor, ventiladores, EEV, protecciones, sensor de temperatura, display de fallas, entrada IR.', unit: 'pza', goodPrice: 1200, betterPrice: 1020, bestPrice: 900, costPrice: 720, categoryId: catRef.id },
      { sku: 'REF-TUBO-COBRE', name: 'Tubería de Cobre 3/8" x 20 m', description: 'Tubo de cobre rígido tipo L de 3/8" para línea de líquido refrigerante, rollo de 20 m, cobre 99.9% libre de oxígeno, cumple ASTM B-280.', unit: 'tramo', goodPrice: 850, betterPrice: 722, bestPrice: 637, costPrice: 510, categoryId: catRef.id },
      { sku: 'DIAG-GRAL', name: 'Diagnóstico General de Sistema HVAC', description: 'Evaluación técnica integral de sistema HVAC. Incluye: inspección visual, medición de presiones y temperaturas, cálculo de superheat/subcooling, amperaje, detección de fugas, revisión de componentes, reporte técnico detallado con diagnóstico y recomendaciones.', unit: 'pza', goodPrice: 900, betterPrice: 765, bestPrice: 675, costPrice: 450, categoryId: catDiag.id },
      { sku: 'DIAG-TERMO', name: 'Diagnóstico Termográfico de Sistema Eléctrico', description: 'Estudio termográfico infrarrojo de tableros y componentes HVAC. Identificación de puntos calientes, clasificación por criticidad, reporte con imágenes térmicas y recomendaciones.', unit: 'pza', goodPrice: 2500, betterPrice: 2125, bestPrice: 1875, costPrice: 1250, categoryId: catDiag.id },
      { sku: 'DIAG-CAL-AIRE', name: 'Diagnóstico de Calidad de Aire Interior', description: 'Evaluación de calidad de aire interior (IAQ). Medición de CO₂, COV, partículas PM2.5/PM10, temperatura, humedad, presión diferencial, muestreo microbiológico, comparación con NOM-001-SSA1-2021 y ASHRAE 62.1.', unit: 'pza', goodPrice: 4500, betterPrice: 3825, bestPrice: 3375, costPrice: 2700, categoryId: catDiag.id },
      { sku: 'REP-TABLERO', name: 'Reparación de Tablero Eléctrico de Control', description: 'Reparación de tablero de control HVAC hasta 50A. Diagnóstico, reemplazo de contactores, relevadores, fusibles, arrancadores, VFD, cableado, etiquetado conforme a NOM-001-SEDE, pruebas.', unit: 'pza', goodPrice: 3500, betterPrice: 2975, bestPrice: 2625, costPrice: 2100, categoryId: catRep.id },
      { sku: 'REP-VALV-EXP', name: 'Reparación/Reemplazo de Válvula de Expansión', description: 'Reparación o reemplazo de válvula de expansión termostática o electrónica. Incluye diagnóstico, recuperación de refrigerante, instalación de válvula nueva, filtro secador, vacío, carga, ajuste de superheat.', unit: 'pza', goodPrice: 3800, betterPrice: 3230, bestPrice: 2850, costPrice: 2280, categoryId: catRep.id },
      { sku: 'REP-CAPACITOR', name: 'Reemplazo de Capacitor de Arranque', description: 'Diagnóstico y reemplazo de capacitor de arranque/marcha. Verificación con multímetro, selección de repuesto con voltaje y capacitancia correctos, instalación y prueba.', unit: 'pza', goodPrice: 650, betterPrice: 552, bestPrice: 487, costPrice: 325, categoryId: catRep.id },
    ];
    for (const item of catalogItems) {
      await prisma.pricebookItem.create({ data: item });
    }
    console.log(`[startup] ${catalogItems.length} conceptos de precio unitario creados con descripciones detalladas.`);
  } else {
    console.log(`[startup] ${pricebookCount} conceptos ya existen, saltando.`);
  }

  // 8. One-time migration: clean stale overrides from old permission system
  //    (old buildPermissionMap saved defaults as overrides, causing sections to appear unrequested)
  const fleetOverride = await prisma.rolePermission.findFirst({ where: { permission: 'fleet:view' } });
  if (!fleetOverride) {
    const staleCount = await prisma.rolePermission.count();
    if (staleCount > 0) {
      await prisma.rolePermission.deleteMany();
      console.log(`[startup] Migración: ${staleCount} overrides antiguos eliminados — el sistema de permisos cambió.`);
      console.log('[startup] Configura los permisos desde Admin > Permisos. Ya no se borrarán automáticamente.');
    }
  }

  // 9. Extend trial for all non-admin users (to avoid subscription blocks)
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const usersToExtend = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' }, OR: [{ trialEndsAt: null }, { trialEndsAt: { lt: now } }] },
  });
  if (usersToExtend.length > 0) {
    for (const u of usersToExtend) {
      await prisma.user.update({ where: { id: u.id }, data: { trialEndsAt: trialEnd } });
    }
    console.log(`[startup] Período de prueba extendido a 90 días para ${usersToExtend.length} usuarios.`);
  }

  await prisma.$disconnect();
  console.log('[startup] Listo.');
}

startup();
