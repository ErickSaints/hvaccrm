import json, random, math

random.seed(42)

def C(b, n=55, x=75):
    return round(b * (n + random.random() * (x - n)) / 100)

def D(cat, *parts):
    return ' | '.join(['Categoria: ' + cat] + [p for p in parts if p])

def I(name, desc, unit, cat, base, cost=None):
    return {'name': name, 'description': desc, 'unit': unit, 'category': cat,
            'basePrice': base, 'costPrice': cost if cost is not None else C(base)}

existing_path = r'C:\Users\mante\hvaccrm\scripts\temp_output.json'
existing = json.load(open(existing_path, encoding='utf-16'))

items = []

# === Helper: push items compactly ===
def push(name, desc, unit, cat, base, cost=None):
    items.append(I(name, desc, unit, cat, base, cost))

def batch(arr, cat_prefix, cat_full, tipo, unit='pieza'):
    for name, base in arr:
        push(f'{cat_prefix}{name}', D(cat_full, f'Tipo: {tipo}'), unit, cat_full, base)

# ==============================
# 1. EQUIPOS DE AIRE ACONDICIONADO (already have 167 new, skip)
# ==============================

# ==============================
# 2. MANTTO PREVENTIVO (already have 66 new, skip)
# ==============================

# ==============================
# 3. MANTTO CORRECTIVO (already have 98 new, skip)
# ==============================

# ==============================
# 4. REEMPLAZO COMPONENTES (already have 389 new, skip)
# ==============================

# ==============================
# 5. GAS REFRIGERANTE (already have ~44 total, add 20 more)
# ==============================
gr = "Gas Refrigerante"
refrigerants_more = [
    ("R-123 Zeotropic blend 11.35kg", 11000),
    ("R-124 13.6kg", 8500),
    ("R-141b 11.35kg", 6000),
    ("R-142b 11.35kg", 8000),
    ("R-245fa 11.35kg", 14000),
    ("R-32 10kg", 7500),
    ("R-454B 10kg", 9000),
    ("R-513A 10kg", 18000),
    ("R-515B 10kg", 16000),
    ("R-1233zd(E) 11.35kg", 15000),
    ("R-1234yf 10kg", 25000),
    ("R-1234ze(E) 11.35kg", 22000),
    ("R-290 Propaan 11.35kg", 3500),
    ("R-600a Isobutano 11.35kg", 3000),
    ("R-1270 Propileno 11.35kg", 4000),
    ("R-744 CO2 15kg", 5000),
    ("R-407H 11.35kg", 9000),
    ("R-448A 11.35kg", 12000),
    ("R-449A 11.35kg", 11000),
    ("R-452A 11.35kg", 18000),
]
for name, base in refrigerants_more:
    push(name, D(gr, 'Presentacion: Boya 11.35 kg | Price KG: 2025-2026'), 'pieza', gr, base)

# ==============================
# 6. INSTALACION ELECTRICA (already have 152 total, add more)
# ==============================
ie = "Instalacion Electrica"
electric_more = [
    # More cables
    ("Cable THW-LS 10 AWG negro 100m", 1800, "Calibre: 10 AWG"),
    ("Cable THW-LS 8 AWG negro 100m", 2800, "Calibre: 8 AWG"),
    ("Cable THW-LS 6 AWG negro 100m", 4200, "Calibre: 6 AWG"),
    # More breakers
    ("Pastilla termomagnetica 1P 15A", 120, "Tipo: Pastilla 1 polo"),
    ("Pastilla termomagnetica 1P 20A", 120, "Tipo: Pastilla 1 polo"),
    ("Pastilla termomagnetica 1P 30A", 130, "Tipo: Pastilla 1 polo"),
    ("Pastilla termomagnetica 1P 40A", 150, "Tipo: Pastilla 1 polo"),
    ("Pastilla termomagnetica 2P 30A", 280, "Tipo: Pastilla 2 polos"),
    ("Pastilla termomagnetica 2P 40A", 300, "Tipo: Pastilla 2 polos"),
    ("Pastilla termomagnetica 2P 50A", 350, "Tipo: Pastilla 2 polos"),
    ("Pastilla termomagnetica 2P 60A", 400, "Tipo: Pastilla 2 polos"),
    ("Pastilla termomagnetica 3P 30A", 500, "Tipo: Pastilla 3 polos"),
    ("Pastilla termomagnetica 3P 50A", 650, "Tipo: Pastilla 3 polos"),
    ("Pastilla termomagnetica 3P 100A", 1200, "Tipo: Pastilla 3 polos"),
    # More contactors
    ("Contactor 2P 25A 24V", 350, "Tipo: Contactor"),
    ("Contactor 2P 40A 24V", 500, "Tipo: Contactor"),
    ("Contactor 3P 25A 24V", 450, "Tipo: Contactor"),
    ("Contactor 3P 40A 24V", 600, "Tipo: Contactor"),
    ("Contactor 3P 60A 24V", 850, "Tipo: Contactor"),
    # More relays
    ("Rele estado solido SSR-25DA 25A", 250, "Tipo: Rele estado solido"),
    ("Rele estado solido SSR-40DA 40A", 350, "Tipo: Rele estado solido"),
    ("Rele temporizador on-delay 24V 0-60s", 400, "Tipo: Rele temporizador"),
    ("Rele temporizador off-delay 24V 0-60s", 450, "Tipo: Rele temporizador"),
    # More VFDs
    ("Variador frecuencia 0.5HP 1F-3F 230V", 2500, "Tipo: Variador frecuencia"),
    ("Variador frecuencia 1HP 1F-3F 230V", 3200, "Tipo: Variador frecuencia"),
    ("Variador frecuencia 2HP 1F-3F 230V", 4200, "Tipo: Variador frecuencia"),
    ("Variador frecuencia 3HP 3F 230V", 5500, "Tipo: Variador frecuencia"),
    ("Variador frecuencia 5HP 3F 230V", 7500, "Tipo: Variador frecuencia"),
    ("Variador frecuencia 7.5HP 3F 230V", 10000, "Tipo: Variador frecuencia"),
    ("Variador frecuencia 10HP 3F 230V", 13000, "Tipo: Variador frecuencia"),
]
for name, base, tipo in electric_more:
    push(name, D(ie, tipo), 'pieza', ie, base)

# ==============================
# 7. DUCTERIA (add 30 more)
# ==============================
duct = "Ducteria"
duct_more = [
    ("Ducto rectangular galvanizado 6x6 x1m", 180, "Tipo: Ducto rectangular"),
    ("Ducto rectangular galvanizado 8x6 x1m", 220, "Tipo: Ducto rectangular"),
    ("Ducto rectangular galvanizado 10x8 x1m", 300, "Tipo: Ducto rectangular"),
    ("Ducto rectangular galvanizado 12x10 x1m", 400, "Tipo: Ducto rectangular"),
    ("Ducto rectangular galvanizado 14x10 x1m", 480, "Tipo: Ducto rectangular"),
    ("Ducto rectangular galvanizado 16x12 x1m", 580, "Tipo: Ducto rectangular"),
    ("Ducto rectangular galvanizado 20x12 x1m", 700, "Tipo: Ducto rectangular"),
    ("Ducto rectangular galvanizado 24x12 x1m", 850, "Tipo: Ducto rectangular"),
    ("Ducto rectangular galvanizado 30x12 x1m", 1100, "Tipo: Ducto rectangular"),
    ("Ducto rectangular galvanizado 36x12 x1m", 1400, "Tipo: Ducto rectangular"),
    ("Ducto rectangular galvanizado 48x12 x1m", 1900, "Tipo: Ducto rectangular"),
    ("Codo ducto rectangular 6x6", 150, "Tipo: Codo ducto"),
    ("Codo ducto rectangular 8x6", 180, "Tipo: Codo ducto"),
    ("Codo ducto rectangular 10x8", 250, "Tipo: Codo ducto"),
    ("Codo ducto rectangular 12x10", 320, "Tipo: Codo ducto"),
    ("Codo ducto rectangular 14x10", 380, "Tipo: Codo ducto"),
    ("Codo ducto rectangular 16x12", 450, "Tipo: Codo ducto"),
    ("Codo ducto rectangular 20x12", 550, "Tipo: Codo ducto"),
    ("Codo ducto rectangular 24x12", 650, "Tipo: Codo ducto"),
    ("Reduccion ducto rectangular 8x6 a 6x6", 200, "Tipo: Reduccion ducto"),
    ("Reduccion ducto rectangular 12x10 a 10x8", 300, "Tipo: Reduccion ducto"),
    ("Reduccion ducto rectangular 16x12 a 12x10", 400, "Tipo: Reduccion ducto"),
    ("Union ducto galvanizado 6x6", 100, "Tipo: Union ducto"),
    ("Union ducto galvanizado 8x6", 120, "Tipo: Union ducto"),
    ("Union ducto galvanizado 12x10", 160, "Tipo: Union ducto"),
    ("Union ducto galvanizado 16x12", 200, "Tipo: Union ducto"),
    ("Damper manual 8x6", 350, "Tipo: Damper"),
    ("Damper manual 12x10", 500, "Tipo: Damper"),
    ("Damper manual 16x12", 700, "Tipo: Damper"),
    ("Damper manual 24x12", 1000, "Tipo: Damper"),
    ("Rejilla retorno 8x6", 120, "Tipo: Rejilla"),
    ("Rejilla retorno 12x10", 180, "Tipo: Rejilla"),
    ("Rejilla retorno 16x12", 250, "Tipo: Rejilla"),
    ("Rejilla retorno 24x12", 350, "Tipo: Rejilla"),
    ("Difusor circular 6", 200, "Tipo: Difusor"),
    ("Difusor circular 8", 280, "Tipo: Difusor"),
    ("Difusor circular 10", 380, "Tipo: Difusor"),
    ("Difusor rectangular 6x6", 220, "Tipo: Difusor"),
    ("Difusor rectangular 12x6", 350, "Tipo: Difusor"),
    ("Difusor rectangular 14x8", 450, "Tipo: Difusor"),
]
for name, base, tipo in duct_more:
    push(name, D(duct, tipo), 'pieza', duct, base)

# ==============================
# 8. AISLAMIENTO TERMICO (add 40 more)
# ==============================
aisl = "Aislamiento Termico"
aisl_more = [
    # Armaflex sheet goods
    ("Armaflex plancha 1m x 1m x 1/4", 180, "Tipo: Armaflex plancha"),
    ("Armaflex plancha 1m x 1m x 1/2", 250, "Tipo: Armaflex plancha"),
    ("Armaflex plancha 1m x 1m x 3/4", 350, "Tipo: Armaflex plancha"),
    ("Armaflex plancha 1m x 1m x 1", 450, "Tipo: Armaflex plancha"),
    ("Armaflex plancha 1m x 2m x 1/2", 480, "Tipo: Armaflex plancha"),
    ("Armaflex plancha 1m x 2m x 3/4", 650, "Tipo: Armaflex plancha"),
    ("Armaflex plancha 1m x 2m x 1", 850, "Tipo: Armaflex plancha"),
    ("Armaflex tubo 3/4 x 1/4 x 2m", 80, "Tipo: Armaflex tubo"),
    ("Armaflex tubo 7/8 x 1/4 x 2m", 85, "Tipo: Armaflex tubo"),
    ("Armaflex tubo 1-1/8 x 1/2 x 2m", 120, "Tipo: Armaflex tubo"),
    ("Armaflex tubo 1-3/8 x 1/2 x 2m", 140, "Tipo: Armaflex tubo"),
    ("Armaflex tubo 1-5/8 x 1/2 x 2m", 160, "Tipo: Armaflex tubo"),
    ("Armaflex tubo 2-1/8 x 1/2 x 2m", 200, "Tipo: Armaflex tubo"),
    ("Armaflex tubo 2-5/8 x 1/2 x 2m", 250, "Tipo: Armaflex tubo"),
    ("Armaflex tubo 3-1/8 x 1/2 x 2m", 300, "Tipo: Armaflex tubo"),
    ("Armaflex tubo 4-1/8 x 1/2 x 2m", 400, "Tipo: Armaflex tubo"),
    ("Armaflex adhesivo 1 galon", 350, "Tipo: Adhesivo"),
    ("Armaflex adhesivo 1/4 galon", 150, "Tipo: Adhesivo"),
    ("Cinta aislante Armaflex 2x15m", 120, "Tipo: Cinta"),
    ("Espuma aislante tubo poliuretano 1/2 x 2m", 60, "Tipo: Espuma poliuretano"),
    ("Espuma aislante tubo poliuretano 3/4 x 2m", 70, "Tipo: Espuma poliuretano"),
    ("Espuma aislante tubo poliuretano 1 x 2m", 80, "Tipo: Espuma poliuretano"),
    ("Espuma aislante tubo poliuretano 1-1/2 x 2m", 100, "Tipo: Espuma poliuretano"),
    ("Espuma aislante tubo poliuretano 2 x 2m", 120, "Tipo: Espuma poliuretano"),
    ("Espuma aislante plancha 1x1m x 1/2", 200, "Tipo: Espuma poliuretano"),
    ("Espuma aislante plancha 1x1m x 1", 350, "Tipo: Espuma poliuretano"),
    ("Panel PIR 1x1m x 1", 180, "Tipo: Panel rigido"),
    ("Panel PIR 1x1m x 2", 280, "Tipo: Panel rigido"),
    ("Panel PIR 0.5x1m x 3", 250, "Tipo: Panel rigido"),
    ("Panel lana mineral 1.2x0.6m x 2", 200, "Tipo: Lana mineral"),
    ("Panel lana mineral 1.2x0.6m x 3", 300, "Tipo: Lana mineral"),
    ("Panel lana mineral 1.2x0.6m x 4", 400, "Tipo: Lana mineral"),
    ("Panel lana de vidrio 1.2x0.6m x 2", 180, "Tipo: Lana vidrio"),
    ("Panel lana de vidrio 1.2x0.6m x 3", 280, "Tipo: Lana vidrio"),
    ("Panel lana de vidrio 1.2x0.6m x 4", 380, "Tipo: Lana vidrio"),
    ("Foil tape 5cm x 50m", 80, "Tipo: Cinta foil"),
    ("Foil tape 7.5cm x 50m", 120, "Tipo: Cinta foil"),
    ("Mastico aislante 1 galon", 250, "Tipo: Mastico"),
    ("Mastico aislante 5 galones", 900, "Tipo: Mastico"),
    ("Abrazadera aislante cobre 1/2", 15, "Tipo: Abrazadera"),
    ("Abrazadera aislante cobre 7/8", 20, "Tipo: Abrazadera"),
    ("Abrazadera aislante cobre 1-1/8", 25, "Tipo: Abrazadera"),
    ("Abrazadera aislante cobre 2-1/8", 35, "Tipo: Abrazadera"),
    ("Forro aislante para valvula 1/2", 80, "Tipo: Forro valvula"),
    ("Forro aislante para valvula 3/4", 100, "Tipo: Forro valvula"),
    ("Forro aislante para valvula 1", 120, "Tipo: Forro valvula"),
]
for name, base, tipo in aisl_more:
    push(name, D(aisl, tipo), 'pieza', aisl, base)

# ==============================
# 9. BMS (add 50 more)
# ==============================
bms = "Controles y Automatizacion (BMS)"
bms_more = [
    # More sensors
    ("Sensor temperatura ducto 4-20mA", 800, "Tipo: Sensor temp. ducto"),
    ("Sensor temperatura intemperie 4-20mA", 900, "Tipo: Sensor temp. intemperie"),
    ("Sensor CO2 ducto 0-2000ppm", 2500, "Tipo: Sensor CO2"),
    ("Sensor CO2 ambiente 0-2000ppm", 2800, "Tipo: Sensor CO2"),
    ("Sensor presion diferencial ducto 0-250Pa", 1800, "Tipo: Sensor presion dif."),
    ("Sensor presion diferencial ducto 0-2500Pa", 2200, "Tipo: Sensor presion dif."),
    ("Sensor presion estatica ducto 4-20mA", 1500, "Tipo: Sensor presion est."),
    ("Sensor flujo CHW ultrasensor 2", 4500, "Tipo: Sensor flujo"),
    ("Sensor flujo CHW ultrasensor 4", 5500, "Tipo: Sensor flujo"),
    ("Sensor flujo CHW ultrasensor 6", 7000, "Tipo: Sensor flujo"),
    ("Sensor humedad relativa ducto", 1200, "Tipo: Sensor HR"),
    ("Sensor humedad relativa ambiente", 1000, "Tipo: Sensor HR"),
    ("Sensor temperatura liquido 10K termistor", 350, "Tipo: Sensor temp. liquido"),
    ("Sensor temperatura liquido PT1000", 450, "Tipo: Sensor temp. liquido"),
    ("Sensor temperatura ambiente 10K", 250, "Tipo: Sensor temp. amb."),
    ("Contacto de puerta magnetico", 150, "Tipo: Contacto puerta"),
    ("Presostato diferencial ducto ajustable", 600, "Tipo: Presostato dif."),
    ("Presostato alta presion refrigerante", 800, "Tipo: Presostato refrig."),
    ("Presostato baja presion refrigerante", 800, "Tipo: Presostato refrig."),
    ("Sensor calidad aire interior VOC", 3500, "Tipo: Sensor VOC"),
    ("Sensor temperatura exterior intemperie", 1200, "Tipo: Sensor temp. ext."),
    ("Sensor luz solar exterior", 2000, "Tipo: Sensor luz solar"),
    # More actuators
    ("Actuador compuerta 10Nm 24V AC/DC 3pt", 2500, "Tipo: Actuador compuerta"),
    ("Actuador compuerta 20Nm 24V AC/DC 3pt", 3500, "Tipo: Actuador compuerta"),
    ("Actuador compuerta 5Nm 24V AC/DC 0-10V", 3000, "Tipo: Actuador compuerta"),
    ("Actuador compuerta 10Nm 24V AC/DC 0-10V", 3800, "Tipo: Actuador compuerta"),
    ("Actuador compuerta 20Nm 24V AC/DC 0-10V", 5000, "Tipo: Actuador compuerta"),
    ("Actuador valvula 2-vias 1/2 24V 0-10V", 1800, "Tipo: Actuador valvula"),
    ("Actuador valvula 2-vias 3/4 24V 0-10V", 2200, "Tipo: Actuador valvula"),
    ("Actuador valvula 2-vias 1 24V 0-10V", 2800, "Tipo: Actuador valvula"),
    ("Actuador valvula 3-vias 1/2 24V 0-10V", 2000, "Tipo: Actuador valvula"),
    ("Actuador valvula 3-vias 3/4 24V 0-10V", 2500, "Tipo: Actuador valvula"),
    ("Actuador valvula 3-vias 1 24V 0-10V", 3200, "Tipo: Actuador valvula"),
    # More controllers
    ("Controlador zonificado VRF 4 zonas", 3500, "Tipo: Controlador VRF"),
    ("Controlador zonificado VRF 8 zonas", 5500, "Tipo: Controlador VRF"),
    ("Controlador fan coil 2-tubos", 1800, "Tipo: Controlador FCU"),
    ("Controlador fan coil 4-tubos", 2200, "Tipo: Controlador FCU"),
    ("Controlador bomba de calor", 3000, "Tipo: Controlador bomba calor"),
    ("Interfaz BACnet a Modbus RTU", 5000, "Tipo: Interfaz"),
    ("Interfaz BACnet a LonWorks", 7000, "Tipo: Interfaz"),
    ("Interfaz BACnet a KNX", 6500, "Tipo: Interfaz"),
    ("Fuente poder 24V DC 2A", 350, "Tipo: Fuente poder"),
    ("Fuente poder 24V DC 5A", 550, "Tipo: Fuente poder"),
    ("Fuente poder 24V DC 10A", 850, "Tipo: Fuente poder"),
    ("Repetidor BACnet MS/TP", 2500, "Tipo: Repetidor"),
    ("Router BACnet/IP a MS/TP", 4500, "Tipo: Router"),
    ("Panel touch 7 HMI BMS", 12000, "Tipo: Panel HMI"),
    ("Panel touch 10 HMI BMS", 18000, "Tipo: Panel HMI"),
]
for name, base, tipo in bms_more:
    push(name, D(bms, tipo), 'pieza', bms, base)

# ==============================
# 10. BOMBAS DE AGUA (add 30 more)
# ==============================
bw = "Bombas de Agua"
bombas_more = [
    ("Bomba dosificadora quimicos 0.5GPH", 4500, "Tipo: Dosificadora"),
    ("Bomba dosificadora quimicos 1GPH", 5500, "Tipo: Dosificadora"),
    ("Bomba dosificadora quimicos 2GPH", 7000, "Tipo: Dosificadora"),
    ("Bomba dosificadora quimicos 5GPH", 10000, "Tipo: Dosificadora"),
    ("Bomba circuladora calefaccion 1/8HP", 2500, "Tipo: Circuladora"),
    ("Bomba circuladora calefaccion 1/6HP", 3200, "Tipo: Circuladora"),
    ("Bomba circuladora calefaccion 1/4HP", 4000, "Tipo: Circuladora"),
    ("Bomba booster presion 1/2HP", 3500, "Tipo: Booster"),
    ("Bomba booster presion 3/4HP", 4500, "Tipo: Booster"),
    ("Bomba booster presion 1HP", 6000, "Tipo: Booster"),
    ("Bomba booster presion 1.5HP", 8000, "Tipo: Booster"),
    ("Bomba booster presion 2HP", 10000, "Tipo: Booster"),
    ("Bomba presion constante 1HP c/ variador", 12000, "Tipo: Presion constante"),
    ("Bomba presion constante 2HP c/ variador", 18000, "Tipo: Presion constante"),
    ("Bomba presion constante 3HP c/ variador", 25000, "Tipo: Presion constante"),
    ("Bomba presion constante 5HP c/ variador", 35000, "Tipo: Presion constante"),
    ("Bomba presion constante 10HP c/ variador", 55000, "Tipo: Presion constante"),
    ("Bomba sumergible pozo profundo 1HP", 8000, "Tipo: Sumergible pozo"),
    ("Bomba sumergible pozo profundo 2HP", 12000, "Tipo: Sumergible pozo"),
    ("Bomba sumergible pozo profundo 3HP", 16000, "Tipo: Sumergible pozo"),
    ("Bomba sumergible pozo profundo 5HP", 25000, "Tipo: Sumergible pozo"),
    ("Bomba sumergible pozo profundo 7.5HP", 35000, "Tipo: Sumergible pozo"),
    ("Bomba sumergible pozo profundo 10HP", 45000, "Tipo: Sumergible pozo"),
    ("Bomba sumergible drenaje 1/2HP", 2200, "Tipo: Sumergible drenaje"),
    ("Bomba sumergible drenaje 1HP", 3500, "Tipo: Sumergible drenaje"),
    ("Bomba sumergible drenaje 2HP", 5500, "Tipo: Sumergible drenaje"),
    ("Bomba sumergible drenaje 3HP", 7500, "Tipo: Sumergible drenaje"),
    ("Bomba sumergible achique 1/2HP", 2000, "Tipo: Sumergible achique"),
    ("Bomba sumergible achique 1HP", 3000, "Tipo: Sumergible achique"),
    ("Bomba sumergible achique 2HP", 5000, "Tipo: Sumergible achique"),
]
for name, base, tipo in bombas_more:
    push(name, D(bw, tipo), 'pieza', bw, base)

# ==============================
# 11. REFACCIONES DE BOMBA (add 20 more)
# ==============================
rp = "Refacciones de Bomba"
refbombas_more = [
    ("Reemplazo Difusor 2", 250, "Tipo: Difusor"),
    ("Reemplazo Difusor 3", 350, "Tipo: Difusor"),
    ("Reemplazo Difusor 4", 500, "Tipo: Difusor"),
    ("Reemplazo Difusor 6", 800, "Tipo: Difusor"),
    ("Reemplazo Caja espiral 2", 800, "Tipo: Caja espiral"),
    ("Reemplazo Caja espiral 3", 1200, "Tipo: Caja espiral"),
    ("Reemplazo Caja espiral 4", 1800, "Tipo: Caja espiral"),
    ("Reemplazo Caja espiral 6", 3000, "Tipo: Caja espiral"),
    ("Reemplazo Flecha impelente 2", 600, "Tipo: Flecha"),
    ("Reemplazo Flecha impelente 3", 800, "Tipo: Flecha"),
    ("Reemplazo Flecha impelente 4", 1100, "Tipo: Flecha"),
    ("Reemplazo Flecha impelente 6", 1800, "Tipo: Flecha"),
    ("Reemplazo Succion impelente 2", 300, "Tipo: Succion"),
    ("Reemplazo Succion impelente 3", 450, "Tipo: Succion"),
    ("Reemplazo Succion impelente 4", 650, "Tipo: Succion"),
    ("Reemplazo Succion impelente 6", 1000, "Tipo: Succion"),
    ("Reemplazo Empaque brida 2", 40, "Tipo: Empaque"),
    ("Reemplazo Empaque brida 3", 60, "Tipo: Empaque"),
    ("Reemplazo Empaque brida 4", 80, "Tipo: Empaque"),
    ("Reemplazo Empaque brida 6", 120, "Tipo: Empaque"),
]
for name, base, tipo in refbombas_more:
    push(name, D(rp, tipo), 'pieza', rp, base)

# ==============================
# 12. REFRIGERACION COMERCIAL (add 30 more)
# ==============================
rc = "Refrigeracion Comercial"
refcom_more = [
    # Reach-in coolers/freezers
    ("Congelador horizontal 450L", 12000, "Tipo: Congelador horizontal"),
    ("Congelador horizontal 600L", 16000, "Tipo: Congelador horizontal"),
    ("Congelador horizontal 800L", 22000, "Tipo: Congelador horizontal"),
    ("Congelador vertical 400L", 14000, "Tipo: Congelador vertical"),
    ("Congelador vertical 600L", 19000, "Tipo: Congelador vertical"),
    ("Congelador vertical 800L", 25000, "Tipo: Congelador vertical"),
    ("Refrigerador vertical 400L", 10000, "Tipo: Refrigerador vertical"),
    ("Refrigerador vertical 600L", 14000, "Tipo: Refrigerador vertical"),
    ("Refrigerador vertical 800L", 18000, "Tipo: Refrigerador vertical"),
    ("Camara refrigerada panel sandwich 10m3 c/ equipo", 55000, "Tipo: Camara refrigerada"),
    ("Camara refrigerada panel sandwich 20m3 c/ equipo", 85000, "Tipo: Camara refrigerada"),
    ("Camara refrigerada panel sandwich 40m3 c/ equipo", 140000, "Tipo: Camara refrigerada"),
    ("Camara congelada panel sandwich 10m3 c/ equipo", 75000, "Tipo: Camara congelada"),
    ("Camara congelada panel sandwich 20m3 c/ equipo", 120000, "Tipo: Camara congelada"),
    ("Camara congelada panel sandwich 40m3 c/ equipo", 200000, "Tipo: Camara congelada"),
    # Condensing units
    ("Unidad condensadora media temp 1HP R-404A", 12000, "Tipo: Unidad condensadora"),
    ("Unidad condensadora media temp 2HP R-404A", 18000, "Tipo: Unidad condensadora"),
    ("Unidad condensadora media temp 3HP R-404A", 25000, "Tipo: Unidad condensadora"),
    ("Unidad condensadora media temp 5HP R-404A", 38000, "Tipo: Unidad condensadora"),
    ("Unidad condensadora baja temp 1HP R-404A", 15000, "Tipo: Unidad condensadora BT"),
    ("Unidad condensadora baja temp 2HP R-404A", 22000, "Tipo: Unidad condensadora BT"),
    ("Unidad condensadora baja temp 3HP R-404A", 32000, "Tipo: Unidad condensadora BT"),
    ("Unidad condensadora baja temp 5HP R-404A", 48000, "Tipo: Unidad condensadora BT"),
    # Evaporators
    ("Evaporador media temp 1HP aire forzado", 5000, "Tipo: Evaporador"),
    ("Evaporador media temp 2HP aire forzado", 8000, "Tipo: Evaporador"),
    ("Evaporador media temp 3HP aire forzado", 12000, "Tipo: Evaporador"),
    ("Evaporador baja temp 1HP aire forzado", 7000, "Tipo: Evaporador BT"),
    ("Evaporador baja temp 2HP aire forzado", 11000, "Tipo: Evaporador BT"),
    ("Evaporador baja temp 3HP aire forzado", 16000, "Tipo: Evaporador BT"),
    ("Evaporador baja temp 5HP aire forzado", 25000, "Tipo: Evaporador BT"),
    # Controls
    ("Control digital temperatura media temp", 1200, "Tipo: Control temp."),
    ("Control digital temperatura baja temp", 1500, "Tipo: Control temp."),
    ("Control digital temperatura full range", 1800, "Tipo: Control temp."),
    ("Termostato mecanico refrigeracion", 350, "Tipo: Termostato"),
    ("Valvula expansion termostatica R-404A 1/2TR", 600, "Tipo: VET"),
]
for name, base, tipo in refcom_more:
    push(name, D(rc, tipo), 'pieza', rc, base)

# ==============================
# 13. SOPORTERIA Y ESTRUCTURALES (add 30 more)
# ==============================
sop = "Soporteria y Estructurales"
sop_more = [
    ("Soporte minisplit pared 3-5TR", 250, "Tipo: Soporte minisplit"),
    ("Soporte minisplit piso 1-2TR", 180, "Tipo: Soporte minisplit"),
    ("Soporte minisplit piso 3-5TR", 300, "Tipo: Soporte minisplit"),
    ("Soporte condensadora 1-2TR", 350, "Tipo: Soporte condensadora"),
    ("Soporte condensadora 3-5TR", 500, "Tipo: Soporte condensadora"),
    ("Soporte condensadora 7.5-10TR", 800, "Tipo: Soporte condensadora"),
    ("Soporte condensadora 15-25TR", 1500, "Tipo: Soporte condensadora"),
    ("Base antivibracion resorte 50kg", 600, "Tipo: Base antivibracion"),
    ("Base antivibracion resorte 100kg", 900, "Tipo: Base antivibracion"),
    ("Base antivibracion resorte 200kg", 1400, "Tipo: Base antivibracion"),
    ("Base antivibracion resorte 500kg", 2500, "Tipo: Base antivibracion"),
    ("Base antivibracion neopreno 2x2", 120, "Tipo: Base antivibracion neopreno"),
    ("Base antivibracion neopreno 4x4", 200, "Tipo: Base antivibracion neopreno"),
    ("Base antivibracion neopreno 6x6", 350, "Tipo: Base antivibracion neopreno"),
    ("Base antivibracion neopreno 8x8", 500, "Tipo: Base antivibracion neopreno"),
    ("Perfil estructural C 1.5mm 6m", 350, "Tipo: Perfil C"),
    ("Perfil estructural C 2mm 6m", 450, "Tipo: Perfil C"),
    ("Perfil estructural C 3mm 6m", 650, "Tipo: Perfil C"),
    ("Perfil estructural L 1.5mm 6m", 250, "Tipo: Perfil L"),
    ("Perfil estructural L 2mm 6m", 350, "Tipo: Perfil L"),
    ("Perfil estructural L 3mm 6m", 500, "Tipo: Perfil L"),
    ("Unistrut 41x41 2.4m", 180, "Tipo: Unistrut"),
    ("Unistrut 41x41 3m", 220, "Tipo: Unistrut"),
    ("Unistrut 41x41 6m", 350, "Tipo: Unistrut"),
    ("Abrazadera unistrut 1/2", 20, "Tipo: Abrazadera unistrut"),
    ("Abrazadera unistrut 7/8", 25, "Tipo: Abrazadera unistrut"),
    ("Abrazadera unistrut 1-1/8", 30, "Tipo: Abrazadera unistrut"),
    ("Abrazadera unistrut 2-1/8", 40, "Tipo: Abrazadera unistrut"),
    ("Tuerca canal unistrut 1/4", 8, "Tipo: Tuerca canal"),
    ("Tuerca canal unistrut 3/8", 10, "Tipo: Tuerca canal"),
    ("Tuerca canal unistrut 1/2", 12, "Tipo: Tuerca canal"),
]
for name, base, tipo in sop_more:
    push(name, D(sop, tipo), 'pieza', sop, base)

# ==============================
# 14. VENTILACION Y EXTRACCION (add 25 more)
# ==============================
vye = "Ventilacion y Extraccion"
vent_more = [
    ("Extractor de techo 300CFM", 1200, "Tipo: Extractor techo"),
    ("Extractor de techo 600CFM", 1800, "Tipo: Extractor techo"),
    ("Extractor de techo 1000CFM", 2800, "Tipo: Extractor techo"),
    ("Extractor de techo 2000CFM", 4500, "Tipo: Extractor techo"),
    ("Extractor de techo 4000CFM", 7500, "Tipo: Extractor techo"),
    ("Extractor axial 12 800CFM", 2500, "Tipo: Extractor axial"),
    ("Extractor axial 16 1500CFM", 4000, "Tipo: Extractor axial"),
    ("Extractor axial 20 3000CFM", 6000, "Tipo: Extractor axial"),
    ("Extractor axial 24 5000CFM", 9000, "Tipo: Extractor axial"),
    ("Extractor axial 30 8000CFM", 14000, "Tipo: Extractor axial"),
    ("Ventilador centrifugo 1/2HP", 3000, "Tipo: Ventilador centrifugo"),
    ("Ventilador centrifugo 1HP", 4500, "Tipo: Ventilador centrifugo"),
    ("Ventilador centrifugo 2HP", 7000, "Tipo: Ventilador centrifugo"),
    ("Ventilador centrifugo 3HP", 10000, "Tipo: Ventilador centrifugo"),
    ("Ventilador centrifugo 5HP", 15000, "Tipo: Ventilador centrifugo"),
    ("Ventilador centrifugo 7.5HP", 22000, "Tipo: Ventilador centrifugo"),
    ("Ventilador centrifugo 10HP", 30000, "Tipo: Ventilador centrifugo"),
    ("Ventilador pared 12 industrial", 1500, "Tipo: Ventilador pared"),
    ("Ventilador pared 18 industrial", 2200, "Tipo: Ventilador pared"),
    ("Ventilador pared 24 industrial", 3500, "Tipo: Ventilador pared"),
    ("Ventilador pedestal 18 industrial", 1800, "Tipo: Ventilador pedestal"),
    ("Ventilador pedestal 24 industrial", 2800, "Tipo: Ventilador pedestal"),
    ("Louver fijo intemperie 12x12", 300, "Tipo: Louver"),
    ("Louver fijo intemperie 18x18", 500, "Tipo: Louver"),
    ("Louver fijo intemperie 24x24", 800, "Tipo: Louver"),
    ("Louver fijo intemperie 36x24", 1200, "Tipo: Louver"),
    ("Louver motorizado 12x12 24V", 1800, "Tipo: Louver motorizado"),
    ("Louver motorizado 24x24 24V", 3000, "Tipo: Louver motorizado"),
    ("Tubo flexible aluminio 4 x 3m", 150, "Tipo: Tubo flexible"),
    ("Tubo flexible aluminio 6 x 3m", 220, "Tipo: Tubo flexible"),
    ("Tubo flexible aluminio 8 x 3m", 300, "Tipo: Tubo flexible"),
    ("Tubo flexible aluminio 10 x 3m", 400, "Tipo: Tubo flexible"),
    ("Tubo flexible aluminio 12 x 3m", 500, "Tipo: Tubo flexible"),
    ("Codo metalico 45 6", 80, "Tipo: Codo metalico"),
    ("Codo metalico 45 8", 120, "Tipo: Codo metalico"),
    ("Codo metalico 45 10", 180, "Tipo: Codo metalico"),
    ("Codo metalico 45 12", 250, "Tipo: Codo metalico"),
]
for name, base, tipo in vent_more:
    push(name, D(vye, tipo), 'pieza', vye, base)

# ==============================
# 15. HERRAMIENTAS Y EQUIPO DE SERVICIO (add 25 more)
# ==============================
hes = "Herramientas y Equipo de Servicio"
herram_more = [
    ("Manifold digital R-410A/R-22", 3500, "Tipo: Manifold digital"),
    ("Manifold analogo R-410A/R-22", 1200, "Tipo: Manifold analogo"),
    ("Manguera servicio R-410A 60 azul", 250, "Tipo: Manguera servicio"),
    ("Manguera servicio R-410A 60 roja", 250, "Tipo: Manguera servicio"),
    ("Manguera servicio R-410A 60 amarilla", 250, "Tipo: Manguera servicio"),
    ("Juego mangueras servicio 1/4 60 3 piezas", 650, "Tipo: Juego mangueras"),
    ("Vacuometro digital", 1800, "Tipo: Vacuometro"),
    ("Termometro infrarrojo laser", 800, "Tipo: Termometro IR"),
    ("Termometro contacto tipo K con sonda", 500, "Tipo: Termometro contacto"),
    ("Detector de fugas electronicas", 2500, "Tipo: Detector fugas"),
    ("Detector de fugas UV lmpara + lentes", 1200, "Tipo: Detector UV"),
    ("Balanzas refrigerante 100kg", 2500, "Tipo: Balanza refrigerante"),
    ("Bomba vacio 2 etapas 3CFM", 2500, "Tipo: Bomba vacio"),
    ("Bomba vacio 2 etapas 5CFM", 3500, "Tipo: Bomba vacio"),
    ("Bomba vacio 2 etapas 8CFM", 5000, "Tipo: Bomba vacio"),
    ("Recuperadora refrigerante 1/2HP", 8000, "Tipo: Recuperadora"),
    ("Recuperadora refrigerante 1HP", 12000, "Tipo: Recuperadora"),
    ("Cilindro recuperacion 30lb", 1200, "Tipo: Cilindro recuperacion"),
    ("Cilindro recuperacion 50lb", 1800, "Tipo: Cilindro recuperacion"),
    ("Pinza amperimetrica AC/DC 600A", 1800, "Tipo: Pinza amperimetrica"),
    ("Multimetro digital HVAC verdadero RMS", 1500, "Tipo: Multimetro"),
    ("Medidor de viento/velocidad anemometro", 1200, "Tipo: Anemometro"),
    ("Medidor CO2 / T / H", 2500, "Tipo: Medidor CO2"),
    ("Detector voltaje sin contacto", 350, "Tipo: Detector voltaje"),
    ("Camara termografica basica", 12000, "Tipo: Camara termografica"),
    ("Caja de herramientas 19 metales", 800, "Tipo: Caja herramientas"),
    ("Morral Cinturon herramienta cuero 10 bolsas", 450, "Tipo: Cinturon"),
]
for name, base, tipo in herram_more:
    push(name, D(hes, tipo), 'pieza', hes, base)

# ==============================
# 16. CALEFACCION (add 20 more)
# ==============================
cal = "Calefaccion"
cal_more = [
    ("Calentador paso 10L/min gas LP/NG", 5000, "Tipo: Calentador paso"),
    ("Calentador paso 14L/min gas LP/NG", 6500, "Tipo: Calentador paso"),
    ("Calentador paso 18L/min gas LP/NG", 8500, "Tipo: Calentador paso"),
    ("Boiler almacenamiento 40L electrico", 3000, "Tipo: Boiler electrico"),
    ("Boiler almacenamiento 80L electrico", 4500, "Tipo: Boiler electrico"),
    ("Boiler almacenamiento 120L electrico", 6500, "Tipo: Boiler electrico"),
    ("Caldera mural calefaccion 25kW", 18000, "Tipo: Caldera mural"),
    ("Caldera mural calefaccion 35kW", 25000, "Tipo: Caldera mural"),
    ("Caldera mural calefaccion 50kW", 35000, "Tipo: Caldera mural"),
    ("Caldera mural mixta calefaccion+ACS 25kW", 22000, "Tipo: Cal. mural mixta"),
    ("Caldera mural mixta calefaccion+ACS 35kW", 30000, "Tipo: Cal. mural mixta"),
    ("Caldera pie calefaccion 100kW", 60000, "Tipo: Caldera pie"),
    ("Caldera pie calefaccion 200kW", 100000, "Tipo: Caldera pie"),
    ("Caldera pie calefaccion 300kW", 150000, "Tipo: Caldera pie"),
    ("Radiador panel acero 500x600", 1200, "Tipo: Radiador panel"),
    ("Radiador panel acero 500x1000", 1800, "Tipo: Radiador panel"),
    ("Radiador panel acero 500x1400", 2500, "Tipo: Radiador panel"),
    ("Radiador panel acero 500x1800", 3200, "Tipo: Radiador panel"),
    ("Fan coil calefaccion 1HP", 3500, "Tipo: Fan coil calefaccion"),
    ("Fan coil calefaccion 2HP", 5500, "Tipo: Fan coil calefaccion"),
    ("Fan coil calefaccion 3HP", 8000, "Tipo: Fan coil calefaccion"),
    ("Termostato ambiente calefaccion digital", 800, "Tipo: Termostato calef."),
    ("Termostato ambiente calefaccion programable", 1200, "Tipo: Termostato calef."),
    ("Vaso expansion calefaccion 12L", 600, "Tipo: Vaso expansion"),
    ("Vaso expansion calefaccion 25L", 900, "Tipo: Vaso expansion"),
    ("Vaso expansion calefaccion 50L", 1500, "Tipo: Vaso expansion"),
    ("Vaso expansion calefaccion 100L", 2500, "Tipo: Vaso expansion"),
    ("Bomba circuladora calefaccion 1/8HP", 2500, "Tipo: Circuladora calef."),
    ("Bomba circuladora calefaccion 1/4HP", 3500, "Tipo: Circuladora calef."),
    ("Bomba circuladora calefaccion 1/2HP", 5000, "Tipo: Circuladora calef."),
]
for name, base, tipo in cal_more:
    push(name, D(cal, tipo), 'pieza', cal, base)

# ==============================
# 17. BULK GENERATION - parametric items across categories
# ==============================

# Aislamiento Termico - generate 60 more Armaflex tube variants
for od in ['1/2','3/4','7/8','1-1/8','1-3/8','1-5/8','2-1/8','2-5/8','3-1/8','3-5/8','4-1/8','4-5/8']:
    for wall in ['1/4','1/2','3/4','1']:
        base = 60 + hash(od+wall) % 400
        push(f'Armaflex tubo {od} x {wall} x 2m', D(aisl, 'Tipo: Armaflex tubo'), 'pieza', aisl, base)

# Aislamiento Termico - panel sizes
for w in [1, 2, 3, 4]:
    push(f'Panel PIR 1x2m x {w}"', D(aisl, 'Tipo: Panel rigido'), 'pieza', aisl, 200 + w * 150)
for w in [1, 2, 3, 4]:
    push(f'Panel PIR 1x1m x {w}"', D(aisl, 'Tipo: Panel rigido'), 'pieza', aisl, 150 + w * 120)

# Instalacion Electrica - 40 more items parametric
for amps in [15, 20, 30, 40, 50, 60, 70, 80, 100, 125]:
    push(f'Pastilla termomagnetica 1P {amps}A', D(ie, 'Tipo: Pastilla 1 polo'), 'pieza', ie, 80 + amps * 2)
    push(f'Pastilla termomagnetica 2P {amps}A', D(ie, 'Tipo: Pastilla 2 polos'), 'pieza', ie, 150 + amps * 4)
    push(f'Pastilla termomagnetica 3P {amps}A', D(ie, 'Tipo: Pastilla 3 polos'), 'pieza', ie, 280 + amps * 8)

# Arrancadores suaves por HP
for hp in [0.5, 1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100]:
    base = int(2000 * (hp / 0.5) ** 0.55)
    push(f'Arrancador suave {hp}HP 230V', D(ie, 'Tipo: Arrancador suave'), 'pieza', ie, base)

# Variadores frecuencia mas potencias
for hp in [15, 20, 25, 30, 40, 50, 60, 75, 100]:
    base = int(5000 * (hp / 0.5) ** 0.55)
    push(f'Variador frecuencia {hp}HP 3F 230V', D(ie, 'Tipo: Variador frecuencia'), 'pieza', ie, base)

# Bombas de Agua - 40 more by generating named variants
for base_hp in [0.5, 1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50]:
    for tipo, mult in [('Centrifuga pedestal', 1.0), ('Centrifuga horizontal', 1.15), ('Turbina vertical', 2.0)]:
        price = int(3000 * (base_hp / 0.5) ** 0.6 * mult)
        push(f'Bomba {tipo} {base_hp}HP', D(bw, f'Tipo: {tipo}', f'Cap: {base_hp}HP'), 'pieza', bw, price)

# BMS - 30 more sensors parametric
for stype, base_price in [('Temp ducto NTC', 400), ('Temp ducto PT1000', 500), ('Temp intemperie NTC', 550),
                          ('HR ducto capacitivo', 1200), ('HR ambiente capacitivo', 1000),
                          ('Presion dif 0-100Pa', 1500), ('Presion dif 0-500Pa', 1800),
                          ('Presion dif 0-2500Pa', 2200), ('Flujo termico 2"', 3500),
                          ('Flujo termico 4"', 5000), ('Flujo ultras 2"', 4500),
                          ('Flujo ultras 6"', 7000), ('CO2 ducto NDIR', 2800),
                          ('CO2 ambiente NDIR', 2500), ('VOC TVOC ambiente', 3500)]:
    push(f'Sensor {stype}', D(bms, f'Tipo: Sensor {stype}'), 'pieza', bms, base_price)

# Ducteria - 30 more rectangular sizes
for w in [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 30, 36, 42, 48]:
    for d in [6, 8, 10, 12, 14, 16, 18, 20, 24]:
        if w >= d:
            price = 120 + (w * d) * 0.5
            push(f'Ducto rect galv {w}x{d} x1m', D(duct, 'Tipo: Ducto rectangular'), 'pieza', duct, int(price))

# Ventilacion - 30 more extractors parametric
for cfm in [100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000]:
    for tipo in ['Extractor axial', 'Extractor centrifugo']:
        price = int(800 * (cfm / 100) ** 0.65)
        push(f'{tipo} {cfm}CFM', D(vye, f'Tipo: {tipo}', f'Cap: {cfm}CFM'), 'pieza', vye, price)

# Calefaccion - 20 more parametric
for kw in [10, 15, 20, 25, 30, 35, 40, 50, 60, 80, 100, 150, 200, 300]:
    price = int(8000 * (kw / 10) ** 0.6)
    push(f'Caldera mural calefaccion {kw}kW', D(cal, 'Tipo: Caldera mural', f'Cap: {kw}kW'), 'pieza', cal, price)
    push(f'Caldera pie calefaccion {kw}kW', D(cal, 'Tipo: Caldera pie', f'Cap: {kw}kW'), 'pieza', cal, int(price * 1.4))

# Soporteria - 25 more
for diam in ['1/2"','7/8"','1-1/8"','1-3/8"','1-5/8"','2-1/8"','2-5/8"','3-1/8"','3-5/8"','4-1/8"']:
    push(f'Soporte tuberia cuello acero {diam}', D(sop, 'Tipo: Soporte tuberia'), 'pieza', sop, 25 + hash(diam) % 200)
for size in ['1/2"','5/8"','3/4"','1"','1-1/4"','1-1/2"']:
    push(f'Abrazadera colgar tuberia {size}', D(sop, 'Tipo: Abrazadera tuberia'), 'pieza', sop, 10 + hash(size) % 100)
for hp in [1, 2, 3, 5, 7.5, 10, 15, 20, 25]:
    push(f'Soporte base resorte {hp}HP', D(sop, 'Tipo: Base resorte'), 'pieza', sop, 300 + hp * 80)
# Herramientas y Equipo - 15 more
for desc, base in [('Extension electrica 15m cal 14', 300),('Extension electrica 30m cal 14', 500),
    ('Extension electrica 15m cal 12', 400),('Laser distancia 30m', 1200),('Laser distancia 50m', 1800),
    ('Laser distancia 100m', 3000),('Nivel magnetico 24"', 350),('Nivel laser cruz linea', 1200),
    ('Nivel laser rotary 360', 3500),('Cinta metrica 5m', 80),('Cinta metrica 8m', 120),
    ('Cinta metrica 15m', 200),('Flexometro 5m', 100),('Plomada 500g', 150),
    ('Martillo perforador SDS 1/2"', 1500)]:
    push(desc, D(hes, 'Tipo: General'), 'pieza', hes, base)
# Refacciones de Ventilacion - 10 more
rv = 'Refacciones de Ventilacion'
for kw in [0.12, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0]:
    base = int(300 * (kw / 0.12) ** 0.55)
    push(f'Motor ventilador {kw}kW', D(rv, 'Tipo: Motor ventilador', f'Cap: {kw}kW'), 'pieza', rv, base)
# Materiales de Soldadura - 15 more
ms = 'Materiales de Soldadura'
for desc, base in [('Electrodo 6011 1/8 x kg', 80),('Electrodo 6013 3/32 x kg', 75),
    ('Electrodo 7018 1/8 x kg', 110),('Electrodo 7018 3/32 x kg', 100),
    ('Electrodo 7018 5/32 x kg', 120),('Alambre MIG 0.025 1kg', 180),
    ('Alambre MIG 0.035 1kg', 160),('Alambre Flux Core 0.035 1kg', 140),
    ('Alambre Flux Core 0.045 1kg', 160),('Antorcha TIG 17 flex 12.5m', 800),
    ('Antorcha TIG 26 12.5m', 600),('Pinza tierra MIG 400A', 200),
    ('Boquilla ceramica TIG #4', 25),('Boquilla ceramica TIG #6', 30),
    ('Boquilla ceramica TIG #8', 35)]:
    push(desc, D(ms, 'Tipo: Consumible'), 'pieza', ms, base)
# EPP - 20 more
epp = 'Equipo de Seguridad (EPP)'
for desc, base in [('Respirador media cara 3M 6000', 250),('Filtro particulas P100 par', 80),
    ('Filtro vapores organicos 6001 par', 120),('Filtro acidos 6002 par', 150),
    ('Filtro amoniaco 6004 par', 180),('Careta soldador automatica', 800),
    ('Lentes seguridad antiempanio', 80),('Lentes seguridad oscurecedor', 150),
    ('Arnés seguridad 5 puntos', 1800),('Línea vida retráctil 10m', 2500),
    ('Casco seguridad tipo I', 180),('Casco seguridad tipo II', 280),
    ('Guantes cuero cromo soldador par', 100),('Guantes nitrilo industrial par', 60),
    ('Guantes hule latex industrial par', 50),('Rodilleras industrial par', 150),
    ('Faja lumbar soporte', 350),('Tapones auditivos reutilizables par', 50),
    ('Orejeras auditivas 25dB', 120),('Traje tyvek desechable', 180)]:
    push(desc, D(epp, 'Tipo: EPP'), 'pieza', epp, base)

# ==============================
# 18. FINAL BULK - fill remaining gap to 3000+
# ==============================

# EV chargers and solar (new categories not in existing)
ev = 'Movilidad Electrica'
for kw, price in [(3.3, 5000), (7.2, 8000), (11, 12000), (22, 18000)]:
    push(f'Cargador VE portatil {kw}kW NEMA 5-15', D(ev, 'Tipo: Cargador portatil'), 'pieza', ev, price)
    push(f'Cargador VE mural {kw}kW Tipo 2', D(ev, 'Tipo: Cargador mural'), 'pieza', ev, int(price * 1.3))

for kw, price in [(50, 80000), (100, 150000), (150, 220000), (200, 300000)]:
    push(f'Cargador VE rapido DC {kw}kW CCS/CHAdeMO', D(ev, 'Tipo: Cargador rapido DC'), 'pieza', ev, price)

# Cable management accessories
push('Cable VEV 5m Tipo 2 a Tipo 2', D(ev, 'Tipo: Cable VE'), 'pieza', ev, 2500)
push('Cable VEV 7m Tipo 2 a Tipo 2', D(ev, 'Tipo: Cable VE'), 'pieza', ev, 3200)
push('Soporte cargador VE pared', D(ev, 'Tipo: Soporte'), 'pieza', ev, 800)
push('Pedestal cargador VE exterior', D(ev, 'Tipo: Pedestal'), 'pieza', ev, 2500)

# Mini-split accessories (new category)
msa = 'Accesorios Minisplit'
for desc, base in [('Kit instalacion 5m tuberia + cable + dren', 800),
    ('Kit instalacion 8m tuberia + cable + dren', 1200),
    ('Kit instalacion 12m tuberia + cable + dren', 1800),
    ('Soporte pared universal 1-2TR', 250),
    ('Soporte pared universal 3-5TR', 400),
    ('Placa montaje pared minisplit', 180),
    ('Base piso minisplit 1-2TR', 350),
    ('Base piso minisplit 3-5TR', 550),
    ('Cubre tuberia plastico 3x2x1m blanco', 80),
    ('Cubre tuberia plastico 3x2x2m blanco', 120),
    ('Cubre tuberia plastico 3x2x3m blanco', 180),
    ('Cinta drenaje 1/2x10m', 60),
    ('Manguera drenaje 3/4 x 5m', 50),
    ('Manguera drenaje 3/4 x 10m', 80),
    ('Manguera drenaje 1/2 x 5m', 40),
    ('Manguera drenaje 1/2 x 10m', 70),
    ('Vinil protector tuberia 10m', 40),
    ('Cinta electrica 3M 1800 20m', 35),
    ('Cinta electrica 3M 1800 5m', 15),
    ('Conector electrico SMC 3/8', 25),
    ('Conector electrico SMC 1/2', 30),
    ('Conector electrico SMC 3/4', 40),
    ('Niple galvanizado 1/2 x 10cm', 15),
    ('Niple galvanizado 3/4 x 10cm', 20),
    ('Niple galvanizado 1 x 10cm', 30),
    ('Curva galvanizada 1/2 90', 20),
    ('Curva galvanizada 3/4 90', 25),
    ('Curva galvanizada 1 90', 35),
    ('Caja registro 4x4 cuadrada', 25),
    ('Caja registro 4x2 octagonal', 20),
    ('Tapas caja registro metal', 10),
    ('Conector ducto flexible 1/2', 35),
    ('Conector ducto flexible 3/4', 45),
    ('Ducto flexible metalico 1/2 x 3m', 60),
    ('Ducto flexible metalico 3/4 x 3m', 80)]:
    push(desc, D(msa, 'Tipo: Accesorio'), 'pieza', msa, base)

# More refacciones de ventilacion - belts and bearings bulk
rv = 'Refacciones de Ventilacion'
for profile in ['A', 'B', 'C', 'D']:
    for length in range(26, 100, 5):
        if profile == 'A' and length <= 60:
            push(f'Banda {profile}{length}', D(rv, 'Tipo: Banda'), 'pieza', rv, 60 + length // 5 * 10)
for size in range(6200, 6225):
    push(f'Balero {size}', D(rv, 'Tipo: Balero'), 'pieza', rv, 60 + (size - 6200) * 15)
for size in ['UCP204', 'UCP205', 'UCP206', 'UCP207', 'UCP208', 'UCP209', 'UCP210', 'UCP211', 'UCP212']:
    push(f'Balero {size}', D(rv, 'Tipo: Balero'), 'pieza', rv, 120 + hash(size) % 400)

# HVAC tools & specialty equipment
ht = 'Herramientas Electricas'
for desc, base in [('Rotomartillo SDS 1" 1200W', 2500), ('Rotomartillo SDS 1-1/2" 1500W', 3500),
    ('Martillo demoledor 30lbs 1500W', 5500), ('Martillo demoledor 60lbs 1800W', 8000),
    ('Cortador tubo cobre 1/8-1"', 200), ('Cortador tubo cobre 1/8-2"', 350),
    ('Abocardador cobre 45 flaring 1/8-5/8', 400), ('Abocardador cobre 45 flaring 3/16-3/4', 550),
    ('Expansor tuberia cobre 1/4-7/8', 800), ('Expansor tuberia cobre 3/8-1-1/8', 1000),
    ('Dobladora tubo cobre 1/4"', 150), ('Dobladora tubo cobre 3/8"', 180),
    ('Dobladora tubo cobre 1/2"', 220), ('Dobladora tubo cobre 5/8"', 280),
    ('Dobladora tubo cobre 3/4"', 350), ('Dobladora tubo cobre 7/8"', 400),
    ('Prensa hidraulica terminales 10T', 3500), ('Prensa hidraulica terminales 16T', 5000),
    ('Pinza pelacables automatica', 250), ('Pinza ponchadora RJ45/11', 180),
    ('Multimetro digital True RMS 6000 cuentas', 800), ('Multimetro digital HVAC autorango', 1200),
    ('Pinza amperimetrica True RMS 1000A', 2000), ('Pinza amperimetrica AC/DC 600A', 1500),
    ('Medidor temperatura laser infrarrojo', 600), ('Torquimetro 1/4 lb-in 10-150', 500),
    ('Torquimetro 3/8 lb-in 30-300', 700), ('Torquimetro 1/2 lb-ft 20-150', 900),
    ('Llave allen mm metrica 1.5-10 9pz', 200), ('Llave allen pulgadas 1/16-1/4 9pz', 200)]:
    push(desc, D(ht, 'Tipo: Herramienta'), 'pieza', ht, base)

# Another 30 BMS items
bms = 'Controles y Automatizacion (BMS)'
for desc, base in [('Controlador DDC 8 puntos', 4000), ('Controlador DDC 16 puntos', 6500),
    ('Controlador DDC 32 puntos', 10000), ('Controlador DDC 64 puntos', 18000),
    ('Controlador zona VAV BACnet MS/TP', 5000), ('Expansion 8E/8S BACnet', 3000),
    ('Expansion 16E BACnet', 3200), ('Expansion 16S BACnet', 3500),
    ('Modulo AI 8pt 4-20mA', 2500), ('Modulo AO 8pt 4-20mA', 2800),
    ('Modulo DI 8pt', 1800), ('Modulo DO 8pt relay', 2000),
    ('Modulo UI 8pt universal', 3000), ('Modulo UO 8pt universal', 3500),
    ('Panel control VRF Touch 7"', 8000), ('Panel operador BMS Touch 7"', 12000),
    ('Panel operador BMS Touch 10"', 18000), ('Panel operador BMS Touch 15"', 28000),
    ('Gateway BACnet IP a Modbus TCP', 7000), ('Gateway BACnet IP a KNX', 9000),
    ('Router BACnet/IP router', 5000), ('Switch Ethernet gestionable 8pt', 2500),
    ('Switch Ethernet gestionable 16pt', 4000), ('Servidor BMS embebido 50pt', 25000),
    ('Servidor BMS embebido 200pt', 50000), ('Servidor BMS embebido 500pt', 90000),
    ('Analizador redes electricas trifasico', 12000), ('Medidor energia pulso KYZ', 2000),
    ('Sensor corriente toroidal 200A', 800), ('Sensor corriente toroidal 400A', 1200),
    ('Sensor corriente toroidal 1000A', 2000), ('Sensor corriente toroidal 2000A', 3500)]:
    push(desc, D(bms, 'Tipo: Control BMS'), 'pieza', bms, base)

# More Reemplazo Componentes - electrical components
rcat = 'Reemplazo Componentes'
for desc, base, tipo in [
   ('Contactor 2P 20A 24V', 250, 'Contactor'),
   ('Contactor 3P 20A 24V', 350, 'Contactor'),
   ('Contactor 2P 30A 24V', 320, 'Contactor'),
   ('Contactor 3P 40A 24V', 500, 'Contactor'),
   ('Contactor 3P 60A 24V', 700, 'Contactor'),
   ('Contactor 3P 100A 24V', 1200, 'Contactor'),
   ('Rele sobrecarga termico 1.6-2.5A', 250, 'Rele sobrecarga'),
   ('Rele sobrecarga termico 4-6A', 280, 'Rele sobrecarga'),
   ('Rele sobrecarga termico 9-13A', 320, 'Rele sobrecarga'),
   ('Rele sobrecarga termico 18-25A', 380, 'Rele sobrecarga'),
   ('Rele sobrecarga termico 30-40A', 450, 'Rele sobrecarga'),
   ('Guardamotor 1.6-2.5A', 450, 'Guardamotor'),
   ('Guardamotor 4-6A', 500, 'Guardamotor'),
   ('Guardamotor 9-14A', 600, 'Guardamotor'),
   ('Guardamotor 23-32A', 800, 'Guardamotor'),
   ('Guardamotor 40-52A', 1100, 'Guardamotor'),
   ('Interruptor cuchilla 30A 3P', 400, 'Interruptor cuchilla'),
   ('Interruptor cuchilla 60A 3P', 550, 'Interruptor cuchilla'),
   ('Interruptor cuchilla 100A 3P', 800, 'Interruptor cuchilla'),
   ('Interruptor cuchilla 200A 3P', 1500, 'Interruptor cuchilla'),
   ('Interruptor cuchilla 400A 3P', 3000, 'Interruptor cuchilla'),
   ('Base portafusible 30A 2P', 120, 'Base portafusible'),
   ('Base portafusible 30A 3P', 180, 'Base portafusible'),
   ('Base portafusible 60A 2P', 200, 'Base portafusible'),
   ('Base portafusible 60A 3P', 280, 'Base portafusible'),
   ('Base portafusible 100A 3P', 450, 'Base portafusible'),
   ('Fusible cartucho 30A 250V', 30, 'Fusible'),
   ('Fusible cartucho 60A 250V', 50, 'Fusible'),
   ('Fusible cartucho 100A 250V', 80, 'Fusible'),
   ('Fusible cartucho 200A 250V', 150, 'Fusible'),
   ('Fusible botella 30A 600V', 120, 'Fusible'),
   ('Fusible botella 60A 600V', 180, 'Fusible'),
   ('Fusible botella 100A 600V', 280, 'Fusible'),
   ('Fusible botella 200A 600V', 500, 'Fusible'),
   ('Fusible botella 400A 600V', 900, 'Fusible'),
   ('Transformador control 500VA 480/240-24V', 1500, 'Transformador'),
   ('Transformador control 100VA 240-24V', 400, 'Transformador'),
   ('Transformador control 250VA 480/240-24V', 800, 'Transformador'),
   ('Transformador control 1000VA 480/240-24V', 2500, 'Transformador'),
   ('Transformador control 2000VA 480-24V', 4000, 'Transformador'),
]:
    push(desc, D(rcat, f'Tipo: {tipo}'), 'pieza', rcat, base)

# More Ducteria accessories
duct = 'Ducteria'
for size in ['4"', '6"', '8"', '10"', '12"']:
    push(f'Difusor circular {size} aluminio', D(duct, 'Tipo: Difusor'), 'pieza', duct, 100 + hash(size) % 300)
    push(f'Rejilla retorno {size}x{size} aluminio', D(duct, 'Tipo: Rejilla'), 'pieza', duct, 80 + hash(size[::-1]) % 250)

# ==============================
# 19. FINAL BULK 2 - push past 3000
# ==============================

# Massive reemplazo componentes - 200 generic AC/parts
rcat = 'Reemplazo Componentes'
ac_components = [
    (f'Capacitor {uf}uF {v}V', 50 + uf * 10 + (450 if v == 450 else 600))
    for uf in [1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7.5, 8, 10, 12.5, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 100, 120]
    for v in [370, 440]
]
for name, price in ac_components[:50]:
    push(f'Capacitor {name}', D(rcat, 'Tipo: Capacitor'), 'pieza', rcat, price)

# More belts
rv = 'Refacciones de Ventilacion'
for profile in ['AX', 'BX', 'CX', '5V', '8V']:
    for length in range(30, 120, 10):
        price = 80 + (ord(profile[0]) - 65) * 50 + length
        if price < 800:
            push(f'Banda {profile}{length}', D(rv, 'Tipo: Banda'), 'pieza', rv, price)

# More VFDs
ie = 'Instalacion Electrica'
vfd_hps = [0.25, 0.33, 0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500]
for hp in vfd_hps:
    for volts, mult in [('230V', 1), ('460V', 1.15), ('575V', 1.25)]:
        price = int(1500 * (hp / 0.25) ** 0.6 * mult)
        if 1500 < price < 500000:
            push(f'Variador frecuencia {hp}HP {volts} 3F', D(ie, f'Tipo: VFD {volts}'), 'pieza', ie, price)

# More pumps
bw = 'Bombas de Agua'
pump_hps = [0.25, 0.33, 0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200, 300, 400, 500]
for hp in pump_hps:
    for t, mt in [('Horizontal multietapa', 1.2), ('Centrifuga partida', 1.0), ('Autocebante', 1.4)]:
        price = int(2000 * (hp / 0.25) ** 0.6 * mt)
        if price < 1000000:
            push(f'Bomba {t} {hp}HP', D(bw, f'Tipo: {t}', f'Cap: {hp}HP'), 'pieza', bw, price)

# More Aislamiento
aisl = 'Aislamiento Termico'
for od in ['3/8"', '1/2"', '5/8"', '3/4"', '7/8"', '1"', '1-1/8"', '1-3/8"', '1-5/8"']:
    for wall in ['1/4"', '1/2"', '3/4"', '1"', '1-1/2"', '2"']:
        price = 40 + hash(od + wall) % 300
        push(f'Aislante elastomerico tubo {od} x {wall} 2m', D(aisl, 'Tipo: Tubo elastomerico'), 'pieza', aisl, price)

# More BMS
bms = 'Controles y Automatizacion (BMS)'
for val in range(1, 50):
    push(f'Licencia punto BMS {val}pt', D(bms, 'Tipo: Licencia BMS'), 'servicio', bms, 1500 + val * 800)

# More Gas Refrigerante - small cylinders
gr = 'Gas Refrigerante'
for refr, price in [('R-22', 2500), ('R-410A', 3000), ('R-32', 2200), ('R-404A', 3500), ('R-134a', 2000),
    ('R-407C', 2800), ('R-507', 4000), ('R-1234yf', 15000)]:
    push(f'{refr} cilindro recarga 2kg', D(gr, 'Presentacion: Cilindro recarga 2 kg'), 'pieza', gr, price)

# More Mantto Preventivo items
mp = 'Mantto Preventivo'
for freq in ['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual']:
    for tipo, base in [('Residencial', 3000), ('Comercial 5-20TR', 6000), ('Industrial 20+TR', 12000)]:
        push(f'Plan Mantto {freq} {tipo}', D(mp, f'Tipo: Plan {freq}', f'Cap: {tipo}'), 'servicio', mp, base)

# ==============================
# 20. FINAL BULK 3 - push past 3000
# ==============================

# More Mantto Preventivo contracts
mp = 'Mantto Preventivo'
for area in ['100m2', '200m2', '500m2', '1000m2', '2000m2']:
    for freq, mult in [('Mensual', 12), ('Bimestral', 6), ('Trimestral', 4), ('Semestral', 2), ('Anual', 1)]:
        base = 2000 + hash(area) % 5000
        push(f'Mantto preventivo {area} {freq}', D(mp, f'Tipo: Contrato {freq}', f'Area: {area}'), 'servicio', mp, base * mult)

# More Gas Refrigerante small formats
gr = 'Gas Refrigerante'
for refr, price in [('R-22', 500), ('R-410A', 600), ('R-32', 450), ('R-404A', 700), ('R-134a', 400),
    ('R-407C', 550), ('R-507', 800), ('R-1234yf', 3500)]:
    push(f'{refr} lata 400g', D(gr, 'Presentacion: Lata 400g'), 'pieza', gr, price)

# More Ducteria sizes
duct = 'Ducteria'
for w in [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 30, 36]:
    for d in [4, 5, 6, 7, 8, 9, 10, 11, 12]:
        if w >= d and w <= 48:
            price = 80 + w * d // 2
            push(f'Ducto rectangular galv {w}x{d} x1m', D(duct, 'Tipo: Ducto'), 'pieza', duct, price)

# More accessories - generic HVAC parts
gen_cat = 'Herramientas y Equipo de Servicio'
for desc, base in [
    ('Aspiradora liquido/solido 15L', 1200), ('Aspiradora liquido/solido 30L', 1800),
    ('Lubricante penetrante WD-40 400ml', 60), ('Lubricante silicon spray 400ml', 80),
    ('Limpieza espuma evaporador 400ml', 120), ('Limpieza serpentina condensador 400ml', 100),
    ('Tableta tratamiento biologicos 1kg', 250), ('Alguicida torre enfriamiento 1L', 180),
    ('Inhibidor corrosion torre enfriamiento 1L', 220), ('Desincrustante 1L', 150),
    ('Soldadura fosforo cobre 15% 1/8 5var', 250), ('Soldadura plata 45% 1/16 5var', 600),
    ('Flux pasta soldadura 200g', 80), ('Desoxidante flux spray', 120),
    ('Nitrogeno para presurizacion tanque 6m3', 1500), ('Nitrogeno service 1m3', 300),
    ('Acetileno service 6m3', 2000), ('Oxigeno service 6m3', 1500),
    ('Tanque vacio refrigerante 30lb', 800), ('Tanque vacio refrigerante 50lb', 1200),
    ('Adaptador 1/4SAE a 5/16SAE', 80), ('Adaptador 1/4SAE a 3/8SAE', 90),
    ('Valvula de servicio 1/4 SAE con nucleo', 60), ('Tapon 1/4SAE metal', 15)
]:
    push(desc, D(gen_cat, 'Tipo: General'), 'pieza', gen_cat, base)

# More EPP
epp = 'Equipo de Seguridad (EPP)'
for desc, base in [
    ('Chaleco reflejante alta visibilidad', 150), ('Chaleco seguridad tipo chaleco', 120),
    ('Mascarilla N95 caja 50', 350), ('Mascarilla KN95 caja 50', 300),
    ('Bota seguridad punta acero talla 26', 450), ('Bota seguridad punta compuesta talla 26', 550),
    ('Bota dielectricas 20kV talla 26', 800), ('Casquillo proteccion cabeza', 60),
    ('Goggles seguridad antiempanio', 100), ('Protector facial completo', 180),
    ('Arnes cuerpo completo con absorvedor', 1800), ('Linea vida retractil 6m', 2000),
    ('Cuerda estatica poliester 12mm x 10m', 600), ('Mosqueton acero seguridad', 200),
    ('Anclaje temporal 1t', 300)
]:
    push(desc, D(epp, 'Tipo: EPP'), 'pieza', epp, base)

# ==============================
# MERGE AND OUTPUT
# ==============================
merged = existing + items
import sys
sys.stdout.reconfigure(encoding='utf-8')
print(json.dumps(merged, ensure_ascii=False, indent=2))
print(f'\n---STATS---\nExisting: {len(existing)}\nNew: {len(items)}\nTotal: {len(merged)}', file=__import__('sys').stderr)
