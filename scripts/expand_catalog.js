const fs = require('fs');
const path = require('path');

// Read existing catalog
const basePath = path.join(__dirname, 'catalog_import.json');
const items = JSON.parse(fs.readFileSync(basePath, 'utf-8'));
const existing = items.length;

const newItems = [
  // ═══════════════════════════════════════════════════════════════
  // MANTTO PREVENTIVO - Additional items
  // ═══════════════════════════════════════════════════════════════
  { name: "Lavado de Alfombra y Tapetes (Servicio)", description: "Lavado de alfombras y tapetes en área de oficinas con equipo de aspiración y shampoo especializado", unit: "servicio", category: "Mantto Preventivo", basePrice: 1800, costPrice: 900 },
  { name: "Limpieza de Cortinas y Persianas", description: "Limpieza de cortinas y persianas en área de oficinas", unit: "servicio", category: "Mantto Preventivo", basePrice: 1200, costPrice: 600 },
  { name: "Desinfección de Ductos con Ozono", description: "Desinfección de sistema de ductos mediante generación de ozono controlado", unit: "servicio", category: "Mantto Preventivo", basePrice: 3500, costPrice: 1750 },
  { name: "Limpieza de Plafones y Muros", description: "Limpieza de plafones y muros en área de instalación de equipos HVAC", unit: "servicio", category: "Mantto Preventivo", basePrice: 2500, costPrice: 1250 },
  
  // ═══════════════════════════════════════════════════════════════
  // MANTTO CORRECTIVO - Additional items  
  // ═══════════════════════════════════════════════════════════════
  { name: "Reparación de Fuga de Agua en Tubería de Drenaje", description: "Detección y reparación de fuga de agua en tubería de drenaje de condensados", unit: "servicio", category: "Mantto Correctivo", basePrice: 2800, costPrice: 1400 },
  { name: "Reparación de Fuga de Agua Helada", description: "Detección y reparación de fuga en tubería de agua helada con aislamiento", unit: "servicio", category: "Mantto Correctivo", basePrice: 4500, costPrice: 2250 },
  { name: "Destape de Línea de Drenaje", description: "Destape de línea de drenaje obstruida con equipo de presión y aspiradora", unit: "servicio", category: "Mantto Correctivo", basePrice: 1500, costPrice: 750 },
  { name: "Reparación de Unidad Interior (Filtración de Agua)", description: "Reparación de unidad interior con filtración de agua por drenaje obstruido o bandeja dañada", unit: "servicio", category: "Mantto Correctivo", basePrice: 2200, costPrice: 1100 },
  { name: "Sobrecalentamiento de Compresor", description: "Diagnóstico y corrección de sobrecalentamiento de compresor (causas: falta de refrigerante, condensador sucio, ventilador dañado)", unit: "servicio", category: "Mantto Correctivo", basePrice: 3800, costPrice: 1900 },
  { name: "Reemplazo de Válvula de Expansión", description: "Reemplazo de válvula de expansión termostática o electrónica", unit: "servicio", category: "Mantto Correctivo", basePrice: 3200, costPrice: 1600 },
  { name: "Reemplazo de Capacitor de Arranque", description: "Reemplazo de capacitor de arranque o marcha en compresor o ventilador", unit: "servicio", category: "Mantto Correctivo", basePrice: 800, costPrice: 400 },
  { name: "Reemplazo de Contactos Eléctricos", description: "Reemplazo de contactos eléctricos dañados en tablero de control", unit: "servicio", category: "Mantto Correctivo", basePrice: 1200, costPrice: 600 },

  // ═══════════════════════════════════════════════════════════════
  // SOPORTERÍA Y ESTRUCTURALES - Expanded
  // ═══════════════════════════════════════════════════════════════
  { name: "Base de Neopreno para Equipo HVAC", description: "Base de neopreno de alta densidad para absorción de vibraciones en equipos HVAC 1-5 TR", unit: "pieza", category: "Soportería y Estructurales", basePrice: 350, costPrice: 210 },
  { name: "Aislador Sísmico para Equipo HVAC", description: "Aislador sísmico tipo resorte metálico con base de neopreno para equipos HVAC", unit: "pieza", category: "Soportería y Estructurales", basePrice: 850, costPrice: 510 },
  { name: "Canaleta Metálica para Tubería de Cobre", description: "Canaleta de lámina galvanizada para protección de tubería de cobre en exterior", unit: "ml", category: "Soportería y Estructurales", basePrice: 180, costPrice: 108 },
  { name: "Canaleta Plástica para Tubería de Cobre", description: "Canaleta de PVC para ocultar tubería de cobre en interior", unit: "ml", category: "Soportería y Estructurales", basePrice: 95, costPrice: 57 },
  { name: "Cinta de Montaje (Doble Cara) para Soportería", description: "Cinta de montaje de doble cara de alta resistencia para soportería de tubería", unit: "pieza", category: "Soportería y Estructurales", basePrice: 45, costPrice: 27 },
  { name: "Clavo de Impacto para Concreto", description: "Clavo de impacto de acero templado para fijación de soportería en concreto", unit: "caja", category: "Soportería y Estructurales", basePrice: 120, costPrice: 72 },
  { name: "Ancla Expansiva para Concreto (1/4\")", description: "Ancla expansiva de acero zincado para fijación en concreto de 1/4\" x 2\"", unit: "caja", category: "Soportería y Estructurales", basePrice: 180, costPrice: 108 },
  { name: "Ancla Expansiva para Concreto (3/8\")", description: "Ancla expansiva de acero zincado para fijación en concreto de 3/8\" x 3\"", unit: "caja", category: "Soportería y Estructurales", basePrice: 250, costPrice: 150 },
  { name: "Varilla Roscada (1/4\" x 1m)", description: "Varilla roscada de acero zincado 1/4\" para soportería de ductos y tubería", unit: "pieza", category: "Soportería y Estructurales", basePrice: 38, costPrice: 23 },
  { name: "Tuerca Mariposa para Varilla Roscada", description: "Tuerca mariposa de acero zincado para varilla roscada de soportería", unit: "pieza", category: "Soportería y Estructurales", basePrice: 8, costPrice: 5 },

  // ═══════════════════════════════════════════════════════════════
  // VENTILACIÓN Y EXTRACCIÓN - Expanded
  // ═══════════════════════════════════════════════════════════════
  { name: "Extractor Centrífugo Industrial (10 HP)", description: "Extractor centrífugo industrial para extracción de aire en naves industriales", unit: "pieza", category: "Ventilación y Extracción", basePrice: 18000, costPrice: 10800 },
  { name: "Extractor Centrífugo Industrial (5 HP)", description: "Extractor centrífugo industrial de 5 HP para extracción de aire", unit: "pieza", category: "Ventilación y Extracción", basePrice: 9500, costPrice: 5700 },
  { name: "Extractor de Aire tipo Ventilador de Techo Industrial", description: "Extractor tipo ventilador de techo industrial para naves y bodegas", unit: "pieza", category: "Ventilación y Extracción", basePrice: 3500, costPrice: 2100 },
  { name: "Extractor de Aire para Baño (Silencioso 50 CFM)", description: "Extractor silencioso para baño 50 CFM con motor DC de bajo consumo", unit: "pieza", category: "Ventilación y Extracción", basePrice: 1200, costPrice: 720 },
  { name: "Extractor de Aire para Baño (100 CFM)", description: "Extractor para baño 100 CFM con temporizador integrado", unit: "pieza", category: "Ventilación y Extracción", basePrice: 1800, costPrice: 1080 },
  { name: "Ventilador de Pared Industrial (24\")", description: "Ventilador de pared industrial 24 pulgadas con rejilla de protección", unit: "pieza", category: "Ventilación y Extracción", basePrice: 2500, costPrice: 1500 },
  { name: "Ventilador de Pared Industrial (30\")", description: "Ventilador de pared industrial 30 pulgadas con rejilla de protección", unit: "pieza", category: "Ventilación y Extracción", basePrice: 3800, costPrice: 2280 },
  { name: "Cortina de Aire para Puerta (1.2m)", description: "Cortina de aire para puerta de acceso de 1.2 metros de ancho", unit: "pieza", category: "Ventilación y Extracción", basePrice: 4500, costPrice: 2700 },
  { name: "Cortina de Aire para Puerta (1.8m)", description: "Cortina de aire para puerta de acceso de 1.8 metros de ancho", unit: "pieza", category: "Ventilación y Extracción", basePrice: 6500, costPrice: 3900 },
  { name: "Cortina de Aire para Puerta (2.4m)", description: "Cortina de aire para puerta de acceso de 2.4 metros de ancho (doble)", unit: "pieza", category: "Ventilación y Extracción", basePrice: 9500, costPrice: 5700 },
  { name: "Louver de Ventilación con Malla (6x6\")", description: "Louver de aluminio con malla mosquitera de 6x6 pulgadas", unit: "pieza", category: "Ventilación y Extracción", basePrice: 180, costPrice: 108 },
  { name: "Louver de Ventilación con Malla (24x24\")", description: "Louver de aluminio con malla mosquitera de 24x24 pulgadas", unit: "pieza", category: "Ventilación y Extracción", basePrice: 650, costPrice: 390 },
  { name: "Rejilla de Ventilación de Pared (8x8\")", description: "Rejilla de ventilación de pared de aluminio 8x8 pulgadas", unit: "pieza", category: "Ventilación y Extracción", basePrice: 120, costPrice: 72 },

  // ═══════════════════════════════════════════════════════════════
  // CALEFACCIÓN - Expanded
  // ═══════════════════════════════════════════════════════════════
  { name: "Calentador de Paso Eléctrico (6L)", description: "Calentador de paso eléctrico 6 litros/minuto para uso residencial", unit: "pieza", category: "Calefacción", basePrice: 2800, costPrice: 1680 },
  { name: "Calentador Solar de Tubos de Vacío (10 tubos)", description: "Calentador solar de tubos de vacío 10 tubos con termotanque 100L", unit: "pieza", category: "Calefacción", basePrice: 5500, costPrice: 3300 },
  { name: "Calentador Solar de Tubos de Vacío (24 tubos)", description: "Calentador solar de tubos de vacío 24 tubos con termotanque 250L", unit: "pieza", category: "Calefacción", basePrice: 9500, costPrice: 5700 },
  { name: "Calentador Solar de Placa Plana (2x1m)", description: "Calentador solar de placa plana selectiva 2x1 metro", unit: "pieza", category: "Calefacción", basePrice: 4500, costPrice: 2700 },
  { name: "Tanque de Agua Caliente (150L Aislado)", description: "Tanque de almacenamiento de agua caliente 150 litros con aislamiento de poliuretano", unit: "pieza", category: "Calefacción", basePrice: 3800, costPrice: 2280 },
  { name: "Tanque de Agua Caliente (300L Aislado)", description: "Tanque de almacenamiento de agua caliente 300 litros con aislamiento de poliuretano", unit: "pieza", category: "Calefacción", basePrice: 6500, costPrice: 3900 },
  { name: "Bomba de Circulación para Calefacción (1/2 HP)", description: "Bomba de circulación de agua caliente para sistema de calefacción hidrónico 1/2 HP", unit: "pieza", category: "Calefacción", basePrice: 3200, costPrice: 1920 },
  { name: "Bomba de Circulación para Calefacción (1 HP)", description: "Bomba de circulación de agua caliente para sistema de calefacción hidrónico 1 HP", unit: "pieza", category: "Calefacción", basePrice: 4800, costPrice: 2880 },
  { name: "Válvula de Zona para Calefacción (3/4\")", description: "Válvula de zona motorizada 3/4\" para control de calefacción por zona", unit: "pieza", category: "Calefacción", basePrice: 950, costPrice: 570 },
  { name: "Válvula de Zona para Calefacción (1\")", description: "Válvula de zona motorizada 1\" para control de calefacción por zona", unit: "pieza", category: "Calefacción", basePrice: 1200, costPrice: 720 },

  // ═══════════════════════════════════════════════════════════════
  // TUBERÍA DE COBRE Y CONEXIONES - Expanded
  // ═══════════════════════════════════════════════════════════════
  { name: "Tubería de Cobre Rígido (1/2\" x 6m Tramo)", description: "Tubería de cobre rígido tipo M de 1/2\" en tramo de 6 metros", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 280, costPrice: 168 },
  { name: "Tubería de Cobre Rígido (3/4\" x 6m Tramo)", description: "Tubería de cobre rígido tipo M de 3/4\" en tramo de 6 metros", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 380, costPrice: 228 },
  { name: "Tubería de Cobre Rígido (1\" x 6m Tramo)", description: "Tubería de cobre rígido tipo M de 1\" en tramo de 6 metros", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 520, costPrice: 312 },
  { name: "Tubería de Cobre Tipo L (1/2\" x 6m)", description: "Tubería de cobre rígido tipo L (pared gruesa) de 1/2\" en tramo de 6 metros", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 420, costPrice: 252 },
  { name: "Tubería de Cobre Tipo L (3/4\" x 6m)", description: "Tubería de cobre rígido tipo L (pared gruesa) de 3/4\" en tramo de 6 metros", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 580, costPrice: 348 },
  { name: "Codo de Cobre 45° (1/2\")", description: "Codo 45° de cobre para tubería de 1/2\"", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 18, costPrice: 11 },
  { name: "Codo de Cobre 45° (3/4\")", description: "Codo 45° de cobre para tubería de 3/4\"", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 25, costPrice: 15 },
  { name: "Tee de Cobre (1/2\")", description: "Tee de cobre para tubería de 1/2\"", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 28, costPrice: 17 },
  { name: "Tee de Cobre (3/4\")", description: "Tee de cobre para tubería de 3/4\"", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 38, costPrice: 23 },
  { name: "Reducción Bushing de Cobre (1/2\" a 3/8\")", description: "Reducción bushing de cobre de 1/2\" a 3/8\"", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 22, costPrice: 13 },
  { name: "Reducción Bushing de Cobre (3/4\" a 1/2\")", description: "Reducción bushing de cobre de 3/4\" a 1/2\"", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 28, costPrice: 17 },
  { name: "Tuerca Unión de Cobre (1/2\")", description: "Tuerca unión de cobre para tubería de 1/2\"", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 45, costPrice: 27 },
  { name: "Tuerca Unión de Cobre (3/4\")", description: "Tuerca unión de cobre para tubería de 3/4\"", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 55, costPrice: 33 },
  { name: "Niple de Cobre (1/2\" x 4\")", description: "Niple de cobre de 1/2\" x 4 pulgadas con rosca NPT", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 35, costPrice: 21 },
  { name: "Niple de Cobre (3/4\" x 4\")", description: "Niple de cobre de 3/4\" x 4 pulgadas con rosca NPT", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 45, costPrice: 27 },
  { name: "Válvula Check de Cobre (1/2\")", description: "Válvula check de cobre para tubería de 1/2\"", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 120, costPrice: 72 },
  { name: "Válvula Check de Cobre (3/4\")", description: "Válvula check de cobre para tubería de 3/4\"", unit: "pieza", category: "Tubería de Cobre y Conexiones", basePrice: 160, costPrice: 96 },

  // ═══════════════════════════════════════════════════════════════
  // HERRAMIENTAS Y EQUIPO DE SERVICIO - Expanded
  // ═══════════════════════════════════════════════════════════════
  { name: "Kit de Herramientas para HVAC (Básico)", description: "Kit básico de herramientas para técnico HVAC: llaves, dados, desarmadores, pinzas, cortafrío", unit: "juego", category: "Herramientas y Equipo de Servicio", basePrice: 1800, costPrice: 1080 },
  { name: "Kit de Herramientas para HVAC (Profesional)", description: "Kit profesional de herramientas para técnico HVAC: llaves, dados, desarmadores, pinzas, cortafrío, martillo, nivel", unit: "juego", category: "Herramientas y Equipo de Servicio", basePrice: 3500, costPrice: 2100 },
  { name: "Kit de Abocardadora (Flare) para Tubería de Cobre", description: "Kit de abocardadora (flare) para tubería de cobre de 1/4\" a 3/4\"", unit: "juego", category: "Herramientas y Equipo de Servicio", basePrice: 450, costPrice: 270 },
  { name: "Cortatubos de Cobre (1/4\" a 1\")", description: "Cortatubos para tubería de cobre de 1/4\" a 1\"", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 280, costPrice: 168 },
  { name: "Soplete de Propano para Soldadura", description: "Soplete de propano con encendido piezoeléctrico para soldadura de cobre", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 350, costPrice: 210 },
  { name: "Tanque de Propano para Soplete (Pequeño)", description: "Tanque de propano desechable para soplete de soldadura", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 85, costPrice: 51 },
  { name: "Multímetro Digital para HVAC (True RMS)", description: "Multímetro digital True RMS con medición de temperatura, capacitancia y frecuencia", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 750, costPrice: 450 },
  { name: "Megóhmetro (Megger) para Motores HVAC", description: "Megóhmetro para medición de aislamiento de motores HVAC hasta 1000V", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 3200, costPrice: 1920 },
  { name: "Detector de Voltaje Sin Contacto", description: "Detector de voltaje sin contacto desde 12V a 1000V AC", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 220, costPrice: 132 },
  { name: "Cámara Termográfica para HVAC", description: "Cámara termográfica infrarroja para diagnóstico de sistemas HVAC", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 8500, costPrice: 5100 },
  { name: "Analizador de Gases de Combustión", description: "Analizador de gases de combustión para calderas y calentadores", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 6500, costPrice: 3900 },
  { name: "Kit de Detección de Fugas por Ultrasonido", description: "Kit de detección de fugas de refrigerante por ultrasonido", unit: "juego", category: "Herramientas y Equipo de Servicio", basePrice: 4200, costPrice: 2520 },
  { name: "Cilindro de Recuperación de Refrigerante (30 lb)", description: "Cilindro de recuperación de refrigerante de 30 libras con válvula", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 850, costPrice: 510 },
  { name: "Cilindro de Recuperación de Refrigerante (50 lb)", description: "Cilindro de recuperación de refrigerante de 50 libras con válvula", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 1200, costPrice: 720 },
  { name: "Kit de Carga de Refrigerante (Mangueras + Manifold)", description: "Kit completo de carga de refrigerante con mangueras, manifold y adaptadores", unit: "juego", category: "Herramientas y Equipo de Servicio", basePrice: 1800, costPrice: 1080 },
  { name: "Cinta de Teflón para Tubería (1/2\" x 15m)", description: "Cinta de teflón para sellado de roscas de tubería", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 25, costPrice: 15 },
  { name: "Sellador de Tuberías (Pasta para Roscas)", description: "Sellador en pasta para roscas de tubería de cobre y acero", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 65, costPrice: 39 },
  { name: "Limpiador de Tubería de Cobre (Desengrasante)", description: "Limpiador desengrasante para tubería de cobre antes de soldar", unit: "litro", category: "Herramientas y Equipo de Servicio", basePrice: 120, costPrice: 72 },

  // ═══════════════════════════════════════════════════════════════
  // REFRIGERACIÓN COMERCIAL - Expanded
  // ═══════════════════════════════════════════════════════════════
  { name: "Unidad Condensadora Comercial Media Temp (1.5 HP)", description: "Unidad condensadora para refrigeración comercial de media temperatura 1.5 HP R404A", unit: "pieza", category: "Refrigeración Comercial", basePrice: 8500, costPrice: 5100 },
  { name: "Unidad Condensadora Comercial Baja Temp (2 HP)", description: "Unidad condensadora para refrigeración comercial de baja temperatura 2 HP R404A", unit: "pieza", category: "Refrigeración Comercial", basePrice: 12000, costPrice: 7200 },
  { name: "Unidad Condensadora Comercial Media Temp (3 HP)", description: "Unidad condensadora para refrigeración comercial de media temperatura 3 HP R404A", unit: "pieza", category: "Refrigeración Comercial", basePrice: 15000, costPrice: 9000 },
  { name: "Evaporador Comercial de Bajo Perfil (1 HP)", description: "Evaporador de bajo perfil para cámara de refrigeración 1 HP", unit: "pieza", category: "Refrigeración Comercial", basePrice: 5200, costPrice: 3120 },
  { name: "Evaporador Comercial de Medio Perfil (2 HP)", description: "Evaporador de medio perfil para cámara de refrigeración 2 HP", unit: "pieza", category: "Refrigeración Comercial", basePrice: 7500, costPrice: 4500 },
  { name: "Evaporador Comercial de Alto Perfil (3 HP)", description: "Evaporador de alto perfil para cámara de refrigeración 3 HP con descongelamiento eléctrico", unit: "pieza", category: "Refrigeración Comercial", basePrice: 11000, costPrice: 6600 },
  { name: "Panel Sandwich para Cámara Fría (100mm x 1.20m x 2.40m)", description: "Panel sandwich de poliuretano 100mm para cámara de refrigeración", unit: "pieza", category: "Refrigeración Comercial", basePrice: 1200, costPrice: 720 },
  { name: "Panel Sandwich para Cámara Fría (150mm x 1.20m x 2.40m)", description: "Panel sandwich de poliuretano 150mm para cámara de congelación", unit: "pieza", category: "Refrigeración Comercial", basePrice: 1600, costPrice: 960 },
  { name: "Puerta para Cámara Fría (Abatible 0.90m)", description: "Puerta abatible para cámara de refrigeración de 0.90m x 2.10m con cerradura", unit: "pieza", category: "Refrigeración Comercial", basePrice: 5800, costPrice: 3480 },
  { name: "Puerta para Cámara Fría (Corrediza 1.20m)", description: "Puerta corrediza para cámara de refrigeración de 1.20m x 2.10m", unit: "pieza", category: "Refrigeración Comercial", basePrice: 7500, costPrice: 4500 },
  { name: "Reloj de Deshielo para Cámara Fría", description: "Reloj de deshielo electrónico para control de ciclo de descongelamiento", unit: "pieza", category: "Refrigeración Comercial", basePrice: 450, costPrice: 270 },
  { name: "Resistencia de Deshielo para Evaporador", description: "Resistencia de deshielo para evaporador de cámara fría (según modelo)", unit: "pieza", category: "Refrigeración Comercial", basePrice: 380, costPrice: 228 },
  { name: "Control de Temperatura Digital para Cámara Fría", description: "Control de temperatura digital con sonda para cámara de refrigeración", unit: "pieza", category: "Refrigeración Comercial", basePrice: 650, costPrice: 390 },
  { name: "Termómetro Digital para Cámara Fría", description: "Termómetro digital para cámara fría con display externo", unit: "pieza", category: "Refrigeración Comercial", basePrice: 220, costPrice: 132 },
  { name: "Cortina de PVC para Cámara Fría", description: "Cortina de tiras de PVC para entrada de cámara fría (1.20m ancho)", unit: "juego", category: "Refrigeración Comercial", basePrice: 1800, costPrice: 1080 },
  { name: "Empaque Magnético para Puerta de Cámara Fría", description: "Empaque magnético de reemplazo para puerta de cámara fría", unit: "ml", category: "Refrigeración Comercial", basePrice: 180, costPrice: 108 },
  { name: "Condensador Evaporativo para Refrigeración Comercial", description: "Condensador evaporativo para sistema de refrigeración comercial", unit: "pieza", category: "Refrigeración Comercial", basePrice: 18000, costPrice: 10800 },
  { name: "Válvula Solenoide para Línea de Líquido (1/4\")", description: "Válvula solenoide para línea de líquido de refrigeración 1/4\"", unit: "pieza", category: "Refrigeración Comercial", basePrice: 850, costPrice: 510 },
  { name: "Válvula Solenoide para Línea de Líquido (3/8\")", description: "Válvula solenoide para línea de líquido de refrigeración 3/8\"", unit: "pieza", category: "Refrigeración Comercial", basePrice: 1100, costPrice: 660 },

  // ═══════════════════════════════════════════════════════════════
  // INSTALACIÓN ELÉCTRICA - More items
  // ═══════════════════════════════════════════════════════════════
  { name: "Interruptor Termomagnético (15A 1 Polo)", description: "Interruptor termomagnético de 15 Amperes 1 polo para protección de circuito HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 120, costPrice: 72 },
  { name: "Interruptor Termomagnético (20A 1 Polo)", description: "Interruptor termomagnético de 20 Amperes 1 polo para protección de circuito HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 130, costPrice: 78 },
  { name: "Interruptor Termomagnético (30A 2 Polos)", description: "Interruptor termomagnético de 30 Amperes 2 polos para protección de circuito HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 280, costPrice: 168 },
  { name: "Interruptor Termomagnético (50A 2 Polos)", description: "Interruptor termomagnético de 50 Amperes 2 polos para protección de circuito HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 380, costPrice: 228 },
  { name: "Interruptor Termomagnético (100A 3 Polos)", description: "Interruptor termomagnético de 100 Amperes 3 polos para protección de circuito HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 850, costPrice: 510 },
  { name: "Cable THW-LS (Calibre 12 AWG) por Metro", description: "Cable THW-LS calibre 12 AWG para instalación eléctrica HVAC", unit: "m", category: "Instalación Eléctrica", basePrice: 18, costPrice: 11 },
  { name: "Cable THW-LS (Calibre 10 AWG) por Metro", description: "Cable THW-LS calibre 10 AWG para instalación eléctrica HVAC", unit: "m", category: "Instalación Eléctrica", basePrice: 28, costPrice: 17 },
  { name: "Cable THW-LS (Calibre 8 AWG) por Metro", description: "Cable THW-LS calibre 8 AWG para instalación eléctrica HVAC", unit: "m", category: "Instalación Eléctrica", basePrice: 45, costPrice: 27 },
  { name: "Cable THW-LS (Calibre 6 AWG) por Metro", description: "Cable THW-LS calibre 6 AWG para instalación eléctrica HVAC", unit: "m", category: "Instalación Eléctrica", basePrice: 65, costPrice: 39 },
  { name: "Cable THW-LS (Calibre 4 AWG) por Metro", description: "Cable THW-LS calibre 4 AWG para instalación eléctrica HVAC", unit: "m", category: "Instalación Eléctrica", basePrice: 95, costPrice: 57 },
  { name: "Cable de Control (2 Conductores 18 AWG) por Metro", description: "Cable de control 2 conductores 18 AWG para termostato HVAC", unit: "m", category: "Instalación Eléctrica", basePrice: 12, costPrice: 7 },
  { name: "Cable de Control (4 Conductores 18 AWG) por Metro", description: "Cable de control 4 conductores 18 AWG para termostato HVAC", unit: "m", category: "Instalación Eléctrica", basePrice: 18, costPrice: 11 },
  { name: "Cable de Control (8 Conductores 18 AWG) por Metro", description: "Cable de control 8 conductores 18 AWG para termostato HVAC", unit: "m", category: "Instalación Eléctrica", basePrice: 28, costPrice: 17 },
  { name: "Contacto Eléctrico (Dúplex 15A 127V)", description: "Contacto eléctrico dúplex 15A 127V con placa", unit: "pieza", category: "Instalación Eléctrica", basePrice: 45, costPrice: 27 },
  { name: "Contacto Eléctrico (Dúplex 20A 127V)", description: "Contacto eléctrico dúplex 20A 127V con placa", unit: "pieza", category: "Instalación Eléctrica", basePrice: 65, costPrice: 39 },
  { name: "Arrancador Magnético para Motor (1 HP)", description: "Arrancador magnético con protección térmica para motor de 1 HP HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 850, costPrice: 510 },
  { name: "Arrancador Magnético para Motor (3 HP)", description: "Arrancador magnético con protección térmica para motor de 3 HP HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 1200, costPrice: 720 },
  { name: "Arrancador Magnético para Motor (5 HP)", description: "Arrancador magnético con protección térmica para motor de 5 HP HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 1800, costPrice: 1080 },
  { name: "Variador de Frecuencia (1 HP 220V)", description: "Variador de frecuencia para motor de 1 HP 220V trifásico HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 3500, costPrice: 2100 },
  { name: "Variador de Frecuencia (3 HP 220V)", description: "Variador de frecuencia para motor de 3 HP 220V trifásico HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 5500, costPrice: 3300 },
  { name: "Variador de Frecuencia (5 HP 220V)", description: "Variador de frecuencia para motor de 5 HP 220V trifásico HVAC", unit: "pieza", category: "Instalación Eléctrica", basePrice: 8000, costPrice: 4800 },
  { name: "Gabinete Metálico para Tablero Eléctrico (12x12x6\")", description: "Gabinete metálico NEMA 1 para tablero eléctrico HVAC 12x12x6 pulgadas", unit: "pieza", category: "Instalación Eléctrica", basePrice: 450, costPrice: 270 },
  { name: "Gabinete Metálico para Tablero Eléctrico (24x24x8\")", description: "Gabinete metálico NEMA 1 para tablero eléctrico HVAC 24x24x8 pulgadas", unit: "pieza", category: "Instalación Eléctrica", basePrice: 850, costPrice: 510 },
  { name: "Cable de Fuerza (2-2-4-6 AL X 1m) para Acometida", description: "Cable de fuerza de aluminio para acometida de 200A (2-2-4-6)", unit: "m", category: "Instalación Eléctrica", basePrice: 180, costPrice: 108 },
  { name: "Tubería Conduit Metálico (1/2\" x 3m)", description: "Tubería conduit metálico EMT de 1/2\" en tramo de 3 metros", unit: "pieza", category: "Instalación Eléctrica", basePrice: 65, costPrice: 39 },
  { name: "Tubería Conduit Metálico (3/4\" x 3m)", description: "Tubería conduit metálico EMT de 3/4\" en tramo de 3 metros", unit: "pieza", category: "Instalación Eléctrica", basePrice: 85, costPrice: 51 },

  // ═══════════════════════════════════════════════════════════════
  // DUCTERÍA - Expanded
  // ═══════════════════════════════════════════════════════════════
  { name: "Ducto de Lámina Galvanizada (12x12\") por Metro", description: "Ducto rectangular de lámina galvanizada calibre 24 de 12x12 pulgadas", unit: "ml", category: "Ductería", basePrice: 280, costPrice: 168 },
  { name: "Ducto de Lámina Galvanizada (24x24\") por Metro", description: "Ducto rectangular de lámina galvanizada calibre 22 de 24x24 pulgadas", unit: "ml", category: "Ductería", basePrice: 480, costPrice: 288 },
  { name: "Codo de Ducto Galvanizado (90° 12x12\")", description: "Codo 90° de ducto galvanizado de 12x12 pulgadas", unit: "pieza", category: "Ductería", basePrice: 350, costPrice: 210 },
  { name: "Transición de Ducto Galvanizado (12x12\" a 24x24\")", description: "Transición de ducto galvanizado de 12x12\" a 24x24\"", unit: "pieza", category: "Ductería", basePrice: 450, costPrice: 270 },
  { name: "Caja de Plenum para Difusor (Cuadrada)", description: "Caja de plenum de lámina galvanizada para difusor cuadrado", unit: "pieza", category: "Ductería", basePrice: 320, costPrice: 192 },
  { name: "Difusor Lineal de Aire (600mm)", description: "Difusor lineal de aluminio de 600mm de longitud", unit: "pieza", category: "Ductería", basePrice: 280, costPrice: 168 },
  { name: "Difusor Lineal de Aire (1200mm)", description: "Difusor lineal de aluminio de 1200mm de longitud", unit: "pieza", category: "Ductería", basePrice: 420, costPrice: 252 },
  { name: "Rejilla de Retorno (24x24\")", description: "Rejilla de retorno de aluminio de 24x24 pulgadas con marco", unit: "pieza", category: "Ductería", basePrice: 380, costPrice: 228 },
  { name: "Rejilla de Retorno (12x12\")", description: "Rejilla de retorno de aluminio de 12x12 pulgadas con marco", unit: "pieza", category: "Ductería", basePrice: 180, costPrice: 108 },
  { name: "Compuerta de Regulación (Damper Manual 12x12\")", description: "Compuerta de regulación manual tipo damper de cuchilla opuesta 12x12\"", unit: "pieza", category: "Ductería", basePrice: 320, costPrice: 192 },
  { name: "Compuerta de Regulación (Damper Motorizado 12x12\")", description: "Compuerta de regulación motorizada tipo damper 12x12\" con actuador 24V", unit: "pieza", category: "Ductería", basePrice: 2200, costPrice: 1320 },
  { name: "Compuerta Cortafuego (12x12\")", description: "Compuerta cortafuego de 12x12\" con fusible térmico para ducto", unit: "pieza", category: "Ductería", basePrice: 2800, costPrice: 1680 },
  { name: "Toma de Aire Exterior con Louver (24x24\")", description: "Toma de aire exterior con louver de aluminio y malla de 24x24 pulgadas", unit: "pieza", category: "Ductería", basePrice: 850, costPrice: 510 },
  { name: "Regulador de Tiro (Barométrico) para Ducto", description: "Regulador de tiro barométrico para ducto de chimenea o extractor", unit: "pieza", category: "Ductería", basePrice: 1200, costPrice: 720 },
  { name: "Silenciador de Ducto (Atenuador de Ruido)", description: "Silenciador de ducto atenuador de ruido para sistema de aire", unit: "pieza", category: "Ductería", basePrice: 3500, costPrice: 2100 },

  // ═══════════════════════════════════════════════════════════════
  // AISLAMIENTOS TÉRMICOS
  // ═══════════════════════════════════════════════════════════════
  { name: "Aislamiento de Fibra de Vidrio para Ducto (1\" x 1.20m x 15m)", description: "Manta de fibra de vidrio de 1 pulgada de espesor con barrera de vapor para ducto", unit: "m2", category: "Ductería", basePrice: 180, costPrice: 108 },
  { name: "Aislamiento de Fibra de Vidrio para Ducto (2\" x 1.20m x 10m)", description: "Manta de fibra de vidrio de 2 pulgadas de espesor con barrera de vapor para ducto", unit: "m2", category: "Ductería", basePrice: 280, costPrice: 168 },
  { name: "Cinta Aluminizada para Juntas de Aislamiento", description: "Cinta aluminizada para sellado de juntas de aislamiento de ducto", unit: "pieza", category: "Ductería", basePrice: 85, costPrice: 51 },
  { name: "Pegamento para Aislamiento de Ducto (1 Galón)", description: "Pegamento para fijación de aislamiento de fibra de vidrio a ducto", unit: "galon", category: "Ductería", basePrice: 450, costPrice: 270 },
  { name: "Aislamiento Elastomérico para Tubería de Agua Helada (1\" x 1/2\")", description: "Aislamiento elastomérico para tubería de agua helada de 1/2\" espesor 1\"", unit: "ml", category: "Ductería", basePrice: 95, costPrice: 57 },
  { name: "Aislamiento Elastomérico para Tubería de Agua Helada (1\" x 1\")", description: "Aislamiento elastomérico para tubería de agua helada de 1\" espesor 1\"", unit: "ml", category: "Ductería", basePrice: 120, costPrice: 72 },
  { name: "Protector UV para Aislamiento Elastomérico", description: "Protector UV para aislamiento elastomérico expuesto a intemperie", unit: "litro", category: "Ductería", basePrice: 250, costPrice: 150 },

  // ═══════════════════════════════════════════════════════════════
  // QUÍMICOS Y TRATAMIENTO DE AGUA
  // ═══════════════════════════════════════════════════════════════
  { name: "Tratamiento Químico para Torre de Enfriamiento (Biocida 1L)", description: "Biocida líquido para tratamiento de agua en torre de enfriamiento", unit: "litro", category: "Mantto Preventivo", basePrice: 180, costPrice: 108 },
  { name: "Tratamiento Químico para Torre de Enfriamiento (Anticorrosivo 1L)", description: "Inhibidor de corrosión para tratamiento de agua en torre de enfriamiento", unit: "litro", category: "Mantto Preventivo", basePrice: 220, costPrice: 132 },
  { name: "Tratamiento Químico para Torre de Enfriamiento (Antiespumante 1L)", description: "Antiespumante para tratamiento de agua en torre de enfriamiento", unit: "litro", category: "Mantto Preventivo", basePrice: 160, costPrice: 96 },
  { name: "Desengrasante para Serpentines HVAC (1 Galón)", description: "Desengrasante alcalino para limpieza de serpentines de evaporador y condensador", unit: "galon", category: "Mantto Preventivo", basePrice: 280, costPrice: 168 },
  { name: "Limpiador de Aletas de Serpentín (Spray 500ml)", description: "Limpiador en aerosol para aletas de serpentín de aluminio", unit: "pieza", category: "Mantto Preventivo", basePrice: 95, costPrice: 57 },
  { name: "Inhibidor de Corrosión para Serpentín (Spray 500ml)", description: "Inhibidor de corrosión en aerosol para protección de serpentines HVAC", unit: "pieza", category: "Mantto Preventivo", basePrice: 120, costPrice: 72 },
  { name: "Tableta Antialgas para Bandeja de Drenaje (Caja 12 pzas)", description: "Tableta antialgas para prevenir crecimiento de algas en bandeja de drenaje", unit: "caja", category: "Mantto Preventivo", basePrice: 180, costPrice: 108 },

  // ═══════════════════════════════════════════════════════════════
  // EQUIPO DE SEGURIDAD Y PROTECCIÓN PERSONAL (EPP)
  // ═══════════════════════════════════════════════════════════════
  { name: "Casco de Seguridad para Trabajo en Altura", description: "Casco de seguridad dieléctrico para trabajo en altura en instalaciones HVAC", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 280, costPrice: 168 },
  { name: "Arnés de Seguridad para Trabajo en Altura", description: "Arnés de seguridad de cuerpo completo para trabajo en altura", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 1200, costPrice: 720 },
  { name: "Línea de Vida Retráctil (6m)", description: "Línea de vida retráctil de 6 metros para trabajo en altura", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 2200, costPrice: 1320 },
  { name: "Gafas de Seguridad para Técnico HVAC", description: "Gafas de seguridad antiempañante para técnico HVAC", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 85, costPrice: 51 },
  { name: "Guantes de Carnaza para Soldadura", description: "Guantes de carnaza para soldadura de tubería de cobre", unit: "par", category: "Herramientas y Equipo de Servicio", basePrice: 120, costPrice: 72 },
  { name: "Guantes de Látex para Manejo de Químicos", description: "Guantes de látex para manejo de químicos de limpieza HVAC", unit: "caja", category: "Herramientas y Equipo de Servicio", basePrice: 95, costPrice: 57 },
  { name: "Mascarilla para Partículas (N95)", description: "Mascarilla N95 para protección contra partículas durante limpieza HVAC", unit: "caja", category: "Herramientas y Equipo de Servicio", basePrice: 180, costPrice: 108 },
  { name: "Respirador para Gases de Soldadura", description: "Respirador con filtro para gases de soldadura y químicos HVAC", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 450, costPrice: 270 },
  { name: "Cinta de Señalización de Seguridad (Amarilla/Negra)", description: "Cinta de señalización de seguridad para área de trabajo HVAC", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 65, costPrice: 39 },
  { name: "Cono de Seguridad (18\")", description: "Cono de seguridad para señalización de área de trabajo HVAC", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 120, costPrice: 72 },
  { name: "Extintor de Incendios (ABC 4.5kg)", description: "Extintor de incendios multipropósito ABC 4.5kg para área de trabajo HVAC", unit: "pieza", category: "Herramientas y Equipo de Servicio", basePrice: 380, costPrice: 228 },

  // ═══════════════════════════════════════════════════════════════
  // REFRIGERANTES - Expanded
  // ═══════════════════════════════════════════════════════════════
  { name: "Recarga de Refrigerante R-290 (Propano) por kg", description: "Suministro de refrigerante R-290 (propano) ecológico", unit: "kg", category: "Gas Refrigerante", basePrice: 180, costPrice: 110 },
  { name: "Recarga de Refrigerante R-600a (Isobutano) por kg", description: "Suministro de refrigerante R-600a (isobutano) ecológico", unit: "kg", category: "Gas Refrigerante", basePrice: 220, costPrice: 130 },
  { name: "Recarga de Refrigerante R-1234yf por kg", description: "Suministro de refrigerante R-1234yf para sistemas automotrices y comerciales", unit: "kg", category: "Gas Refrigerante", basePrice: 950, costPrice: 570 },
  { name: "Nitrógeno para Prueba de Presión (Tanque 1.5m³)", description: "Tanque de nitrógeno para prueba de presión de circuitos refrigerantes", unit: "pieza", category: "Gas Refrigerante", basePrice: 850, costPrice: 510 },
  { name: "Nitrógeno para Prueba de Presión (Recarga)", description: "Recarga de nitrógeno para tanque de prueba de presión", unit: "servicio", category: "Gas Refrigerante", basePrice: 280, costPrice: 168 },
];

// Append and write
const merged = [...items, ...newItems];
const outPath = path.join(__dirname, 'catalog_import.json');
fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n');
console.log(`Added ${newItems.length} items. Total: ${merged.length}`);

// Count by category
const byCat = {};
merged.forEach(i => { byCat[i.category] = (byCat[i.category]||0) + 1; });
Object.entries(byCat).sort((a,b) => a[0].localeCompare(b[0])).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
