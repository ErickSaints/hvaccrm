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
    }
    await prisma.$disconnect();
  } catch (err) {
    console.error('[startup] Database check failed, continuing:', err.message);
  }

  console.log('[startup] Done. Starting server...');
}

startup();
