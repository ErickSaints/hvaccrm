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

  // 7. Ensure sample pricebook catalog items (conceptos de obra con precios reales de mercado CDMX)
  const pricebookCount = await prisma.pricebookItem.count();
  if (pricebookCount === 0) {
    console.log('[startup] Sembrando catálogo de precios unitarios HVAC con datos de mercado reales...');
    const catInst = await prisma.pricebookCategory.create({ data: { name: 'Instalación', sortOrder: 1, description: 'Instalación de equipos de climatización y refrigeración' } });
    const catMant = await prisma.pricebookCategory.create({ data: { name: 'Mantenimiento', sortOrder: 2, description: 'Servicios de mantenimiento preventivo y correctivo' } });
    const catRef = await prisma.pricebookCategory.create({ data: { name: 'Refacciones', sortOrder: 3, description: 'Partes y componentes para equipos HVAC-R' } });
    const catDiag = await prisma.pricebookCategory.create({ data: { name: 'Diagnóstico', sortOrder: 4, description: 'Servicios de diagnóstico y evaluación técnica' } });
    const catRep = await prisma.pricebookCategory.create({ data: { name: 'Reparación', sortOrder: 5, description: 'Servicios de reparación de equipos y sistemas' } });

    const catalogItems = [
      // ── Instalación ──
      { sku: 'INST-MSP-1T', name: 'Instalación de Minisplit 1 Tonelada', description: 'Instalación completa de sistema de aire acondicionado tipo minisplit de 1 tonelada (12,000 BTU/h). Incluye: montaje de unidad evaporadora, instalación de condensadora, línea refrigerante de cobre con aislamiento, cableado eléctrico, drenaje de condensados, soportería, conexiones, prueba de vacío, carga de refrigerante R-410A, arranque y prueba de funcionamiento.', unit: 'pza', basePrice: 3500, categoryId: catInst.id },
      { sku: 'INST-MSP-2T', name: 'Instalación de Minisplit 2 Toneladas', description: 'Instalación completa de sistema de aire acondicionado tipo minisplit de 2 toneladas (24,000 BTU/h). Incluye: montaje de evaporadora, instalación de condensadora, línea refrigerante de 3/8" y 5/8" con aislamiento, cableado calibre 10 con termomagnético de 30A, drenaje PVC, soportería, conexiones, prueba de vacío, carga de refrigerante R-410A, arranque y prueba.', unit: 'pza', basePrice: 4800, categoryId: catInst.id },
      { sku: 'INST-VRF', name: 'Instalación de Sistema VRF/VRV', description: 'Instalación de sistema de volumen de refrigerante variable (VRV/VRF). Incluye: montaje de unidad condensadora, instalación de evaporadoras, tubería de cobre con derivaciones, cableado de comunicación y control, drenajes, carga precisa de refrigerante R-410A, arranque y puesta en marcha.', unit: 'pza', basePrice: 7500, categoryId: catInst.id },
      { sku: 'INST-CST', name: 'Instalación de Equipo Cassette', description: 'Instalación de equipo de aire acondicionado tipo cassette de 1 a 3 toneladas. Incluye: montaje en plafón, refuerzo estructural, conexión de línea refrigerante, drenaje con bomba de condensados, cableado eléctrico, control remoto, arranque y prueba.', unit: 'pza', basePrice: 4200, categoryId: catInst.id },
      { sku: 'INST-PT', name: 'Instalación de Equipo Piso-Techo', description: 'Instalación de equipo de aire acondicionado tipo piso-techo. Incluye: montaje en piso o muro, conexión de ductos, línea refrigerante, drenaje, cableado eléctrico, termostato, arranque y puesta en marcha.', unit: 'pza', basePrice: 5800, categoryId: catInst.id },
      { sku: 'INST-CHILL', name: 'Instalación de Chiller', description: 'Instalación de chiller enfriado por aire para climatización central. Incluye: montaje en base de concreto, conexión de líneas de agua helada con aislamiento, instalación de bomba, válvulas, conexiones eléctricas trifásicas, llenado del sistema, arranque y prueba de capacidad.', unit: 'pza', basePrice: 25000, categoryId: catInst.id },

      // ── Mantenimiento ──
      { sku: 'MANT-MSP-1T', name: 'Mantenimiento Preventivo Minisplit 1TR', description: 'Mantenimiento preventivo para minisplit de 1 tonelada. Incluye: limpieza de filtros y serpentines, revisión de presiones, medición de amperaje, revisión de conexiones eléctricas, lubricación de ventiladores, revisión de drenaje, reporte fotográfico.', unit: 'pza', basePrice: 1800, categoryId: catMant.id },
      { sku: 'MANT-MSP-2T', name: 'Mantenimiento Preventivo Minisplit 2TR', description: 'Mantenimiento preventivo para minisplit de 2 toneladas. Incluye: limpieza de filtros y serpentines, revisión de presiones y temperaturas, medición de amperaje, revisión de conexiones eléctricas, lubricación, revisión de drenaje, reporte fotográfico.', unit: 'pza', basePrice: 2200, categoryId: catMant.id },
      { sku: 'MANT-CST', name: 'Mantenimiento Preventivo Cassette', description: 'Mantenimiento preventivo para equipo cassette. Incluye: limpieza de filtros y serpentines, revisión de drenaje y bomba de condensados, revisión de presiones, conexiones eléctricas, lubricación de ventiladores, reporte técnico.', unit: 'pza', basePrice: 2800, categoryId: catMant.id },
      { sku: 'MANT-VRF', name: 'Mantenimiento Preventivo VRF/VRV por unidad', description: 'Mantenimiento preventivo para sistema VRF por unidad evaporadora. Incluye: limpieza de filtros y serpentines, revisión de carga refrigerante, inspección de cajas de derivación, verificación de comunicación, limpieza de tarjetas de control, reporte de rendimiento.', unit: 'pza', basePrice: 3500, categoryId: catMant.id },
      { sku: 'MANT-CHILL', name: 'Mantenimiento Preventivo Chiller', description: 'Mantenimiento preventivo para chiller de hasta 50 toneladas. Incluye: limpieza química de serpentín, revisión de presiones y aceite, reemplazo de filtros secadores, revisión de válvula de expansión y contactores, medición de voltajes y amperajes, limpieza de tablero, reporte técnico.', unit: 'pza', basePrice: 12000, categoryId: catMant.id },
      { sku: 'MANT-CFRIO', name: 'Mantenimiento Preventivo Cámara Fría', description: 'Mantenimiento preventivo para cámara de refrigeración. Incluye: limpieza de evaporador y condensador, revisión de puertas y cortinas, verificación de temperatura y descongelamiento, revisión de refrigerante, conexiones eléctricas, reporte.', unit: 'pza', basePrice: 5500, categoryId: catMant.id },

      // ── Diagnóstico ──
      { sku: 'DIAG-BAS', name: 'Diagnóstico Básico de Sistema HVAC', description: 'Evaluación técnica básica de sistema HVAC. Incluye: inspección visual, medición de presiones y temperaturas, cálculo de superheat/subcooling, medición de amperaje, detección de fugas, reporte técnico con diagnóstico y recomendaciones.', unit: 'pza', basePrice: 800, categoryId: catDiag.id },
      { sku: 'DIAG-AVAN', name: 'Diagnóstico Avanzado (presiones, fugas, eléctrico)', description: 'Diagnóstico avanzado de sistema HVAC. Incluye: prueba de presiones con nitrógeno, detección electrónica de fugas, análisis de circuito eléctrico, medición de resistencia de aislamiento, revisión de componentes electromecánicos, reporte detallado.', unit: 'pza', basePrice: 2200, categoryId: catDiag.id },
      { sku: 'DIAG-TERMO', name: 'Diagnóstico Termográfico de Instalaciones', description: 'Estudio termográfico infrarrojo de instalaciones HVAC. Identificación de puntos calientes en tableros eléctricos y componentes, clasificación por criticidad, reporte con imágenes térmicas y recomendaciones de acción.', unit: 'pza', basePrice: 3500, categoryId: catDiag.id },

      // ── Reparación ──
      { sku: 'REP-COMP', name: 'Reemplazo de Compresor', description: 'Reemplazo de compresor de 1 a 5 toneladas. Incluye: diagnóstico, recuperación de refrigerante, retiro de compresor dañado, instalación de compresor nuevo, filtro secador, visor de líquido, vacío profundo, carga de refrigerante, ajuste de parámetros, prueba de funcionamiento.', unit: 'pza', basePrice: 8500, categoryId: catRep.id },
      { sku: 'REP-FUGA', name: 'Detección y Reparación de Fugas de Refrigerante', description: 'Servicio integral de detección y reparación de fugas de refrigerante. Incluye: inspección visual, prueba de presión con nitrógeno, detección electrónica, reparación con soldadura de aleación de plata, vacío, carga de refrigerante, tinte UV trazador.', unit: 'pza', basePrice: 4500, categoryId: catRep.id },
      { sku: 'REP-TARJ', name: 'Reparación o Reemplazo de Tarjeta de Control', description: 'Diagnóstico y reparación o reemplazo de tarjeta de control de equipo HVAC. Incluye: diagnóstico de falla, reparación de componentes electrónicos o reemplazo de tarjeta, programación, prueba de funcionamiento.', unit: 'pza', basePrice: 3200, categoryId: catRep.id },
      { sku: 'REP-MOTOR', name: 'Reemplazo de Motor Ventilador', description: 'Reemplazo de motor de ventilador de evaporadora o condensadora. Incluye: diagnóstico, retiro de motor dañado, instalación de motor nuevo, conexiones eléctricas, balanceo, prueba de funcionamiento y medición de amperaje.', unit: 'pza', basePrice: 3800, categoryId: catRep.id },
      { sku: 'REP-VALV', name: 'Reemplazo de Válvula de Expansión', description: 'Reemplazo de válvula de expansión termostática o electrónica. Incluye: diagnóstico, recuperación de refrigerante, instalación de válvula nueva, filtro secador, vacío, carga de refrigerante, ajuste de superheat.', unit: 'pza', basePrice: 2200, categoryId: catRep.id },

      // ── Refacciones ──
      { sku: 'REF-FILT', name: 'Suministro y Reemplazo de Filtros Secador', description: 'Suministro e instalación de filtro secador para línea refrigerante. Incluye: filtro secador según capacidad del sistema, corte y soldadura con aleación de plata, prueba de presión, vacío.', unit: 'pza', basePrice: 600, categoryId: catRef.id },
      { sku: 'REF-CAP', name: 'Suministro de Capacitores y Arrancadores', description: 'Suministro de capacitores de arranque y marcha para motores HVAC. Incluye: verificación con multímetro, selección de capacitancia y voltaje correctos, instalación y prueba.', unit: 'pza', basePrice: 450, categoryId: catRef.id },
    ];
    for (const item of catalogItems) {
      await prisma.pricebookItem.create({ data: item });
    }
    console.log(`[startup] ${catalogItems.length} conceptos de precio unitario creados con precios de mercado CDMX.`);
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
