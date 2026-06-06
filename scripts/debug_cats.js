const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backend/scripts/catalog_import.json', 'utf8'));
const noCat = data.filter(i => !i.category);
console.log('Items without category:', noCat.length);
noCat.slice(0, 20).forEach(i => console.log('  -', i.name, '|', (i.description || '').substring(0, 60)));

const cats = [...new Set(data.map(i => i.category))].sort();
console.log('\nAll categories:');
cats.forEach(c => {
  const cnt = data.filter(i => i.category === c).length;
  console.log('  [' + cnt + '] ' + JSON.stringify(c));
});
