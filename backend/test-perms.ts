import { PrismaClient } from '@prisma/client';
import { getPermissionsForRole } from './src/permissions';

const prisma = new PrismaClient();

async function main() {
  for (const role of ['ADMIN', 'TECHNICIAN', 'SALES', 'PROYECTOS', 'COMPRAS'] as const) {
    const effective = new Set(getPermissionsForRole(role));
    const overrides = await prisma.rolePermission.findMany({
      where: { role },
      select: { permission: true, allowed: true }
    });
    for (const o of overrides) {
      if (o.allowed) effective.add(o.permission);
      else effective.delete(o.permission);
    }
    console.log(`\n=== ${role} (${effective.size} permissions) ===`);
    console.log([...effective].sort().join(', '));
  }
  await prisma.$disconnect();
}
main();
