const { execSync } = require('child_process');

async function startup() {
  console.log('[startup] Running Prisma db push...');
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit', cwd: __dirname });
    console.log('[startup] Database schema synced.');
  } catch (err) {
    console.error('[startup] Prisma db push failed, trying to continue:', err.message);
  }

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('[startup] Database empty, seeding...');
      try {
        execSync('npx tsx src/seed.ts', { stdio: 'inherit', cwd: __dirname });
        console.log('[startup] Seed completed.');
      } catch (seedErr) {
        console.error('[startup] Seed failed, continuing:', seedErr.message);
      }
    } else {
      console.log(`[startup] Database has ${userCount} users, skipping seed.`);
      // Ensure PROFESIONAL plans exist for existing databases
      try {
        const adminUser = await prisma.user.findFirst({ where: { isSuperAdmin: true }, orderBy: { id: 'asc' } });
        if (adminUser) {
          const existingProfPlans = await prisma.subscriptionPlan.count({ where: { targetRole: 'PROFESIONAL' } });
          if (existingProfPlans === 0) {
            console.log('[startup] Creating PROFESIONAL subscription plans...');
            await prisma.subscriptionPlan.createMany({
              data: [
                {
                  name: 'Plan Mensual Profesional',
                  description: 'Acceso completo al CRM para profesionales. Ideal para técnicos y contratistas.',
                  price: 499,
                  duration: 'MENSUAL',
                  durationDays: 30,
                  features: 'Gestión de clientes, tickets, cotizaciones, reportes, pólizas, equipos, dashboard',
                  targetRole: 'PROFESIONAL',
                  active: true,
                  createdById: adminUser.id,
                },
                {
                  name: 'Plan Anual Profesional',
                  description: 'Acceso completo al CRM por un año. Ahorra 2 meses vs el plan mensual profesional.',
                  price: 4990,
                  duration: 'ANUAL',
                  durationDays: 365,
                  features: 'Todo lo del plan mensual profesional + soporte prioritario + respaldo en la nube + reportes avanzados',
                  targetRole: 'PROFESIONAL',
                  active: true,
                  createdById: adminUser.id,
                },
              ],
            });
            console.log('[startup] PROFESIONAL plans created.');
          } else {
            console.log(`[startup] ${existingProfPlans} PROFESIONAL plans already exist, skipping.`);
          }
        }
      } catch (migrateErr) {
        console.error('[startup] Failed to create PROFESIONAL plans:', migrateErr.message);
      }
    }
    await prisma.$disconnect();
  } catch (err) {
    console.error('[startup] Database check failed, continuing:', err.message);
  }

  console.log('[startup] Done. Starting server...');
}

startup();
