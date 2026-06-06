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
    if (!item.name || !item.category) {
      console.warn('Skipping invalid item:', JSON.stringify(item).slice(0, 100));
      skipped++;
      continue;
    }

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
      await prisma.pricebookItem.update({
        where: { id: existing.id },
        data: {
          description: item.description || '',
          unit: item.unit || 'pza',
          basePrice: item.basePrice ?? null,
          costPrice: item.costPrice ?? null,
        },
      });
      skipped++;
    } else {
      const sku = `${item.category.substring(0, 3).toUpperCase()}-${Date.now()}-${created}`;
      await prisma.pricebookItem.create({
        data: {
          sku,
          name: item.name,
          description: item.description || '',
          unit: item.unit || 'pza',
          basePrice: item.basePrice ?? null,
          costPrice: item.costPrice ?? null,
          categoryId: category.id,
        },
      });
      created++;
    }
  }

  console.log(`\nImport complete: ${created} created, ${skipped} updated/skipped (total ${items.length})`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Import failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
