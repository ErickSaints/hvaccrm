import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function startup() {
  const [userCount, planCount] = await Promise.all([
    prisma.user.count(),
    prisma.subscriptionPlan.count(),
  ]);

  console.log(`[startup] users=${userCount} plans=${planCount}`);

  // Always ensure subscription plans exist (required for registration)
  if (planCount === 0) {
    console.log('[startup] Plans missing — creating default plans...');
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
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: 'Plan Mensual',
          description: 'Acceso completo al CRM por mes. Ideal para técnicos independientes.',
          price: 299,
          duration: 'MENSUAL',
          durationDays: 30,
          features: 'Gestión de clientes, tickets, cotizaciones, reportes, pólizas',
          active: true,
          createdById: admin.id,
        },
        {
          name: 'Plan Anual',
          description: 'Acceso completo al CRM por un año. Ahorra 2 meses vs el plan mensual.',
          price: 2990,
          duration: 'ANUAL',
          durationDays: 365,
          features: 'Todo lo del plan mensual + soporte prioritario + respaldo en la nube',
          active: true,
          createdById: admin.id,
        },
      ],
    });
    console.log('[startup] Default plans created.');
  }

  // Seed demo users if none exist
  if (userCount === 0) {
    console.log('[startup] Users missing — running seed...');
    await import('./seed');
  } else {
    console.log('[startup] Users exist — skipping full seed.');
  }

  await prisma.$disconnect();
  console.log('[startup] Done.');
}

startup();
