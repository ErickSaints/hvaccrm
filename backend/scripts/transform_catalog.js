const fs = require('fs');
const path = require('path');

// Transform all 3 files
const files = [
  path.join(__dirname, '..', '..', 'scripts', 'catalog_import.json'),
  path.join(__dirname, '..', 'scripts', 'catalog_import.json'),
  path.join(__dirname, '..', 'public', 'catalog_import.json'),
];

for (const f of files) {
  const raw = fs.readFileSync(f, 'utf-8');
  const items = JSON.parse(raw);
  
  const transformed = items.map(item => ({
    name: item.name,
    description: item.description,
    unit: item.unit,
    category: item.category,
    basePrice: item.goodPrice ?? item.basePrice ?? null,
    costPrice: item.costPrice ?? null,
  }));

  fs.writeFileSync(f, JSON.stringify(transformed, null, 2) + '\n');
  console.log(`Transformed ${f}: ${items.length} -> ${transformed.length} items`);
}
