import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // Clean existing data in reverse dependency order
  await prisma.usedMaterial.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.serviceReport.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.maintenancePolicy.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.userSubscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const techPassword = await bcrypt.hash('tecnic0123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@hvaccrm.com',
      password: adminPassword,
      name: 'Admin Principal',
      role: 'ADMIN',
      phone: '555-0100',
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      email: 'tecnico1@hvaccrm.com',
      password: techPassword,
      name: 'Carlos Técnico',
      role: 'TECHNICIAN',
      phone: '555-0101',
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      email: 'tecnico2@hvaccrm.com',
      password: techPassword,
      name: 'María López',
      role: 'TECHNICIAN',
      phone: '555-0102',
    },
  });

  const sales = await prisma.user.create({
    data: {
      email: 'ventas@hvaccrm.com',
      password: techPassword,
      name: 'Roberto Ventas',
      role: 'SALES',
      phone: '555-0103',
    },
  });

  const customer1 = await prisma.customer.create({
    data: {
      companyName: 'Hotel Paraíso S.A.',
      contactName: 'Juan Pérez',
      email: 'juan@hotelparaiso.com',
      phone: '555-1001',
      address: 'Av. Principal 123, Colonia Centro',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '06000',
      taxId: 'HPE-123456-ABC',
      notes: 'Cliente VIP, pago puntual',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      companyName: 'Plaza Comercial del Valle',
      contactName: 'Ana García',
      email: 'ana@plazavalle.com',
      phone: '555-1002',
      address: 'Blvd. del Valle 456',
      city: 'Monterrey',
      state: 'Nuevo León',
      zipCode: '64000',
      taxId: 'PCV-789012-DEF',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      companyName: 'Hospital San Rafael',
      contactName: 'Dr. Luis Mendoza',
      email: 'lmendoza@sanrafael.com',
      phone: '555-1003',
      phone2: '555-1004',
      address: 'Calle de la Salud 789',
      city: 'Guadalajara',
      state: 'Jalisco',
      zipCode: '44100',
      taxId: 'HSR-345678-GHI',
      notes: 'Requiere atención 24/7 para áreas críticas',
    },
  });

  const equip1 = await prisma.equipment.create({
    data: {
      type: 'Chiller',
      brand: 'Carrier',
      model: '30RB-200',
      serialNumber: 'CH-2024-001',
      capacity: '200 TR',
      location: 'Sótano - Cuarto de Máquinas',
      installDate: new Date('2023-06-15'),
      lastService: new Date('2025-12-20'),
      customerId: customer1.id,
      notes: 'Equipo principal del hotel',
    },
  });

  const equip2 = await prisma.equipment.create({
    data: {
      type: 'VRF/VRV',
      brand: 'Daikin',
      model: 'VRV IV',
      serialNumber: 'VRV-2023-045',
      capacity: '48 TR',
      location: 'Azotea',
      installDate: new Date('2023-03-10'),
      lastService: new Date('2025-11-15'),
      customerId: customer2.id,
    },
  });

  const equip3 = await prisma.equipment.create({
    data: {
      type: 'Unidad Manejo de Aire',
      brand: 'Trane',
      model: 'UMA-5000',
      serialNumber: 'UMA-2022-112',
      capacity: '5000 CFM',
      location: 'Piso 3 - Cuarto Técnico',
      installDate: new Date('2022-08-20'),
      lastService: new Date('2025-10-30'),
      customerId: customer3.id,
      notes: 'Área de quirófanos - crítico',
    },
  });

  const equip4 = await prisma.equipment.create({
    data: {
      type: 'Cámara Fría',
      brand: 'Thermo King',
      model: 'TK-500',
      serialNumber: 'CF-2024-033',
      capacity: '500 m³',
      location: 'Cocina - Almacén de Alimentos',
      installDate: new Date('2024-01-05'),
      lastService: new Date('2025-12-01'),
      customerId: customer1.id,
    },
  });

  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Chiller no enfría adecuadamente',
      description: 'El chiller principal está disparando por alta presión. Temperatura de salida superior a lo normal.',
      level: 'EMERGENCIA',
      status: 'EN_PROCESO',
      customerId: customer1.id,
      equipmentId: equip1.id,
      assignedTo: tech1.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Mantenimiento preventivo VRF',
      description: 'Se requiere mantenimiento preventivo programado del sistema VRF de la plaza comercial.',
      level: 'PROGRAMAR',
      status: 'ABIERTO',
      customerId: customer2.id,
      equipmentId: equip2.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Fallo en UMA de quirófanos',
      description: 'La unidad de manejo de aire del piso 3 presenta vibraciones anormales y ruido excesivo.',
      level: 'ATENCION',
      status: 'ABIERTO',
      customerId: customer3.id,
      equipmentId: equip3.id,
    },
  });

  await prisma.quotation.create({
    data: {
      number: 'COT-202605-0001',
      title: 'Mantenimiento preventivo Chiller Carrier',
      subtotal: 25000,
      tax: 4000,
      total: 29000,
      status: 'APROBADA',
      validUntil: new Date('2026-07-23'),
      notes: 'Incluye cambio de aceite y filtros',
      terms: 'Pago a 30 días',
      customerId: customer1.id,
      createdById: sales.id,
      items: {
        create: [
          { description: 'Mantenimiento preventivo Chiller 30RB-200', quantity: 1, unitPrice: 15000, total: 15000 },
          { description: 'Cambio de aceite sintético', quantity: 2, unitPrice: 3000, total: 6000 },
          { description: 'Filtros secador', quantity: 2, unitPrice: 2000, total: 4000 },
        ],
      },
    },
  });

  await prisma.quotation.create({
    data: {
      number: 'COT-202605-0002',
      title: 'Reparación UMA Trane',
      subtotal: 18500,
      tax: 2960,
      total: 21460,
      status: 'ENVIADA',
      validUntil: new Date('2026-06-23'),
      customerId: customer3.id,
      createdById: sales.id,
      items: {
        create: [
          { description: 'Diagnóstico y reparación de vibraciones', quantity: 1, unitPrice: 8500, total: 8500 },
          { description: 'Balero de motor ventilador', quantity: 2, unitPrice: 3500, total: 7000 },
          { description: 'Correas de transmisión', quantity: 3, unitPrice: 1000, total: 3000 },
        ],
      },
    },
  });

  const policy1 = await prisma.maintenancePolicy.create({
    data: {
      number: 'POL-202605-0001',
      name: 'Póliza Premium Hotel Paraíso',
      description: 'Cobertura completa para todos los equipos del hotel',
      frequency: 'TRIMESTRAL',
      visitCount: 4,
      pricePerVisit: 8500,
      totalPrice: 34000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVA',
      customerId: customer1.id,
    },
  });

  const policy2 = await prisma.maintenancePolicy.create({
    data: {
      number: 'POL-202605-0002',
      name: 'Póliza Básica Hospital San Rafael',
      description: 'Mantenimiento semestral para UMA',
      frequency: 'SEMESTRAL',
      visitCount: 2,
      pricePerVisit: 12000,
      totalPrice: 24000,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2027-02-28'),
      status: 'ACTIVA',
      customerId: customer3.id,
    },
  });

  const serviceOrder = await prisma.serviceOrder.create({
    data: {
      number: 'ORD-202605-0001',
      description: 'Atención a emergencia - Chiller sobrecalentado',
      scheduledDate: new Date('2026-05-23'),
      status: 'EN_PROGRESO',
      customerId: customer1.id,
      equipmentId: equip1.id,
      assignedTo: tech1.id,
      ticketId: ticket1.id,
    },
  });

  await prisma.serviceOrder.create({
    data: {
      number: 'ORD-202605-0002',
      description: 'Revisión programada VRF Daikin',
      scheduledDate: new Date('2026-06-01'),
      status: 'PENDIENTE',
      customerId: customer2.id,
      equipmentId: equip2.id,
      assignedTo: tech2.id,
    },
  });

  await prisma.serviceReport.create({
    data: {
      title: 'Reporte de Servicio - Chiller Carrier',
      description: 'Atención a emergencia por sobrecalentamiento',
      diagnosis: 'Condensador obstruido con suciedad, presión alta detectada',
      workPerformed: 'Limpieza de condensador, revisión de refrigerante, ajuste de presostato',
      recommendations: 'Programar limpieza trimestral de condensador',
      arrivalTime: '08:30',
      departureTime: '12:45',
      signature: 'Juan Pérez - Recibido',
      serviceOrderId: serviceOrder.id,
      technicianId: tech1.id,
      customerId: customer1.id,
      equipmentId: equip1.id,
      photos: {
        create: [
          { url: '/uploads/chiller-antes.jpg', caption: 'Condensador antes de limpieza', type: 'ANTES' },
          { url: '/uploads/chiller-despues.jpg', caption: 'Condensador después de limpieza', type: 'DESPUES' },
        ],
      },
      usedMaterials: {
        create: [
          { name: 'Desengrasante industrial', quantity: 2, unitPrice: 250, total: 500 },
          { name: 'Refrigerante R-134a (kg)', quantity: 5, unitPrice: 450, total: 2250 },
        ],
      },
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      description: 'Visita trimestral 1 - Mantenimiento preventivo',
      scheduledDate: new Date('2026-04-15'),
      completedDate: new Date('2026-04-15'),
      status: 'COMPLETADO',
      policyId: policy1.id,
      equipmentId: equip1.id,
      assignedTo: tech1.id,
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      description: 'Visita trimestral 2 - Mantenimiento preventivo',
      scheduledDate: new Date('2026-07-15'),
      status: 'PENDIENTE',
      policyId: policy1.id,
      equipmentId: equip1.id,
      assignedTo: tech1.id,
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      description: 'Mantenimiento semestral UMA',
      scheduledDate: new Date('2026-06-01'),
      status: 'PENDIENTE',
      policyId: policy2.id,
      equipmentId: equip3.id,
      assignedTo: tech2.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log('');
  const planMensual = await prisma.subscriptionPlan.create({
    data: {
      name: 'Plan Mensual',
      description: 'Acceso completo al CRM por mes. Ideal para técnicos independientes.',
      price: 299,
      duration: 'MENSUAL',
      durationDays: 30,
      features: 'Gestión de clientes, tickets, cotizaciones, reportes, pólizas',
      active: true,
      createdById: admin.id,
    },
  });

  const planAnual = await prisma.subscriptionPlan.create({
    data: {
      name: 'Plan Anual',
      description: 'Acceso completo al CRM por un año. Ahorra 2 meses vs el plan mensual.',
      price: 2990,
      duration: 'ANUAL',
      durationDays: 365,
      features: 'Todo lo del plan mensual + soporte prioritario + respaldo en la nube',
      active: true,
      createdById: admin.id,
    },
  });

  console.log('');
  console.log('Credentials:');
  console.log('  Admin:     admin@hvaccrm.com / admin123');
  console.log('  Technician: tecnico1@hvaccrm.com / tecnic0123');
  console.log('  Sales:     ventas@hvaccrm.com / tecnic0123');
  console.log('  Plans:     Mensual ($299/mes), Anual ($2990/año)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
