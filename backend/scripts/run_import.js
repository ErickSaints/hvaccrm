const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(__dirname, '..', 'public', 'catalog_import.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('ERROR: catalog_import.json not found at', jsonPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const items = JSON.parse(raw);
  let created = 0;
  let skipped = 0;

  for (const item of items) {
    let category = await prisma.pricebookCategory.findFirst({
      where: { name: item.category, active: true },
    });
    if (!category) {
      category = await prisma.pricebookCategory.create({
        data: { name: item.category, sortOrder: 0 },
      });
    }

    const existing = await prisma.pricebookItem.findFirst({
      where: { name: item.name, categoryId: category.id, active: true },
    });

    if (existing) {
      await prisma.pricebookItem.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          unit: item.unit,
          goodPrice: item.goodPrice,
          betterPrice: item.betterPrice,
          bestPrice: item.bestPrice,
          costPrice: item.costPrice,
          categoryId: category.id,
        },
      });
      skipped++;
    } else {
      await prisma.pricebookItem.create({
        data: {
          name: item.name,
          description: item.description,
          unit: item.unit,
          goodPrice: item.goodPrice,
          betterPrice: item.betterPrice,
          bestPrice: item.bestPrice,
          costPrice: item.costPrice,
          categoryId: category.id,
        },
      });
      created++;
    }
  }

  console.log(`Import complete: ${created} created, ${skipped} updated/skipped`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Import failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
