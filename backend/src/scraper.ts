const MARKUP_PERCENTAGE = 0.35;
const FETCH_TIMEOUT = 10000;

interface SearchResult {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  availableQuantity: number;
  thumbnail: string;
  freeShipping: boolean;
  deliveryDays: number;
  source: string;
  provider: string;
}

async function fetchWithTimeout(url: string, options?: RequestInit, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch {
    clearTimeout(id);
    throw new Error('Timeout');
  }
}

async function searchClimasMonterrey(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const res = await fetchWithTimeout(
      `https://www.climasmonterrey.com/api/v1/products?limit=200`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return [];
    const data: any = await res.json();
    const products = data?.payload?.products || [];
    const q = query.toLowerCase();

    const filtered = products.filter((p: any) =>
      (p.name || '').toLowerCase().includes(q)
    ).slice(0, limit);

    return filtered.map((p: any, i: number) => {
      const basePrice = p.selling_price || 0;
      const finalPrice = Math.round(basePrice * (1 + MARKUP_PERCENTAGE) * 100) / 100;
      const imgUrl = p.images?.[0]?.url
        ? `https://www.climasmonterrey.com${p.images[0].url}`
        : 'https://via.placeholder.com/200?text=CM';

      return {
        id: `cm-${p.id || i}`,
        title: p.name || 'Producto',
        price: finalPrice,
        currency: 'MXN',
        condition: 'Nuevo',
        availableQuantity: p.stock_available || 5,
        thumbnail: imgUrl,
        freeShipping: false,
        deliveryDays: 5,
        source: `https://www.climasmonterrey.com${p.url || ''}`,
        provider: 'Climas Monterrey',
      };
    });
  } catch {
    return [];
  }
}

async function searchCoresa(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://www.grupocoresa.com/rest/V1/products?searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5Bfield%5D=name&searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5Bvalue%5D=%25${encoded}%25&searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5BconditionType%5D=like&searchCriteria%5BpageSize%5D=${limit}`;
    const res = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];
    const data: any = await res.json();
    const items = data?.items || [];

    return items.map((p: any) => {
      const basePrice = p.price || 0;
      const finalPrice = Math.round(basePrice * (1 + MARKUP_PERCENTAGE) * 100) / 100;
      const imgFile = p.media_gallery_entries?.[0]?.file || '';
      const thumbnail = imgFile
        ? `https://www.grupocoresa.com/media/catalog/product${imgFile}`
        : 'https://via.placeholder.com/200?text=Coresa';

      return {
        id: `coresa-${p.id}`,
        title: p.name || 'Producto',
        price: finalPrice,
        currency: 'MXN',
        condition: 'Nuevo',
        availableQuantity: 5,
        thumbnail,
        freeShipping: false,
        deliveryDays: 4,
        source: `https://www.grupocoresa.com/${p.custom_attributes?.find((a: any) => a.attribute_code === 'url_key')?.value || ''}`,
        provider: 'Grupo Coresa',
      };
    });
  } catch {
    return [];
  }
}

const FALLBACK_PRODUCTS: any[] = [
  // Compresores
  { title: 'Compresor Scroll Copeland 5HP R-410A', price: 12500, thumbnail: 'https://http2.mlstatic.com/D_716838-MLA74263967275_022024-O.jpg', freeShipping: true },
  { title: 'Compresor Scroll Copeland 7.5HP R-410A', price: 18900, thumbnail: 'https://http2.mlstatic.com/D_716838-MLA74263967275_022024-O.jpg', freeShipping: false },
  { title: 'Compresor Scroll Copeland 3HP R-22', price: 9800, thumbnail: 'https://http2.mlstatic.com/D_716838-MLA74263967275_022024-O.jpg', freeShipping: false },
  { title: 'Compresor Scroll Copeland 10HP R-410A', price: 28500, thumbnail: 'https://http2.mlstatic.com/D_716838-MLA74263967275_022024-O.jpg', freeShipping: false },
  { title: 'Compresor Scroll Copeland 15HP R-410A', price: 42000, thumbnail: 'https://http2.mlstatic.com/D_716838-MLA74263967275_022024-O.jpg', freeShipping: false },
  { title: 'Compresor Hermético Embraco 1/2HP R-134a', price: 3800, thumbnail: 'https://http2.mlstatic.com/D_908895-MLA72158231142_102023-O.jpg', freeShipping: false },
  { title: 'Compresor Hermético Embraco 1/3HP R-134a', price: 3200, thumbnail: 'https://http2.mlstatic.com/D_908895-MLA72158231142_102023-O.jpg', freeShipping: false },
  { title: 'Compresor Hermético Embraco 1/4HP R-134a', price: 2800, thumbnail: 'https://http2.mlstatic.com/D_908895-MLA72158231142_102023-O.jpg', freeShipping: false },
  { title: 'Compresor Scroll Danfoss 4HP R-410A', price: 11200, thumbnail: 'https://http2.mlstatic.com/D_716838-MLA74263967275_022024-O.jpg', freeShipping: false },
  { title: 'Compresor Scroll Danfoss 6HP R-410A', price: 16800, thumbnail: 'https://http2.mlstatic.com/D_716838-MLA74263967275_022024-O.jpg', freeShipping: false },

  // Gases Refrigerantes
  { title: 'Gas Refrigerante R-22 25kg', price: 6800, thumbnail: 'https://http2.mlstatic.com/D_757646-MLA72966758049_112023-O.jpg', freeShipping: false },
  { title: 'Gas Refrigerante R-410A 11.3kg', price: 4500, thumbnail: 'https://http2.mlstatic.com/D_786279-MLA72024268608_102023-O.jpg', freeShipping: false },
  { title: 'Gas Refrigerante R-410A 25kg', price: 8900, thumbnail: 'https://http2.mlstatic.com/D_786279-MLA72024268608_102023-O.jpg', freeShipping: false },
  { title: 'Gas Refrigerante R-32 10kg', price: 5200, thumbnail: 'https://http2.mlstatic.com/D_786279-MLA72024268608_102023-O.jpg', freeShipping: false },
  { title: 'Gas Refrigerante R-134a 13.6kg', price: 5800, thumbnail: 'https://http2.mlstatic.com/D_757646-MLA72966758049_112023-O.jpg', freeShipping: false },
  { title: 'Gas Refrigerante R-404A 10kg', price: 7200, thumbnail: 'https://http2.mlstatic.com/D_757646-MLA72966758049_112023-O.jpg', freeShipping: false },
  { title: 'Gas Refrigerante R-407C 11kg', price: 6100, thumbnail: 'https://http2.mlstatic.com/D_757646-MLA72966758049_112023-O.jpg', freeShipping: false },
  { title: 'Gas Refrigerante R-290 (Propano) 10kg', price: 3400, thumbnail: 'https://http2.mlstatic.com/D_757646-MLA72966758049_112023-O.jpg', freeShipping: false },
  { title: 'Gas Refrigerante R-600a (Isobutano) 10kg', price: 2800, thumbnail: 'https://http2.mlstatic.com/D_757646-MLA72966758049_112023-O.jpg', freeShipping: false },

  // Válvulas
  { title: 'Válvula de Expansión Termostática Danfoss', price: 1850, thumbnail: 'https://http2.mlstatic.com/D_797548-MLA72100433401_102023-O.jpg', freeShipping: true },
  { title: 'Válvula de Expansión Termostática Sporlan', price: 2200, thumbnail: 'https://http2.mlstatic.com/D_797548-MLA72100433401_102023-O.jpg', freeShipping: true },
  { title: 'Válvula Solenoide 1/2" 220V', price: 780, thumbnail: 'https://http2.mlstatic.com/D_815891-MLA71700840715_092023-O.jpg', freeShipping: true },
  { title: 'Válvula Solenoide 3/4" 220V', price: 980, thumbnail: 'https://http2.mlstatic.com/D_815891-MLA71700840715_092023-O.jpg', freeShipping: true },
  { title: 'Válvula Solenoide 1" 220V', price: 1250, thumbnail: 'https://http2.mlstatic.com/D_815891-MLA71700840715_092023-O.jpg', freeShipping: true },
  { title: 'Válvula de Servicio 1/4"', price: 180, thumbnail: 'https://http2.mlstatic.com/D_729835-MLA71547363270_092023-O.jpg', freeShipping: true },
  { title: 'Válvula de Servicio 3/8"', price: 220, thumbnail: 'https://http2.mlstatic.com/D_729835-MLA71547363270_092023-O.jpg', freeShipping: true },
  { title: 'Válvula de Servicio 1/2"', price: 280, thumbnail: 'https://http2.mlstatic.com/D_729835-MLA71547363270_092023-O.jpg', freeShipping: true },
  { title: 'Válvula de Seguridad para Refrigeración 1/4"', price: 350, thumbnail: 'https://http2.mlstatic.com/D_729835-MLA71547363270_092023-O.jpg', freeShipping: true },
  { title: 'Válvula de Paso Tipo Bola 1/2"', price: 320, thumbnail: 'https://http2.mlstatic.com/D_729835-MLA71547363270_092023-O.jpg', freeShipping: true },

  // Capacitores
  { title: 'Capacitor de Arranque 35/5 uF 440V', price: 280, thumbnail: 'https://http2.mlstatic.com/D_641916-MLA70825686445_082023-O.jpg', freeShipping: true },
  { title: 'Capacitor de Arranque 40/5 uF 440V', price: 310, thumbnail: 'https://http2.mlstatic.com/D_641916-MLA70825686445_082023-O.jpg', freeShipping: true },
  { title: 'Capacitor de Arranque 45/5 uF 440V', price: 340, thumbnail: 'https://http2.mlstatic.com/D_641916-MLA70825686445_082023-O.jpg', freeShipping: true },
  { title: 'Capacitor de Arranque 50/5 uF 440V', price: 370, thumbnail: 'https://http2.mlstatic.com/D_641916-MLA70825686445_082023-O.jpg', freeShipping: true },
  { title: 'Capacitor Permanente 5 uF 370V', price: 120, thumbnail: 'https://http2.mlstatic.com/D_641916-MLA70825686445_082023-O.jpg', freeShipping: true },
  { title: 'Capacitor Permanente 7.5 uF 370V', price: 140, thumbnail: 'https://http2.mlstatic.com/D_641916-MLA70825686445_082023-O.jpg', freeShipping: true },
  { title: 'Capacitor Permanente 10 uF 370V', price: 160, thumbnail: 'https://http2.mlstatic.com/D_641916-MLA70825686445_082023-O.jpg', freeShipping: true },
  { title: 'Capacitor Dual 30+5 uF 440V', price: 250, thumbnail: 'https://http2.mlstatic.com/D_641916-MLA70825686445_082023-O.jpg', freeShipping: true },
  { title: 'Capacitor Dual 55+5 uF 440V', price: 400, thumbnail: 'https://http2.mlstatic.com/D_641916-MLA70825686445_082023-O.jpg', freeShipping: true },
  { title: 'Capacitor Dual 60+7.5 uF 440V', price: 430, thumbnail: 'https://http2.mlstatic.com/D_641916-MLA70825686445_082023-O.jpg', freeShipping: true },

  // Termostatos y Controles
  { title: 'Termostato Digital Honeywell Pro 1', price: 1250, thumbnail: 'https://http2.mlstatic.com/D_764881-MLA74118225818_012024-O.jpg', freeShipping: true },
  { title: 'Termostato Digital Honeywell RTH8580WF', price: 1850, thumbnail: 'https://http2.mlstatic.com/D_764881-MLA74118225818_012024-O.jpg', freeShipping: true },
  { title: 'Termostato Mecánico para Refrigeración', price: 350, thumbnail: 'https://http2.mlstatic.com/D_892132-MLA71080098680_082023-O.jpg', freeShipping: true },
  { title: 'Controlador Electrónico Dixell XR06CX', price: 1450, thumbnail: 'https://http2.mlstatic.com/D_892132-MLA71080098680_082023-O.jpg', freeShipping: true },
  { title: 'Controlador Electrónico Eliwell EW-974', price: 1680, thumbnail: 'https://http2.mlstatic.com/D_892132-MLA71080098680_082023-O.jpg', freeShipping: true },
  { title: 'Presostato de Alta y Baja 1/4"', price: 890, thumbnail: 'https://http2.mlstatic.com/D_852199-MLA72463775602_102023-O.jpg', freeShipping: true },
  { title: 'Presostato de Aceite Honeywell', price: 1250, thumbnail: 'https://http2.mlstatic.com/D_852199-MLA72463775602_102023-O.jpg', freeShipping: true },
  { title: 'Contacto 2 polos 40A para Refrigeración', price: 450, thumbnail: 'https://http2.mlstatic.com/D_729835-MLA71547363270_092023-O.jpg', freeShipping: true },
  { title: 'Contacto 3 polos 30A para HVAC', price: 520, thumbnail: 'https://http2.mlstatic.com/D_729835-MLA71547363270_092023-O.jpg', freeShipping: true },
  { title: 'Relé de Arranque 3/4 HP', price: 390, thumbnail: 'https://http2.mlstatic.com/D_858808-MLA75098397964_032024-O.jpg', freeShipping: true },

  // Motores y Ventiladores
  { title: 'Motor Ventilador Condensador 1/4 HP', price: 3200, thumbnail: 'https://http2.mlstatic.com/D_736539-MLA74424360713_022024-O.jpg', freeShipping: false },
  { title: 'Motor Ventilador Condensador 1/3 HP', price: 3800, thumbnail: 'https://http2.mlstatic.com/D_736539-MLA74424360713_022024-O.jpg', freeShipping: false },
  { title: 'Motor Ventilador Condensador 1/2 HP', price: 4500, thumbnail: 'https://http2.mlstatic.com/D_736539-MLA74424360713_022024-O.jpg', freeShipping: false },
  { title: 'Motor Ventilador Condensador 3/4 HP', price: 5600, thumbnail: 'https://http2.mlstatic.com/D_736539-MLA74424360713_022024-O.jpg', freeShipping: false },
  { title: 'Motor Ventilador Evaporador 1/8 HP', price: 1800, thumbnail: 'https://http2.mlstatic.com/D_736539-MLA74424360713_022024-O.jpg', freeShipping: false },
  { title: 'Motor Ventilador Evaporador 1/6 HP', price: 2200, thumbnail: 'https://http2.mlstatic.com/D_736539-MLA74424360713_022024-O.jpg', freeShipping: false },
  { title: 'Ventilador Axial 20" Industrial', price: 3200, thumbnail: 'https://http2.mlstatic.com/D_857483-MLA71048302540_082023-O.jpg', freeShipping: false },
  { title: 'Ventilador Axial 24" Industrial', price: 4200, thumbnail: 'https://http2.mlstatic.com/D_857483-MLA71048302540_082023-O.jpg', freeShipping: false },
  { title: 'Ventilador de Techo Industrial 56"', price: 4200, thumbnail: 'https://http2.mlstatic.com/D_916869-MLA70984970422_082023-O.jpg', freeShipping: false },
  { title: 'Turbina para Aire Acondicionado Centrífuga', price: 2800, thumbnail: 'https://http2.mlstatic.com/D_857483-MLA71048302540_082023-O.jpg', freeShipping: false },

  // Minisplits y Equipos
  { title: 'Minisplit Mirage 1TR 220V R-410A', price: 5200, thumbnail: 'https://http2.mlstatic.com/D_723182-MLA76396009512_052024-O.jpg', freeShipping: false },
  { title: 'Minisplit Mirage 1.5TR 220V R-410A', price: 6500, thumbnail: 'https://http2.mlstatic.com/D_723182-MLA76396009512_052024-O.jpg', freeShipping: false },
  { title: 'Minisplit Mirage 2TR 220V R-410A', price: 7800, thumbnail: 'https://http2.mlstatic.com/D_723182-MLA76396009512_052024-O.jpg', freeShipping: false },
  { title: 'Minisplit LG 1TR Inverter R-32', price: 6200, thumbnail: 'https://http2.mlstatic.com/D_712745-MLA75203907745_032024-O.jpg', freeShipping: false },
  { title: 'Minisplit LG 1.5TR Inverter R-32', price: 7500, thumbnail: 'https://http2.mlstatic.com/D_712745-MLA75203907745_032024-O.jpg', freeShipping: false },
  { title: 'Minisplit LG 2TR Inverter R-32', price: 8900, thumbnail: 'https://http2.mlstatic.com/D_712745-MLA75203907745_032024-O.jpg', freeShipping: false },
  { title: 'Minisplit York 1TR R-410A', price: 5500, thumbnail: 'https://http2.mlstatic.com/D_723182-MLA76396009512_052024-O.jpg', freeShipping: false },
  { title: 'Minisplit York 2TR R-410A', price: 8200, thumbnail: 'https://http2.mlstatic.com/D_723182-MLA76396009512_052024-O.jpg', freeShipping: false },
  { title: 'Minisplit Carrier 1TR Inverter R-32', price: 6800, thumbnail: 'https://http2.mlstatic.com/D_712745-MLA75203907745_032024-O.jpg', freeShipping: false },
  { title: 'Minisplit Carrier 2TR Inverter R-32', price: 9500, thumbnail: 'https://http2.mlstatic.com/D_712745-MLA75203907745_032024-O.jpg', freeShipping: false },

  // Unidades Condensadoras y Evaporadoras
  { title: 'Unidad Condensadora 2TR R-410A', price: 18500, thumbnail: 'https://http2.mlstatic.com/D_657490-MLA74026359477_012024-O.jpg', freeShipping: false },
  { title: 'Unidad Condensadora 3TR R-410A', price: 24500, thumbnail: 'https://http2.mlstatic.com/D_657490-MLA74026359477_012024-O.jpg', freeShipping: false },
  { title: 'Unidad Condensadora 5TR R-410A', price: 38000, thumbnail: 'https://http2.mlstatic.com/D_657490-MLA74026359477_012024-O.jpg', freeShipping: false },
  { title: 'Unidad Evaporadora 24,000 BTU', price: 5800, thumbnail: 'https://http2.mlstatic.com/D_781074-MLA76059898836_052024-O.jpg', freeShipping: false },
  { title: 'Unidad Evaporadora 36,000 BTU', price: 7200, thumbnail: 'https://http2.mlstatic.com/D_781074-MLA76059898836_052024-O.jpg', freeShipping: false },
  { title: 'Unidad Evaporadora 48,000 BTU', price: 9200, thumbnail: 'https://http2.mlstatic.com/D_781074-MLA76059898836_052024-O.jpg', freeShipping: false },
  { title: 'Fan & Coil 1.5TR', price: 4200, thumbnail: 'https://http2.mlstatic.com/D_781074-MLA76059898836_052024-O.jpg', freeShipping: false },
  { title: 'Fan & Coil 3TR', price: 6800, thumbnail: 'https://http2.mlstatic.com/D_781074-MLA76059898836_052024-O.jpg', freeShipping: false },

  // Filtros y Accesorios
  { title: 'Filtro Secador 3/8 pulgada', price: 180, thumbnail: 'https://http2.mlstatic.com/D_892545-MLA75577723240_042024-O.jpg', freeShipping: true },
  { title: 'Filtro Secador 1/2 pulgada', price: 220, thumbnail: 'https://http2.mlstatic.com/D_892545-MLA75577723240_042024-O.jpg', freeShipping: true },
  { title: 'Filtro Secador 5/8 pulgada', price: 280, thumbnail: 'https://http2.mlstatic.com/D_892545-MLA75577723240_042024-O.jpg', freeShipping: true },
  { title: 'Filtro Aire Pleated 12x12x1', price: 85, thumbnail: 'https://http2.mlstatic.com/D_892545-MLA75577723240_042024-O.jpg', freeShipping: true },
  { title: 'Filtro Aire Pleated 14x14x1', price: 95, thumbnail: 'https://http2.mlstatic.com/D_892545-MLA75577723240_042024-O.jpg', freeShipping: true },
  { title: 'Filtro Aire Pleated 16x20x1', price: 110, thumbnail: 'https://http2.mlstatic.com/D_892545-MLA75577723240_042024-O.jpg', freeShipping: true },
  { title: 'Filtro Aire Pleated 20x20x1', price: 130, thumbnail: 'https://http2.mlstatic.com/D_892545-MLA75577723240_042024-O.jpg', freeShipping: true },
  { title: 'Filtro Deshidratador 1/4"', price: 250, thumbnail: 'https://http2.mlstatic.com/D_892545-MLA75577723240_042024-O.jpg', freeShipping: true },

  // Tubería y Cobre
  { title: 'Tubo de Cobre 1/4 pulgada x 15m', price: 1200, thumbnail: 'https://http2.mlstatic.com/D_783391-MLA75184863981_032024-O.jpg', freeShipping: false },
  { title: 'Tubo de Cobre 3/8 pulgada x 15m', price: 1800, thumbnail: 'https://http2.mlstatic.com/D_783391-MLA75184863981_032024-O.jpg', freeShipping: false },
  { title: 'Tubo de Cobre 1/2 pulgada x 15m', price: 2400, thumbnail: 'https://http2.mlstatic.com/D_783391-MLA75184863981_032024-O.jpg', freeShipping: false },
  { title: 'Tubo de Cobre 5/8 pulgada x 15m', price: 3100, thumbnail: 'https://http2.mlstatic.com/D_783391-MLA75184863981_032024-O.jpg', freeShipping: false },
  { title: 'Tubo de Cobre 3/4 pulgada x 15m', price: 4200, thumbnail: 'https://http2.mlstatic.com/D_783391-MLA75184863981_032024-O.jpg', freeShipping: false },
  { title: 'Tubo Capilar 2.4m para Refrigeración', price: 120, thumbnail: 'https://http2.mlstatic.com/D_959574-MLA72898190656_112023-O.jpg', freeShipping: true },
  { title: 'Aislante Térmico para Tubería 1/2" x 1.8m', price: 320, thumbnail: 'https://http2.mlstatic.com/D_888928-MLA74601623920_022024-O.jpg', freeShipping: true },
  { title: 'Aislante Térmico para Tubería 3/4" x 1.8m', price: 380, thumbnail: 'https://http2.mlstatic.com/D_888928-MLA74601623920_022024-O.jpg', freeShipping: true },
  { title: 'Aislante Térmico para Tubería 1" x 1.8m', price: 450, thumbnail: 'https://http2.mlstatic.com/D_888928-MLA74601623920_022024-O.jpg', freeShipping: true },

  // Herramientas
  { title: 'Manómetro Digital para Refrigerante', price: 5500, thumbnail: 'https://http2.mlstatic.com/D_750699-MLA74320753266_022024-O.jpg', freeShipping: false },
  { title: 'Manómetro Análogo para Refrigerante 2 vías', price: 1800, thumbnail: 'https://http2.mlstatic.com/D_750699-MLA74320753266_022024-O.jpg', freeShipping: false },
  { title: 'Multímetro Digital para Refrigeración', price: 1800, thumbnail: 'https://http2.mlstatic.com/D_929844-MLA72717928454_112023-O.jpg', freeShipping: true },
  { title: 'Detector de Fugas de Refrigerante', price: 3200, thumbnail: 'https://http2.mlstatic.com/D_929844-MLA72717928454_112023-O.jpg', freeShipping: true },
  { title: 'Bomba de Vacío 1/2HP 1.5CFM', price: 2800, thumbnail: 'https://http2.mlstatic.com/D_929844-MLA72717928454_112023-O.jpg', freeShipping: false },
  { title: 'Bomba de Vacío 3/4HP 3CFM', price: 3800, thumbnail: 'https://http2.mlstatic.com/D_929844-MLA72717928454_112023-O.jpg', freeShipping: false },
  { title: 'Recuperadora de Refrigerante 1/2HP', price: 8500, thumbnail: 'https://http2.mlstatic.com/D_929844-MLA72717928454_112023-O.jpg', freeShipping: false },
  { title: 'Llave de Servicio para Refrigerante 1/4"', price: 680, thumbnail: 'https://http2.mlstatic.com/D_834412-MLA72511919926_102023-O.jpg', freeShipping: true },
  { title: 'Kit de Instalación Minisplit 1/4-1/2 5m', price: 850, thumbnail: 'https://http2.mlstatic.com/D_796115-MLA72071079499_102023-O.jpg', freeShipping: true },
  { title: 'Kit de Instalación Minisplit 1/4-3/8 8m', price: 1100, thumbnail: 'https://http2.mlstatic.com/D_796115-MLA72071079499_102023-O.jpg', freeShipping: true },
  { title: 'Kit de Limpieza para Aire Acondicionado', price: 650, thumbnail: 'https://http2.mlstatic.com/D_910018-MLA73997977572_012024-O.jpg', freeShipping: true },

  // Tarjetas Electrónicas y Controles
  { title: 'Tarjeta Universal para Minisplit 12/24V', price: 850, thumbnail: 'https://http2.mlstatic.com/D_709077-MLA72352741951_102023-O.jpg', freeShipping: false },
  { title: 'Tarjeta Universal para Minisplit 220V', price: 950, thumbnail: 'https://http2.mlstatic.com/D_709077-MLA72352741951_102023-O.jpg', freeShipping: false },
  { title: 'Tarjeta Control Mirage MMEC1221C', price: 1450, thumbnail: 'https://http2.mlstatic.com/D_709077-MLA72352741951_102023-O.jpg', freeShipping: true },
  { title: 'Tarjeta Control York SMEC1221J', price: 1350, thumbnail: 'https://http2.mlstatic.com/D_709077-MLA72352741951_102023-O.jpg', freeShipping: true },
  { title: 'Control Remoto Universal para Minisplit', price: 280, thumbnail: 'https://http2.mlstatic.com/D_709077-MLA72352741951_102023-O.jpg', freeShipping: true },
  { title: 'Control Remoto Original Mirage', price: 350, thumbnail: 'https://http2.mlstatic.com/D_709077-MLA72352741951_102023-O.jpg', freeShipping: true },
  { title: 'Módulo Wi-Fi Minisplit Universal', price: 450, thumbnail: 'https://http2.mlstatic.com/D_709077-MLA72352741951_102023-O.jpg', freeShipping: true },
  { title: 'Sensor de Temperatura NTC 10K', price: 85, thumbnail: 'https://http2.mlstatic.com/D_604826-MLA70826399760_082023-O.jpg', freeShipping: true },
  { title: 'Sensor de Temperatura NTC 5K', price: 75, thumbnail: 'https://http2.mlstatic.com/D_604826-MLA70826399760_082023-O.jpg', freeShipping: true },
  { title: 'Transformador 24V 40VA', price: 320, thumbnail: 'https://http2.mlstatic.com/D_604826-MLA70826399760_082023-O.jpg', freeShipping: true },

  // Equipos Industriales
  { title: 'Cámara Fría 4x3x2.5m Panel 80mm', price: 45000, thumbnail: 'https://http2.mlstatic.com/D_679525-MLA71997421897_092023-O.jpg', freeShipping: false },
  { title: 'Cámara Fría 6x4x2.5m Panel 80mm', price: 65000, thumbnail: 'https://http2.mlstatic.com/D_679525-MLA71997421897_092023-O.jpg', freeShipping: false },
  { title: 'Cámara Fría 8x5x3m Panel 100mm', price: 95000, thumbnail: 'https://http2.mlstatic.com/D_679525-MLA71997421897_092023-O.jpg', freeShipping: false },
  { title: 'Unidad Enfriadora Chiller 5TR', price: 85000, thumbnail: 'https://http2.mlstatic.com/D_679525-MLA71997421897_092023-O.jpg', freeShipping: false },
  { title: 'Unidad Enfriadora Chiller 10TR', price: 145000, thumbnail: 'https://http2.mlstatic.com/D_679525-MLA71997421897_092023-O.jpg', freeShipping: false },

  // Material Eléctrico
  { title: 'Cable THW 12 AWG 100m', price: 2100, thumbnail: 'https://http2.mlstatic.com/D_876787-MLA75530948883_042024-O.jpg', freeShipping: false },
  { title: 'Cable THW 10 AWG 100m', price: 3200, thumbnail: 'https://http2.mlstatic.com/D_876787-MLA75530948883_042024-O.jpg', freeShipping: false },
  { title: 'Cable THW 8 AWG 100m', price: 4800, thumbnail: 'https://http2.mlstatic.com/D_876787-MLA75530948883_042024-O.jpg', freeShipping: false },
  { title: 'Cable para Termostato 18/5 30m', price: 850, thumbnail: 'https://http2.mlstatic.com/D_876787-MLA75530948883_042024-O.jpg', freeShipping: false },

  // Aceites y Químicos
  { title: 'Aceite para Compresor POE 1 Litro', price: 420, thumbnail: 'https://http2.mlstatic.com/D_822460-MLA72015893570_102023-O.jpg', freeShipping: true },
  { title: 'Aceite para Compresor Mineral 1 Litro', price: 280, thumbnail: 'https://http2.mlstatic.com/D_822460-MLA72015893570_102023-O.jpg', freeShipping: true },
  { title: 'Aceite para Compresor AB 1 Litro', price: 350, thumbnail: 'https://http2.mlstatic.com/D_822460-MLA72015893570_102023-O.jpg', freeShipping: true },
  { title: 'Deshidratante para Refrigeración 1kg', price: 250, thumbnail: 'https://http2.mlstatic.com/D_843631-MLA72794658874_112023-O.jpg', freeShipping: true },
  { title: 'Cinta Aislante 3M 18mm x 20m', price: 45, thumbnail: 'https://http2.mlstatic.com/D_835026-MLA70635941438_072023-O.jpg', freeShipping: true },
  { title: 'Limpiador de Evaporador en Aerosol', price: 180, thumbnail: 'https://http2.mlstatic.com/D_910018-MLA73997977572_012024-O.jpg', freeShipping: true },
  { title: 'Sellador de Fugas para Refrigerante', price: 350, thumbnail: 'https://http2.mlstatic.com/D_910018-MLA73997977572_012024-O.jpg', freeShipping: true },

  // Cámaras de Refrigeración Comercial
  { title: 'Refrigerador Comercial 1 Puerta', price: 8500, thumbnail: 'https://http2.mlstatic.com/D_679525-MLA71997421897_092023-O.jpg', freeShipping: false },
  { title: 'Refrigerador Comercial 2 Puertas', price: 12500, thumbnail: 'https://http2.mlstatic.com/D_679525-MLA71997421897_092023-O.jpg', freeShipping: false },
  { title: 'Congelador Comercial 1 Puerta', price: 9500, thumbnail: 'https://http2.mlstatic.com/D_679525-MLA71997421897_092023-O.jpg', freeShipping: false },
  { title: 'Congelador Comercial 2 Puertas', price: 14500, thumbnail: 'https://http2.mlstatic.com/D_679525-MLA71997421897_092023-O.jpg', freeShipping: false },
  { title: 'Barra Refrigerante para Salón', price: 12000, thumbnail: 'https://http2.mlstatic.com/D_679525-MLA71997421897_092023-O.jpg', freeShipping: false },

  // Partes Varias
  { title: 'Bobina de Relevador 24VAC para HVAC', price: 220, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Placa Universal de Control para Minisplit', price: 1450, thumbnail: 'https://http2.mlstatic.com/D_738554-MLA74405317189_022024-O.jpg', freeShipping: true },
  { title: 'Base de Aire Acondicionado de Piso', price: 1200, thumbnail: 'https://http2.mlstatic.com/D_924128-MLA74128350387_012024-O.jpg', freeShipping: false },
  { title: 'Serpentina de Cobre para A/A 3/8"', price: 1800, thumbnail: 'https://http2.mlstatic.com/D_703575-MLA71028842157_082023-O.jpg', freeShipping: false },
  { title: 'Bomba de Agua para Condensado 1/8HP', price: 1600, thumbnail: 'https://http2.mlstatic.com/D_867972-MLA73523457860_112023-O.jpg', freeShipping: true },
  { title: 'Bomba de Agua para Condensado 1/4HP', price: 2100, thumbnail: 'https://http2.mlstatic.com/D_867972-MLA73523457860_112023-O.jpg', freeShipping: true },
  { title: 'Bomba de Agua para Condensado 1/2HP', price: 3200, thumbnail: 'https://http2.mlstatic.com/D_867972-MLA73523457860_112023-O.jpg', freeShipping: true },
  { title: 'Junta para Compresor Hermético', price: 120, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Plato Válvula para Compresor', price: 280, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Sello Mecánico para Bomba 1/2"', price: 450, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Sello Mecánico para Bomba 3/4"', price: 580, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Sello Mecánico para Bomba 1"', price: 720, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },

  // Soldadura
  { title: 'Barra de Soldadura Silver 15% 1/8"', price: 180, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Barra de Soldadura Silver 5% 1/8"', price: 95, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Barra de Soldadura 45% 1/8"', price: 350, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Flux para Soldadura de Cobre', price: 65, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },

  // Conexiones
  { title: 'Conexión de Cobre 1/4" hembra', price: 35, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Conexión de Cobre 3/8" hembra', price: 42, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Conexión de Cobre 1/2" hembra', price: 55, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Niple de Cobre 1/4" x 2"', price: 28, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Niple de Cobre 3/8" x 2"', price: 32, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Codo de Cobre 1/4" 90°', price: 25, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Codo de Cobre 3/8" 90°', price: 30, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Codo de Cobre 1/2" 90°', price: 38, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Reducción de Cobre 3/8" x 1/4"', price: 22, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },

  // Termómetros
  { title: 'Termómetro Digital para Refrigeración +50/-50°C', price: 450, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Termómetro Análogo para Refrigeración', price: 180, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Termómetro Infrarrojo -50 a 380°C', price: 850, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
  { title: 'Higrómetro Digital para HVAC', price: 380, thumbnail: 'https://http2.mlstatic.com/D_663211-MLA72118702769_102023-O.jpg', freeShipping: true },
];

function searchFallback(query: string, limit: number): SearchResult[] {
  const q = query.toLowerCase();
  const filtered = FALLBACK_PRODUCTS.filter((p) =>
    p.title.toLowerCase().includes(q)
  ).slice(0, limit);

  return filtered.map((item: any, i: number) => {
    const basePrice = item.price;
    const finalPrice = Math.round(basePrice * (1 + MARKUP_PERCENTAGE) * 100) / 100;
    let baseDays = item.freeShipping ? 5 : 3;
    if (item.seller_city) baseDays = 4;
    const deliveryDays = baseDays + 1;

    return {
      id: `local-${i}`,
      title: item.title,
      price: finalPrice,
      currency: 'MXN',
      condition: 'Nuevo',
      availableQuantity: 5,
      thumbnail: item.thumbnail,
      freeShipping: item.freeShipping || false,
      deliveryDays,
      source: '#',
      provider: 'Catálogo local',
    };
  });
}

export async function searchProducts(query: string, limit: number): Promise<{ results: SearchResult[]; provider: string }> {
  const results: SearchResult[] = [];
  let provider = '';

  const [cmResults, coresaResults] = await Promise.all([
    searchClimasMonterrey(query, limit),
    searchCoresa(query, limit),
  ]);

  if (cmResults.length > 0) {
    results.push(...cmResults);
    provider = 'Climas Monterrey';
  }

  if (coresaResults.length > 0) {
    results.push(...coresaResults);
    if (!provider) provider = 'Grupo Coresa';
    else provider = 'Múltiples proveedores';
  }

  if (results.length >= limit) {
    return { results: results.slice(0, limit), provider };
  }

  const fallback = searchFallback(query, limit - results.length);
  if (fallback.length > 0) {
    results.push(...fallback);
    if (!provider) provider = 'Catálogo local';
    else provider = 'Múltiples proveedores';
  }

  return { results: results.slice(0, limit), provider };
}
