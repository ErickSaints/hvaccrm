const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backend/scripts/catalog_import.json', 'utf8'));
const sinCat = data.filter(i => i.category === 'Sin Categoria');
console.log('Sin Categoria items:', sinCat.length);
sinCat.forEach(i => {
  console.log('  ' + i.name + ' | ' + (i.category || 'null') + ' | ' + i.basePrice);
});
