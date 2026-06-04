import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, MapPin, Save, Loader2, RotateCcw, FileText,
  TrendingUp, RefreshCw, Check, X,
  ChevronDown, ChevronRight, DollarSign, Calculator, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import PricebookBreakdownEditor from '../components/PricebookBreakdownEditor';

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

interface RegionGroup {
  code: string;
  name: string;
  adj: number;
  states: StatePrice[];
}

const REGIONS: RegionGroup[] = [
  { code: 'NORTE', name: 'Norte', adj: 0.07, states: [] },
  { code: 'CENTRO-N', name: 'Centro-Norte', adj: 0.02, states: [] },
  { code: 'CENTRO', name: 'Centro', adj: 0, states: [] },
  { code: 'BAJIO', name: 'Bajío-Occidente', adj: -0.02, states: [] },
  { code: 'SURESTE', name: 'Sur-Sureste', adj: -0.07, states: [] },
];

const REGION_STYLES: Record<string, string> = {
  NORTE: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  'CENTRO-N': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  CENTRO: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  BAJIO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  SURESTE: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
};

const REGION_BG: Record<string, string> = {
  NORTE: 'border-l-4 border-red-500',
  'CENTRO-N': 'border-l-4 border-amber-500',
  CENTRO: 'border-l-4 border-blue-500',
  BAJIO: 'border-l-4 border-emerald-500',
  SURESTE: 'border-l-4 border-purple-500',
};

const fmt = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—';

export default function PricebookRegionalPage() {
  const queryClient = useQueryClient();
  const [itemSearch, setItemSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [editVals, setEditVals] = useState<Record<string, string>>({});
  const [apuOpen, setApuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: items, isLoading: itemsLoading, isError: itemsError } = useQuery<Item[]>({
    queryKey: ['pricebook-items-all'],
    queryFn: () => api.get('/pricebook/items/all').then(r => r.data),
    retry: 2,
  });

  const {
    data: statePrices, isLoading: pricesLoading, isError: pricesError,
  } = useQuery<StatePrice[]>({
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

  const regions = useMemo(() => {
    if (!statePrices) return [];
    return REGIONS.map(r => ({
      ...r,
      states: statePrices.filter(sp => sp.regionCode === r.code),
    }));
  }, [statePrices]);

  const regionPrices = useMemo(() => {
    if (!selectedItem || !statePrices) return [];
    const bp = selectedItem.basePrice;
    return REGIONS.map(r => {
      const states = statePrices.filter(sp => sp.regionCode === r.code);
      const calculatedPrice = bp != null ? Math.round(bp * (1 + r.adj) * 100) / 100 : null;
      const overrideStates = states.filter(s => s.isOverridden);
      const regionalPrices = states.map(s => s.regionalPrice).filter((p): p is number => p != null);
      return {
        ...r,
        stateCount: states.length,
        calculatedPrice,
        states,
        overrideStates,
        minPrice: regionalPrices.length > 0 ? Math.min(...regionalPrices) : null,
        maxPrice: regionalPrices.length > 0 ? Math.max(...regionalPrices) : null,
        avgPrice: regionalPrices.length > 0 ? regionalPrices.reduce((a, b) => a + b, 0) / regionalPrices.length : null,
      };
    });
  }, [selectedItem, statePrices]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.put(`/pricebook/items/${selectedItemId}/regional-price`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-regional-prices', selectedItemId] });
      toast.success('Precio guardado');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al guardar'),
  });

  const resetMutation = useMutation({
    mutationFn: async (stateCode: string) => {
      await api.delete(`/pricebook/items/${selectedItemId}/regional-price/${stateCode}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-regional-prices', selectedItemId] });
      toast.success('Restablecido');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al restablecer'),
  });

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
    setExpandedRegion(null);
    setEditVals({});
  }

  if (!selectedItemId) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Precios Regionales</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Precios ajustados por región para cotización de servicios HVAC</p>
            </div>
          </div>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar concepto por nombre, clave o categoría..."
                value={itemSearch}
                onChange={e => { setItemSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-9 pr-3 py-3 text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                {itemsError ? (
                  <div className="p-6 text-center text-sm text-red-500">Error al cargar el catálogo</div>
                ) : itemsLoading ? (
                  <div className="p-6 text-center text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Cargando catálogo...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    {itemSearch.trim() ? 'No se encontraron conceptos' : 'Escribe para buscar en el catálogo'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {filteredItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => selectItem(item)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</span>
                          {item.sku && <span className="text-[11px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.sku}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {item.category && <span className="text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.category.name}</span>}
                          <span className="text-[11px] text-gray-400">{item.unit}</span>
                          <span className="text-[11px] text-primary-600 font-medium ml-auto">{fmt(item.basePrice)}</span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── HEADER ── */}
      <div className="card px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Precios Regionales</h1>
              <p className="text-[10px] text-gray-400">Precio base ajustado por factor de región</p>
            </div>
          </div>
          <div className="relative w-64" ref={dropdownRef}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cambiar concepto..."
              value={itemSearch}
              onChange={e => { setItemSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">Sin resultados</div>
                ) : (
                  filteredItems.map(item => (
                    <button key={item.id} onClick={() => selectItem(item)} className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700/30 last:border-0 ${selectedItemId === item.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                      <div className="text-[10px] text-gray-400">{item.sku} · {item.category?.name} · {item.unit}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SELECTED CONCEPT INFO ── */}
      {selectedItem && (
        <div className="card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedItem.name}</h2>
                {selectedItem.sku && <span className="text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">{selectedItem.sku}</span>}
                <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{selectedItem.unit}</span>
                {selectedItem.category && <span className="text-[10px] text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">{selectedItem.category.name}</span>}
              </div>
              {selectedItem.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{selectedItem.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg shrink-0">
              <DollarSign className="w-4 h-4 text-primary-500" />
              <div>
                <span className="text-[10px] text-gray-500 font-medium block">Precio Base</span>
                <span className="text-base font-bold text-primary-700 dark:text-primary-300 tabular-nums">{fmt(selectedItem.basePrice)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {pricesError && (
        <div className="card p-8 text-center">
          <X className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Error al cargar precios regionales</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['pricebook-regional-prices', selectedItemId] })} className="mt-3 text-xs text-primary-600 hover:underline inline-flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Reintentar</button>
        </div>
      )}

      {/* ── LOADING ── */}
      {pricesLoading && (
        <div className="card py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="text-xs text-gray-400 mt-2">Cargando regiones...</p>
        </div>
      )}

      {/* ── REGION CARDS ── */}
      {!pricesLoading && !pricesError && regionPrices && (
        <div className="space-y-3">
          {regionPrices.map(rp => {
            const isExpanded = expandedRegion === rp.code;
            return (
              <div key={rp.code} className={`card p-0 overflow-hidden transition-shadow ${REGION_BG[rp.code] || ''}`}>
                {/* Region header */}
                <div
                  onClick={() => setExpandedRegion(isExpanded ? null : rp.code)}
                  className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={isExpanded ? 'text-gray-400' : 'text-gray-300'}>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                    <div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${REGION_STYLES[rp.code] || ''}`}>
                        {rp.name}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2">
                        {rp.stateCount} estados · Ajuste: {rp.adj >= 0 ? '+' : ''}{Math.round(rp.adj * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">Precio Regional</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{fmt(rp.calculatedPrice)}</span>
                    </div>
                    {rp.overrideStates.length > 0 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {rp.overrideStates.length} override
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {rp.minPrice != null ? `${fmt(rp.minPrice)} – ${fmt(rp.maxPrice)}` : '—'}
                    </span>
                  </div>
                </div>

                {/* Expanded: states table */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/30">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <th className="text-left py-2 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Estado</th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Precio Regional</th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Diferencia vs Base</th>
                            <th className="text-center py-2 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Tipo</th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider w-24">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/30">
                          {rp.states.map(sp => {
                            const isEditing = editVals[sp.stateCode] !== undefined;
                            const edVal = editVals[sp.stateCode] ?? '';
                            const diff = selectedItem?.basePrice != null && sp.regionalPrice != null
                              ? ((sp.regionalPrice - selectedItem.basePrice) / selectedItem.basePrice) * 100
                              : null;

                            return (
                              <tr key={sp.stateCode} className="hover:bg-white dark:hover:bg-gray-800/50 transition-colors">
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-gray-400 bg-white dark:bg-gray-800 px-1 rounded">{sp.stateCode}</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{sp.stateName}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {isEditing ? (
                                    <div className="relative inline-block">
                                      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                      <input
                                        type="number" step="0.01"
                                        value={edVal}
                                        onChange={e => setEditVals(prev => ({ ...prev, [sp.stateCode]: e.target.value }))}
                                        className="w-24 pl-3.5 pr-1.5 py-0.5 text-xs text-right bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-semibold tabular-nums"
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{fmt(sp.regionalPrice)}</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right tabular-nums">
                                  {diff != null ? (
                                    <span className={`font-medium text-[11px] ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                                    </span>
                                  ) : '—'}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {sp.isOverridden ? (
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Manual</span>
                                  ) : (
                                    <span className="text-[10px] text-gray-400">Auto</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {isEditing ? (
                                    <div className="flex gap-1 justify-end">
                                      <button
                                        onClick={() => saveMutation.mutate({ stateCode: sp.stateCode, regionalPrice: parseFloat(edVal) })}
                                        disabled={saveMutation.isPending || isNaN(parseFloat(edVal))}
                                        className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded hover:bg-amber-600 disabled:opacity-50"
                                      >
                                        {saveMutation.isPending ? <Loader2 className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                      </button>
                                      <button onClick={() => { const n = { ...editVals }; delete n[sp.stateCode]; setEditVals(n); }} className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 text-[10px] rounded hover:bg-gray-50">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1 justify-end">
                                      <button
                                        onClick={() => setEditVals(prev => ({ ...prev, [sp.stateCode]: String(sp.regionalPrice ?? '') }))}
                                        className="px-2 py-0.5 text-[10px] text-primary-600 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 font-medium"
                                      >
                                        Editar
                                      </button>
                                      {sp.isOverridden && (
                                        <button
                                          onClick={() => resetMutation.mutate(sp.stateCode)}
                                          disabled={resetMutation.isPending}
                                          className="px-2 py-0.5 text-[10px] text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700/50 text-[10px] text-gray-400">
                      <span>{rp.states.length} estados en {rp.name}</span>
                      <span>Rango: {fmt(rp.minPrice)} – {fmt(rp.maxPrice)} · Promedio: {fmt(rp.avgPrice)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── EMPTY DATA ── */}
      {!pricesLoading && !pricesError && statePrices && statePrices.length === 0 && (
        <div className="card py-12 text-center">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">No hay datos regionales</p>
        </div>
      )}
    </div>
  );
}
