const { categories, items } = require('../src/pricebookData');
console.log('Categories:', categories.length);
categories.forEach(c => console.log(`  [${c.key}] ${c.name}`));
console.log('Items:', items.length);
