import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, Save, Loader2, RotateCcw, DollarSign, TrendingUp, Check, X, ShoppingCart, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface Region {
  id: number; code: string; name: string; adjustmentFactor: number; description: string | null; sortOrder: number;
  _count?: { states: number };
}

interface State {
  id: number; code: string; name: string; regionId: number;
  region: { id: number; code: string; name: string; adjustmentFactor: number };
}

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
  { code: 'NORTE', name: 'Norte', adj: 0.07, color: 'red' },
  { code: 'CENTRO-N', name: 'Centro-N', adj: 0.02, color: 'amber' },
  { code: 'CENTRO', name: 'Centro', adj: 0, color: 'blue' },
  { code: 'BAJIO', name: 'Bajío', adj: -0.02, color: 'emerald' },
  { code: 'SURESTE', name: 'Sureste', adj: -0.07, color: 'purple' },
] as const;

const REGION_COLORS: Record<string, string> = {
  NORTE: 'bg-red-100 text-red-700 ring-red-300 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700',
  'CENTRO-N': 'bg-amber-100 text-amber-700 ring-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700',
  CENTRO: 'bg-blue-100 text-blue-700 ring-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700',
  BAJIO: 'bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700',
  SURESTE: 'bg-purple-100 text-purple-700 ring-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-700',
};

const REGION_BG: Record<string, string> = {
  NORTE: 'bg-red-600',
  'CENTRO-N': 'bg-amber-600',
  CENTRO: 'bg-blue-600',
  BAJIO: 'bg-emerald-600',
  SURESTE: 'bg-purple-600',
};

const formatMoney = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—';

function calcMargin(cost: number | null, sell: number | null): number | null {
  if (cost == null || sell == null || cost === 0) return null;
  return ((sell - cost) / sell) * 100;
}

export default function PricebookRegionalPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [filterRegion, setFilterRegion] = useState<string | null>(null);
  const [stateSearch, setStateSearch] = useState('');
  const [priceEdits, setPriceEdits] = useState<Record<string, Partial<StatePrice>>>({});
  const [focusedState, setFocusedState] = useState<string | null>(null);
  const [useTier, setUseTier] = useState<'goodPrice' | 'betterPrice' | 'bestPrice'>('goodPrice');

  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ['pricebook-items-all'],
    queryFn: () => api.get('/pricebook/items/all').then(r => r.data),
  });

  const { data: statePrices, isLoading: pricesLoading } = useQuery<StatePrice[]>({
    queryKey: ['pricebook-regional-prices', selectedItemId],
    enabled: !!selectedItemId,
    queryFn: () => api.get(`/pricebook/items/${selectedItemId}/regional-prices`).then(r => r.data),
  });

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku?.toLowerCase().includes(search.toLowerCase()) ||
      i.category?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const selectedItem = useMemo(() => {
    if (!items || !selectedItemId) return null;
    return items.find(i => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const filteredPrices = useMemo(() => {
    if (!statePrices) return [];
    let list = statePrices;
    if (filterRegion) {
      list = list.filter(sp => sp.regionCode === filterRegion);
    }
    if (stateSearch) {
      const q = stateSearch.toLowerCase();
      list = list.filter(sp =>
        sp.stateName.toLowerCase().includes(q) ||
        sp.stateCode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [statePrices, filterRegion, stateSearch]);

  const regionsWithPrices = useMemo(() => {
    if (!statePrices) return REGIONS;
    return REGIONS.map(r => ({
      ...r,
      stateCount: statePrices.filter(sp => sp.regionCode === r.code).length,
    }));
  }, [statePrices]);

  const saveMutation = useMutation({
    mutationFn: async ({ stateCode, data }: { stateCode: string; data: any }) => {
      await api.put(`/pricebook/items/${selectedItemId}/regional-price`, { stateCode, ...data });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-regional-prices', selectedItemId] });
      setPriceEdits(prev => {
        const next = { ...prev };
        delete next[vars.stateCode];
        return next;
      });
      toast.success(`Precio guardado para ${vars.stateCode}`);
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

  const pendingEdits = Object.keys(priceEdits).length;

  function handlePriceChange(stateCode: string, field: string, value: number | null) {
    setPriceEdits(prev => ({
      ...prev,
      [stateCode]: { ...(prev[stateCode] || {}), [field]: value },
    }));
  }

  function handleSaveState(stateCode: string) {
    if (!selectedItemId) return;
    const edits = priceEdits[stateCode];
    if (!edits) return;
    saveMutation.mutate({ stateCode, data: edits });
  }

  function handleSaveAll() {
    if (!selectedItemId) return;
    for (const stateCode of Object.keys(priceEdits)) {
      saveMutation.mutate({ stateCode, data: priceEdits[stateCode] });
    }
  }

  function getPrice(statePrice: StatePrice, field: 'goodPrice' | 'betterPrice' | 'bestPrice' | 'costPrice'): number | null {
    const edit = priceEdits[statePrice.stateCode]?.[field];
    if (edit !== undefined) return edit as number | null;
    return statePrice[field];
  }

  const priceTiers = [
    { key: 'goodPrice' as const, label: 'Good', desc: 'Precio estándar', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { key: 'betterPrice' as const, label: 'Better', desc: 'Precio preferencial', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { key: 'bestPrice' as const, label: 'Best', desc: 'Precio promocional', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Precios Regionales</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Precios competitivos por estado con ajuste regional automático</p>
          </div>
        </div>
        {selectedItem && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
              Base CDMX: <strong className="text-gray-700 dark:text-gray-300">{formatMoney(selectedItem.goodPrice)}</strong>
            </span>
            {pendingEdits > 0 && (
              <button onClick={handleSaveAll} disabled={saveMutation.isPending}
                className="btn-primary text-sm inline-flex items-center gap-1.5">
                {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Guardar ({pendingEdits})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Left: Item selector */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="card p-0">
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="Buscar artículo..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>
            {itemsLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50 max-h-[65vh] overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">
                    {search ? 'Sin resultados' : 'Selecciona un artículo'}
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`w-full text-left px-3 py-2.5 transition-colors ${
                        selectedItemId === item.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.category && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{item.category.name}</span>
                        )}
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{item.unit}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: pricing panel */}
        <div className="flex-1 min-w-0 space-y-4">
          {!selectedItemId ? (
            <div className="card py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Selecciona un artículo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Elige un artículo del listado para ver precios ajustados por estado
              </p>
            </div>
          ) : pricesLoading ? (
            <div className="card py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            </div>
          ) : (
            <>
              {/* Item info bar */}
              <div className="card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{selectedItem?.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedItem?.category?.name} · {selectedItem?.unit}
                      {selectedItem?.sku && <span className="ml-2 font-mono text-xs text-gray-400">{selectedItem.sku}</span>}
                    </p>
                  </div>
                  {/* Tier selector */}
                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    {priceTiers.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setUseTier(t.key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          useTier === t.key
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Region filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterRegion(null)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ring-1 ${
                    !filterRegion
                      ? 'bg-gray-900 text-white ring-gray-900 dark:bg-white dark:text-gray-900 dark:ring-white'
                      : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-gray-700'
                  }`}
                >
                  Todas las regiones
                </button>
                {regionsWithPrices.map(r => (
                  <button
                    key={r.code}
                    onClick={() => setFilterRegion(r.code)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ring-1 ${
                      filterRegion === r.code
                        ? `${REGION_BG[r.code]} text-white ring-transparent`
                        : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-gray-700'
                    }`}
                  >
                    {r.name} {r.adj >= 0 ? '+' : ''}{(r.adj * 100).toFixed(0)}%
                  </button>
                ))}
              </div>

              {/* State search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="Buscar estado..."
                  value={stateSearch}
                  onChange={e => setStateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>

              {/* Price cards grid */}
              {filteredPrices.length === 0 ? (
                <div className="card py-8 text-center text-sm text-gray-400">Sin estados para mostrar</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredPrices.map(sp => {
                    const selTier = sp[useTier as keyof StatePrice] as number | null;
                    const basePrice = selectedItem?.[useTier] as number | null;
                    const margin = calcMargin(sp.costPrice, selTier);
                    const isEdited = !!priceEdits[sp.stateCode];
                    const isSaving = saveMutation.isPending && !!priceEdits[sp.stateCode];

                    return (
                      <div
                        key={sp.stateCode}
                        className={`card p-0 overflow-hidden transition-all ${
                          focusedState === sp.stateCode ? 'ring-2 ring-primary-500 shadow-lg' : ''
                        } ${sp.isOverridden || isEdited ? 'ring-1 ring-amber-300 dark:ring-amber-700' : ''}`}
                        onClick={() => setFocusedState(sp.stateCode)}
                      >
                        {/* State header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full ${sp.isOverridden || isEdited ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                            <div>
                              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{sp.stateName}</span>
                              <span className="text-[10px] text-gray-400 ml-1.5 font-mono">{sp.stateCode}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ${REGION_COLORS[sp.regionCode]}`}>
                            {sp.regionName}
                          </span>
                        </div>

                        {/* Price and adjust */}
                        <div className="p-4 space-y-3">
                          {/* Main price display */}
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Precio {priceTiers.find(t => t.key === useTier)?.label}</span>
                            <div className="text-right">
                              <span className={`text-xl font-bold tabular-nums ${margin != null && margin > 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
                                {formatMoney(selTier)}
                              </span>
                              {basePrice != null && selTier != null && basePrice !== selTier && (
                                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                  Base: {formatMoney(basePrice)} · Ajuste: {((selTier - basePrice) / basePrice * 100).toFixed(0)}%
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Cost and margin row */}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Costo: {formatMoney(sp.costPrice)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Percent className="w-3 h-3" />
                              Margen: {margin != null ? `${margin.toFixed(1)}%` : '—'}
                            </span>
                            <span className="text-[10px]">
                              Factor: {sp.adjustmentFactor >= 0 ? '+' : ''}{(sp.adjustmentFactor * 100).toFixed(0)}%
                            </span>
                          </div>

                          {/* Manual override inputs */}
                          <div className={`grid grid-cols-2 gap-2 transition-all ${focusedState === sp.stateCode ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                            {priceTiers.map(t => (
                              <div key={t.key}>
                                <label className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5 block">{t.label}</label>
                                <div className={`relative rounded-md border ${focusedState === sp.stateCode ? 'border-gray-200 dark:border-gray-600' : 'border-transparent'} overflow-hidden`}>
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                  <input
                                    type="number" step="0.01"
                                    value={getPrice(sp, t.key) ?? ''}
                                    onChange={e => handlePriceChange(sp.stateCode, t.key, e.target.value ? parseFloat(e.target.value) : null)}
                                    onFocus={() => setFocusedState(sp.stateCode)}
                                    className={`w-full pl-5 pr-2 py-1.5 text-xs font-medium text-right bg-transparent focus:outline-none tabular-nums ${
                                      sp.isOverridden || isEdited ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'
                                    }`}
                                    placeholder="—"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-end gap-1.5">
                          {isEdited && (
                            <button
                              onClick={e => { e.stopPropagation(); handleSaveState(sp.stateCode); }}
                              disabled={saveMutation.isPending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Guardar
                            </button>
                          )}
                          {sp.isOverridden && !isEdited && (
                            <button
                              onClick={e => { e.stopPropagation(); resetMutation.mutate(sp.stateCode); }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Restaurar
                            </button>
                          )}

                          {/* Copy for quoting */}
                          {selTier != null && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(String(selTier));
                                toast.success(`$${selTier.toLocaleString('es-MX', { minimumFractionDigits: 2 })} copiado`);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                              title="Copiar precio"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              Copiar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary bar */}
              {filteredPrices.length > 0 && (
                <div className="card p-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Mostrando {filteredPrices.length} de {statePrices?.length || 0} estados
                    {filterRegion ? ` (${REGIONS.find(r => r.code === filterRegion)?.name})` : ''}
                  </span>
                  <span>
                    {statePrices?.filter(s => s.isOverridden).length || 0} con precios manuales
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
