const { execSync } = require('child_process');

async function startup() {
  console.log('[startup] Running Prisma db push...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit', cwd: __dirname });

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('[startup] Database empty, seeding...');
    execSync('npx tsx src/seed.ts', { stdio: 'inherit', cwd: __dirname });
  } else {
    console.log(`[startup] Database has ${userCount} users, skipping seed.`);
  }

  await prisma.$disconnect();
  console.log('[startup] Done. Starting server...');
}

startup();
