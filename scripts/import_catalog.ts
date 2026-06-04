const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(__dirname, 'catalog_import.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  let created = 0;
  let skipped = 0;

  for (const item of data) {
    let category = await prisma.pricebookCategory.findFirst({
      where: { name: item.category, active: true },
    });
    if (!category) {
      category = await prisma.pricebookCategory.create({
        data: { name: item.category, sortOrder: 0 },
      });
      console.log(`  Created category: ${item.category}`);
    }

    const existing = await prisma.pricebookItem.findFirst({
      where: { name: item.name, categoryId: category.id, active: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const sku = `${item.category.substring(0, 3).toUpperCase()}-${Date.now()}-${created}`;

    await prisma.pricebookItem.create({
      data: {
        sku,
        name: item.name,
        description: item.description || '',
        unit: item.unit || 'pza',
        basePrice: item.basePrice || item.goodPrice,
        costPrice: item.costPrice,
        categoryId: category.id,
      },
    });
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped (duplicates): ${skipped}, Total: ${data.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
