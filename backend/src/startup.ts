import { execSync } from 'child_process';
import prisma from './prisma';

async function startup() {
  console.log('[startup] Running Prisma db push...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('[startup] Database empty, seeding...');
    execSync('npx tsx src/seed.ts', { stdio: 'inherit' });
  } else {
    console.log(`[startup] Database has ${userCount} users, skipping seed.`);
  }

  await prisma.$disconnect();
  console.log('[startup] Done. Starting server...');
}

startup();
