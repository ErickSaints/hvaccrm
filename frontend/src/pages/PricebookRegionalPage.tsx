import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, MapPin, Save, Loader2, RotateCcw, FileText,
  Minus, Plus, TrendingUp, RefreshCw, ClipboardList, Check, X, ChevronDown, ChevronRight, DollarSign, Percent
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

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

const REGION_COLORS: Record<string, string> = {
  NORTE: 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/20',
  'CENTRO-N': 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/20',
  CENTRO: 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20',
  BAJIO: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/20',
  SURESTE: 'text-purple-600 bg-purple-50 dark:text-purple-300 dark:bg-purple-900/20',
};

const REGION_PILL: Record<string, { active: string; idle: string }> = {
  NORTE:     { active: 'bg-red-600 text-white ring-red-600', idle: 'ring-1 ring-inset ring-red-200 text-red-700 bg-white hover:bg-red-50 dark:ring-red-800 dark:text-red-300 dark:bg-gray-800 dark:hover:bg-red-900/20' },
  'CENTRO-N':{ active: 'bg-amber-600 text-white ring-amber-600', idle: 'ring-1 ring-inset ring-amber-200 text-amber-700 bg-white hover:bg-amber-50 dark:ring-amber-800 dark:text-amber-300 dark:bg-gray-800 dark:hover:bg-amber-900/20' },
  CENTRO:    { active: 'bg-blue-600 text-white ring-blue-600', idle: 'ring-1 ring-inset ring-blue-200 text-blue-700 bg-white hover:bg-blue-50 dark:ring-blue-800 dark:text-blue-300 dark:bg-gray-800 dark:hover:bg-blue-900/20' },
  BAJIO:     { active: 'bg-emerald-600 text-white ring-emerald-600', idle: 'ring-1 ring-inset ring-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 dark:ring-emerald-800 dark:text-emerald-300 dark:bg-gray-800 dark:hover:bg-emerald-900/20' },
  SURESTE:   { active: 'bg-purple-600 text-white ring-purple-600', idle: 'ring-1 ring-inset ring-purple-200 text-purple-700 bg-white hover:bg-purple-50 dark:ring-purple-800 dark:text-purple-300 dark:bg-gray-800 dark:hover:bg-purple-900/20' },
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
              <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Catálogo Nacional de Precios</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Busca un artículo del catálogo para consultar precios ajustados por estado y región</p>
            </div>
          </div>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar artículo (ej. Mini Split, Chiller, Mantenimiento)..."
                value={itemSearch}
                onChange={e => { setItemSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-9 pr-3 py-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                {itemsError ? (
                  <div className="p-4 text-center text-sm text-red-500">Error al cargar artículos</div>
                ) : itemsLoading ? (
                  <div className="p-4 text-center text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Cargando...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">
                    {itemSearch.trim() ? 'No se encontraron artículos' : 'Escribe para buscar en el catálogo'}
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => selectItem(item)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/30 last:border-0"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.category && <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.category.name}</span>}
                        <span className="text-[11px] text-gray-400">{item.unit}</span>
                        {item.sku && <span className="text-[11px] text-gray-400 font-mono">{item.sku}</span>}
                        {item.goodPrice != null && <span className="text-[11px] text-primary-600 font-medium ml-auto">{fmt(item.goodPrice)}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="card py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Selecciona un artículo</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Busca y selecciona un artículo del catálogo para ver sus precios en los 32 estados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header Bar ── */}
      <div className="card px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">Catálogo Nacional de Precios</h1>
              <p className="text-xs text-gray-400">Precios ajustados por región para cada estado</p>
            </div>
          </div>
          <div className="relative w-72" ref={dropdownRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cambiar artículo..."
              value={itemSearch}
              onChange={e => { setItemSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">{itemSearch.trim() ? 'Sin resultados' : 'Escribe para buscar'}</div>
                ) : (
                  filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => selectItem(item)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700/30 last:border-0 text-xs ${
                        selectedItemId === item.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                      <span className="text-gray-400 ml-2">{item.category?.name} · {item.unit}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Item Info + Quantity ── */}
      {selectedItem && (
        <div className="card px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedItem.name}</h2>
                {selectedItem.sku && <span className="text-[11px] text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{selectedItem.sku}</span>}
                <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{selectedItem.unit}</span>
                {selectedItem.category && <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{selectedItem.category.name}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">Cantidad:</span>
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number" min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center text-sm py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-x border-gray-200 dark:border-gray-700 focus:outline-none tabular-nums"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                tier.key === 'goodPrice' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                tier.key === 'betterPrice' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}>
                {tier.label} · {tier.desc}
              </div>
              {(() => {
                const pu = selectedItem[tier.key];
                const total = pu != null ? pu * quantity : null;
                const costT = selectedItem.costPrice != null ? selectedItem.costPrice * quantity : null;
                const m = margin(selectedItem.costPrice, pu);
                return (
                  <>
                    <span className="text-xs text-gray-500"><span className="text-gray-400">P/U:</span> <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{fmt(pu)}</span></span>
                    <span className="text-xs text-gray-500"><span className="text-gray-400">Total:</span> <span className="font-bold text-primary-600 dark:text-primary-400 tabular-nums">{fmt(total)}</span></span>
                    {costT != null && <span className="text-xs text-gray-500"><span className="text-gray-400">Costo:</span> <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{fmt(costT)}</span></span>}
                    {m != null && (
                      <span className={`text-xs font-medium ${m >= 20 ? 'text-emerald-600' : m >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                        <Percent className="w-3 h-3 inline -mt-0.5" /> {m.toFixed(1)}%
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {TIER_CONFIG.map(t => {
              const active = tier.key === t.key;
              const price = selectedItem[t.key];
              return (
                <button
                  key={t.key}
                  onClick={() => setQuantity(t.minQty)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-600 font-semibold'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {t.label} <span className="text-gray-400">({t.desc})</span>
                  {price != null && <span className="ml-1 font-medium tabular-nums">{fmt(price)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {pricesError && (
        <div className="card p-4 text-center">
          <p className="text-sm text-red-500">Error al cargar precios regionales</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['pricebook-regional-prices', selectedItemId] })} className="mt-2 text-xs text-primary-600 hover:underline inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )}

      {/* ── Region pills + state search ── */}
      {!pricesLoading && !pricesError && statePrices && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterRegion(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                !filterRegion
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              Todos
            </button>
            {REGIONS.map(r => {
              const count = statePrices.filter(sp => sp.regionCode === r.code).length;
              const s = REGION_PILL[r.code];
              return (
                <button
                  key={r.code}
                  onClick={() => setFilterRegion(filterRegion === r.code ? null : r.code)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterRegion === r.code ? s.active : s.idle}`}
                >
                  {r.name}
                  <span className="ml-1 opacity-60">{count}</span>
                </button>
              );
            })}
            <div className="ml-auto relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar estado por nombre o código..."
                value={stateSearch}
                onChange={e => { setStateSearch(e.target.value); setExpandedState(null); setEditValues({}); }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
              {stateSearch && (
                <button onClick={() => setStateSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {pricesLoading && (
        <div className="card py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="text-xs text-gray-400 mt-2">Cargando precios regionales...</p>
        </div>
      )}

      {/* ── Main Table ── */}
      {!pricesLoading && !pricesError && statePrices && (
        <div className="card p-0 overflow-hidden">
          {filteredStates.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              {stateSearch || filterRegion ? 'Ningún estado coincide con los filtros aplicados' : 'No hay datos disponibles'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30">
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 w-10"></th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500">Estado</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500">Región</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-500">Precio Unitario</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-500">Importe</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-500">Costo</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-500">Margen</th>
                    <th className="text-center py-2.5 px-3 font-medium text-gray-500 w-16">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40">
                  {filteredStates.map(sp => {
                    const pu = sp[tier.key];
                    const total = pu != null ? pu * quantity : null;
                    const m = margin(sp.costPrice, pu);
                    const isExpanded = expandedState === sp.stateCode;

                    return (
                      <Fragment key={sp.stateCode}>
                        <tr
                          onClick={() => {
                            if (expandedState === sp.stateCode) {
                              setExpandedState(null);
                              setEditValues({});
                            } else {
                              setExpandedState(sp.stateCode);
                              setEditValues({});
                            }
                          }}
                          className={`cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-primary-50/60 dark:bg-primary-900/15'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-gray-300">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{sp.stateName}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{sp.stateCode}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${REGION_COLORS[sp.regionCode] || ''}`}>
                              {sp.regionName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">{fmt(pu)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-primary-600 dark:text-primary-400">{fmt(total)}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-gray-500">{sp.costPrice != null ? fmt(sp.costPrice) : '—'}</td>
                          <td className="py-2.5 px-3 text-right">
                            {m != null ? (
                              <span className={`font-medium ${m >= 20 ? 'text-emerald-600' : m >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                                {m.toFixed(1)}%
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {sp.isOverridden ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                Manual
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400">Auto</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="px-4 pb-4 pt-1">
                              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 p-4 ml-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {TIER_CONFIG.map(({ key, label, desc }) => {
                                    const base = selectedItem?.[key] as number | null;
                                    const regional = sp[key] as number | null;
                                    const mTier = margin(sp.costPrice, regional);
                                    const editKey = `${sp.stateCode}_${key}`;
                                    const editVal = editValues[editKey] ?? '';
                                    const isEdited = editKey in editValues;
                                    const isActive = tier.key === key;

                                    return (
                                      <div key={key} className={`p-3 rounded-lg border ${
                                        isActive
                                          ? 'border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/20'
                                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                      }`}>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{label}</span>
                                            <span className="text-[10px] text-gray-400">{desc}</span>
                                            {isActive && <span className="text-[10px] text-primary-600 font-medium">← activo</span>}
                                          </div>
                                          <span className="text-[10px] text-gray-400">Base: {fmt(base)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs text-gray-500">Precio:</span>
                                          {isEdited ? (
                                            <div className="relative flex-1">
                                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                              <input
                                                type="number" step="0.01"
                                                value={editVal}
                                                onChange={e => setEditValues(prev => ({ ...prev, [editKey]: e.target.value }))}
                                                className="w-full pl-4 pr-2 py-1 text-xs text-right bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium tabular-nums"
                                                autoFocus
                                              />
                                            </div>
                                          ) : (
                                            <span className={`text-sm font-bold tabular-nums ${mTier != null && mTier > 0 ? 'text-gray-900 dark:text-gray-100' : mTier != null && mTier <= 0 ? 'text-red-600' : ''}`}>
                                              {fmt(regional)}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center justify-between mb-2">
                                          {mTier != null ? (
                                            <span className={`text-[11px] font-medium ${mTier >= 20 ? 'text-emerald-600' : mTier >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                                              Margen: {mTier.toFixed(1)}%
                                            </span>
                                          ) : <span />}
                                          <span className="text-[11px] text-gray-400">
                                            Imp: {fmt(regional != null ? regional * quantity : null)}
                                          </span>
                                        </div>

                                        <div className="flex gap-1.5">
                                          {isEdited ? (
                                            <>
                                              <button
                                                onClick={() => saveMutation.mutate({ stateCode: sp.stateCode, [key]: parseFloat(editVal) })}
                                                disabled={saveMutation.isPending || isNaN(parseFloat(editVal))}
                                                className="flex-1 text-[11px] px-2 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium inline-flex items-center justify-center gap-1"
                                              >
                                                {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                Guardar
                                              </button>
                                              <button
                                                onClick={() => {
                                                  const n = { ...editValues };
                                                  delete n[editKey];
                                                  setEditValues(n);
                                                }}
                                                className="text-[11px] px-2 py-1.5 text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                onClick={() => setEditValues(prev => ({ ...prev, [editKey]: String(regional ?? '') }))}
                                                className="flex-1 text-[11px] px-2 py-1.5 text-primary-600 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 font-medium"
                                              >
                                                Editar
                                              </button>
                                              {sp.isOverridden && (
                                                <button
                                                  onClick={() => {
                                                    if (regional != null) {
                                                      navigator.clipboard.writeText(String(regional));
                                                      toast.success(`${fmt(regional)} copiado`);
                                                    }
                                                  }}
                                                  className="text-[11px] px-2 py-1.5 text-gray-600 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                                                >
                                                  Copiar
                                                </button>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {sp.isOverridden && (
                                  <div className="mt-3 flex justify-end">
                                    <button
                                      onClick={() => resetMutation.mutate(sp.stateCode)}
                                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Restablecer a precio regional automático
                                    </button>
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
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 flex justify-between bg-gray-50/60 dark:bg-gray-900/30">
            <span>Mostrando {filteredStates.length} de {statePrices.length} estados · <span className={filterRegion ? 'text-primary-600 font-medium' : ''}>{filterRegion ? `Filtro: ${REGIONS.find(r => r.code === filterRegion)?.name}` : 'Sin filtro de región'}</span></span>
            <span className="text-amber-600">{statePrices.filter(s => s.isOverridden).length} con precio manual</span>
          </div>
        </div>
      )}
    </div>
  );
}
