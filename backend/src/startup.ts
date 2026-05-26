import prisma from './prisma';
import bcrypt from 'bcryptjs';

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
      },
    });
  }
  return admin;
}

async function ensurePlans(adminId: number) {
  const count = await prisma.subscriptionPlan.count();
  if (count > 0) return;
  console.log('[startup] Creando planes de suscripción...');
  await prisma.subscriptionPlan.createMany({
    data: [
      { name: 'Plan Mensual', description: 'Acceso completo al CRM por mes. Ideal para técnicos independientes.', price: 299, duration: 'MENSUAL', durationDays: 30, features: 'Gestión de clientes, tickets, cotizaciones, reportes, pólizas', active: true, createdById: adminId },
      { name: 'Plan Anual', description: 'Acceso completo al CRM por un año. Ahorra 2 meses vs el plan mensual.', price: 2990, duration: 'ANUAL', durationDays: 365, features: 'Todo lo del plan mensual + soporte prioritario + respaldo en la nube', active: true, createdById: adminId },
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
    for (const u of needed) {
      const exists = existingUsers.find((eu) => eu.email === u.email);
      if (!exists) {
        await prisma.user.create({ data: { ...u, password: techPassword } });
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
    await prisma.catalogMaterial.createMany({
      data: [
        // SOPORTERÍA
        { description: 'Canaleta galvanizada 2x2 m', category: 'Soportería', unit: 'pza' },
        { description: 'Canaleta galvanizada 3x3 m', category: 'Soportería', unit: 'pza' },
        { description: 'Perfil angular 1/4" x 6m', category: 'Soportería', unit: 'pza' },
        { description: 'Perfil angular 3/8" x 6m', category: 'Soportería', unit: 'pza' },
        { description: 'Solera galvanizada 1/8" x 6m', category: 'Soportería', unit: 'pza' },
        { description: 'Viga IPR 6" x 6m', category: 'Soportería', unit: 'pza' },
        { description: 'Abrazadera para ducto redondo 6"', category: 'Soportería', unit: 'pza' },
        { description: 'Abrazadera para ducto redondo 8"', category: 'Soportería', unit: 'pza' },
        { description: 'Abrazadera para ducto redondo 10"', category: 'Soportería', unit: 'pza' },
        { description: 'Abrazadera para ducto redondo 12"', category: 'Soportería', unit: 'pza' },
        { description: 'Anclaje expansivo 3/8"', category: 'Soportería', unit: 'pza' },
        { description: 'Anclaje expansivo 1/2"', category: 'Soportería', unit: 'pza' },
        { description: 'Tornillo galvanizado 1/4" x 1"', category: 'Soportería', unit: 'pza' },
        { description: 'Tornillo galvanizado 3/8" x 1.5"', category: 'Soportería', unit: 'pza' },
        { description: 'Rondana plana 1/4"', category: 'Soportería', unit: 'pza' },
        { description: 'Rondana de presión 3/8"', category: 'Soportería', unit: 'pza' },
        { description: 'Taquete plástico 1/4" con tornillo', category: 'Soportería', unit: 'pza' },
        { description: 'Soporte tipo "L" para minisplit', category: 'Soportería', unit: 'pza' },
        { description: 'Base antivibración para condensadora', category: 'Soportería', unit: 'pza' },
        { description: 'Aislante de caucho para tubería 1/2"', category: 'Soportería', unit: 'm' },
        // DUCTERÍA
        { description: 'Ducto rectangular galvanizado cal. 24', category: 'Ductería', unit: 'm²' },
        { description: 'Ducto rectangular galvanizado cal. 26', category: 'Ductería', unit: 'm²' },
        { description: 'Ducto rectangular galvanizado cal. 22', category: 'Ductería', unit: 'm²' },
        { description: 'Ducto redondo helicoidal 6"', category: 'Ductería', unit: 'm' },
        { description: 'Ducto redondo helicoidal 8"', category: 'Ductería', unit: 'm' },
        { description: 'Ducto redondo helicoidal 10"', category: 'Ductería', unit: 'm' },
        { description: 'Ducto redondo helicoidal 12"', category: 'Ductería', unit: 'm' },
        { description: 'Ducto redondo helicoidal 14"', category: 'Ductería', unit: 'm' },
        { description: 'Codo ducto rectangular 90°', category: 'Ductería', unit: 'pza' },
        { description: 'Codo ducto redondo 90° 6"', category: 'Ductería', unit: 'pza' },
        { description: 'Codo ducto redondo 90° 8"', category: 'Ductería', unit: 'pza' },
        { description: 'Codo ducto redondo 90° 10"', category: 'Ductería', unit: 'pza' },
        { description: 'Codo ducto redondo 90° 12"', category: 'Ductería', unit: 'pza' },
        { description: 'Reducción concéntrica ducto 8"-6"', category: 'Ductería', unit: 'pza' },
        { description: 'Reducción excéntrica ducto 10"-8"', category: 'Ductería', unit: 'pza' },
        { description: 'Yee ducto rectangular', category: 'Ductería', unit: 'pza' },
        { description: 'Compuerta de regulación manual 8"', category: 'Ductería', unit: 'pza' },
        { description: 'Compuerta cortafuego 12"', category: 'Ductería', unit: 'pza' },
        { description: 'Tornillo autorroscante #8 x 1/2"', category: 'Ductería', unit: 'pza' },
        { description: 'Remache pop 1/8"', category: 'Ductería', unit: 'pza' },
        { description: 'Cinta de aluminio para ductos 50m', category: 'Ductería', unit: 'rollo' },
        { description: 'Cemento PVC para ductería 1/4"', category: 'Ductería', unit: 'lt' },
        // REJILLAS Y DIFUSORES
        { description: 'Rejilla de retorno 12x12"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Rejilla de retorno 16x16"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Rejilla de retorno 20x20"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Rejilla de suministro 12x6"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Rejilla de suministro 16x8"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Rejilla de suministro 20x10"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Rejilla de piso 24x6"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Difusor circular 8"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Difusor circular 10"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Difusor circular 12"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Difusor cuadrado 12x12"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Difusor cuadrado 16x16"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Difusor lineal 24x2"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Difusor lineal 48x4"', category: 'Rejillas y Difusores', unit: 'pza' },
        { description: 'Tornillo para rejilla 1/4"', category: 'Rejillas y Difusores', unit: 'pza' },
        // AISLAMIENTOS
        { description: 'Aislante térmico fibra de vidrio 1/2"', category: 'Aislamientos', unit: 'm²' },
        { description: 'Aislante térmico fibra de vidrio 1"', category: 'Aislamientos', unit: 'm²' },
        { description: 'Aislante térmico fibra de vidrio 2"', category: 'Aislamientos', unit: 'm²' },
        { description: 'Aislante tubular elastomérico 1/2" x 3/8"', category: 'Aislamientos', unit: 'm' },
        { description: 'Aislante tubular elastomérico 3/4" x 1/2"', category: 'Aislamientos', unit: 'm' },
        { description: 'Aislante tubular elastomérico 1" x 3/4"', category: 'Aislamientos', unit: 'm' },
        { description: 'Aislante tubular elastomérico 1.5" x 1"', category: 'Aislamientos', unit: 'm' },
        { description: 'Aislante en rollo polietileno 1/4"', category: 'Aislamientos', unit: 'm²' },
        { description: 'Aislante en rollo polietileno 3/8"', category: 'Aislamientos', unit: 'm²' },
        { description: 'Adhesivo para aislante elastomérico 1L', category: 'Aislamientos', unit: 'lt' },
        { description: 'Adhesivo para fibra de vidrio 1L', category: 'Aislamientos', unit: 'lt' },
        { description: 'Cinta para aislamiento 50m', category: 'Aislamientos', unit: 'rollo' },
        { description: 'Recubrimiento aluminio para ducto exterior', category: 'Aislamientos', unit: 'm²' },
        { description: 'Malla de fibra de vidrio para recubrimiento', category: 'Aislamientos', unit: 'm²' },
        // HERRAMIENTAS
        { description: 'Juego de llaves Allen métricas', category: 'Herramientas', unit: 'juego' },
        { description: 'Juego de dados 1/4" a 1"', category: 'Herramientas', unit: 'juego' },
        { description: 'Llave combinada 1/2"', category: 'Herramientas', unit: 'pza' },
        { description: 'Llave combinada 9/16"', category: 'Herramientas', unit: 'pza' },
        { description: 'Llave combinada 5/8"', category: 'Herramientas', unit: 'pza' },
        { description: 'Llave combinada 3/4"', category: 'Herramientas', unit: 'pza' },
        { description: 'Llave Stillson 14"', category: 'Herramientas', unit: 'pza' },
        { description: 'Llave Stillson 18"', category: 'Herramientas', unit: 'pza' },
        { description: 'Desarmador plano 1/4" x 6"', category: 'Herramientas', unit: 'pza' },
        { description: 'Desarmador Phillips #2 x 6"', category: 'Herramientas', unit: 'pza' },
        { description: 'Pin de corte 8"', category: 'Herramientas', unit: 'pza' },
        { description: 'Pin de electricista 8"', category: 'Herramientas', unit: 'pza' },
        { description: 'Alicate de presión 10"', category: 'Herramientas', unit: 'pza' },
        { description: 'Martillo de bola 16 oz', category: 'Herramientas', unit: 'pza' },
        { description: 'Marro 8 lb', category: 'Herramientas', unit: 'pza' },
        { description: 'Taladro percutor 1/2"', category: 'Herramientas', unit: 'pza' },
        { description: 'Broca para metal 1/4"', category: 'Herramientas', unit: 'pza' },
        { description: 'Broca para metal 3/8"', category: 'Herramientas', unit: 'pza' },
        { description: 'Broca para metal 1/2"', category: 'Herramientas', unit: 'pza' },
        { description: 'Broca para concreto 1/4"', category: 'Herramientas', unit: 'pza' },
        { description: 'Broca para concreto 3/8"', category: 'Herramientas', unit: 'pza' },
        { description: 'Esmeril angular 4.5"', category: 'Herramientas', unit: 'pza' },
        { description: 'Disco de corte para metal 4.5"', category: 'Herramientas', unit: 'pza' },
        { description: 'Disco de desbaste 4.5"', category: 'Herramientas', unit: 'pza' },
        { description: 'Nivel de mano 24"', category: 'Herramientas', unit: 'pza' },
        { description: 'Cinta métrica 5m', category: 'Herramientas', unit: 'pza' },
        { description: 'Manómetro de refrigeración (juego)', category: 'Herramientas', unit: 'juego' },
        { description: 'Detector de fugas de refrigerante', category: 'Herramientas', unit: 'pza' },
        { description: 'Termómetro infrarrojo', category: 'Herramientas', unit: 'pza' },
        { description: 'Pinza amperimétrica', category: 'Herramientas', unit: 'pza' },
        { description: 'Multímetro digital', category: 'Herramientas', unit: 'pza' },
        { description: 'Bomba de vacío 4 CFM', category: 'Herramientas', unit: 'pza' },
        { description: 'Manguera de carga de refrigerante 60"', category: 'Herramientas', unit: 'pza' },
        { description: 'Válvula de servicio para refrigerante', category: 'Herramientas', unit: 'pza' },
        { description: 'Cortador de tubo de cobre 1/8"-1.5"', category: 'Herramientas', unit: 'pza' },
        { description: 'Expansor de tubo de cobre 3/8"-7/8"', category: 'Herramientas', unit: 'pza' },
        { description: 'Doblador de tubo de cobre 1/4"-5/8"', category: 'Herramientas', unit: 'pza' },
        { description: 'Soldadura estaño-plata para cobre', category: 'Herramientas', unit: 'pza' },
        { description: 'Flux para soldadura de cobre 1/4L', category: 'Herramientas', unit: 'lt' },
        { description: 'Soplete de gas propano', category: 'Herramientas', unit: 'pza' },
        { description: 'Tanque de nitrógeno para prueba', category: 'Herramientas', unit: 'pza' },
        { description: 'Regulador de nitrógeno', category: 'Herramientas', unit: 'pza' },
        // REFRIGERANTES
        { description: 'Refrigerante R-22 (kg)', category: 'Refrigerantes', unit: 'kg' },
        { description: 'Refrigerante R-410A (kg)', category: 'Refrigerantes', unit: 'kg' },
        { description: 'Refrigerante R-32 (kg)', category: 'Refrigerantes', unit: 'kg' },
        { description: 'Refrigerante R-134a (kg)', category: 'Refrigerantes', unit: 'kg' },
        { description: 'Refrigerante R-404A (kg)', category: 'Refrigerantes', unit: 'kg' },
        { description: 'Refrigerante R-507 (kg)', category: 'Refrigerantes', unit: 'kg' },
        { description: 'Refrigerante R-407C (kg)', category: 'Refrigerantes', unit: 'kg' },
        { description: 'Refrigerante R-1234yf (kg)', category: 'Refrigerantes', unit: 'kg' },
        { description: 'Aceite para compresor POE 1L', category: 'Refrigerantes', unit: 'lt' },
        { description: 'Aceite para compresor mineral 1L', category: 'Refrigerantes', unit: 'lt' },
        { description: 'Colorante para detección de fugas', category: 'Refrigerantes', unit: 'pza' },
        // TUBERÍA Y CONEXIONES
        { description: 'Tubería de cobre recocido 1/4" x 15m', category: 'Tubería y Conexiones', unit: 'rollo' },
        { description: 'Tubería de cobre recocido 3/8" x 15m', category: 'Tubería y Conexiones', unit: 'rollo' },
        { description: 'Tubería de cobre recocido 1/2" x 15m', category: 'Tubería y Conexiones', unit: 'rollo' },
        { description: 'Tubería de cobre recocido 5/8" x 15m', category: 'Tubería y Conexiones', unit: 'rollo' },
        { description: 'Tubería de cobre recocido 3/4" x 15m', category: 'Tubería y Conexiones', unit: 'rollo' },
        { description: 'Tubería de cobre rígido 1/2" x 6m', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Tubería de cobre rígido 3/4" x 6m', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Tubería de cobre rígido 1" x 6m', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Tubería PVC 1/2" x 6m', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Tubería PVC 3/4" x 6m', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Tubería PVC 1" x 6m', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Tubería PVC 2" x 6m', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Codo de cobre 1/4"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Codo de cobre 3/8"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Codo de cobre 1/2"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Codo de cobre 5/8"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Codo de cobre 3/4"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Tuerca unión de cobre 1/4"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Tuerca unión de cobre 3/8"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Tuerca unión de cobre 1/2"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Válvula de bola de cobre 1/4"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Válvula de bola de cobre 3/8"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Válvula de bola de cobre 1/2"', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Válvula de expansión termostática', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Filtro secador de línea', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Mirilla de refrigerante', category: 'Tubería y Conexiones', unit: 'pza' },
        { description: 'Silenciador de línea de succión', category: 'Tubería y Conexiones', unit: 'pza' },
        // EQUIPO DE PROTECCIÓN
        { description: 'Casco de seguridad', category: 'Equipo de Protección', unit: 'pza' },
        { description: 'Lentes de seguridad', category: 'Equipo de Protección', unit: 'pza' },
        { description: 'Guantes de carnaza', category: 'Equipo de Protección', unit: 'par' },
        { description: 'Guantes de hule', category: 'Equipo de Protección', unit: 'par' },
        { description: 'Guantes dieléctricos', category: 'Equipo de Protección', unit: 'par' },
        { description: 'Arnés de seguridad', category: 'Equipo de Protección', unit: 'pza' },
        { description: 'Línea de vida retráctil', category: 'Equipo de Protección', unit: 'pza' },
        { description: 'Respirador para vapores', category: 'Equipo de Protección', unit: 'pza' },
        { description: 'Mascarilla N95', category: 'Equipo de Protección', unit: 'caja' },
        { description: 'Tapones auditivos', category: 'Equipo de Protección', unit: 'caja' },
        // ELÉCTRICO
        { description: 'Cable THW #10 (100m)', category: 'Eléctrico', unit: 'rollo' },
        { description: 'Cable THW #12 (100m)', category: 'Eléctrico', unit: 'rollo' },
        { description: 'Cable THW #14 (100m)', category: 'Eléctrico', unit: 'rollo' },
        { description: 'Cable THW #8 (100m)', category: 'Eléctrico', unit: 'rollo' },
        { description: 'Breaker 1 polo 20A', category: 'Eléctrico', unit: 'pza' },
        { description: 'Breaker 2 polos 30A', category: 'Eléctrico', unit: 'pza' },
        { description: 'Breaker 2 polos 60A', category: 'Eléctrico', unit: 'pza' },
        { description: 'Arrancador magnético 1-3 HP', category: 'Eléctrico', unit: 'pza' },
        { description: 'Contactor 25A 3 polos', category: 'Eléctrico', unit: 'pza' },
        { description: 'Capacitor de arranque 35/5 uF', category: 'Eléctrico', unit: 'pza' },
        { description: 'Capacitor de arranque 45/5 uF', category: 'Eléctrico', unit: 'pza' },
        { description: 'Capacitor permanente 5 uF', category: 'Eléctrico', unit: 'pza' },
        { description: 'Capacitor permanente 7.5 uF', category: 'Eléctrico', unit: 'pza' },
        { description: 'Interruptor termomagnético 3 polos 30A', category: 'Eléctrico', unit: 'pza' },
        { description: 'Interruptor termomagnético 3 polos 60A', category: 'Eléctrico', unit: 'pza' },
        { description: 'Relevador de estado sólido SSR', category: 'Eléctrico', unit: 'pza' },
        { description: 'Sensor de temperatura (termopar)', category: 'Eléctrico', unit: 'pza' },
        { description: 'Sensor de presión de refrigerante', category: 'Eléctrico', unit: 'pza' },
        { description: 'Tablero eléctrico metálico 12 espacios', category: 'Eléctrico', unit: 'pza' },
        { description: 'Canaleta ranurada 1"', category: 'Eléctrico', unit: 'm' },
        { description: 'Cable de control 18 AWG (100m)', category: 'Eléctrico', unit: 'rollo' },
      ],
    });
    console.log('[startup] Catálogo de materiales creado.');
  }

  await prisma.$disconnect();
  console.log('[startup] Listo.');
}

startup();
