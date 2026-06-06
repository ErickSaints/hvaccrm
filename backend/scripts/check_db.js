const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cats = await prisma.pricebookCategory.findMany();
  console.log('Categories:', cats.length);
  cats.forEach(c => console.log(`  [${c.id}] ${c.name}`));
  const count = await prisma.pricebookItem.count();
  console.log('Total items:', count);
  await prisma.$disconnect();
}
main();
