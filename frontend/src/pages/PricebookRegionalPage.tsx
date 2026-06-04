import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, MapPin, Save, Loader2, RotateCcw, FileText,
  Minus, Plus, TrendingUp, RefreshCw, Check, X,
  ChevronDown, ChevronRight, Percent, DollarSign, Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import PricebookBreakdownEditor from '../components/PricebookBreakdownEditor';

interface Item {
  id: number; sku: string | null; name: string; description: string | null;
  unit: string; goodPrice: number | null; betterPrice: number | null;
  bestPrice: number | null; costPrice: number | null;
  category?: { id: number; name: string };
}

interface StatePrice {
  stateCode: string; stateName: string;
  regionCode: string; regionName: string;
  adjustmentFactor: number;
  goodPrice: number | null; betterPrice: number | null;
  bestPrice: number | null; costPrice: number | null;
  isOverridden: boolean;
}

const REGIONS = [
  { code: 'NORTE', name: 'Norte', adj: 0.07 },
  { code: 'CENTRO-N', name: 'Centro-Norte', adj: 0.02 },
  { code: 'CENTRO', name: 'Centro', adj: 0 },
  { code: 'BAJIO', name: 'Bajío-Occidente', adj: -0.02 },
  { code: 'SURESTE', name: 'Sur-Sureste', adj: -0.07 },
];

const REGION_STYLES: Record<string, string> = {
  NORTE: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  'CENTRO-N': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  CENTRO: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  BAJIO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  SURESTE: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
};

const REGION_PILLS: Record<string, { active: string; idle: string }> = {
  NORTE:     { active: 'bg-red-600 text-white shadow-sm', idle: 'bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700' },
  'CENTRO-N':{ active: 'bg-amber-600 text-white shadow-sm', idle: 'bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700' },
  CENTRO:    { active: 'bg-blue-600 text-white shadow-sm', idle: 'bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700' },
  BAJIO:     { active: 'bg-emerald-600 text-white shadow-sm', idle: 'bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700' },
  SURESTE:   { active: 'bg-purple-600 text-white shadow-sm', idle: 'bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700' },
};

const fmt = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—';

function margin(cost: number | null, sell: number | null): number | null {
  if (cost == null || sell == null || cost === 0) return null;
  return ((sell - cost) / sell) * 100;
}

const TIER_CONFIG = [
  { key: 'goodPrice' as const, label: 'Good', desc: '1-9 pzas', minQty: 1, maxQty: 9 },
  { key: 'betterPrice' as const, label: 'Better', desc: '10-49 pzas', minQty: 10, maxQty: 49 },
  { key: 'bestPrice' as const, label: 'Best', desc: '50+ pzas', minQty: 50, maxQty: Infinity },
];

function determineTier(qty: number): typeof TIER_CONFIG[number] {
  for (const t of TIER_CONFIG) {
    if (qty >= t.minQty && qty <= t.maxQty) return t;
  }
  return TIER_CONFIG[TIER_CONFIG.length - 1];
}

export default function PricebookRegionalPage() {
  const queryClient = useQueryClient();
  const [itemSearch, setItemSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [filterRegion, setFilterRegion] = useState<string | null>(null);
  const [stateSearch, setStateSearch] = useState('');
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
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

  const tier = useMemo(() => determineTier(quantity), [quantity]);

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

  const filteredStates = useMemo(() => {
    if (!statePrices) return [];
    let list = statePrices;
    if (filterRegion) list = list.filter(sp => sp.regionCode === filterRegion);
    if (stateSearch.trim()) {
      const q = stateSearch.toLowerCase().trim();
      list = list.filter(sp =>
        sp.stateName.toLowerCase().includes(q) ||
        sp.stateCode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [statePrices, filterRegion, stateSearch]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.put(`/pricebook/items/${selectedItemId}/regional-price`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-regional-prices', selectedItemId] });
      setEditValues({});
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
      toast.success('Restablecido al valor regional');
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
    setFilterRegion(null);
    setStateSearch('');
    setExpandedState(null);
    setEditValues({});
    setQuantity(1);
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
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Catálogo Nacional de Precios Unitarios</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona un concepto para consultar precios ajustados por región en los 32 estados</p>
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
                          {item.goodPrice != null && <span className="text-[11px] text-primary-600 font-medium ml-auto">{fmt(item.goodPrice)}</span>}
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
              <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Catálogo Nacional de Precios Unitarios</h1>
              <p className="text-[10px] text-gray-400">Precios ajustados por región para los 32 estados de México</p>
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
          <div className="flex flex-wrap items-start justify-between gap-3">
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
          </div>

          {/* Quantity + Tier */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Cantidad:</span>
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600"><Minus className="w-3 h-3" /></button>
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-12 text-center text-xs py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-x border-gray-200 dark:border-gray-700 focus:outline-none tabular-nums" />
                <button onClick={() => setQuantity(quantity + 1)} className="px-2 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
            <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tier.key === 'goodPrice' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : tier.key === 'betterPrice' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>{tier.label} · <span className="font-normal">{tier.desc}</span></div>
            {(() => {
              const pu = selectedItem[tier.key];
              const total = pu != null ? pu * quantity : null;
              const m = margin(selectedItem.costPrice, pu);
              return (
                <>
                  <span className="text-xs text-gray-500"><span className="text-gray-400">P.U. Base:</span> <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{fmt(pu)}</span></span>
                  <span className="text-xs text-gray-500"><span className="text-gray-400">Importe:</span> <span className="font-bold text-primary-600 dark:text-primary-400 tabular-nums">{fmt(total)}</span></span>
                  {m != null && <span className={`text-xs font-medium ${m >= 20 ? 'text-emerald-600' : m >= 10 ? 'text-amber-600' : 'text-red-600'} tabular-nums`}><Percent className="w-3 h-3 inline -mt-0.5" /> {m.toFixed(1)}%</span>}
                </>
              );
            })()}
          </div>
          <div className="flex gap-2 mt-3">
            {TIER_CONFIG.map(t => {
              const active = tier.key === t.key;
              const price = selectedItem[t.key];
              return (
                <button key={t.key} onClick={() => setQuantity(t.minQty)} className={`text-[11px] px-2.5 py-1.5 rounded-md border transition-all ${active ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-600 font-semibold' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  {t.label} <span className="text-gray-400">({t.desc})</span>
                  {price != null && <span className="ml-1 font-medium tabular-nums">{fmt(price)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REGION FILTERS + STATE SEARCH ── */}
      {!pricesLoading && !pricesError && statePrices && statePrices.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setFilterRegion(null)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!filterRegion ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm' : 'bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-gray-700'}`}>
            Todos · {statePrices.length}
          </button>
          {REGIONS.map(r => {
            const count = statePrices.filter(sp => sp.regionCode === r.code).length;
            const s = REGION_PILLS[r.code];
            return (
              <button key={r.code} onClick={() => setFilterRegion(filterRegion === r.code ? null : r.code)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterRegion === r.code ? s.active : s.idle}`}>
                {r.name} · {count}
              </button>
            );
          })}
          <div className="ml-auto relative min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Filtrar estado..." value={stateSearch} onChange={e => { setStateSearch(e.target.value); setExpandedState(null); setEditValues({}); }} className="w-full pl-8 pr-8 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            {stateSearch && <button onClick={() => setStateSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}
          </div>
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {pricesError && (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Error al cargar precios regionales</p>
          <p className="text-xs text-gray-500 mt-1">Verifica la conexión o intenta de nuevo</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['pricebook-regional-prices', selectedItemId] })} className="mt-3 text-xs text-primary-600 hover:underline inline-flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Reintentar</button>
        </div>
      )}

      {/* ── LOADING ── */}
      {pricesLoading && (
        <div className="card py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="text-xs text-gray-400 mt-2">Cargando precios regionales...</p>
        </div>
      )}

      {/* ── MAIN TABLE (CPU Tabulador) ── */}
      {!pricesLoading && !pricesError && statePrices && (
        <div className="card p-0 overflow-hidden">
          {filteredStates.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stateSearch || filterRegion ? 'Ningún estado coincide con los filtros aplicados' : 'No se encontraron estados'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stateSearch || filterRegion ? 'Intenta con otros criterios de búsqueda' : 'Verifica que los datos estén cargados correctamente'}
              </p>
              {(stateSearch || filterRegion) && (
                <button onClick={() => { setStateSearch(''); setFilterRegion(null); }} className="mt-3 text-xs text-primary-600 hover:underline">Limpiar filtros</button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider w-6"></th>
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Estado</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Región</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Precio Unitario</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Importe</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Costo</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Margen</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider w-16">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                  {filteredStates.map((sp, idx) => {
                    const pu = sp[tier.key];
                    const total = pu != null ? pu * quantity : null;
                    const m = margin(sp.costPrice, pu);
                    const isExpanded = expandedState === sp.stateCode;

                    return (
                      <Fragment key={sp.stateCode}>
                        <tr
                          onClick={() => setExpandedState(isExpanded ? null : sp.stateCode)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-primary-50/70 dark:bg-primary-900/15'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                          } ${!isExpanded && idx % 2 === 1 ? 'bg-gray-50/40 dark:bg-gray-800/10' : ''}`}
                        >
                          <td className="py-2.5 px-3 text-gray-300">{isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 rounded">{sp.stateCode}</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{sp.stateName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${REGION_STYLES[sp.regionCode] || ''}`}>{sp.regionName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">{fmt(pu)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-primary-600 dark:text-primary-400">{fmt(total)}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-gray-500">{sp.costPrice != null ? fmt(sp.costPrice) : '—'}</td>
                          <td className="py-2.5 px-3 text-right">
                            {m != null ? (
                              <span className={`font-semibold text-xs ${m >= 20 ? 'text-emerald-600' : m >= 10 ? 'text-amber-600' : 'text-red-600'}`}>{m.toFixed(1)}%</span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {sp.isOverridden ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Manual</span>
                            ) : (
                              <span className="text-[10px] text-gray-400">Auto</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="px-4 pb-4 pt-2">
                              <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 ml-10">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{sp.stateName}</span>
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${REGION_STYLES[sp.regionCode] || ''}`}>{sp.regionName}</span>
                                    <span className="text-[10px] text-gray-400">Ajuste: {sp.adjustmentFactor >= 0 ? '+' : ''}{(sp.adjustmentFactor * 100).toFixed(0)}%</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => setApuOpen(prev => !prev)} className={`text-[10px] px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 transition-all ${apuOpen ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                                      <Calculator className="w-3 h-3" /> APU
                                    </button>
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${sp.isOverridden ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                      {sp.isOverridden ? 'Precio manual' : 'Precio regional automático'}
                                    </span>
                                  </div>
                                </div>

                                {apuOpen && selectedItem ? (
                                  <PricebookBreakdownEditor
                                    itemId={selectedItem.id}
                                    goodPrice={selectedItem.goodPrice}
                                    betterPrice={selectedItem.betterPrice}
                                    bestPrice={selectedItem.bestPrice}
                                    onClose={() => setApuOpen(false)}
                                  />
                                ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {TIER_CONFIG.map(({ key, label, desc }) => {
                                    const base = selectedItem?.[key] as number | null;
                                    const regional = sp[key] as number | null;
                                    const mTier = margin(sp.costPrice, regional);
                                    const editKey = `${sp.stateCode}_${key}`;
                                    const editVal = editValues[editKey] ?? '';
                                    const isEdited = editKey in editValues;
                                    const isActive = tier.key === key;

                                    return (
                                      <div key={key} className={`p-3 rounded-lg border ${isActive ? 'border-primary-200 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{label}</span>
                                            <span className="text-[10px] text-gray-400">({desc})</span>
                                            {isActive && <span className="text-[10px] text-primary-600 font-medium">· activo</span>}
                                          </div>
                                          <span className="text-[10px] text-gray-400">Base: {fmt(base)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-[10px] text-gray-500">P.U.:</span>
                                          {isEdited ? (
                                            <div className="relative flex-1">
                                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                              <input type="number" step="0.01" value={editVal} onChange={e => setEditValues(prev => ({ ...prev, [editKey]: e.target.value }))} className="w-full pl-4 pr-2 py-1 text-xs text-right bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium tabular-nums" autoFocus />
                                            </div>
                                          ) : (
                                            <span className={`text-sm font-bold tabular-nums ${mTier != null && mTier > 0 ? 'text-gray-900 dark:text-gray-100' : mTier != null && mTier <= 0 ? 'text-red-600' : ''}`}>{fmt(regional)}</span>
                                          )}
                                        </div>

                                        <div className="flex items-center justify-between mb-2">
                                          {mTier != null ? <span className={`text-[10px] font-medium ${mTier >= 20 ? 'text-emerald-600' : mTier >= 10 ? 'text-amber-600' : 'text-red-600'}`}>Margen: {mTier.toFixed(1)}%</span> : <span />}
                                          <span className="text-[10px] text-gray-400">Imp: {fmt(regional != null ? regional * quantity : null)}</span>
                                        </div>

                                        <div className="flex gap-1.5">
                                          {isEdited ? (
                                            <>
                                              <button onClick={() => saveMutation.mutate({ stateCode: sp.stateCode, [key]: parseFloat(editVal) })} disabled={saveMutation.isPending || isNaN(parseFloat(editVal))} className="flex-1 text-[10px] px-2 py-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 font-medium inline-flex items-center justify-center gap-1">
                                                {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Guardar
                                              </button>
                                              <button onClick={() => { const n = { ...editValues }; delete n[editKey]; setEditValues(n); }} className="text-[10px] px-2 py-1.5 text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 font-medium">
                                                <X className="w-3 h-3" />
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button onClick={() => setEditValues(prev => ({ ...prev, [editKey]: String(regional ?? '') }))} className="flex-1 text-[10px] px-2 py-1.5 text-primary-600 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded hover:bg-primary-100 font-medium">Editar</button>
                                              {sp.isOverridden && (
                                                <button onClick={() => resetMutation.mutate(sp.stateCode)} className="text-[10px] px-2 py-1.5 text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 font-medium inline-flex items-center gap-1">
                                                  <RotateCcw className="w-3 h-3" /> Restablecer
                                                </button>
                                              )}
                                              {regional != null && (
                                                <button onClick={() => { navigator.clipboard.writeText(String(regional)); toast.success(`${fmt(regional)} copiado`); }} className="text-[10px] px-2 py-1.5 text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 font-medium">Copiar</button>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between text-[10px] text-gray-500">
            <span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{filteredStates.length}</span> de <span className="font-medium">{statePrices.length}</span> estados
              {filterRegion && <> · <span className="text-primary-600 font-medium">Filtro: {REGIONS.find(r => r.code === filterRegion)?.name}</span></>}
              {stateSearch && <> · Búsqueda: "{stateSearch}"</>}
            </span>
            <span className={statePrices.filter(s => s.isOverridden).length > 0 ? 'text-amber-600 font-medium' : ''}>
              {statePrices.filter(s => s.isOverridden).length} con precio manual
            </span>
          </div>
        </div>
      )}

      {/* ── EMPTY DATA HELP ── */}
      {!pricesLoading && !pricesError && statePrices && statePrices.length === 0 && (
        <div className="card py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No hay datos de precios regionales</p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            El catálogo de estados y regiones no está disponible. Esto puede ocurrir si la base de datos no se ha inicializado correctamente. Contacta al administrador del sistema.
          </p>
        </div>
      )}
    </div>
  );
}
