import prisma from './prisma';

async function startup() {
  const [userCount, planCount] = await Promise.all([
    prisma.user.count(),
    prisma.subscriptionPlan.count(),
  ]);

  if (userCount === 0 || planCount === 0) {
    console.log(`[startup] users=${userCount} plans=${planCount} — running seed...`);
    await import('./seed');
  } else {
    console.log(`[startup] users=${userCount} plans=${planCount} — skipping seed.`);
  }

  await prisma.$disconnect();
  console.log('[startup] Done. Starting server...');
}

startup();
