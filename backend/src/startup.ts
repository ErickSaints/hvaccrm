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

  // 7a. One-time migration: detect old small catalog (22 items) and re-seed with expanded version (150+ items)
  const oldItemCount = await prisma.pricebookItem.count();
  if (oldItemCount > 0 && oldItemCount < 50) {
    await prisma.pricebookItem.deleteMany();
    await prisma.pricebookCategory.deleteMany();
    console.log('[startup] Catalogo anterior detectado y eliminado. Se sembrara la version expandida.');
  }

  // 7. Ensure sample pricebook catalog items (conceptos de obra con precios reales de mercado CDMX)
  const pricebookCount = await prisma.pricebookItem.count();
  if (pricebookCount === 0) {
    console.log('[startup] Sembrando catálogo de precios unitarios HVAC con datos de mercado reales...');
    const catInst = await prisma.pricebookCategory.create({ data: { name: 'Instalación', sortOrder: 1, description: 'Instalación de equipos de climatización y refrigeración' } });
    const catMant = await prisma.pricebookCategory.create({ data: { name: 'Mantenimiento', sortOrder: 2, description: 'Servicios de mantenimiento preventivo y correctivo' } });
    const catDiag = await prisma.pricebookCategory.create({ data: { name: 'Diagnóstico', sortOrder: 3, description: 'Servicios de diagnóstico y evaluación técnica' } });
    const catRep = await prisma.pricebookCategory.create({ data: { name: 'Reparación', sortOrder: 4, description: 'Servicios de reparación de equipos y sistemas' } });
    const catRef = await prisma.pricebookCategory.create({ data: { name: 'Refacciones', sortOrder: 5, description: 'Partes y componentes originales y equivalentes' } });
    const catDuct = await prisma.pricebookCategory.create({ data: { name: 'Ductos y Aire', sortOrder: 6, description: 'Fabricación e instalación de ductería y difusión de aire' } });
    const catRefr = await prisma.pricebookCategory.create({ data: { name: 'Refrigeración Comercial', sortOrder: 7, description: 'Sistemas de refrigeración comercial e industrial' } });
    const catCal = await prisma.pricebookCategory.create({ data: { name: 'Calefacción', sortOrder: 8, description: 'Sistemas de calefacción y calentadores de agua' } });
    const catGas = await prisma.pricebookCategory.create({ data: { name: 'Gas Refrigerante', sortOrder: 9, description: 'Suministro de gases refrigerantes' } });
    const catCtrl = await prisma.pricebookCategory.create({ data: { name: 'Control y Automatización', sortOrder: 10, description: 'Sistemas de control, BMS y automatización' } });
    const catLim = await prisma.pricebookCategory.create({ data: { name: 'Limpieza Especializada', sortOrder: 11, description: 'Servicios de limpieza profunda y sanitización' } });
    const catRet = await prisma.pricebookCategory.create({ data: { name: 'Retiro y Desmontaje', sortOrder: 12, description: 'Retiro y disposición de equipos' } });
    const catIng = await prisma.pricebookCategory.create({ data: { name: 'Diseño e Ingeniería', sortOrder: 13, description: 'Diseño de sistemas HVAC y cálculo de cargas' } });
    const catPm = await prisma.pricebookCategory.create({ data: { name: 'Puesta en Marcha', sortOrder: 14, description: 'Comisionamiento y puesta en operación' } });
    const catEf = await prisma.pricebookCategory.create({ data: { name: 'Eficiencia Energética', sortOrder: 15, description: 'Auditorías y mejoras de eficiencia energética' } });
    const catObra = await prisma.pricebookCategory.create({ data: { name: 'Obra Civil y Soportería', sortOrder: 16, description: 'Obra civil, bases y estructuras de soporte' } });

    const catalogItems: {
      sku: string; name: string; description: string; unit: string; basePrice: number; categoryId: number
    }[] = [
      // ── Instalación (10) ──
      { sku: 'INST-MSP-1T', name: 'Instalacion de Minisplit 1 Tonelada', description: 'Instalacion completa de sistema de aire acondicionado tipo minisplit de 1 tonelada (12,000 BTU/h). Incluye: montaje de unidad evaporadora, instalacion de condensadora, linea refrigerante de cobre con aislamiento, cableado electrico, drenaje de condensados, soporteria, conexiones, prueba de vacio, carga de refrigerante R-410A, arranque y prueba de funcionamiento.', unit: 'pza', basePrice: 3500, categoryId: catInst.id },
      { sku: 'INST-MSP-2T', name: 'Instalacion de Minisplit 2 Toneladas', description: 'Instalacion completa de sistema de aire acondicionado tipo minisplit de 2 toneladas (24,000 BTU/h). Incluye: montaje de evaporadora, instalacion de condensadora, linea refrigerante de 3/8 y 5/8 pulg con aislamiento, cableado calibre 10 con termomagnetico de 30A, drenaje PVC, soporteria, conexiones, prueba de vacio, carga de refrigerante R-410A, arranque y prueba.', unit: 'pza', basePrice: 4800, categoryId: catInst.id },
      { sku: 'INST-VRF', name: 'Instalacion de Sistema VRF/VRV', description: 'Instalacion de sistema de volumen de refrigerante variable (VRV/VRF). Incluye: montaje de unidad condensadora, instalacion de evaporadoras, tuberia de cobre con derivaciones, cableado de comunicacion y control, drenajes, carga precisa de refrigerante R-410A, arranque y puesta en marcha.', unit: 'pza', basePrice: 7500, categoryId: catInst.id },
      { sku: 'INST-CST', name: 'Instalacion de Equipo Cassette', description: 'Instalacion de equipo de aire acondicionado tipo cassette de 1 a 3 toneladas. Incluye: montaje en plafon, refuerzo estructural, conexion de linea refrigerante, drenaje con bomba de condensados, cableado electrico, control remoto, arranque y prueba.', unit: 'pza', basePrice: 4200, categoryId: catInst.id },
      { sku: 'INST-PT', name: 'Instalacion de Equipo Piso-Techo', description: 'Instalacion de equipo de aire acondicionado tipo piso-techo. Incluye: montaje en piso o muro, conexion de ductos, linea refrigerante, drenaje, cableado electrico, termostato, arranque y puesta en marcha.', unit: 'pza', basePrice: 5800, categoryId: catInst.id },
      { sku: 'INST-CHILL', name: 'Instalacion de Chiller', description: 'Instalacion de chiller enfriado por aire para climatizacion central. Incluye: montaje en base de concreto, conexion de lineas de agua helada con aislamiento, instalacion de bomba, valvulas, conexiones electricas trifasicas, llenado del sistema, arranque y prueba de capacidad.', unit: 'pza', basePrice: 25000, categoryId: catInst.id },
      { sku: 'INST-UMA', name: 'Instalacion de Unidad Manejadora de Aire', description: 'Instalacion de unidad manejadora de aire (UMA) de 2,000 a 10,000 CFM. Incluye: montaje sobre base de concreto, conexion de ductos de suministro y retorno, bateria de enfriamiento, conexiones hidronicas, valvulas de control, drenaje, cableado electrico trifasico, arranque y prueba.', unit: 'pza', basePrice: 8500, categoryId: catInst.id },
      { sku: 'INST-FANCOIL', name: 'Instalacion de Fan Coil', description: 'Instalacion de fan coil de 1 a 5 toneladas. Incluye: montaje en plafon o muro, conexion de tuberia de agua helada con aislamiento, valvula de control, drenaje, cableado electrico, termostato, arranque y prueba de flujo de aire.', unit: 'pza', basePrice: 4500, categoryId: catInst.id },
      { sku: 'INST-PRECISO', name: 'Instalacion de Equipo de Precision (Data Center)', description: 'Instalacion de equipo de climatizacion de precision para data center de 3 a 10 toneladas. Incluye: montaje, conexion de piso tecnico, tuberia de refrigerante, drenaje con bomba, cableado electrico trifasico con respaldo, humidificador, sensores de temperatura, arranque y calibracion.', unit: 'pza', basePrice: 15000, categoryId: catInst.id },
      { sku: 'INST-PAQUETE', name: 'Instalacion de Equipo Paquete (Rooftop)', description: 'Instalacion de equipo paquete tipo rooftop de 5 a 20 toneladas. Incluye: montaje en base estructural, ductos de suministro y retorno, conexion electrica trifasica, termostato, arranque y puesta en marcha.', unit: 'pza', basePrice: 12000, categoryId: catInst.id },

      // ── Mantenimiento (12) ──
      { sku: 'MANT-MSP-1T', name: 'Mantenimiento Preventivo Minisplit 1TR', description: 'Mantenimiento preventivo para minisplit de 1 tonelada. Incluye: limpieza de filtros y serpentines, revision de presiones, medicion de amperaje, revision de conexiones electricas, lubricacion de ventiladores, revision de drenaje, reporte fotografico.', unit: 'pza', basePrice: 1800, categoryId: catMant.id },
      { sku: 'MANT-MSP-2T', name: 'Mantenimiento Preventivo Minisplit 2TR', description: 'Mantenimiento preventivo para minisplit de 2 toneladas. Incluye: limpieza de filtros y serpentines, revision de presiones y temperaturas, medicion de amperaje, revision de conexiones electricas, lubricacion, revision de drenaje, reporte fotografico.', unit: 'pza', basePrice: 2200, categoryId: catMant.id },
      { sku: 'MANT-CST', name: 'Mantenimiento Preventivo Cassette', description: 'Mantenimiento preventivo para equipo cassette. Incluye: limpieza de filtros y serpentines, revision de drenaje y bomba de condensados, revision de presiones, conexiones electricas, lubricacion de ventiladores, reporte tecnico.', unit: 'pza', basePrice: 2800, categoryId: catMant.id },
      { sku: 'MANT-VRF', name: 'Mantenimiento Preventivo VRF/VRV por unidad evaporadora', description: 'Mantenimiento preventivo para sistema VRF por unidad evaporadora. Incluye: limpieza de filtros y serpentines, revision de carga refrigerante, inspeccion de cajas de derivacion, verificacion de comunicacion, limpieza de tarjetas de control, reporte de rendimiento.', unit: 'pza', basePrice: 3500, categoryId: catMant.id },
      { sku: 'MANT-CHILL', name: 'Mantenimiento Preventivo Chiller hasta 50 TR', description: 'Mantenimiento preventivo para chiller de hasta 50 toneladas. Incluye: limpieza quimica de serpentin, revision de presiones y aceite, reemplazo de filtros secadores, revision de valvula de expansion y contactores, medicion de voltajes y amperajes, limpieza de tablero, reporte tecnico.', unit: 'pza', basePrice: 12000, categoryId: catMant.id },
      { sku: 'MANT-CFRIO', name: 'Mantenimiento Preventivo Camara Fria', description: 'Mantenimiento preventivo para camara de refrigeracion. Incluye: limpieza de evaporador y condensador, revision de puertas y cortinas, verificacion de temperatura y descongelamiento, revision de refrigerante, conexiones electricas, reporte.', unit: 'pza', basePrice: 5500, categoryId: catMant.id },
      { sku: 'MANT-UMA', name: 'Mantenimiento Preventivo UMA', description: 'Mantenimiento preventivo para unidad manejadora de aire. Incluye: limpieza de serpentines, reemplazo de filtros, lubricacion de ventiladores, tension de correas, revision de valvulas de control, limpieza de bandeja de drenaje, reporte.', unit: 'pza', basePrice: 6500, categoryId: catMant.id },
      { sku: 'MANT-TORRE', name: 'Mantenimiento de Torre de Enfriamiento', description: 'Mantenimiento de torre de enfriamiento de hasta 100 TR. Incluye: limpieza de relleno y distribuidores, revision de motor y ventilador, tratamiento quimico del agua, limpieza de charola, purga de solidos, reporte de calidad de agua.', unit: 'pza', basePrice: 8000, categoryId: catMant.id },
      { sku: 'MANT-GRAL', name: 'Mantenimiento General de Sistema Central', description: 'Mantenimiento general de sistema de climatizacion central. Incluye: revision de todos los componentes del sistema, limpieza de serpentines, ajuste de parametros, reporte de eficiencia y recomendaciones.', unit: 'pza', basePrice: 9500, categoryId: catMant.id },
      { sku: 'MANT-PRECISO', name: 'Mantenimiento de Equipo de Precision', description: 'Mantenimiento de equipo de climatizacion de precision para data center. Incluye: limpieza de serpentines, reemplazo de filtros HEPA, revision de humidificador, calibracion de sensores, reporte de condiciones ambientales.', unit: 'pza', basePrice: 6000, categoryId: catMant.id },
      { sku: 'MANT-BOMBACAL', name: 'Mantenimiento de Bomba de Calor', description: 'Mantenimiento preventivo para bomba de calor residencial o comercial. Incluye: limpieza de serpentines, revision de presiones, ciclo de calefaccion y enfriamiento, conexiones electricas, reporte.', unit: 'pza', basePrice: 3500, categoryId: catMant.id },
      { sku: 'MANT-CALDERA', name: 'Mantenimiento de Calentador o Caldera', description: 'Mantenimiento preventivo para calentador de paso o caldera. Incluye: limpieza de quemadores, revision de termopar y valvula de gas, medicion de presion de agua, purga del sistema, reporte de eficiencia de combustion.', unit: 'pza', basePrice: 4200, categoryId: catMant.id },

      // ── Diagnostico (8) ──
      { sku: 'DIAG-BAS', name: 'Diagnostico Basico de Sistema HVAC', description: 'Evaluacion tecnica basica de sistema HVAC. Incluye: inspeccion visual, medicion de presiones y temperaturas, calculo de superheat/subcooling, medicion de amperaje, deteccion de fugas, reporte tecnico con diagnostico y recomendaciones.', unit: 'pza', basePrice: 800, categoryId: catDiag.id },
      { sku: 'DIAG-AVAN', name: 'Diagnostico Avanzado (presiones, fugas, electrico)', description: 'Diagnostico avanzado de sistema HVAC. Incluye: prueba de presiones con nitrogeno, deteccion electronica de fugas, analisis de circuito electrico, medicion de resistencia de aislamiento, revision de componentes electromagneticos, reporte detallado.', unit: 'pza', basePrice: 2200, categoryId: catDiag.id },
      { sku: 'DIAG-TERMO', name: 'Diagnostico Termografico de Instalaciones', description: 'Estudio termografico infrarrojo de instalaciones HVAC. Identificacion de puntos calientes en tableros electricos y componentes, clasificacion por criticidad, reporte con imagenes termicas y recomendaciones de accion.', unit: 'pza', basePrice: 3500, categoryId: catDiag.id },
      { sku: 'DIAG-AIRE', name: 'Analisis de Calidad de Aire Interior', description: 'Evaluacion de calidad de aire interior en espacios climatizados. Incluye: medicion de CO2, temperatura y humedad relativa, conteo de particulas PM2.5/PM10, deteccion de COVs, reporte con recomendaciones de ventilacion y filtracion.', unit: 'pza', basePrice: 4500, categoryId: catDiag.id },
      { sku: 'DIAG-VIB', name: 'Analisis de Vibraciones en Equipos Rotativos', description: 'Analisis de vibraciones en motores, ventiladores y compresores HVAC. Incluye: medicion con acelerometro en puntos criticos, analisis espectral, diagnostico de desbalanceo o desalineacion, reporte con recomendaciones.', unit: 'pza', basePrice: 3800, categoryId: catDiag.id },
      { sku: 'DIAG-ESTRUCT', name: 'Diagnostico Estructural de Soporteria', description: 'Evaluacion estructural de soporteria de equipos HVAC. Incluye: inspeccion visual de corrosion y fatiga, verificacion de anclajes y niveles, reporte de condiciones y recomendaciones de refuerzo.', unit: 'pza', basePrice: 2500, categoryId: catDiag.id },
      { sku: 'DIAG-CARGA', name: 'Analisis de Carga Termica y Balance de Sistema', description: 'Analisis detallado de carga termica por el metodo CARRIER (ASHRAE). Incluye: medicion de temperaturas y flujos, calculo de carga actual vs diseno, identificacion de desviaciones, reporte con recomendaciones de optimizacion.', unit: 'pza', basePrice: 5000, categoryId: catDiag.id },
      { sku: 'DIAG-PRES', name: 'Prueba de Presion en Circuito Refrigerante', description: 'Prueba de presion con nitrogeno en circuito refrigerante. Incluye: presurizacion a 150-300 psig segun tipo de sistema, deteccion de caidas de presion, identificacion de fugas, reporte de resultados.', unit: 'pza', basePrice: 1500, categoryId: catDiag.id },

      // ── Reparacion (12) ──
      { sku: 'REP-COMP', name: 'Reemplazo de Compresor 1-5 TR', description: 'Reemplazo de compresor de 1 a 5 toneladas. Incluye: diagnostico, recuperacion de refrigerante, retiro de compresor danado, instalacion de compresor nuevo, filtro secador, visor de liquido, vacio profundo, carga de refrigerante, ajuste de parametros, prueba de funcionamiento.', unit: 'pza', basePrice: 8500, categoryId: catRep.id },
      { sku: 'REP-FUGA', name: 'Deteccion y Reparacion de Fugas de Refrigerante', description: 'Servicio integral de deteccion y reparacion de fugas de refrigerante. Incluye: inspeccion visual, prueba de presion con nitrogeno, deteccion electronica, reparacion con soldadura de aleacion de plata, vacio, carga de refrigerante, tinte UV trazador.', unit: 'pza', basePrice: 4500, categoryId: catRep.id },
      { sku: 'REP-TARJ', name: 'Reparacion o Reemplazo de Tarjeta de Control', description: 'Diagnostico y reparacion o reemplazo de tarjeta de control de equipo HVAC. Incluye: diagnostico de falla, reparacion de componentes electronicos o reemplazo de tarjeta, programacion, prueba de funcionamiento.', unit: 'pza', basePrice: 3200, categoryId: catRep.id },
      { sku: 'REP-MOTOR', name: 'Reemplazo de Motor Ventilador', description: 'Reemplazo de motor de ventilador de evaporadora o condensadora. Incluye: diagnostico, retiro de motor danado, instalacion de motor nuevo, conexiones electricas, balanceo, prueba de funcionamiento y medicion de amperaje.', unit: 'pza', basePrice: 3800, categoryId: catRep.id },
      { sku: 'REP-VALV', name: 'Reemplazo de Valvula de Expansion', description: 'Reemplazo de valvula de expansion termostatica o electronica. Incluye: diagnostico, recuperacion de refrigerante, instalacion de valvula nueva, filtro secador, vacio, carga de refrigerante, ajuste de superheat.', unit: 'pza', basePrice: 2200, categoryId: catRep.id },
      { sku: 'REP-VENT', name: 'Reemplazo de Ventilador Completo', description: 'Reemplazo de ventilador completo de evaporadora o condensadora. Incluye: diagnostico, retiro de ventilador danado, instalacion de ventilador nuevo, aspa, rejilla, conexiones electricas, prueba de funcionamiento.', unit: 'pza', basePrice: 2800, categoryId: catRep.id },
      { sku: 'REP-BOMBA', name: 'Reemplazo de Bomba de Agua Helada o Condensados', description: 'Reemplazo de bomba de agua helada o condensados. Incluye: diagnostico, retiro de bomba danada, instalacion de bomba nueva, conexiones hidraulicas y electricas, purga del sistema, prueba de flujo y presion.', unit: 'pza', basePrice: 3500, categoryId: catRep.id },
      { sku: 'REP-CONTACT', name: 'Reemplazo de Contactores y Arrancadores', description: 'Reemplazo de contactores y arrancadores en tablero electrico de equipo HVAC. Incluye: diagnostico, retiro de componente danado, instalacion de componente nuevo, calibracion de proteccion termica, prueba de funcionamiento.', unit: 'pza', basePrice: 1500, categoryId: catRep.id },
      { sku: 'REP-PRESOST', name: 'Reemplazo de Presostato', description: 'Reemplazo de presostato de alta o baja presion. Incluye: diagnostico, recuperacion de refrigerante, instalacion de presostato nuevo, calibracion de setpoint, vacio, carga de refrigerante, prueba de ciclo.', unit: 'pza', basePrice: 1200, categoryId: catRep.id },
      { sku: 'REP-TERM', name: 'Reemplazo de Termostato o Sensor', description: 'Reemplazo de termostato analogico, digital o sensor de temperatura. Incluye: diagnostico, retiro de termostato danado, instalacion de termostato o sensor nuevo, cableado, configuracion, calibracion y prueba de funcionamiento.', unit: 'pza', basePrice: 900, categoryId: catRep.id },
      { sku: 'REP-CORREA', name: 'Reemplazo de Correas y Poleas', description: 'Reemplazo de correas de transmision y poleas en ventiladores y motores HVAC. Incluye: diagnostico de desgaste, retiro de correas danadas, instalacion de correas nuevas, alineacion de poleas, tensionado, medicion de amperaje.', unit: 'pza', basePrice: 1800, categoryId: catRep.id },
      { sku: 'REP-DREN', name: 'Reparacion de Bandeja de Drenaje y Obstrucciones', description: 'Reparacion de bandeja de drenaje obstruida o danada. Incluye: destape de linea de drenaje con equipo especializado, limpieza y desinfeccion de bandeja, reparacion de fugas en bandeja, prueba de drenaje y vertido.', unit: 'pza', basePrice: 1500, categoryId: catRep.id },

      // ── Refacciones (10) ──
      { sku: 'REF-FILT', name: 'Suministro de Filtro Secador', description: 'Suministro e instalacion de filtro secador para linea refrigerante. Incluye: filtro secador segun capacidad del sistema, corte y soldadura con aleacion de plata, prueba de presion, vacio.', unit: 'pza', basePrice: 600, categoryId: catRef.id },
      { sku: 'REF-CAP', name: 'Suministro de Capacitores y Arrancadores', description: 'Suministro de capacitores de arranque y marcha para motores HVAC. Incluye: verificacion con multimetro, seleccion de capacitancia y voltaje correctos, instalacion y prueba.', unit: 'pza', basePrice: 450, categoryId: catRef.id },
      { sku: 'REF-ACEITE', name: 'Suministro de Aceite para Compresor', description: 'Suministro de aceite sintetico o mineral para compresor HVAC. Incluye: seleccion del tipo correcto segun refrigerante, cambio de aceite, registro de nivel y presion.', unit: 'litro', basePrice: 350, categoryId: catRef.id },
      { sku: 'REF-TUBO', name: 'Tuberia de Cobre para Refrigerante por metro', description: 'Suministro de tuberia de cobre tipo L para linea refrigerante. Incluye: corte a medida, debastado, limpieza interna, taponamiento temporal de extremos.', unit: 'm', basePrice: 250, categoryId: catRef.id },
      { sku: 'REF-AISLA', name: 'Aislamiento Termico para Tuberia por metro', description: 'Suministro e instalacion de aislamiento termico elastomerico para tuberia de refrigerante. Incluye: corte a medida, instalacion con pegamento especial, sellado de juntas con cinta.', unit: 'm', basePrice: 180, categoryId: catRef.id },
      { sku: 'REF-BALERO', name: 'Baleros y Rodamientos para Motor HVAC', description: 'Suministro de baleros o rodamientos para motores y ventiladores HVAC. Incluye: seleccion del balero correcto segun catalogo del fabricante, instalacion con herramienta especializada, lubricacion.', unit: 'pza', basePrice: 350, categoryId: catRef.id },
      { sku: 'REF-CORREA', name: 'Correas de Transmision para Ventilador', description: 'Suministro de correas de transmision tipo V o dentadas para ventiladores HVAC. Incluye: seleccion de perfil y longitud correctos, instalacion y tensionado.', unit: 'pza', basePrice: 250, categoryId: catRef.id },
      { sku: 'REF-FILTRO', name: 'Filtro de Aire para Retorno', description: 'Suministro de filtro de aire para retorno de equipo HVAC. Incluye: filtro de medios sinteticos o plisado segun especificacion, retiro de filtro usado, instalacion de filtro nuevo.', unit: 'pza', basePrice: 200, categoryId: catRef.id },
      { sku: 'REF-VISOR', name: 'Visor de Liquido con Indicador de Humedad', description: 'Suministro e instalacion de visor de liquido con indicador de humedad. Incluye: seleccion del diametro correcto, instalacion con soldadura de aleacion de plata, prueba de presion.', unit: 'pza', basePrice: 450, categoryId: catRef.id },
      { sku: 'REF-SENSOR', name: 'Sensor de Temperatura o Presion', description: 'Suministro de sensor de temperatura NTC/PT1000 o transductor de presion para sistema HVAC. Incluye: seleccion del sensor correcto, instalacion, conexion electrica, calibracion.', unit: 'pza', basePrice: 550, categoryId: catRef.id },

      // ── Ductos y Aire (10) ──
      { sku: 'DUCT-LAMINA', name: 'Fabricacion e Instalacion de Ducto de Lamina Galvanizada', description: 'Fabricacion e instalacion de ducto de lamina galvanizada para sistema de aire acondicionado. Incluye: corte y armado de ducto rectangular, refuerzos, bridas, sellado de juntas, soporteria colgante, instalacion en techo.', unit: 'm2', basePrice: 450, categoryId: catDuct.id },
      { sku: 'DUCT-FLEX', name: 'Instalacion de Ducto Flexible Aislado', description: 'Instalacion de ducto flexible con aislamiento termico para sistema de aire acondicionado. Incluye: ducto flexible con capa de aislamiento y barrera de vapor, conexion a difusor y plenum, cintas y abrazaderas.', unit: 'ml', basePrice: 180, categoryId: catDuct.id },
      { sku: 'DUCT-DIFUSOR', name: 'Suministro e Instalacion de Difusor de Aire', description: 'Suministro e instalacion de difusor de aire tipo cuadrangular o lineal para cielo raso. Incluye: difusor de aluminio con plenum, conexion a ducto flexible, instalacion en cielo raso, ajuste de aspas.', unit: 'pza', basePrice: 350, categoryId: catDuct.id },
      { sku: 'DUCT-REJILLA', name: 'Suministro e Instalacion de Rejilla de Retorno', description: 'Suministro e instalacion de rejilla de retorno de aire con filtro. Incluye: rejilla de aluminio o acero con filtro lavable, instalacion en muro o cielo raso, conexion a ducto de retorno.', unit: 'pza', basePrice: 300, categoryId: catDuct.id },
      { sku: 'DUCT-DAMPER', name: 'Compuerta de Regulacion de Flujo (Damper)', description: 'Suministro e instalacion de compuerta de regulacion de flujo de aire tipo damper. Incluye: damper de cuchilla opuesta con actuador manual o motorizado, instalacion en ducto, ajuste de flujo.', unit: 'pza', basePrice: 400, categoryId: catDuct.id },
      { sku: 'DUCT-CAMPANA', name: 'Fabricacion de Campana de Extraccion en Lamina Inoxidable', description: 'Fabricacion e instalacion de campana de extraccion para cocina o laboratorio en lamina de acero inoxidable. Incluye: diseno a medida, fabricacion con soldadura TIG, filtros de Grasa, instalacion y conexion a ducto de extraccion.', unit: 'pza', basePrice: 5500, categoryId: catDuct.id },
      { sku: 'DUCT-EXTRAC', name: 'Instalacion de Extractor de Aire Tipo Ventilador', description: 'Instalacion de extractor de aire tipo ventilador axial o centrifugo. Incluye: montaje en muro o ducto, conexion electrica con interruptor o timer, arranque y prueba de capacidad de extraccion.', unit: 'pza', basePrice: 1800, categoryId: catDuct.id },
      { sku: 'DUCT-LOUVER', name: 'Suministro e Instalacion de Louver o Toma de Aire Exterior', description: 'Suministro e instalacion de louver de ventilacion para toma de aire exterior. Incluye: louver de aluminio con malla protectora, instalacion en muro exterior, sello perimetral, conexion a ducto.', unit: 'pza', basePrice: 500, categoryId: catDuct.id },
      { sku: 'DUCT-AISLA', name: 'Aislamiento Termico de Ductos con Fibra de Vidrio', description: 'Aislamiento termico de ductos de aire acondicionado con fibra de vidrio. Incluye: suministro e instalacion de manta de fibra de vidrio con barrera de vapor, fijacion con clavos de impacto, cintas y selladores.', unit: 'm2', basePrice: 250, categoryId: catDuct.id },
      { sku: 'DUCT-PLENO', name: 'Fabricacion de Plenum de Lamina Galvanizada', description: 'Fabricacion e instalacion de plenum de lamina galvanizada para difusor o rejilla. Incluye: corte y armado de plenum con conexion para ducto flexible, instalacion en cielo raso, sellado de juntas.', unit: 'pza', basePrice: 380, categoryId: catDuct.id },

      // ── Refrigeracion Comercial (12) ──
      { sku: 'REFR-CFAB', name: 'Instalacion de Camara Fria Panel Sandwich Modular', description: 'Instalacion de camara de refrigeracion con panel sandwich modular. Incluye: armado de paneles, piso sanitario, puerta, unidad condensadora, evaporador, control electronico, tuberia de cobre, cableado electrico, arranque y prueba de temperatura.', unit: 'pza', basePrice: 18000, categoryId: catRefr.id },
      { sku: 'REFR-CONSERV', name: 'Instalacion de Cuarto de Conservacion (Refrigeracion)', description: 'Instalacion de cuarto de conservacion de 0 a 8 grados Celsius. Incluye: panel sandwich, puerta con cerradura, unidad condensadora de media temperatura, evaporador, control digital, tuberia, conexiones electricas, arranque y calibracion.', unit: 'pza', basePrice: 15000, categoryId: catRefr.id },
      { sku: 'REFR-CONGEL', name: 'Instalacion de Cuarto de Congelacion menor a -18 C', description: 'Instalacion de cuarto de congelacion con temperatura menor a -18 grados Celsius. Incluye: panel sandwich grueso, puerta de congelacion, unidad condensadora de baja temperatura, evaporador con resistencia de descongelamiento, control, tuberia, electrico, arranque.', unit: 'pza', basePrice: 22000, categoryId: catRefr.id },
      { sku: 'REFR-UNICOND', name: 'Instalacion de Unidad Condensadora Comercial', description: 'Instalacion de unidad condensadora comercial para refrigeracion. Incluye: montaje en base, conexion de linea de succion y liquido, filtro secador, valvula de servicio, cableado electrico, arranque y ajuste de presostato.', unit: 'pza', basePrice: 5500, categoryId: catRefr.id },
      { sku: 'REFR-EVAP', name: 'Instalacion de Evaporador Comercial', description: 'Instalacion de evaporador comercial de tiro forzado. Incluye: montaje en soporteria, conexion de linea de liquido y succion, valvula de expansion, resistencia de descongelamiento, drenaje electrico, cableado, arranque.', unit: 'pza', basePrice: 4800, categoryId: catRefr.id },
      { sku: 'REFR-VITRINA', name: 'Mantenimiento de Vitrina Refrigerada', description: 'Mantenimiento preventivo de vitrina refrigerada. Incluye: limpieza de serpentines, revision de compresor, descongelamiento, calibracion de termostato, limpieza de filtros, revision de ventiladores, reporte.', unit: 'pza', basePrice: 2500, categoryId: catRefr.id },
      { sku: 'REFR-HIELO', name: 'Mantenimiento de Maquina de Hielo', description: 'Mantenimiento preventivo de maquina de hielo. Incluye: limpieza del sistema con solucion desincrustante, reemplazo de filtro de agua, revision de ciclo de cosecha, limpieza de condensador, revision de nivel de refrigerante.', unit: 'pza', basePrice: 2200, categoryId: catRefr.id },
      { sku: 'REFR-EXPAN', name: 'Reemplazo de Valvula de Expansion Comercial', description: 'Reemplazo de valvula de expansion termostatica para sistema comercial. Incluye: diagnostico, recuperacion de refrigerante, instalacion de valvula nueva, filtro secador, vacio, carga de refrigerante, ajuste de superheat.', unit: 'pza', basePrice: 2800, categoryId: catRefr.id },
      { sku: 'REFR-PUERTA', name: 'Reparacion de Puerta de Camara Fria', description: 'Reparacion de puerta de camara fria. Incluye: ajuste de bisagras, reemplazo de empaque magnetico, reparacion de cerradura, ajuste de cierre, prueba de sellado y temperatura.', unit: 'pza', basePrice: 3500, categoryId: catRefr.id },
      { sku: 'REFR-CORTINA', name: 'Instalacion de Cortina de Aire para Camara Fria', description: 'Instalacion de cortina de aire para entrada de camara fria. Incluye: suministro e instalacion de cortina de aire de longitud segun puerta, conexion electrica, ajuste de flujo y direccion, prueba de temperatura.', unit: 'pza', basePrice: 2500, categoryId: catRefr.id },
      { sku: 'REFR-CONTROL', name: 'Reemplazo de Control Electronico de Refrigeracion', description: 'Reemplazo de control electronico de temperatura y descongelamiento. Incluye: diagnostico, retiro de control danado, instalacion de control nuevo, programacion de parametros, calibracion de sensor, prueba de ciclo.', unit: 'pza', basePrice: 2200, categoryId: catRefr.id },
      { sku: 'REFR-FUGA', name: 'Deteccion y Reparacion de Fuga en Sistema Comercial', description: 'Deteccion y reparacion de fugas de refrigerante en sistemas comerciales. Incluye: presurizacion con nitrogeno, deteccion electronica, reparacion con soldadura, filtro secador, vacio, carga de refrigerante, prueba de ciclo.', unit: 'pza', basePrice: 4500, categoryId: catRefr.id },

      // ── Calefaccion (10) ──
      { sku: 'CAL-BOMBA', name: 'Instalacion de Bomba de Calor Aire-Aire', description: 'Instalacion de bomba de calor aire-aire residencial o comercial de 1 a 5 toneladas. Incluye: montaje de unidad interior y exterior, linea refrigerante, drenaje, cableado electrico, termostato, arranque y prueba en modo calefaccion y enfriamiento.', unit: 'pza', basePrice: 6500, categoryId: catCal.id },
      { sku: 'CAL-PISO', name: 'Instalacion de Calefaccion por Piso Radiante', description: 'Instalacion de sistema de calefaccion por piso radiante hidronico. Incluye: tendido de tuberia PEX sobre malla, conexion a manifold, instalacion de caldera o bomba de calor para ACS, purga del sistema, prueba de presion.', unit: 'm2', basePrice: 600, categoryId: catCal.id },
      { sku: 'CAL-CALENT', name: 'Instalacion de Calentador de Agua de Paso', description: 'Instalacion de calentador de agua de paso (calentador instantaneo). Incluye: montaje en muro, conexion de gas, conexion hidraulica con valvulas, conexion de ventilacion, arranque y calibracion de temperatura.', unit: 'pza', basePrice: 3500, categoryId: catCal.id },
      { sku: 'CAL-CALDERA', name: 'Instalacion de Caldera de Agua Caliente', description: 'Instalacion de caldera para sistema de calefaccion hidronica o agua caliente sanitaria. Incluye: montaje, conexion hidraulica, valvulas de seguridad, conexion de gas, chimenea, termostato, arranque y ajuste de combustion.', unit: 'pza', basePrice: 8000, categoryId: catCal.id },
      { sku: 'CAL-ELECTR', name: 'Instalacion de Calefactor Electrico de Ambiente', description: 'Instalacion de calefactor electrico de ambiente tipo muro o techo. Incluye: montaje en soporteria, conexion electrica con linea dedicada y termomagnetico, termostato de ambiente, arranque y prueba.', unit: 'pza', basePrice: 1200, categoryId: catCal.id },
      { sku: 'CAL-MANT', name: 'Mantenimiento de Sistema de Calefaccion', description: 'Mantenimiento preventivo de sistema de calefaccion central. Incluye: limpieza de quemadores, revision de intercambiador de calor, medicion de eficiencia de combustion, purga de radiadores, revision de termostato, reporte.', unit: 'pza', basePrice: 3500, categoryId: catCal.id },
      { sku: 'CAL-RADIAD', name: 'Suministro e Instalacion de Radiador de Agua Caliente', description: 'Suministro e instalacion de radiador de agua caliente para calefaccion. Incluye: radiador de panel de acero, valvula termostatica, purgador automatico, soporteria, conexion hidraulica, purga y prueba.', unit: 'pza', basePrice: 2800, categoryId: catCal.id },
      { sku: 'CAL-BOMBAM', name: 'Mantenimiento de Bomba de Calor Residencial', description: 'Mantenimiento preventivo de bomba de calor residencial. Incluye: limpieza de serpentines, revision de presiones en ciclo de calefaccion y enfriamiento, medicion de COP, conexiones electricas, reporte.', unit: 'pza', basePrice: 3200, categoryId: catCal.id },
      { sku: 'CAL-TANQUE', name: 'Instalacion de Tanque de Agua Caliente con Aislamiento', description: 'Instalacion de tanque de almacenamiento de agua caliente con aislamiento termico. Incluye: montaje, conexion hidraulica con valvulas de retencion, entrada de agua fria y salida de agua caliente, valvula de seguridad, purga.', unit: 'pza', basePrice: 4500, categoryId: catCal.id },
      { sku: 'CAL-DIAG', name: 'Diagnostico de Sistema de Calefaccion', description: 'Evaluacion tecnica de sistema de calefaccion. Incluye: inspeccion de componentes, medicion de eficiencia de combustion, analisis de gases de combustion, deteccion de fugas de gas, reporte con diagnostico y recomendaciones.', unit: 'pza', basePrice: 1500, categoryId: catCal.id },

      // ── Gas Refrigerante (8) ──
      { sku: 'GAS-R410A', name: 'Suministro de Refrigerante R-410A por kg', description: 'Suministro de refrigerante R-410A virgen para recarga de sistemas HVAC. Incluye: cilindro con certificado de pureza, dosificacion con bascula electronica, registro de carga.', unit: 'kg', basePrice: 350, categoryId: catGas.id },
      { sku: 'GAS-R32', name: 'Suministro de Refrigerante R-32 por kg', description: 'Suministro de refrigerante R-32 para nuevos equipos de climatizacion. Incluye: cilindro con certificado de pureza, manguera de carga con valvula de retencion, dosificacion, registro de carga.', unit: 'kg', basePrice: 380, categoryId: catGas.id },
      { sku: 'GAS-R134', name: 'Suministro de Refrigerante R-134A por kg', description: 'Suministro de refrigerante R-134A para sistemas de refrigeracion comercial y automotriz. Incluye: cilindro de 10-50 kg con certificado de pureza, dosificacion, registro de carga.', unit: 'kg', basePrice: 450, categoryId: catGas.id },
      { sku: 'GAS-R404', name: 'Suministro de Refrigerante R-404A por kg', description: 'Suministro de refrigerante R-404A para sistemas de refrigeracion comercial de baja temperatura. Incluye: cilindro con certificado de pureza, dosificacion, registro de carga.', unit: 'kg', basePrice: 420, categoryId: catGas.id },
      { sku: 'GAS-R407C', name: 'Suministro de Refrigerante R-407C por kg', description: 'Suministro de refrigerante R-407C para equipos de climatizacion existentes. Incluye: cilindro con certificado de pureza, dosificacion en fase liquida, registro de carga.', unit: 'kg', basePrice: 380, categoryId: catGas.id },
      { sku: 'GAS-R22', name: 'Suministro de Refrigerante R-22 Reciclado por kg', description: 'Suministro de refrigerante R-22 reciclado certificado (uso controlado). Incluye: certificado de recuperacion y reciclaje, dosificacion, registro de carga y disposicion.', unit: 'kg', basePrice: 500, categoryId: catGas.id },
      { sku: 'GAS-R717', name: 'Suministro de Refrigerante Amoniaco R-717 por kg', description: 'Suministro de amoniaco anhidro R-717 para sistemas de refrigeracion industrial. Incluye: cilindro de 50 kg con certificado de pureza, manguera de carga para alta presion, procedimiento de seguridad, EPP.', unit: 'kg', basePrice: 120, categoryId: catGas.id },
      { sku: 'GAS-RECUP', name: 'Servicio de Recuperacion de Gas Refrigerante por kg', description: 'Servicio de recuperacion de gas refrigerante de sistemas HVAC. Incluye: equipo recuperador, cilindro de almacenamiento, filtracion del gas, registro de cantidad recuperada, certificado de disposicion.', unit: 'kg', basePrice: 150, categoryId: catGas.id },

      // ── Control y Automatizacion (10) ──
      { sku: 'CTRL-TERM', name: 'Instalacion de Termostato Digital Programable', description: 'Instalacion de termostato digital programable para sistema HVAC. Incluye: retiro de termostato existente, instalacion de termostato nuevo con soporte para calor/frio automatico, cableado, configuracion de programa semanal, prueba de ciclo.', unit: 'pza', basePrice: 1200, categoryId: catCtrl.id },
      { sku: 'CTRL-ZONA', name: 'Instalacion de Sistema de Control por Zonas', description: 'Instalacion de sistema de zonificacion para HVAC residencial o comercial. Incluye: panel de control maestro, compuertas motorizadas por zona, termostatos por zona, cableado de control, configuracion y calibracion.', unit: 'pza', basePrice: 3500, categoryId: catCtrl.id },
      { sku: 'CTRL-DDC', name: 'Instalacion de Control DDC para UMA', description: 'Instalacion de control directo digital (DDC) para unidad manejadora de aire. Incluye: controlador programable, sensores de temperatura y presion, actuadores de valvula, cableado de control, programacion de logica, arranque y calibracion.', unit: 'pza', basePrice: 5500, categoryId: catCtrl.id },
      { sku: 'CTRL-PLC', name: 'Programacion de PLC para Sistema HVAC', description: 'Programacion de controlador logico programable (PLC) para sistema HVAC. Incluye: diseno de logica de control en ladder o bloques, configuracion de entradas/salidas, implementacion de secuencias de operacion, pruebas en sitio.', unit: 'pza', basePrice: 8500, categoryId: catCtrl.id },
      { sku: 'CTRL-SENSOR', name: 'Instalacion de Sensor de CO2, Temperatura y Humedad', description: 'Instalacion de sensor de calidad de aire para demanda de ventilacion. Incluye: sensor de CO2, temperatura y humedad relativa, montaje en muro o ducto, cableado de alimentacion y senal, configuracion de rango, calibracion.', unit: 'pza', basePrice: 800, categoryId: catCtrl.id },
      { sku: 'CTRL-SCADA', name: 'Configuracion de SCADA/BMS Local', description: 'Configuracion de sistema SCADA o BMS para monitoreo y control de sistemas HVAC. Incluye: instalacion de software de supervision, creacion de puntos de monitoreo, configuracion de alarmas, graficos de tendencias, reportes, prueba de comunicacion.', unit: 'pza', basePrice: 12000, categoryId: catCtrl.id },
      { sku: 'CTRL-VFD', name: 'Instalacion y Programacion de Variador de Frecuencia VFD', description: 'Instalacion y programacion de variador de frecuencia (VFD) para motor HVAC. Incluye: montaje de VFD, cableado de potencia y control, parametrizacion (rampas, frenado, limites), arranque y prueba, medicion de ahorro de energia.', unit: 'pza', basePrice: 3500, categoryId: catCtrl.id },
      { sku: 'CTRL-MONITOR', name: 'Configuracion de Monitoreo Remoto para Equipos HVAC', description: 'Configuracion de gateway IoT para monitoreo remoto de equipos HVAC. Incluye: instalacion de gateway de comunicacion, configuracion de conexion a internet, alta en plataforma cloud, configuracion de alarmas por email/SMS, prueba de comunicacion.', unit: 'pza', basePrice: 4500, categoryId: catCtrl.id },
      { sku: 'CTRL-CALIB', name: 'Calibracion de Sensores e Instrumentos de Medicion', description: 'Calibracion de sensores de temperatura, presion y humedad para sistemas de control HVAC. Incluye: calibracion contra patron certificado, ajuste de offset y ganancia, certificado de calibracion trazable, etiquetado.', unit: 'pza', basePrice: 1500, categoryId: catCtrl.id },
      { sku: 'CTRL-COMUN', name: 'Instalacion de Red de Comunicacion BACnet/Modbus', description: 'Instalacion de red de comunicacion para integracion de equipos HVAC por protocolo BACnet o Modbus. Incluye: cableado de bus RS-485 o Ethernet, configuracion de IDs de dispositivos, prueba de comunicacion entre controladores, integracion con BMS.', unit: 'pza', basePrice: 3800, categoryId: catCtrl.id },

      // ── Limpieza Especializada (8) ──
      { sku: 'LIMP-EVAP', name: 'Limpieza Quimica de Serpentin Evaporador', description: 'Limpieza quimica profunda de serpentin evaporador de equipo HVAC. Incluye: aplicacion de espuma desengrasante alcalina, cepillado manual, enjuague a presion controlada, aplicacion de inhibidor de corrosion, prueba de flujo de aire.', unit: 'pza', basePrice: 2200, categoryId: catLim.id },
      { sku: 'LIMP-COND', name: 'Limpieza Quimica de Condensador', description: 'Limpieza quimica profunda de serpentin condensador de equipo HVAC. Incluye: proteccion de motores y electricos, aplicacion de acido debil o detergente, cepillado en contracorriente, enjuague a presion, aplicacion de sellador antipolvo, medicion de presiones.', unit: 'pza', basePrice: 2500, categoryId: catLim.id },
      { sku: 'LIMP-TORRE', name: 'Limpieza y Desinfeccion de Torre de Enfriamiento', description: 'Limpieza y desinfeccion de torre de enfriamiento. Incluye: drenaje del sistema, limpieza mecanica de relleno y distribuidores, limpieza de charola, desinfeccion con cloro o biocida, llenado, tratamiento quimico inicial.', unit: 'pza', basePrice: 6500, categoryId: catLim.id },
      { sku: 'LIMP-DUCTO', name: 'Limpieza de Ductos de Aire Acondicionado', description: 'Limpieza de ductos de aire acondicionado por succion. Incluye: aspiracion con equipo de alta eficiencia, cepillado mecanico de ductos, limpieza de difusores y rejillas, sanitizacion opcional, reporte fotografico antes/despues.', unit: 'm2', basePrice: 3500, categoryId: catLim.id },
      { sku: 'LIMP-SANIT', name: 'Sanitizacion de Sistema HVAC con Ozono o UV-C', description: 'Sanitizacion del sistema de climatizacion mediante generacion de ozono o lamparas UV-C. Incluye: despeje del area, generacion de ozono o activacion de UV-C en serpentines y ductos, tiempo de exposicion, ventilacion del area, verificacion de niveles seguros.', unit: 'pza', basePrice: 2800, categoryId: catLim.id },
      { sku: 'LIMP-BANDEJA', name: 'Limpieza y Desinfeccion de Bandeja de Drenaje', description: 'Limpieza y desinfeccion de bandeja de drenaje de equipo HVAC. Incluye: retiro de agua estancada, cepillado de bandeja, aplicacion de desinfectante, limpieza de linea de drenaje con presion, prueba de vertido.', unit: 'pza', basePrice: 800, categoryId: catLim.id },
      { sku: 'LIMP-FILTRO', name: 'Limpieza Profunda de Filtros de Aire por pieza', description: 'Limpieza profunda de filtros de aire lavables de equipo HVAC. Incluye: retiro de filtros, lavado con agua y detergente desengrasante, secado, inspeccion de integridad, reinstalacion.', unit: 'pza', basePrice: 150, categoryId: catLim.id },
      { sku: 'LIMP-DREN', name: 'Destape y Limpieza de Linea de Drenaje', description: 'Destape y limpieza de linea de drenaje de equipo HVAC. Incluye: aspiracion de obstruccion con equipo de vacio o soplo de CO2, lavado con agua a presion, verificacion de flujo de drenaje, aplicacion de pastilla antialgas.', unit: 'pza', basePrice: 500, categoryId: catLim.id },

      // ── Retiro y Desmontaje (8) ──
      { sku: 'RET-MSP', name: 'Retiro de Minisplit 1-2 Toneladas', description: 'Retiro de minisplit de 1 a 2 toneladas. Incluye: recuperacion de refrigerante, desconexion electrica, retiro de condensadora y evaporadora, retiro de soporteria, tapado de conexiones, carga de materiales a camion.', unit: 'pza', basePrice: 1500, categoryId: catRet.id },
      { sku: 'RET-VRF', name: 'Retiro de Sistema VRF Incluyendo Tuberia', description: 'Retiro completo de sistema VRF. Incluye: recuperacion de refrigerante, retiro de evaporadoras y condensadora, retiro de tuberia de cobre, retiro de soporteria, manejo de materiales.', unit: 'pza', basePrice: 5500, categoryId: catRet.id },
      { sku: 'RET-CHILL', name: 'Retiro de Chiller de hasta 50 TR', description: 'Retiro de chiller enfriado por aire de hasta 50 toneladas. Incluye: recuperacion de refrigerante, desconexion electrica trifasica, desconexion hidraulica, izaje con grua, carga a camion, manejo de materiales.', unit: 'pza', basePrice: 15000, categoryId: catRet.id },
      { sku: 'RET-DUCTO', name: 'Retiro de Ducteria por m2', description: 'Retiro de ducteria de lamina galvanizada de sistemas HVAC. Incluye: desconexion de difusores y rejillas, desmontaje de ductos, retiro de soporteria colgante, manejo de materiales.', unit: 'm2', basePrice: 180, categoryId: catRet.id },
      { sku: 'RET-CFRIO', name: 'Retiro de Camara Fria Panel Sandwich', description: 'Retiro de camara de refrigeracion de panel sandwich. Incluye: desmontaje de paneles, retiro de puerta, recuperacion de refrigerante, retiro de unidad condensadora y evaporador, manejo de materiales.', unit: 'pza', basePrice: 8500, categoryId: catRet.id },
      { sku: 'RET-CALDERA', name: 'Retiro de Caldera o Calentador Industrial', description: 'Retiro de caldera o calentador de agua industrial. Incluye: desconexion de gas, desconexion hidraulica, desconexion electrica, retiro de equipo, manejo de materiales.', unit: 'pza', basePrice: 4500, categoryId: catRet.id },
      { sku: 'RET-UMA', name: 'Retiro de Unidad Manejadora de Aire', description: 'Retiro de unidad manejadora de aire (UMA) de hasta 10,000 CFM. Incluye: desconexion de ductos, desconexion hidronica y electrica, retiro de la unidad, retiro de soporteria, manejo de materiales.', unit: 'pza', basePrice: 5000, categoryId: catRet.id },
      { sku: 'RET-PAQ', name: 'Retiro de Equipo de Ventana o Paquete', description: 'Retiro de equipo de ventana o paquete. Incluye: desconexion electrica, retiro del equipo del hueco o base, tapado de abertura, manejo de materiales, limpieza del area.', unit: 'pza', basePrice: 600, categoryId: catRet.id },

      // ── Diseno e Ingenieria (8) ──
      { sku: 'ING-CARGAS', name: 'Calculo de Carga Termica por Metodo CARRIER (ASHRAE)', description: 'Calculo de carga termica para diseno de sistema HVAC por el metodo CARRIER basado en ASHRAE. Incluye: visita de levantamiento, ingreso de datos de edificio, calculo de ganancias de calor, seleccion preliminar de equipos, informe.', unit: 'pza', basePrice: 6000, categoryId: catIng.id },
      { sku: 'ING-PROY', name: 'Proyecto Ejecutivo de Sistema HVAC hasta 500 m2', description: 'Elaboracion de proyecto ejecutivo de sistema de climatizacion para areas de hasta 500 m2. Incluye: memorias de calculo, planos de instalacion, especificaciones tecnicas, lista de materiales, presupuesto.', unit: 'pza', basePrice: 15000, categoryId: catIng.id },
      { sku: 'ING-PLANOS', name: 'Elaboracion de Planos de Instalacion HVAC', description: 'Elaboracion de planos arquitectonicos de instalacion HVAC. Incluye: planos de planta, cortes, detalles de instalacion, isometricos de refrigerante y drenajes, diagramas electricos y de control.', unit: 'pza', basePrice: 8500, categoryId: catIng.id },
      { sku: 'ING-MEMORIA', name: 'Memoria de Calculo y Especificaciones Tecnicas', description: 'Elaboracion de memoria de calculo completa y especificaciones tecnicas para sistema HVAC. Incluye: calculo de carga termica, seleccion de equipos, calculo de ductos y difusores, balance hidronico, especificaciones.', unit: 'pza', basePrice: 12000, categoryId: catIng.id },
      { sku: 'ING-VENT', name: 'Diseno de Sistema de Ventilacion y Extraccion', description: 'Diseno de sistema de ventilacion mecanica y extraccion de aire. Incluye: calculo de caudales segun normatividad, diseno de ducteria, seleccion de ventiladores, planos, especificaciones.', unit: 'pza', basePrice: 5500, categoryId: catIng.id },
      { sku: 'ING-CFRIO', name: 'Diseno de Camara de Refrigeracion o Congelacion', description: 'Diseno de camara de refrigeracion o congelacion para aplicacion comercial o industrial. Incluye: calculo de carga termica, seleccion de paneles, seleccion de equipos de refrigeracion, planos de planta y detalles.', unit: 'pza', basePrice: 8000, categoryId: catIng.id },
      { sku: 'ING-ENER', name: 'Diagnostico Energetico de Sistema HVAC', description: 'Diagnostico energetico de sistema de climatizacion existente. Incluye: auditoria de consumo, evaluacion de eficiencia de equipos, identificacion de oportunidades de ahorro, calculo de retorno de inversion, informe ejecutivo.', unit: 'pza', basePrice: 10000, categoryId: catIng.id },
      { sku: 'ING-ESPEC', name: 'Especificacion Tecnica para Compra de Equipos por equipo', description: 'Elaboracion de especificacion tecnica detallada para adquisicion de equipos HVAC. Incluye: requisitos de capacidad, eficiencia, refrigerante, dimensiones, conexiones, garantias, criterios de aceptacion.', unit: 'pza', basePrice: 3500, categoryId: catIng.id },

      // ── Puesta en Marcha (8) ──
      { sku: 'PM-CHILL', name: 'Puesta en Marcha de Chiller', description: 'Comisionamiento y puesta en marcha de chiller. Incluye: revision de instalacion, conexiones electricas y de control, llenado del sistema, purga de aire, arranque, ajuste de parametros, verificacion de capacidad, reporte de puesta en marcha.', unit: 'pza', basePrice: 8000, categoryId: catPm.id },
      { sku: 'PM-VRF', name: 'Puesta en Marcha de Sistema VRF/VRV', description: 'Puesta en marcha de sistema VRF/VRV. Incluye: prueba de presion con nitrogeno, vacio profundo, carga de refrigerante, configuracion de direcciones, arranque de todas las unidades, verificacion de capacidad, ajuste de parametros.', unit: 'pza', basePrice: 6500, categoryId: catPm.id },
      { sku: 'PM-UMA', name: 'Puesta en Marcha de UMA con Control DDC', description: 'Puesta en marcha de unidad manejadora de aire con control DDC. Incluye: verificacion de conexiones, secuencia de arranque, calibracion de sensores y actuadores, verificacion de puntos de control, ajuste de setpoints, reporte.', unit: 'pza', basePrice: 4500, categoryId: catPm.id },
      { sku: 'PM-CFRIO', name: 'Puesta en Marcha de Camara Fria', description: 'Puesta en marcha de camara de refrigeracion. Incluye: prueba de panel y puertas, arranque de sistema de refrigeracion, ajuste de parametros de control, verificacion de temperatura y descongelamiento, registro de ciclo, reporte.', unit: 'pza', basePrice: 5500, categoryId: catPm.id },
      { sku: 'PM-CALDERA', name: 'Puesta en Marcha de Caldera', description: 'Puesta en marcha de caldera de agua caliente. Incluye: revision de instalacion de gas, purga de aire, encendido, ajuste de combustion, analisis de gases, calibracion de temperatura de operacion, reporte de eficiencia.', unit: 'pza', basePrice: 4000, categoryId: catPm.id },
      { sku: 'PM-BOMBACAL', name: 'Puesta en Marcha de Bomba de Calor', description: 'Puesta en marcha de bomba de calor. Incluye: verificacion de instalacion, configuracion del termostato, arranque en modo enfriamiento y calefaccion, medicion de presiones y temperaturas, reporte de funcionamiento.', unit: 'pza', basePrice: 3500, categoryId: catPm.id },
      { sku: 'PM-AIRBAL', name: 'Balanceo de Aire (Aire Acondicionado y Ventilacion)', description: 'Balanceo de aire para sistema de climatizacion y ventilacion. Incluye: medicion de flujo de aire en cada difusor con anemometro, ajuste de dampers, balance de condiciones de diseno, reporte de balanceo.', unit: 'pza', basePrice: 6000, categoryId: catPm.id },
      { sku: 'PM-HIDRO', name: 'Balanceo Hidronico de Sistema de Agua Helada', description: 'Balanceo hidronico de sistema de agua helada. Incluye: verificacion de valvulas de balanceo, medicion de flujo en cada fan coil o UMA, ajuste de valvulas, balance de temperatura de diseno, reporte de balanceo.', unit: 'pza', basePrice: 5500, categoryId: catPm.id },

      // ── Eficiencia Energetica (8) ──
      { sku: 'EF-AUDIT', name: 'Auditoria Energetica Integral HVAC', description: 'Auditoria energetica completa de sistemas de climatizacion. Incluye: analisis de facturacion electrica, medicion de consumo de equipos, evaluacion de eficiencia operativa, identificacion de oportunidades de mejora, calculo de ahorros potenciales y retorno de inversion.', unit: 'pza', basePrice: 12000, categoryId: catEf.id },
      { sku: 'EF-RETRO', name: 'Analisis de Retrofit para Equipos Existentes', description: 'Analisis tecnico-economico para retrofit de equipos HVAC existentes. Incluye: evaluacion de equipos actuales, propuesta de alternativas de reemplazo, calculo de ahorros energeticos, analisis de retorno de inversion, recomendaciones.', unit: 'pza', basePrice: 7500, categoryId: catEf.id },
      { sku: 'EF-VFD', name: 'Instalacion de VFD para Ahorro Energetico en Bombas y Ventiladores', description: 'Instalacion de variador de frecuencia en bombas o ventiladores para ahorro de energia. Incluye: VFD, cableado de potencia y control, parametrizacion, arranque, medicion de ahorro vs velocidad fija, reporte.', unit: 'pza', basePrice: 8500, categoryId: catEf.id },
      { sku: 'EF-CONTROL', name: 'Optimizacion de Setpoints y Programacion de Control', description: 'Optimizacion de parametros de operacion de sistemas HVAC. Incluye: revision de programacion actual, ajuste de setpoints de temperatura, zonas de banda muerta, horarios de operacion, reporte de ahorros proyectados.', unit: 'pza', basePrice: 3500, categoryId: catEf.id },
      { sku: 'EF-FREECOOL', name: 'Implementacion de Economizador (Free Cooling)', description: 'Diseno e implementacion de sistema de free cooling o economizador. Incluye: evaluacion de viabilidad, integracion de compuertas de aire exterior, sensores de temperatura entalpia, actuadores, logica de control, puesta en marcha.', unit: 'pza', basePrice: 5500, categoryId: catEf.id },
      { sku: 'EF-REFRIG', name: 'Analisis y Optimizacion de Carga de Refrigerante', description: 'Analisis de carga de refrigerante en sistema HVAC para optimizacion. Incluye: medicion de superheat/subcooling, ajuste de carga, registro de presiones y temperaturas, reporte de eficiencia con carga optima.', unit: 'pza', basePrice: 2500, categoryId: catEf.id },
      { sku: 'EF-AISLA', name: 'Diagnostico y Mejora de Aislamiento Termico', description: 'Diagnostico de aislamiento termico en tuberias y ductos HVAC. Incluye: inspeccion visual y termografica, deteccion de puntos de perdida, propuesta de mejora, instalacion o reemplazo de aislamiento, reporte de reduccion de perdidas.', unit: 'pza', basePrice: 3000, categoryId: catEf.id },
      { sku: 'EF-REPORTE', name: 'Reporte de Linea Base y Ahorros (IPMVP)', description: 'Elaboracion de reporte de linea base de consumo y ahorros de energia segun protocolo IPMVP. Incluye: recopilacion de datos historicos, establecimiento de linea base, calculo de ahorros verificados, reporte ejecutivo.', unit: 'pza', basePrice: 8500, categoryId: catEf.id },

      // ── Obra Civil y Soporteria (10) ──
      { sku: 'OBRA-BASE', name: 'Construccion de Base de Concreto para Equipo de 1-5 TR', description: 'Construccion de base de concreto armado para equipo HVAC de 1 a 5 toneladas. Incluye: excavacion, armado de acero, cimbra, colado de concreto fc 150 kg/cm2, nivelacion, curado.', unit: 'pza', basePrice: 2500, categoryId: catObra.id },
      { sku: 'OBRA-BASECH', name: 'Construccion de Base de Concreto para Chiller', description: 'Construccion de base de concreto armado para chiller de 20 a 100 TR. Incluye: excavacion, armado de acero, cimbra, colado de concreto fc 200 kg/cm2, nivelacion de precision con nivel laser, curado.', unit: 'pza', basePrice: 8000, categoryId: catObra.id },
      { sku: 'OBRA-SOPORT', name: 'Fabricacion e Instalacion de Soporte Metalico para Condensadora', description: 'Fabricacion e instalacion de soporte metalico tipo base de acero estructural para unidad condensadora. Incluye: diseno a medida, corte y soldadura, acabado anticorrosivo, anclaje a losa con expansivas, nivelacion, ajuste.', unit: 'pza', basePrice: 3500, categoryId: catObra.id },
      { sku: 'OBRA-STRUCT', name: 'Refuerzo Estructural para Equipo de Techo', description: 'Diseno e instalacion de refuerzo estructural para montaje de equipo HVAC en techo. Incluye: calculo estructural, fabricacion de viguetas de acero, soldadura a estructura existente, prueba de carga.', unit: 'pza', basePrice: 5500, categoryId: catObra.id },
      { sku: 'OBRA-PENET', name: 'Perforacion de Losa para Paso de Tuberia y Ductos por pieza', description: 'Perforacion de losa de concreto para paso de tuberia de refrigerante, drenaje o ductos. Incluye: localizacion de acero de refuerzo, perforacion con broca de diamante, sellado perimetral con expansivo, impermeabilizacion.', unit: 'pza', basePrice: 350, categoryId: catObra.id },
      { sku: 'OBRA-ZAPATA', name: 'Construccion de Zapata o Dado de Concreto', description: 'Construccion de zapata aislada o dado de concreto para soporte de equipo HVAC. Incluye: excavacion, armado de acero, cimbra, colado, anclas niveladas, curado.', unit: 'pza', basePrice: 1800, categoryId: catObra.id },
      { sku: 'OBRA-PLACA', name: 'Placa Antivibracion y Aislamiento Sismico', description: 'Suministro e instalacion de placa antivibracion con aisladores sismicos para equipo HVAC. Incluye: placa de acero con neopreno, aisladores tipo resorte, nivelacion, prueba de aislamiento.', unit: 'pza', basePrice: 2200, categoryId: catObra.id },
      { sku: 'OBRA-IZAJE', name: 'Instalacion de Gancho de Izaje para Equipo Pesado', description: 'Fabricacion e instalacion de gancho de izaje tipo ancla quimica o expansiva para equipo HVAC pesado. Incluye: calculo de capacidad, perforacion, instalacion de ancla, prueba de carga con factor de seguridad 5:1.', unit: 'pza', basePrice: 2800, categoryId: catObra.id },
      { sku: 'OBRA-GRUA', name: 'Renta de Grua Pluma o Montacargas para Izaje de Equipo por hora', description: 'Renta de grua pluma o montacargas para izaje de equipos HVAC a azoteas. Incluye: operador, maniobras de izaje, seguros de carga, maniobras de posicionamiento.', unit: 'hora', basePrice: 1500, categoryId: catObra.id },
      { sku: 'OBRA-ANDAMIO', name: 'Renta de Andamio o Plataforma de Trabajo por dia', description: 'Renta de andamio tubular o plataforma de trabajo tipo tijera para mantenimiento e instalacion HVAC. Incluye: traslado, armado, seguro de proteccion, desarmado.', unit: 'dia', basePrice: 800, categoryId: catObra.id },
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
