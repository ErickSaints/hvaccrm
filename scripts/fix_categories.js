const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'backend', 'scripts', 'catalog_import.json'), 'utf8'));

// ─── 1. Fix category names ──────────────────────────────────────────────
const catRenames = {
  'Sin Categoria': null,              // will assign based on content
  'Instalación Equipos': 'Instalacion Equipos',  // merge accents
  'Eficiencia Energetica': 'Eficiencia Energética',
  'Igualas y Polizas': 'Igualas y Pólizas',
  'Planes de Mantenimiento': 'Pólizas de Mantenimiento',  // upgrade
  'Polizas de Mantenimiento': 'Pólizas de Mantenimiento',  // fix accent
  'Instrumentacion': 'Instrumentación',
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

// ─── 3. Fix orthografía (tildes y mayúsculas) ──────────────────────────
let orthoFixes = 0;
const ORTHO_REPLACEMENTS = [
  // Palabras comunes sin tilde → con tilde
  [/\bInstalacion\b/g, 'Instalación'],
  [/\binstalacion\b/g, 'instalación'],
  [/\bElectrico\b/g, 'Eléctrico'],
  [/\belectrico\b/g, 'eléctrico'],
  [/\bElectricos\b/g, 'Eléctricos'],
  [/\belectricos\b/g, 'eléctricos'],
  [/\bElectrica\b/g, 'Eléctrica'],
  [/\belectrica\b/g, 'eléctrica'],
  [/\bElectricas\b/g, 'Eléctricas'],
  [/\belectricas\b/g, 'eléctricas'],
  [/\bPoliza\b/g, 'Póliza'],
  [/\bpoliza\b/g, 'póliza'],
  [/\bPolizas\b/g, 'Pólizas'],
  [/\bpolizas\b/g, 'pólizas'],
  [/\bBasico\b/g, 'Básico'],
  [/\bbasico\b/g, 'básico'],
  [/\bEstandar\b/g, 'Estándar'],
  [/\bestandar\b/g, 'estándar'],
  [/\bPremium\b/g, 'Premium'],  // es correcto así
  [/\bRevision\b/g, 'Revisión'],
  [/\brevision\b/g, 'revisión'],
  [/\bConexion\b/g, 'Conexión'],
  [/\bconexion\b/g, 'conexión'],
  [/\bConexiones\b/g, 'Conexiones'],
  [/\bconexiones\b/g, 'conexiones'],
  [/\bPresion\b/g, 'Presión'],
  [/\bpresion\b/g, 'presión'],
  [/\bValvula\b/g, 'Válvula'],
  [/\bvalvula\b/g, 'válvula'],
  [/\bValvulas\b/g, 'Válvulas'],
  [/\bvalvulas\b/g, 'válvulas'],
  [/\bValvuleria\b/g, 'Válvulería'],
  [/\bvalvuleria\b/g, 'válvulería'],
  [/\bValvulería\b/g, 'Válvulería'],
  [/\bvalvulería\b/g, 'válvulería'],
  [/\bTuberia\b/g, 'Tubería'],
  [/\btuberia\b/g, 'tubería'],
  [/\bSoporteria\b/g, 'Soportería'],
  [/\bsoporteria\b/g, 'soportería'],
  [/\bQuimico\b/g, 'Químico'],
  [/\bquimico\b/g, 'químico'],
  [/\bQuimica\b/g, 'Química'],
  [/\bquimica\b/g, 'química'],
  [/\bElectronico\b/g, 'Electrónico'],
  [/\belectronico\b/g, 'electrónico'],
  [/\bElectronica\b/g, 'Electrónica'],
  [/\belectronica\b/g, 'electrónica'],
  [/\bHidraulico\b/g, 'Hidráulico'],
  [/\bhidraulico\b/g, 'hidráulico'],
  [/\bHidraulica\b/g, 'Hidráulica'],
  [/\bhidraulica\b/g, 'hidráulica'],
  [/\bHidraulicas\b/g, 'Hidráulicas'],
  [/\bhidraulicas\b/g, 'hidráulicas'],
  [/\bCimentacion\b/g, 'Cimentación'],
  [/\bcimentacion\b/g, 'cimentación'],
  [/\bFuncionamiento\b/g, 'Funcionamiento'],
  [/\bfuncionamiento\b/g, 'funcionamiento'],
  [/\bTermostato\b/g, 'Termostato'],
  [/\btermostato\b/g, 'termostato'],
  [/\bAislante\b/g, 'Aislante'],
  [/\baislante\b/g, 'aislante'],
  [/\bAislamiento\b/g, 'Aislamiento'],
  [/\baislamiento\b/g, 'aislamiento'],
  [/\bDrenaje\b/g, 'Drenaje'],
  [/\bdrenaje\b/g, 'drenaje'],
  [/\bRefrigerante\b/g, 'Refrigerante'],
  [/\brefrigerante\b/g, 'refrigerante'],
  [/\bCondensadora\b/g, 'Condensadora'],
  [/\bcondensadora\b/g, 'condensadora'],
  [/\bCondensador\b/g, 'Condensador'],
  [/\bcondensador\b/g, 'condensador'],
  [/\bEvaporadora\b/g, 'Evaporadora'],
  [/\bevaporadora\b/g, 'evaporadora'],
  [/\bEvaporador\b/g, 'Evaporador'],
  [/\bevaporador\b/g, 'evaporador'],
  [/\bCompresor\b/g, 'Compresor'],
  [/\bcompresor\b/g, 'compresor'],
  [/\bCapacitor\b/g, 'Capacitor'],
  [/\bcapacitor\b/g, 'capacitor'],
  [/\bMontaje\b/g, 'Montaje'],
  [/\bmontaje\b/g, 'montaje'],
  [/\bMantenimiento\b/g, 'Mantenimiento'],
  [/\bmantenimiento\b/g, 'mantenimiento'],
  [/\bCorrectivo\b/g, 'Correctivo'],
  [/\bcorrectivo\b/g, 'correctivo'],
  [/\bPreventivo\b/g, 'Preventivo'],
  [/\bpreventivo\b/g, 'preventivo'],
  [/\bDiagnostico\b/g, 'Diagnóstico'],
  [/\bdiagnostico\b/g, 'diagnóstico'],
  [/\bSanitizacion\b/g, 'Sanitización'],
  [/\bsanitizacion\b/g, 'sanitización'],
  [/\bHermeticidad\b/g, 'Hermeticidad'],
  [/\bhermeticidad\b/g, 'hermeticidad'],
  [/\bEstanqueidad\b/g, 'Estanqueidad'],
  [/\bestanqueidad\b/g, 'estanqueidad'],
  [/\bComisionamiento\b/g, 'Comisionamiento'],
  [/\bcomisionamiento\b/g, 'comisionamiento'],
  [/\bProgramacion\b/g, 'Programación'],
  [/\bprogramacion\b/g, 'programación'],
  [/\bConfiguracion\b/g, 'Configuración'],
  [/\bconfiguracion\b/g, 'configuración'],
  [/\bCalibracion\b/g, 'Calibración'],
  [/\bcalibracion\b/g, 'calibración'],
  [/\bVerificacion\b/g, 'Verificación'],
  [/\bverificacion\b/g, 'verificación'],
  [/\bDeteccion\b/g, 'Detección'],
  [/\bdeteccion\b/g, 'detección'],
  [/\bRecuperacion\b/g, 'Recuperación'],
  [/\brecuperacion\b/g, 'recuperación'],
  [/\bReparacion\b/g, 'Reparación'],
  [/\breparacion\b/g, 'reparación'],
  [/\bLubricacion\b/g, 'Lubricación'],
  [/\blubricacion\b/g, 'lubricación'],
  [/\bAlineacion\b/g, 'Alineación'],
  [/\balineacion\b/g, 'alineación'],
  [/\bNivelacion\b/g, 'Nivelación'],
  [/\bnivelacion\b/g, 'nivelación'],
  [/\bOperacion\b/g, 'Operación'],
  [/\boperacion\b/g, 'operación'],
  [/\bSuccion\b/g, 'Succión'],
  [/\bsuccion\b/g, 'succión'],
  [/\bDescarga\b/g, 'Descarga'],
  [/\bdescarga\b/g, 'descarga'],
  [/\bSellado\b/g, 'Sellado'],
  [/\bsellado\b/g, 'sellado'],
  [/\bArmado\b/g, 'Armado'],
  [/\barmado\b/g, 'armado'],
  [/\bPrueba\b/g, 'Prueba'],
  [/\bprueba\b/g, 'prueba'],
];

data.forEach(item => {
  // Fix name
  if (item.name) {
    let fixed = item.name;
    ORTHO_REPLACEMENTS.forEach(([re, replacement]) => { fixed = fixed.replace(re, replacement); });
    if (fixed !== item.name) { item.name = fixed; orthoFixes++; }
  }
  // Fix description
  if (item.description) {
    let fixed = item.description;
    ORTHO_REPLACEMENTS.forEach(([re, replacement]) => { fixed = fixed.replace(re, replacement); });
    if (fixed !== item.description) { item.description = fixed; orthoFixes++; }
  }
});
if (orthoFixes > 0) console.log('Orthography fixes:', orthoFixes);

// ─── 4. Fix negative prices that may remain ─────────────────────────────
let negFixes = 0;
data.forEach(item => {
  if (item.basePrice != null && item.basePrice < 0) { item.basePrice = Math.abs(item.basePrice); negFixes++; }
  if (item.costPrice != null && item.costPrice < 0) { item.costPrice = Math.abs(item.costPrice); negFixes++; }
});
console.log('Negative price fixes:', negFixes);

// ─── 5. Dedup by name again ─────────────────────────────────────────────
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

// ─── 6. Sort ────────────────────────────────────────────────────────────
deduped.sort((a, b) => {
  const ca = (a.category || '');
  const cb = (b.category || '');
  if (ca !== cb) return ca.localeCompare(cb);
  return (a.name || '').localeCompare(b.name || '');
});

// ─── 7. Write ───────────────────────────────────────────────────────────
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
