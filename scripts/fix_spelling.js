const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'backend', 'scripts', 'catalog_import.json'), 'utf8'));

const accentFixes = {
  'acidos': 'ácidos', 'almacn': 'almacén', 'amperimetrica': 'amperimétrica',
  'amperimtrica': 'amperimétrica', 'anemometro': 'anemómetro',
  'antivibracion': 'antivibración', 'area': 'área', 'argén': 'argón',
  'arnes': 'arnés', 'arns': 'arnés', 'automatica': 'automática',
  'automatizacion': 'automatización', 'automítica': 'automática',
  'bao': 'baño', 'basica': 'básica', 'biologicos': 'biológicos',
  'bíscula': 'báscula', 'bísico': 'básico', 'calculo': 'cálculo',
  'calefaccion': 'calefacción', 'camara': 'cámara', 'categoria': 'categoría',
  'caidas': 'caídas', 'centrifuga': 'centrífuga', 'centrifugo': 'centrífugo',
  'ceramica': 'cerámica', 'cerímica': 'cerámica', 'cimentacion': 'cimentación',
  'cinturon': 'cinturón', 'comunicacion': 'comunicación',
  'configuracion': 'configuración', 'conexion': 'conexión',
  'construccion': 'construcción', 'coordinacion': 'coordinación',
  'corrosion': 'corrosión', 'definicion': 'definición',
  'dehumidificacion': 'dehumidificación', 'deteccion': 'detección',
  'diagnostico': 'diagnóstico', 'dilatacion': 'dilatación',
  'direccion': 'dirección', 'diseno': 'diseño',
  'diametro': 'diámetro', 'diímetro': 'diámetro', 'dobble': 'doble',
  'ducteria': 'ductería', 'dia': 'día', 'ductil': 'dúctil',
  'econemico': 'económico', 'elaboracion': 'elaboración',
  'elastomerico': 'elastomérico', 'elastomrica': 'elastomérica',
  'elastomrico': 'elastomérico', 'elctrica': 'eléctrica',
  'elctricas': 'eléctricas', 'elctrico': 'eléctrico', 'elctricos': 'eléctricos',
  'electrica': 'eléctrica', 'electricas': 'eléctricas', 'electrico': 'eléctrico',
  'electrnica': 'electrónica', 'electrénica': 'electrónica',
  'electrénico': 'electrónico', 'elístico': 'elástico',
  'energia': 'energía', 'ergonomico': 'ergonómico',
  'ergonémico': 'ergonómico', 'estao': 'estaño', 'estatica': 'estática',
  'estandar': 'estándar', 'estíndar': 'estándar', 'estítica': 'estática',
  'evacuacion': 'evacuación', 'excavacion': 'excavación',
  'expansion': 'expansión', 'extension': 'extensión', 'extraccion': 'extracción',
  'fabricacion': 'fabricación', 'facturacion': 'facturación',
  'flexometro': 'flexómetro', 'fosforo': 'fósforo',
  'frigorifico': 'frigorífico', 'galon': 'galón', 'garantia': 'garantía',
  'generacion': 'generación', 'generico': 'genérico',
  'geotrmico': 'geotérmico', 'grua': 'grúa',
  'hidraulica': 'hidráulica', 'hidraulicos': 'hidráulicos',
  'hidrostaticas': 'hidrostáticas', 'hidrostíticas': 'hidrostáticas',
  'hidronica': 'hidrónica', 'iluminacion': 'iluminación',
  'implementacion': 'implementación', 'impulsion': 'impulsión',
  'ingenieria': 'ingeniería', 'inmersion': 'inmersión',
  'inspeccion': 'inspección', 'instalacion': 'instalación',
  'integracion': 'integración', 'inversion': 'inversión',
  'isometricos': 'isométricos', 'lamina': 'lámina',
  'licitacion': 'licitación', 'linea': 'línea', 'liquido': 'líquido',
  'lmpara': 'lámpara', 'logica': 'lógica', 'lumenes': 'lúmenes',
  'lümina': 'lámina', 'límina': 'lámina', 'límpara': 'lámpara',
  'magnetico': 'magnético', 'magntico': 'magnético',
  'magnetica': 'magnética', 'mamposteria': 'mampostería',
  'manometro': 'manómetro', 'manémetro': 'manómetro',
  'mecanico': 'mecánico', 'mecínico': 'mecánico', 'medicion': 'medición',
  'medicón': 'medición', 'megohmetro': 'megóhmetro',
  'metalico': 'metálico', 'metrica': 'métrica', 'metílica': 'metálica',
  'miliamperimetro': 'miliamperímetro', 'modulo': 'módulo',
  'monofasico': 'monofásico', 'mosqueton': 'mosquetón',
  'mtrica': 'métrica', 'mtricas': 'métricas', 'multimetro': 'multímetro',
  'multiproposito': 'multipropósito', 'maquinas': 'máquinas',
  'médulo': 'módulo', 'míquina': 'máquina',
  'multiples': 'múltiples', 'ncleo': 'núcleo',
  'nitrogeno': 'nitrógeno', 'nivelacion': 'nivelación',
  'opcion': 'opción', 'operacion': 'operación', 'optimizacion': 'optimización',
  'organicos': 'orgánicos', 'oxiacetilnica': 'oxiacetilénica',
  'oxigeno': 'oxígeno', 'particulas': 'partículas',
  'parametro': 'parámetro', 'pelicula': 'película',
  'pequea': 'pequeña', 'pequeo': 'pequeño', 'pequeos': 'pequeños',
  'perforacion': 'perforación', 'perifrica': 'periférica',
  'piezomtrico': 'piezométrico', 'plastico': 'plástico',
  'portatil': 'portátil', 'precision': 'precisión',
  'presentacion': 'presentación', 'presion': 'presión',
  'presurizacion': 'presurización', 'programacion': 'programación',
  'proteccion': 'protección', 'rapida': 'rápida',
  'recuperacion': 'recuperación', 'reduccion': 'reducción',
  'refrigeracion': 'refrigeración', 'regulacion': 'regulación',
  'reposicion': 'reposición', 'retractil': 'retráctil',
  'revision': 'revisión', 'rigido': 'rígido',
  'seleccion': 'selección', 'separacion': 'separación',
  'serpentin': 'serpentín', 'sesion': 'sesión',
  'senalizacion': 'señalización', 'sifen': 'sifón',
  'simulacion': 'simulación', 'sobrepresion': 'sobrepresión',
  'solido': 'sólido', 'sonometro': 'sonómetro',
  'soporteria': 'soportería', 'succion': 'succión',
  'supervision': 'supervisión', 'silice': 'sílice',
  'tacometro': 'tacómetro', 'tamao': 'tamaño', 'tapon': 'tapón',
  'tcnica': 'técnica', 'tcnico': 'técnico',
  'telescopico': 'telescópico', 'terceria': 'tercería',
  'termico': 'térmico', 'termografica': 'termográfica',
  'termografia': 'termografía', 'termogrífica': 'termográfica',
  'termomagnetica': 'termomagnética', 'termomagntico': 'termomagnético',
  'termometro': 'termómetro', 'termémetro': 'termómetro',
  'termostatica': 'termostática', 'termostítica': 'termostática',
  'teorica': 'teórica', 'tornilleria': 'tornillería',
  'torquimetro': 'torquímetro', 'transicion': 'transición',
  'trifasico': 'trifásico', 'trifísico': 'trifásico',
  'trmica': 'térmica', 'trmico': 'térmico', 'tripode': 'trípode',
  'tuberia': 'tubería', 'tactil': 'táctil',
  'ultrasonico': 'ultrasónico', 'ultrasénico': 'ultrasónico',
  'vacio': 'vacío', 'vacuometro': 'vacuómetro',
  'valvula': 'válvula', 'ventilacion': 'ventilación',
  'verificacion': 'verificación', 'vinilica': 'vinílica',
  'vision': 'visión', 'vàlvula': 'válvula', 'vastago': 'vástago',
  'via': 'vía', 'vílvula': 'válvula', 'vílvulas': 'válvulas',
  'optico': 'óptico', 'optima': 'óptima',
  'perdidas': 'pérdidas', 'poliza': 'póliza', 'quimicos': 'químicos',
  'aplicacion': 'aplicación', 'atencion': 'atención',
  'atenuacion': 'atenuación', 'atmosferico': 'atmosférico',
  'auditoria': 'auditoría', 'bateria': 'batería',
  'baterias': 'baterías', 'bimetalico': 'bimetálico',
  'calibracion': 'calibración', 'capacitacion': 'capacitación',
  'certificacion': 'certificación', 'cogeneracion': 'cogeneración',
  'concentrica': 'concéntrica', 'dielctricas': 'dieléctricas',
  'dielctricos': 'dieléctricos', 'dielectricas': 'dieléctricas',
  'electronicas': 'electrónicas', 'estandar': 'estándar',
  'frecuencia': 'frecuencia', 'historicos': 'históricos',
  'isometricos': 'isométricos', 'lineal': 'lineal',
  'mesofilos': 'mesófilos', 'multimetro': 'multímetro',
  'nivelacion': 'nivelación', 'opcion': 'opción',
  'optimizacion': 'optimización', 'parametro': 'parámetro',
  'pelicula': 'película', 'piezomtrico': 'piezométrico',
  'piton': 'pitón', 'plafon': 'plafón',
  'recomendacion': 'recomendación', 'rociador': 'rociador',
  'secuenciacion': 'secuenciación',
  'silenciador': 'silenciador', 'solenoide': 'solenoide',
  'supresor': 'supresor', 'temporizada': 'temporizada',
  'temporizador': 'temporizador', 'termopar': 'termopar',
  'variador': 'variador',
};

const sortedWrong = Object.keys(accentFixes).sort((a, b) => b.length - a.length);

function fixText(str) {
  if (!str) return str;
  let result = str;
  sortedWrong.forEach(wrong => {
    const right = accentFixes[wrong];
    if (right) {
      const regex = new RegExp('\\b' + wrong + '\\b', 'gi');
      result = result.replace(regex, match => {
        if (match[0] === match[0].toUpperCase() && match !== match.toUpperCase()) {
          return right.charAt(0).toUpperCase() + right.slice(1);
        }
        if (match === match.toUpperCase() && match.length > 1) {
          return right.toUpperCase();
        }
        return right;
      });
    }
  });
  return result;
}

const specificFixes = [
  [/desague/gi, 'desagüe'],
  [/desage/gi, 'desagüe'],
  [/absorvedor/gi, 'absorbedor'],
  [/antiempanio/gi, 'antiempañio'],
  [/tcaudal/gi, 'T+caudal'],
  [/silicén/gi, 'silicon'],
  [/sealamiento/gi, 'señalamiento'],
  [/rele\b/gi, 'relé'],
  [/reles\b/gi, 'relés'],
  [/autoraladrante/gi, 'autotaladrante'],
  [/cocina\b/gi, 'cocina'],
  [/piscina\b/gi, 'piscina'],
];

// Count fields fixed
let fixCount = 0;
data.forEach((item) => {
  ['name', 'description', 'category', 'unit'].forEach(field => {
    if (item[field]) {
      const old = item[field];
      let val = fixText(item[field]);
      specificFixes.forEach(([pattern, replacement]) => {
        val = val.replace(pattern, replacement);
      });
      item[field] = val;
      if (item[field] !== old) {
        fixCount++;
      }
    }
  });
});

const output = JSON.stringify(data, null, 2);
['backend/scripts/catalog_import.json', 'scripts/catalog_import.json', 'backend/public/catalog_import.json'].forEach(loc => {
  fs.writeFileSync(path.join(__dirname, '..', loc), output, 'utf8');
});
console.log('Fields fixed:', fixCount);
console.log('Total items:', data.length);

// Verify: extract all words and check for remaining issues
const allWords = new Set();
data.forEach(item => {
  (item.name + ' ' + (item.description || '') + ' ' + item.category + ' ' + (item.unit || '')).split(/[\s,;()\/\-]+/).forEach(w => {
    const clean = w.replace(/[^a-zA-ZáéíóúüñÑÁÉÍÓÚ]/g, '').trim().toLowerCase();
    if (clean.length > 2) allWords.add(clean);
  });
});
fs.writeFileSync(path.join(__dirname, '..', 'scripts', 'fixed_words.txt'), [...allWords].sort().join('\n'), 'utf8');
console.log('Unique words after fix:', allWords.size);
