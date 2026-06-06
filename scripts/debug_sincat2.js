const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backend/scripts/catalog_import.json', 'utf8'));
const sinCat = data.filter(i => i.category === 'Sin Categoria');
console.log('Sin Categoria items:', sinCat.length);
const keys = new Set();
sinCat.forEach(function(item) {
  Object.keys(item).forEach(function(k) { keys.add(k); });
  console.log('Keys:', [...Object.keys(item)].join(', '));
  console.log('  desc:', item.desc);
  console.log('  description:', item.description);
  console.log('  bp:', item.bp);
  console.log('  basePrice:', item.basePrice);
  console.log('---');
});
