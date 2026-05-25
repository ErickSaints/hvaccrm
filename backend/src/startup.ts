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
  const existingUsers = await prisma.user.findMany({ where: { role: { in: ['TECHNICIAN', 'SALES'] } } });
  if (existingUsers.length < 3) {
    const needed = [
      { email: 'tecnico1@hvaccrm.com', name: 'Carlos Técnico', role: 'TECHNICIAN' as const, phone: '555-0101' },
      { email: 'tecnico2@hvaccrm.com', name: 'María López', role: 'TECHNICIAN' as const, phone: '555-0102' },
      { email: 'ventas@hvaccrm.com', name: 'Roberto Ventas', role: 'SALES' as const, phone: '555-0103' },
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

  await prisma.$disconnect();
  console.log('[startup] Listo.');
}

startup();
