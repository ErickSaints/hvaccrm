const fs = require('fs');
let raw = fs.readFileSync('backend/scripts/catalog_import.json','utf8').replace(/^\uFEFF/,'');
const data = JSON.parse(raw);
const cats = {};
data.forEach(i => { if (!cats[i.category]) cats[i.category] = 0; cats[i.category]++ });
console.log('Total items:', data.length);
console.log('Categories:');
Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  '+k+': '+v));
const names = data.map(i => i.name);
const dups = names.filter((n,i) => names.indexOf(n) !== i);
console.log('Duplicate names:', new Set(dups).size);
const nullBase = data.filter(i => i.basePrice === null || i.basePrice === undefined);
console.log('Items with null basePrice:', nullBase.length);
const cheap = data.filter(i => i.basePrice && i.basePrice < 50);
console.log('Items under $50:', cheap.length);
// Show a few sample items
console.log('\nSample items:');
data.slice(0,3).forEach(i => console.log(JSON.stringify(i)));
// Show some cheap items
if (cheap.length > 0) {
  console.log('\nCheap items sample:');
  cheap.slice(0,5).forEach(i => console.log(i.name, i.basePrice, i.category, i.unit));
}
// Show all unique units
const units = new Set(data.map(i => i.unit));
console.log('\nUnits used:', [...units].join(', '));
