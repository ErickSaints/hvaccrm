const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'public', 'catalog_import.json');
const items = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Map JSON categories to pricebookData category keys
const CAT_MAP = {
  'Soportería y Estructurales': 'catObra',
  'Calefacción': 'catCal',
  'Refrigeración Comercial': 'catRefr',
  'Ventilación y Extracción': 'catVent',
  'Tubería de Cobre y Conexiones': 'catCobre',
  'Herramientas y Equipo de Servicio': 'catHerram',
  'Mantto Preventivo': 'catMant',
  'Mantto Correctivo': 'catMant',
  'Reemplazo Componentes': 'catRep',
  'Gas Refrigerante': 'catGas',
  'Instalación Equipos': 'catInst',
  'Chiller (APU Reales)': 'catInst',
  'Ductería': 'catDuct',
  'Instalación Eléctrica': 'catInst',
  'Igualas y Pólizas': 'catMant',
  'Jornales y MO': 'catObra',
  'Centralizado Completo': 'catInst',
};

// New categories to add
const NEW_CATEGORIES = [
  { key: 'catVent', name: 'Ventilación y Extracción', sortOrder: 17, description: 'Sistemas de ventilacion mecanica, extraccion y calidad de aire' },
  { key: 'catCobre', name: 'Tubería de Cobre y Conexiones', sortOrder: 18, description: 'Tuberia de cobre, conexiones, valvulas y aislamiento termico' },
  { key: 'catHerram', name: 'Herramientas y Equipo de Servicio', sortOrder: 19, description: 'Herramientas especializadas y equipo para servicio HVAC' },
];

// Category name to key mapping for new categories
const CAT_KEY_MAP = {
  'catVent': 'VN',
  'catCobre': 'CB',
  'catHerram': 'HR',
};

function generateSku(categoryKey, name, index) {
  const prefix = CAT_KEY_MAP[categoryKey] || Object.keys(CAT_MAP).find(k => CAT_MAP[k] === categoryKey)?.substring(0, 3).toUpperCase() || 'XX';
  const safe = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15).toUpperCase();
  return `${prefix}-${safe}-${index}`;
}

// Generate ItemDef entries
const generated = [];

items.forEach((item, idx) => {
  const catKey = CAT_MAP[item.category];
  if (!catKey) {
    console.log(`Skipping unknown category: ${item.category} -> ${item.name}`);
    return;
  }
  
  const sku = generateSku(catKey, item.name, idx);
  const price = item.basePrice || item.goodPrice || 0;
  const cost = item.costPrice || Math.round(price * 0.6);
  
  generated.push({
    sku,
    name: item.name,
    description: item.description || `Producto para HVAC: ${item.name}`,
    unit: item.unit || 'pza',
    basePrice: price,
    costPrice: cost,
    categoryKey: catKey,
    volumeTiers: [{ minQty: 1, discountPct: 0 }, { minQty: 5, discountPct: 5 }, { minQty: 10, discountPct: 8 }, { minQty: 20, discountPct: 12 }],
  });
});

console.log(`\n// New categories to add:`);
console.log(`// ${JSON.stringify(NEW_CATEGORIES)}`);
console.log(`\n// Generated ${generated.length} items for pricebookData.ts`);
console.log(`\n// Sample first 3 items:`);
generated.slice(0, 3).forEach(i => console.log(`//   ${i.sku}: ${i.name} (${i.categoryKey}) $${i.basePrice}`));

// Count by category
const byCat = {};
generated.forEach(i => {
  byCat[i.categoryKey] = (byCat[i.categoryKey] || 0) + 1;
});
console.log(`\n// By category:`);
Object.entries(byCat).sort((a,b) => a[0].localeCompare(b[0])).forEach(([k,v]) => console.log(`//   ${k}: ${v}`));
