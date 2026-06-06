const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'backend', 'scripts', 'catalog_import.json'), 'utf8'));

// ─── 1. Fix category names ──────────────────────────────────────────────
const catRenames = {
  'Sin Categoria': null,              // will assign based on content
  'Instalación Equipos': 'Instalacion Equipos',  // merge accents
  'Eficiencia Energetica': 'Eficiencia Energética',
  'Igualas y Polizas': 'Igualas y Pólizas',
  'Instrumentacion': 'Instrumentación',
  // Also fix any remaining category variant issues from the old encodings
};

// Count changes
let catChanges = 0;
data.forEach(item => {
  const cat = item.category;
  if (!cat || cat === 'Sin Categoria') {
    // Assign based on item name
    const name = item.name || '';
    // These are clearly corrective
    const correctivo = ['Cambio ', 'Reemplazo ', 'Reparacion ', 'Destapar ',
      'Recuperacion ', 'Carga de gas', 'Sellado ', 'Vacio ', 'Prueba ',
      'Correccion ', 'Deteccion ', 'Limpieza de drenaje', 'Limpieza de intercambiador',
      'Limpieza de quemadores', 'Limpieza quimica', 'Mantenimiento de presostato'];
    const preventivo = ['Limpieza profunda', 'Limpieza de filtros', 'Limpieza de condensadora',
      'Limpieza de fan coil', 'Limpieza de cassette', 'Diagnostico ',
      'Revision ', 'Balanceo ', 'Analisis ', 'Aislamiento '];
    
    if (correctivo.some(p => name.startsWith(p))) {
      item.category = 'Mantto Correctivo';
    } else if (preventivo.some(p => name.startsWith(p))) {
      item.category = 'Mantto Preventivo';
    } else if (name.includes('Aislamiento')) {
      item.category = 'Aislamiento Térmico';
    } else if (name.includes('Actualizacion') || name.includes('Programacion')) {
      item.category = 'Mantto Correctivo';
    } else {
      // Default: check if it sounds corrective or preventive
      const lower = name.toLowerCase();
      if (lower.includes('reemplaz') || lower.includes('cambio ') || lower.includes('repar') ||
          lower.includes('fuga') || lower.includes('firmware') || lower.includes('voltaje') ||
          lower.includes('carga de gas') || lower.includes('destap') || lower.includes('vacio ') ||
          lower.includes('deteccion')) {
        item.category = 'Mantto Correctivo';
      } else {
        item.category = 'Mantto Preventivo';
      }
    }
    catChanges++;
  } else if (catRenames[cat]) {
    item.category = catRenames[cat];
    catChanges++;
  }
});

// Merge duplicate categories after rename
const catsAfter = [...new Set(data.map(i => i.category))].sort();
console.log('Categories after rename:', catsAfter.length);
console.log('Category changes:', catChanges);

// ─── 2. Fix items with desc/bp fields instead of description/basePrice ──
let fieldFixes = 0;
data.forEach(item => {
  // Fix old-style fields from serviciosMantto/serviciosCorrectivos
  if (item.desc && !item.description) { item.description = item.desc; delete item.desc; fieldFixes++; }
  if (item.bp != null && item.basePrice == null) { item.basePrice = item.bp; delete item.bp; fieldFixes++; }
  if (item.u && !item.unit) { item.unit = item.u; delete item.u; fieldFixes++; }
  // Fix items with no costPrice but have basePrice
  if (item.basePrice != null && item.costPrice == null) {
    item.costPrice = Math.round(item.basePrice * 0.55);
    fieldFixes++;
  }
  // Fix items with undefined basePrice
  if (item.basePrice === undefined) item.basePrice = null;
  if (item.costPrice === undefined) item.costPrice = null;
});
console.log('Field fixes:', fieldFixes);

// ─── 3. Fix negative prices that may remain ─────────────────────────────
let negFixes = 0;
data.forEach(item => {
  if (item.basePrice != null && item.basePrice < 0) { item.basePrice = Math.abs(item.basePrice); negFixes++; }
  if (item.costPrice != null && item.costPrice < 0) { item.costPrice = Math.abs(item.costPrice); negFixes++; }
});
console.log('Negative price fixes:', negFixes);

// ─── 4. Dedup by name again ─────────────────────────────────────────────
const seen = new Map();
const deduped = [];
data.forEach(item => {
  const key = (item.name || '').toUpperCase().trim();
  if (seen.has(key)) {
    const existing = seen.get(key);
    const existingScore = (existing.basePrice != null ? 1 : 0) + (existing.description ? existing.description.length : 0);
    const newScore = (item.basePrice != null ? 1 : 0) + (item.description ? item.description.length : 0);
    if (newScore >= existingScore) {
      const idx = deduped.indexOf(existing);
      deduped[idx] = item;
      seen.set(key, item);
    }
  } else {
    seen.set(key, item);
    deduped.push(item);
  }
});
console.log('After dedup:', deduped.length, '(removed', data.length - deduped.length, ')');

// ─── 5. Sort ────────────────────────────────────────────────────────────
deduped.sort((a, b) => {
  const ca = (a.category || '');
  const cb = (b.category || '');
  if (ca !== cb) return ca.localeCompare(cb);
  return (a.name || '').localeCompare(b.name || '');
});

// ─── 6. Write ───────────────────────────────────────────────────────────
const output = JSON.stringify(deduped, null, 2);
['backend/scripts/catalog_import.json', 'scripts/catalog_import.json', 'backend/public/catalog_import.json'].forEach(loc => {
  fs.writeFileSync(path.join(__dirname, '..', loc), output, 'utf8');
  console.log('Written to:', loc);
});

console.log('Total items:', deduped.length);

// Verify
const cats = [...new Set(deduped.map(i => i.category))].sort();
cats.forEach(c => {
  const count = deduped.filter(i => i.category === c).length;
  const withPrice = deduped.filter(i => i.category === c && i.basePrice != null).length;
  const min = Math.min(...deduped.filter(i => i.category === c && i.basePrice != null).map(i => i.basePrice));
  const max = Math.max(...deduped.filter(i => i.category === c && i.basePrice != null).map(i => i.basePrice));
  console.log('  [' + count + '] ' + c + ' ($' + min + ' - $' + max + ', ' + withPrice + ' con precio)');
});
