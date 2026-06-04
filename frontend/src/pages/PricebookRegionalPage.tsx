import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Loader2, FileText, DollarSign, TrendingUp, X
} from 'lucide-react';
import api from '../lib/api';

interface Item {
  id: number; sku: string | null; name: string; description: string | null;
  unit: string; basePrice: number | null;
  category?: { id: number; name: string };
}

interface StatePrice {
  stateCode: string; stateName: string;
  regionCode: string; regionName: string;
  adjustmentFactor: number;
  regionalPrice: number | null;
  isOverridden: boolean;
}

interface RegionCard {
  code: string; name: string; adj: number;
  price: number | null; stateCount: number;
}

const REGIONS: RegionCard[] = [
  { code: 'NORTE', name: 'Norte', adj: 0.07, price: null, stateCount: 0 },
  { code: 'CENTRO-N', name: 'Centro-Norte', adj: 0.02, price: null, stateCount: 0 },
  { code: 'CENTRO', name: 'Centro', adj: 0, price: null, stateCount: 0 },
  { code: 'BAJIO', name: 'Bajío-Occidente', adj: -0.02, price: null, stateCount: 0 },
  { code: 'SURESTE', name: 'Sur-Sureste', adj: -0.07, price: null, stateCount: 0 },
];

const REGION_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  NORTE:     { bg: 'bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-gray-900', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800/50', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  'CENTRO-N':{ bg: 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-900', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  CENTRO:    { bg: 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/50', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  BAJIO:     { bg: 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/50', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  SURESTE:   { bg: 'bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/50', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
};

const fmt = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—';

export default function PricebookRegionalPage() {
  const [itemSearch, setItemSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: items, isLoading: itemsLoading, isError: itemsError } = useQuery<Item[]>({
    queryKey: ['pricebook-items-all'],
    queryFn: () => api.get('/pricebook/items/all').then(r => r.data),
    retry: 2,
  });

  const { data: statePrices } = useQuery<StatePrice[]>({
    queryKey: ['pricebook-regional-prices', selectedItemId],
    enabled: !!selectedItemId,
    queryFn: () => api.get(`/pricebook/items/${selectedItemId}/regional-prices`).then(r => r.data),
    retry: 2,
  });

  const selectedItem = useMemo(() => {
    if (!items || !selectedItemId) return null;
    return items.find(i => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const q = itemSearch.toLowerCase().trim();
    if (!q) return [];
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.sku?.toLowerCase().includes(q) ||
      i.category?.name?.toLowerCase().includes(q)
    );
  }, [items, itemSearch]);

  const regionCards = useMemo(() => {
    if (!selectedItem || !statePrices) return [];
    const bp = selectedItem.basePrice || 0;
    const stateCounts: Record<string, number> = {};
    statePrices.forEach(sp => {
      stateCounts[sp.regionCode] = (stateCounts[sp.regionCode] || 0) + 1;
    });
    return REGIONS.map(r => ({
      ...r,
      price: Math.round(bp * (1 + r.adj) * 100) / 100,
      stateCount: stateCounts[r.code] || 0,
    }));
  }, [selectedItem, statePrices]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectItem(item: Item) {
    setSelectedItemId(item.id);
    setItemSearch(item.name);
    setShowDropdown(false);
  }

  if (!selectedItemId) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Precios Regionales</h1>
          <p className="text-sm text-gray-500 mt-1">Selecciona un concepto para ver el precio ajustado por región</p>
        </div>
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar concepto por nombre, clave o categoría..."
              value={itemSearch}
              onChange={e => { setItemSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          {showDropdown && (
            <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
              {itemsError ? (
                <div className="p-6 text-center text-sm text-red-500">Error al cargar</div>
              ) : itemsLoading ? (
                <div className="p-6 text-center text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Cargando...</div>
              ) : filteredItems.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  {itemSearch.trim() ? 'No se encontraron conceptos' : 'Escribe para buscar'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {filteredItems.map(item => (
                    <button key={item.id} onClick={() => selectItem(item)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                        {item.sku && <span className="text-[11px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.sku}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {item.category && <span className="text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.category.name}</span>}
                        <span className="text-[11px] text-gray-400">{item.unit}</span>
                        <span className="text-[11px] text-primary-600 font-medium ml-auto">{fmt(item.basePrice)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Selected concept header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { setSelectedItemId(null); setItemSearch(''); }} className="text-xs text-gray-400 hover:text-gray-600 mr-1">&larr; Volver</button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{selectedItem?.name}</h1>
            {selectedItem?.sku && <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{selectedItem.sku}</span>}
          </div>
          {selectedItem?.description && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-2xl">{selectedItem.description}</p>
          )}
        </div>
        <div className="text-right shrink-0 ml-4">
          <span className="text-[10px] text-gray-400 block">Precio Base</span>
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400 tabular-nums">{fmt(selectedItem?.basePrice)}</span>
        </div>
      </div>

      {/* Region cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {regionCards.map(r => {
          const c = REGION_COLORS[r.code] || REGION_COLORS.CENTRO;
          const diff = selectedItem?.basePrice ? ((r.price! - selectedItem.basePrice) / selectedItem.basePrice) * 100 : 0;
          return (
            <div key={r.code} className={`rounded-xl border ${c.border} ${c.bg} p-4 flex flex-col`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{r.name}</span>
                <span className={`text-[10px] font-medium ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                  {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1">
                <span className={`text-lg font-bold ${c.text} tabular-nums`}>{fmt(r.price)}</span>
              </div>
              <div className="mt-auto pt-2 flex items-center justify-between text-[10px] text-gray-400">
                <span>Ajuste: {r.adj >= 0 ? '+' : ''}{(r.adj * 100).toFixed(0)}%</span>
                <span>{r.stateCount} estados</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="text-center text-[10px] text-gray-400">
        Precios calculados automáticamente según el factor de ajuste de cada región
      </div>
    </div>
  );
}
