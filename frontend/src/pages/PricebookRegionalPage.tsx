import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, DollarSign, RefreshCw, Save, Loader2, X, Edit3, TrendingUp, CheckCircle } from 'lucide-react';
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

const formatMoney = (v: number | null) =>
  v != null ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—';

function PriceCell({ value, onChange, onBlur, isOverridden }: {
  value: number | null; onChange: (v: number | null) => void; onBlur?: () => void; isOverridden: boolean;
}) {
  const [edit, setEdit] = useState<string>(value != null ? String(value) : '');
  const [focused, setFocused] = useState(false);
  const display = focused ? edit : formatMoney(value);
  return (
    <div className="relative">
      {isOverridden && !focused && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400 rounded-full" />
      )}
      <input
        value={display as string}
        onChange={e => { setEdit(e.target.value); onChange(e.target.value ? parseFloat(e.target.value) : null); }}
        onFocus={() => { setEdit(value != null ? String(value) : ''); setFocused(true); }}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        className={`w-full text-right bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-primary-500 focus:outline-none px-2 py-1 text-sm font-medium tabular-nums ${isOverridden ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}
        placeholder="—"
      />
    </div>
  );
}

export default function PricebookRegionalPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [priceEdits, setPriceEdits] = useState<Record<string, Partial<StatePrice>>>({});
  const [savingStates, setSavingStates] = useState<Set<string>>(new Set());

  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ['pricebook-items-all'],
    queryFn: () => api.get('/pricebook/items/all').then(r => r.data),
  });

  const { data: regions } = useQuery<Region[]>({
    queryKey: ['pricebook-regions'],
    queryFn: () => api.get('/pricebook/regions').then(r => r.data),
  });

  const { data: states } = useQuery<State[]>({
    queryKey: ['pricebook-states'],
    queryFn: () => api.get('/pricebook/states').then(r => r.data),
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
      i.sku?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const selectedItem = useMemo(() => {
    if (!items || !selectedItemId) return null;
    return items.find(i => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

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
      toast.success(`Precio guardado`);
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

  const editableFields = [
    { key: 'goodPrice' as const, label: 'GOOD', color: 'text-emerald-600' },
    { key: 'betterPrice' as const, label: 'BETTER', color: 'text-blue-600' },
    { key: 'bestPrice' as const, label: 'BEST', color: 'text-purple-600' },
    { key: 'costPrice' as const, label: 'COSTO', color: 'text-gray-600' },
  ];

  const regionColors: Record<string, string> = {
    NORTE: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    'CENTRO-N': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    CENTRO: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    BAJIO: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    SURESTE: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-700 to-red-800 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10">
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Precios Regionales
          </h1>
          <p className="text-amber-200 text-sm mt-1">
            Ajusta precios por estado con factores regionales automáticos
          </p>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* ── Left: Item selector ── */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="card-static">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Artículos
            </h3>
            <input
              type="text"
              placeholder="Buscar artículo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field mb-3"
            />
            {itemsLoading ? (
              <div className="animate-pulse space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedItemId === item.id
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-medium shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="line-clamp-1">{item.name}</span>
                    {item.sku && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">{item.sku}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Regional prices table ── */}
        <div className="flex-1 min-w-0">
          {!selectedItemId ? (
            <div className="card-static py-16 text-center">
              <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Selecciona un artículo
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Elige un artículo del listado para ver y ajustar sus precios por estado
              </p>
            </div>
          ) : pricesLoading ? (
            <div className="card-static py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
            </div>
          ) : (
            <div className="card-static p-0 overflow-hidden">
              {/* Item header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">{selectedItem?.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedItem?.category?.name} · {selectedItem?.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm">
                      Base CDMX: {formatMoney(selectedItem?.goodPrice ?? null)}
                    </span>
                    {pendingEdits > 0 && (
                      <button
                        onClick={handleSaveAll}
                        disabled={saveMutation.isPending}
                        className="btn-primary text-sm bg-amber-600 hover:bg-amber-700 inline-flex items-center gap-1.5"
                      >
                        {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Guardar {pendingEdits} cambio{pendingEdits !== 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                      <th className="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                      <th className="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Región</th>
                      <th className="text-center px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Factor</th>
                      {editableFields.map(f => (
                        <th key={f.key} className={`text-right px-3 py-3 font-semibold ${f.color}`}>{f.label}</th>
                      ))}
                      <th className="text-center px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Ovr</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {statePrices?.map(sp => {
                      const isEdited = !!priceEdits[sp.stateCode];
                      const isSaving = savingStates.has(sp.stateCode);
                      return (
                        <tr key={sp.stateCode} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${sp.isOverridden || isEdited ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{sp.stateName}</span>
                            <span className="text-xs text-gray-400 ml-1.5 font-mono">{sp.stateCode}</span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${regionColors[sp.regionCode] || 'bg-gray-100 text-gray-700'}`}>
                              {sp.regionName}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-xs font-mono font-semibold ${sp.adjustmentFactor >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {sp.adjustmentFactor >= 0 ? '+' : ''}{(sp.adjustmentFactor * 100).toFixed(0)}%
                            </span>
                          </td>
                          {editableFields.map(f => (
                            <td key={f.key} className="px-1 py-2.5">
                              <PriceCell
                                value={getPrice(sp, f.key)}
                                onChange={v => handlePriceChange(sp.stateCode, f.key, v)}
                                isOverridden={sp.isOverridden || !!priceEdits[sp.stateCode]?.[f.key] !== undefined}
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-center">
                            {sp.isOverridden ? (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                <Edit3 className="w-3 h-3" />
                                Manual
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isEdited && (
                                <button
                                  onClick={() => handleSaveState(sp.stateCode)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                  title="Guardar este estado"
                                >
                                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                              )}
                              {sp.isOverridden && !isEdited && (
                                <button
                                  onClick={() => resetMutation.mutate(sp.stateCode)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Restablecer a valor regional"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
