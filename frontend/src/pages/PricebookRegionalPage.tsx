import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, MapPin, Save, Loader2, RotateCcw, FileText,
  TrendingUp, RefreshCw, Check, X,
  ChevronDown, ChevronRight, Percent, DollarSign, Calculator
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

export default function PricebookRegionalPage() {
  const queryClient = useQueryClient();
  const [itemSearch, setItemSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [filterRegion, setFilterRegion] = useState<string | null>(null);
  const [stateSearch, setStateSearch] = useState('');
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
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

  const summary = useMemo(() => {
    if (!statePrices || statePrices.length === 0) return null;
    const prices = statePrices.map(s => s.regionalPrice).filter((p): p is number => p != null);
    if (prices.length === 0) return null;
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      count: prices.length,
    };
  }, [statePrices]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.put(`/pricebook/items/${selectedItemId}/regional-price`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-regional-prices', selectedItemId] });
      setEditVal('');
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
    setEditVal('');
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

          {/* Price summary bar */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <DollarSign className="w-4 h-4 text-primary-500" />
              <div>
                <span className="text-[10px] text-gray-500 font-medium block">Precio Base (CDMX)</span>
                <span className="text-base font-bold text-primary-700 dark:text-primary-300 tabular-nums">{fmt(selectedItem.basePrice)}</span>
              </div>
            </div>
            {summary && (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-medium block">Promedio</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{fmt(summary.avg)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-medium block">Mín / Máx</span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums">{fmt(summary.min)} / {fmt(summary.max)}</span>
                  </div>
                </div>
              </>
            )}
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
            <input type="text" placeholder="Filtrar estado..." value={stateSearch} onChange={e => { setStateSearch(e.target.value); setExpandedState(null); setEditVal(''); }} className="w-full pl-8 pr-8 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
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

      {/* ── MAIN TABLE ── */}
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
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Ajuste</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Precio Regional</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Margen</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-gray-500 text-[10px] uppercase tracking-wider w-16">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                  {filteredStates.map((sp, idx) => {
                    const m = margin(null, sp.regionalPrice);
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
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            <span className={`text-[10px] font-medium ${sp.adjustmentFactor > 0 ? 'text-red-500' : sp.adjustmentFactor < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                              {sp.adjustmentFactor >= 0 ? '+' : ''}{(sp.adjustmentFactor * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">{fmt(sp.regionalPrice)}</td>
                          <td className="py-2.5 px-3 text-right">
                            {m != null ? (
                              <span className={`font-semibold text-xs ${m >= 20 ? 'text-emerald-600' : m >= 10 ? 'text-amber-600' : 'text-red-600'}`}>{m.toFixed(1)}%</span>
                            ) : <span className="text-gray-400 text-[10px]">—</span>}
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
                            <td colSpan={7} className="px-4 pb-4 pt-2">
                              <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 ml-10">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{sp.stateName}</span>
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${REGION_STYLES[sp.regionCode] || ''}`}>{sp.regionName}</span>
                                    <span className="text-[10px] text-gray-400">Ajuste: {sp.adjustmentFactor >= 0 ? '+' : ''}{(sp.adjustmentFactor * 100).toFixed(0)}%</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setApuOpen(prev => !prev); }} className={`text-[10px] px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 transition-all ${apuOpen ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
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
                                    basePrice={selectedItem.basePrice}
                                    onClose={() => setApuOpen(false)}
                                  />
                                ) : (
                                  <div className="flex flex-wrap items-end gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                      <label className="text-[10px] text-gray-500 font-medium block mb-1.5">Precio Regional</label>
                                      <div className="flex gap-2">
                                        <div className="relative flex-1">
                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                          <input
                                            type="number"
                                            step="0.01"
                                            placeholder={sp.regionalPrice != null ? String(sp.regionalPrice) : ''}
                                            value={editVal}
                                            onChange={e => setEditVal(e.target.value)}
                                            className="w-full pl-6 pr-3 py-2 text-sm text-right bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-semibold tabular-nums"
                                            autoFocus
                                          />
                                        </div>
                                        {editVal && (
                                          <button
                                            onClick={() => saveMutation.mutate({ stateCode: sp.stateCode, regionalPrice: parseFloat(editVal) })}
                                            disabled={saveMutation.isPending || isNaN(parseFloat(editVal))}
                                            className="px-3 py-2 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 inline-flex items-center gap-1"
                                          >
                                            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            Guardar
                                          </button>
                                        )}
                                        {editVal && (
                                          <button onClick={() => setEditVal('')} className="px-3 py-2 text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 text-xs font-medium">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                      {sp.isOverridden && (
                                        <p className="text-[10px] text-amber-600 mt-1">
                                          <span className="font-medium">Precio manual actual:</span> {fmt(sp.regionalPrice)}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                      <span className="text-[10px] text-gray-500">Base CDMX:</span>
                                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{fmt(selectedItem?.basePrice)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                      <span className="text-[10px] text-gray-500">Regional:</span>
                                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{fmt(sp.regionalPrice)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                      <span className="text-[10px] text-gray-500">Ajuste:</span>
                                      <span className="text-xs font-semibold tabular-nums">{sp.adjustmentFactor >= 0 ? '+' : ''}{(sp.adjustmentFactor * 100).toFixed(0)}%</span>
                                    </div>
                                    {sp.isOverridden && (
                                      <button
                                        onClick={() => resetMutation.mutate(sp.stateCode)}
                                        disabled={resetMutation.isPending}
                                        className="px-3 py-2 text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 text-xs font-medium inline-flex items-center gap-1"
                                      >
                                        {resetMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                        Restablecer
                                      </button>
                                    )}
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
