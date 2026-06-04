import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, MapPin, Save, Loader2, RotateCcw, Check, X,
  Minus, Plus, TrendingUp, ShoppingCart, RefreshCw
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

const REGION_STYLES: Record<string, { active: string; idle: string; badge: string }> = {
  NORTE:     { active: 'bg-red-600 text-white ring-red-600', idle: 'text-red-700 bg-red-50 ring-red-200 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/30 dark:ring-red-800', badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
  'CENTRO-N':{ active: 'bg-amber-600 text-white ring-amber-600', idle: 'text-amber-700 bg-amber-50 ring-amber-200 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30 dark:ring-amber-800', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  CENTRO:    { active: 'bg-blue-600 text-white ring-blue-600', idle: 'text-blue-700 bg-blue-50 ring-blue-200 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:ring-blue-800', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  BAJIO:     { active: 'bg-emerald-600 text-white ring-emerald-600', idle: 'text-emerald-700 bg-emerald-50 ring-emerald-200 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30 dark:ring-emerald-800', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  SURESTE:   { active: 'bg-purple-600 text-white ring-purple-600', idle: 'text-purple-700 bg-purple-50 ring-purple-200 hover:bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30 dark:ring-purple-800', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
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
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editTier, setEditTier] = useState<string | null>(null);
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
  const costTotal = useMemo(() => {
    if (!selectedItem?.costPrice) return null;
    return selectedItem.costPrice * quantity;
  }, [selectedItem, quantity]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const q = itemSearch.toLowerCase().trim();
    if (!q) return items.slice(0, 30);
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

  const selectedStateData = useMemo(() => {
    if (!selectedState || !statePrices) return null;
    return statePrices.find(sp => sp.stateCode === selectedState) || null;
  }, [selectedState, statePrices]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.put(`/pricebook/items/${selectedItemId}/regional-price`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-regional-prices', selectedItemId] });
      setEditValues({});
      setEditTier(null);
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
    setSelectedState(null);
    setFilterRegion(null);
    setStateSearch('');
    setEditValues({});
    setEditTier(null);
    setQuantity(1);
  }

  if (!selectedItemId) {
    return (
      <div className="space-y-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Precios Regionales</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Busca un artículo para ver precios ajustados por estado y región</p>
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
                className="w-full pl-9 pr-10 py-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
              {itemSearch && (
                <button onClick={() => { setItemSearch(''); setShowDropdown(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                {itemsError ? (
                  <div className="p-4 text-center text-sm text-red-400">Error al cargar artículos</div>
                ) : itemsLoading ? (
                  <div className="p-4 text-center text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Cargando...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">{itemSearch ? 'Sin resultados' : 'Escribe para buscar'}</div>
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
            <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Selecciona un artículo</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Busca y selecciona un artículo del catálogo para ver sus precios regionales
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header + Item search ── */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="relative" ref={dropdownRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar otro artículo..."
                  value={itemSearch}
                  onChange={e => { setItemSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
                {showDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                    {itemsError ? (
                      <div className="p-3 text-center text-sm text-red-400">Error al cargar artículos</div>
                    ) : filteredItems.length === 0 ? (
                      <div className="p-3 text-center text-sm text-gray-400">{itemSearch ? 'Sin resultados' : 'Escribe para buscar'}</div>
                    ) : (
                      filteredItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => selectItem(item)}
                          className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700/30 last:border-0 ${
                            selectedItemId === item.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                          <div className="text-[11px] text-gray-400">
                            {item.category?.name} · {item.unit} · {fmt(item.goodPrice)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quantity selector + active tier ── */}
      {selectedItem && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedItem.name}</span>
              {selectedItem.sku && <span className="ml-2 text-xs text-gray-400 font-mono">SKU: {selectedItem.sku}</span>}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">Cantidad:</span>
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number" min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-sm py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-x border-gray-200 dark:border-gray-700 focus:outline-none tabular-nums"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                tier.key === 'goodPrice' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                tier.key === 'betterPrice' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              }`}>
                {tier.label} · {tier.desc}
              </div>
              {(() => {
                const unitPrice = selectedItem[tier.key];
                return (
                  <>
                    <span className="text-sm text-gray-500">
                      <span className="text-gray-400">P/U:</span>{' '}
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{fmt(unitPrice)}</span>
                    </span>
                    <span className="text-sm text-gray-500">
                      <span className="text-gray-400">Total:</span>{' '}
                      <span className="font-bold text-lg text-primary-600 dark:text-primary-400">
                        {fmt(unitPrice != null ? unitPrice * quantity : null)}
                      </span>
                    </span>
                    {costTotal != null && (
                      <span className="text-sm text-gray-500">
                        <span className="text-gray-400">Costo total:</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{fmt(costTotal)}</span>
                      </span>
                    )}
                    {unitPrice != null && selectedItem.costPrice != null && (
                      <span className="text-sm">
                        <span className="text-gray-400">Margen:</span>{' '}
                        <span className={`font-semibold ${
                          margin(selectedItem.costPrice, unitPrice) ?? 0 >= 20 ? 'text-emerald-600' :
                          margin(selectedItem.costPrice, unitPrice) ?? 0 >= 10 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {margin(selectedItem.costPrice, unitPrice)?.toFixed(1)}%
                        </span>
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Tier quick-pick buttons */}
          <div className="flex gap-2 mt-3">
            {TIER_CONFIG.map(t => {
              const active = tier.key === t.key;
              const price = selectedItem[t.key];
              return (
                <button
                  key={t.key}
                  onClick={() => setQuantity(t.minQty)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-600 font-semibold'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {t.label} ({t.desc}) {price != null && <span className="font-medium">{fmt(price)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {pricesError && (
        <div className="card p-4 text-center">
          <p className="text-sm text-red-500">Error al cargar precios regionales</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['pricebook-regional-prices', selectedItemId] })}
            className="mt-2 text-xs text-primary-600 hover:underline inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )}

      {/* ── Region pills ── */}
      {!pricesLoading && !pricesError && statePrices && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterRegion(null)}
            className={`px-4 py-2 text-sm font-medium rounded-xl ring-1 transition-all ${
              !filterRegion
                ? 'bg-gray-900 text-white ring-gray-900 dark:bg-white dark:text-gray-900 dark:ring-white'
                : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          {REGIONS.map(r => {
            const count = statePrices?.filter(sp => sp.regionCode === r.code).length || 0;
            const s = REGION_STYLES[r.code];
            return (
              <button
                key={r.code}
                onClick={() => setFilterRegion(r.code)}
                className={`px-4 py-2 text-sm font-medium rounded-xl ring-1 transition-all ${
                  filterRegion === r.code ? s.active : s.idle
                }`}
              >
                {r.name}
                <span className="ml-1.5 text-xs opacity-60">{count} edo(s)</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Loading ── */}
      {pricesLoading && (
        <div className="card py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="text-sm text-gray-400 mt-3">Cargando precios regionales...</p>
        </div>
      )}

      {/* ── Content: table or detail ── */}
      {!pricesLoading && !pricesError && statePrices && (
        <>
          {!selectedState ? (
            /* ── State search + table ── */
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar estado por nombre o código..."
                  value={stateSearch}
                  onChange={e => setStateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>

              <div className="card p-0 overflow-hidden">
                {filteredStates.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    {stateSearch || filterRegion ? 'No hay estados con ese filtro' : 'Cargando...'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">Estado</th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">Región</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-medium">{tier.label} (P/U)</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-medium">Total</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-medium">Costo</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-medium">Margen</th>
                          <th className="text-center py-3 px-4 text-gray-500 font-medium w-20">Tipo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {filteredStates.map(sp => {
                          const unitPrice = sp[tier.key];
                          const total = unitPrice != null ? unitPrice * quantity : null;
                          const m = margin(sp.costPrice, unitPrice);
                          return (
                            <tr
                              key={sp.stateCode}
                              onClick={() => setSelectedState(sp.stateCode)}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{sp.stateName}</div>
                                <div className="text-[11px] text-gray-400 font-mono">{sp.stateCode}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${REGION_STYLES[sp.regionCode]?.badge || ''}`}>
                                  {sp.regionName}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">{fmt(unitPrice)}</td>
                              <td className="py-3 px-4 text-right font-semibold tabular-nums text-primary-600 dark:text-primary-400">{fmt(total)}</td>
                              <td className="py-3 px-4 text-right tabular-nums text-gray-500">{fmt(sp.costPrice)}</td>
                              <td className="py-3 px-4 text-right">
                                {m != null ? (
                                  <span className={`text-sm font-medium ${m >= 20 ? 'text-emerald-600' : m >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {m.toFixed(1)}%
                                  </span>
                                ) : <span className="text-gray-400">—</span>}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {sp.isOverridden ? (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                    Manual
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-400">Auto</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex justify-between bg-gray-50/50 dark:bg-gray-900/30">
                  <span>Mostrando {filteredStates.length} de {statePrices.length} estados{filterRegion ? ' · Filtro por región activo' : ''}</span>
                  <span>{statePrices.filter(s => s.isOverridden).length} con precio manual</span>
                </div>
              </div>
            </>
          ) : selectedStateData ? (
            /* ── State detail view ── */
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2 card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setSelectedState(null); setEditValues({}); setEditTier(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -ml-1">
                      <svg className="w-5 h-5 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{selectedStateData.stateName}</h3>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${REGION_STYLES[selectedStateData.regionCode]?.badge || ''}`}>
                        {selectedStateData.regionName} · Ajuste {selectedStateData.adjustmentFactor >= 0 ? '+' : ''}{(selectedStateData.adjustmentFactor * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${selectedStateData.isOverridden ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {selectedStateData.isOverridden ? 'Precio manual' : 'Regional automático'}
                  </span>
                </div>
                <div className="p-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left py-2 pr-4 text-gray-500 font-medium">Tier</th>
                        <th className="text-center py-2 px-4 text-gray-500 font-medium">Rango</th>
                        <th className="text-right py-2 px-4 text-gray-500 font-medium">Base CDMX</th>
                        <th className="text-right py-2 px-4 text-gray-500 font-medium">Precio Regional</th>
                        <th className="text-right py-2 px-4 text-gray-500 font-medium">Margen</th>
                        <th className="text-right py-2 pl-4 text-gray-500 font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TIER_CONFIG.map(({ key, label, desc }) => {
                        const base = selectedItem?.[key] as number | null;
                        const regional = selectedStateData[key] as number | null;
                        const m = margin(selectedStateData.costPrice, regional);
                        const editKey = `${selectedStateData.stateCode}_${key}`;
                        const editVal = editValues[editKey] ?? '';
                        const isEdited = editKey in editValues;

                        return (
                          <tr key={key} className={`border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${tier.key === key ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                            <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                              {label}
                              {tier.key === key && <span className="ml-1.5 text-[10px] text-primary-600 font-normal">(activo)</span>}
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-gray-400">{desc}</td>
                            <td className="py-3 px-4 text-right text-gray-500">{fmt(base)}</td>
                            <td className="py-3 px-4 text-right">
                              {isEdited ? (
                                <div className="relative inline-block">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                  <input
                                    type="number" step="0.01"
                                    value={editVal}
                                    onChange={e => setEditValues(prev => ({ ...prev, [editKey]: e.target.value }))}
                                    className="w-32 pl-5 pr-2 py-1.5 text-sm text-right bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium tabular-nums"
                                  />
                                </div>
                              ) : (
                                <span className={`font-semibold tabular-nums ${m != null && m > 0 ? 'text-gray-900 dark:text-gray-100' : m != null && m <= 0 ? 'text-red-600' : ''}`}>
                                  {fmt(regional)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {m != null ? (
                                <span className={`text-sm font-medium ${m >= 20 ? 'text-emerald-600' : m >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {m.toFixed(1)}%
                                </span>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="py-3 pl-4 text-right">
                              {isEdited ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      const v = parseFloat(editVal);
                                      if (isNaN(v)) { toast.error('Ingresa un número válido'); return; }
                                      saveMutation.mutate({ stateCode: selectedStateData.stateCode, [key]: v });
                                    }}
                                    disabled={saveMutation.isPending}
                                    className="text-xs px-2.5 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium inline-flex items-center gap-1"
                                  >
                                    {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => {
                                      const n = { ...editValues };
                                      delete n[editKey];
                                      setEditValues(n);
                                      if (Object.keys(n).length === 0) setEditTier(null);
                                    }}
                                    className="text-xs px-2.5 py-1.5 text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 font-medium"
                                  >
                                    <X className="w-3 h-3 inline" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setEditValues(prev => ({ ...prev, [editKey]: String(regional ?? '') }));
                                      setEditTier(key);
                                    }}
                                    className="text-xs px-2.5 py-1.5 text-primary-600 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 font-medium"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (regional != null) {
                                        navigator.clipboard.writeText(String(regional));
                                        toast.success(`${fmt(regional)} copiado`);
                                      }
                                    }}
                                    className="text-xs px-2.5 py-1.5 text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium"
                                    title="Copiar precio"
                                  >
                                    <ShoppingCart className="w-3 h-3 inline" /> Copiar
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {selectedStateData.isOverridden && (
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 flex justify-end">
                    <button
                      onClick={() => resetMutation.mutate(selectedStateData.stateCode)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restablecer a precio regional automático
                    </button>
                  </div>
                )}
              </div>

              {/* Quick stats sidebar */}
              <div className="card p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Resumen · {quantity} {selectedItem?.unit || 'pza(s)'}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Región</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{selectedStateData.regionName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ajuste regional</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedStateData.adjustmentFactor >= 0 ? '+' : ''}{(selectedStateData.adjustmentFactor * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tipo de precio</span>
                    <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${selectedStateData.isOverridden ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {selectedStateData.isOverridden ? 'Manual' : 'Automático'}
                    </span>
                  </div>
                  <hr className="border-gray-100 dark:border-gray-800" />
                  {TIER_CONFIG.map(({ key, label }) => {
                    const regional = selectedStateData[key] as number | null;
                    const total = regional != null ? regional * quantity : null;
                    const m = margin(selectedStateData.costPrice, regional);
                    const isActive = tier.key === key;
                    return (
                      <div key={key} className={`flex justify-between text-sm p-2 rounded-lg ${isActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                        <div>
                          <span className="text-gray-500">{label}</span>
                          {isActive && <span className="ml-1 text-[10px] text-primary-600">← activo</span>}
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {total != null ? `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                          </div>
                          <div className={`text-[11px] ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>
                            {fmt(regional)} / {selectedItem?.unit || 'pza'}
                          </div>
                          {m != null && (
                            <div className={`text-[11px] ${m >= 20 ? 'text-emerald-600' : m >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                              Margen {m.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
