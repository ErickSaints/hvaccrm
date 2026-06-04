import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Plus, Trash2, Save, X, ChevronRight,
  Package, Users, Wrench, Calculator,
  Percent, DollarSign, AlertCircle, Info, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface MaterialLine {
  description: string; unit: string; quantity: number; unitCost: number; total: number;
}

interface LaborLine {
  category: string; workers: number; hours: number; hourlyWage: number; total: number;
}

interface EquipmentLine {
  description: string; unit: string; quantity: number; unitCost: number; total: number;
}

interface BreakdownData {
  itemId: number; exists: boolean;
  indirectPct: number; financingPct: number; profitPct: number; additionalPct: number; toolPct: number;
  materials: MaterialLine[]; labor: LaborLine[]; equipment: EquipmentLine[];
  totals: {
    totalMaterials: number; totalLabor: number; toolCost: number; totalEquipment: number;
    directCost: number; indirectCost: number; financingCost: number; profit: number;
    additionalCost: number; unitPrice: number;
  };
}

interface Props {
  itemId: number;
  goodPrice: number | null;
  betterPrice: number | null;
  bestPrice: number | null;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const emptyMaterial = (): MaterialLine => ({ description: '', unit: 'pza', quantity: 1, unitCost: 0, total: 0 });
const emptyLabor = (): LaborLine => ({ category: '', workers: 1, hours: 8, hourlyWage: 0, total: 0 });
const emptyEquipment = (): EquipmentLine => ({ description: '', unit: 'hr', quantity: 1, unitCost: 0, total: 0 });

// ── Component ────────────────────────────────────────────────────────────────

export default function PricebookBreakdownEditor({ itemId, goodPrice, betterPrice, bestPrice, onClose }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'materials' | 'labor' | 'equipment'>('materials');

  const { data: breakdown, isLoading, isError, refetch } = useQuery<BreakdownData>({
    queryKey: ['pricebook-breakdown', itemId],
    queryFn: () => api.get(`/pricebook/items/${itemId}/breakdown`).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const r = await api.put(`/pricebook/items/${itemId}/breakdown`, payload);
      return r.data as BreakdownData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['pricebook-breakdown', itemId], data);
      toast.success('Desglose guardado');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al guardar'),
  });

  // ── State (local copy for editing) ─────────────────────────────────────
  const [local, setLocal] = useState<{
    indirectPct: number; financingPct: number; profitPct: number;
    additionalPct: number; toolPct: number;
    materials: MaterialLine[]; labor: LaborLine[]; equipment: EquipmentLine[];
  } | null>(null);

  // Initialize local state from server data
  if (!local && breakdown) {
    setLocal({
      indirectPct: breakdown.indirectPct,
      financingPct: breakdown.financingPct,
      profitPct: breakdown.profitPct,
      additionalPct: breakdown.additionalPct,
      toolPct: breakdown.toolPct,
      materials: breakdown.materials.length > 0
        ? breakdown.materials
        : [emptyMaterial()],
      labor: breakdown.labor.length > 0
        ? breakdown.labor
        : [emptyLabor()],
      equipment: breakdown.equipment.length > 0
        ? breakdown.equipment
        : [emptyEquipment()],
    });
  }

  // Calculated totals from local state
  function calcTotals(d: typeof local) {
    if (!d) return null;
    const totalMaterials = d.materials.reduce((s, m) => s + m.total, 0);
    const totalLabor = d.labor.reduce((s, l) => s + l.total, 0);
    const toolCost = totalLabor * (d.toolPct / 100);
    const totalEquipment = d.equipment.reduce((s, e) => s + e.total, 0);
    const directCost = totalMaterials + totalLabor + toolCost + totalEquipment;
    const indirectCost = directCost * (d.indirectPct / 100);
    const financingCost = (directCost + indirectCost) * (d.financingPct / 100);
    const profit = (directCost + indirectCost + financingCost) * (d.profitPct / 100);
    const additionalCost = directCost * (d.additionalPct / 100);
    const unitPrice = directCost + indirectCost + financingCost + profit + additionalCost;
    return { totalMaterials, totalLabor, toolCost, totalEquipment, directCost, indirectCost, financingCost, profit, additionalCost, unitPrice };
  }

  const totals = calcTotals(local);
  const hasChanges = local && breakdown && (
    local.indirectPct !== breakdown.indirectPct ||
    local.financingPct !== breakdown.financingPct ||
    local.profitPct !== breakdown.profitPct ||
    local.additionalPct !== breakdown.additionalPct ||
    local.toolPct !== breakdown.toolPct ||
    JSON.stringify(local.materials) !== JSON.stringify(breakdown.materials) ||
    JSON.stringify(local.labor) !== JSON.stringify(breakdown.labor) ||
    JSON.stringify(local.equipment) !== JSON.stringify(breakdown.equipment)
  );

  // ── Mutators ───────────────────────────────────────────────────────────

  function updateField(field: string, value: number) {
    setLocal(prev => prev ? { ...prev, [field]: value } : prev);
  }

  function updateMaterial(idx: number, field: keyof MaterialLine, value: string | number) {
    setLocal(prev => {
      if (!prev) return prev;
      const materials = prev.materials.map((m, i) => {
        if (i !== idx) return m;
        const updated = { ...m, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updated.total = updated.quantity * updated.unitCost;
        }
        return updated;
      });
      return { ...prev, materials };
    });
  }

  function addMaterial() {
    setLocal(prev => prev ? { ...prev, materials: [...prev.materials, emptyMaterial()] } : prev);
  }

  function removeMaterial(idx: number) {
    setLocal(prev => {
      if (!prev) return prev;
      const materials = prev.materials.filter((_, i) => i !== idx);
      return { ...prev, materials: materials.length === 0 ? [emptyMaterial()] : materials };
    });
  }

  function updateLabor(idx: number, field: keyof LaborLine, value: string | number) {
    setLocal(prev => {
      if (!prev) return prev;
      const labor = prev.labor.map((l, i) => {
        if (i !== idx) return l;
        const updated = { ...l, [field]: value };
        if (field === 'workers' || field === 'hours' || field === 'hourlyWage') {
          updated.total = updated.workers * updated.hours * updated.hourlyWage;
        }
        return updated;
      });
      return { ...prev, labor };
    });
  }

  function addLabor() {
    setLocal(prev => prev ? { ...prev, labor: [...prev.labor, emptyLabor()] } : prev);
  }

  function removeLabor(idx: number) {
    setLocal(prev => {
      if (!prev) return prev;
      const labor = prev.labor.filter((_, i) => i !== idx);
      return { ...prev, labor: labor.length === 0 ? [emptyLabor()] : labor };
    });
  }

  function updateEquipment(idx: number, field: keyof EquipmentLine, value: string | number) {
    setLocal(prev => {
      if (!prev) return prev;
      const equipment = prev.equipment.map((e, i) => {
        if (i !== idx) return e;
        const updated = { ...e, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updated.total = updated.quantity * updated.unitCost;
        }
        return updated;
      });
      return { ...prev, equipment };
    });
  }

  function addEquipment() {
    setLocal(prev => prev ? { ...prev, equipment: [...prev.equipment, emptyEquipment()] } : prev);
  }

  function removeEquipment(idx: number) {
    setLocal(prev => {
      if (!prev) return prev;
      const equipment = prev.equipment.filter((_, i) => i !== idx);
      return { ...prev, equipment: equipment.length === 0 ? [emptyEquipment()] : equipment };
    });
  }

  function handleSave() {
    if (!local) return;
    saveMutation.mutate({
      indirectPct: local.indirectPct,
      financingPct: local.financingPct,
      profitPct: local.profitPct,
      additionalPct: local.additionalPct,
      toolPct: local.toolPct,
      materials: local.materials.map(m => ({
        ...m,
        total: m.quantity * m.unitCost,
      })),
      labor: local.labor.map(l => ({
        ...l,
        total: l.workers * l.hours * l.hourlyWage,
      })),
      equipment: local.equipment.map(e => ({
        ...e,
        total: e.quantity * e.unitCost,
      })),
    });
  }

  // ── Loading / Error ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
        <p className="text-xs text-gray-400 mt-2">Cargando desglose...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
        <p className="text-xs text-gray-500 mb-2">Error al cargar desglose</p>
        <button onClick={() => refetch()} className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Reintentar</button>
      </div>
    );
  }

  if (!local) return null;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary-500" />
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Análisis de Precio Unitario (APU)</span>
          <span className="text-[10px] text-gray-400">|</span>
          <span className="text-[10px] text-gray-500">PU = CD + CI + CF + U + CA</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-4 h-4" /></button>
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {([
          { key: 'materials', label: 'Materiales', icon: Package },
          { key: 'labor', label: 'Mano de Obra', icon: Users },
          { key: 'equipment', label: 'Equipo y Herramienta', icon: Wrench },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === key
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── PERCENTAGE FACTORS BAR ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {([
          { key: 'toolPct', label: 'Herramienta', suffix: '% MO' },
          { key: 'indirectPct', label: 'Indirectos', suffix: '% CD' },
          { key: 'financingPct', label: 'Financiamiento', suffix: '% (CD+CI)' },
          { key: 'profitPct', label: 'Utilidad', suffix: '% (CD+CI+CF)' },
          { key: 'additionalPct', label: 'Adicionales', suffix: '% CD' },
        ] as const).map(({ key, label, suffix }) => (
          <div key={key} className="flex flex-col">
            <label className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1">
              {label}
              {key === 'toolPct' && (
                <span className="relative group">
                  <Info className="w-2.5 h-2.5 text-gray-300 cursor-help" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">% sobre la mano de obra</span>
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="number" min="0" max="100" step="0.1"
                value={local[key]} onChange={e => updateField(key, parseFloat(e.target.value) || 0)}
                className="w-full pl-2 pr-6 py-1 text-xs text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-medium tabular-nums"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">{suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── LINE ITEMS TABLE ── */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {tab === 'materials' && (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 font-medium text-gray-500">Descripción</th>
                <th className="text-center py-2 px-2 font-medium text-gray-500 w-16">Unidad</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-20">Cantidad</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-24">Costo Unit.</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-24">Importe</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
              {local.materials.map((m, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-1.5 px-2">
                    <input type="text" value={m.description} onChange={e => updateMaterial(idx, 'description', e.target.value)} placeholder="Describir material..." className="w-full px-1.5 py-1 text-xs bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800" />
                  </td>
                  <td className="py-1.5 px-2">
                    <input type="text" value={m.unit} onChange={e => updateMaterial(idx, 'unit', e.target.value)} className="w-full px-1.5 py-1 text-xs text-center bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800" />
                  </td>
                  <td className="py-1.5 px-2">
                    <input type="number" min="0" step="0.01" value={m.quantity} onChange={e => updateMaterial(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="relative">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">$</span>
                      <input type="number" min="0" step="0.01" value={m.unitCost} onChange={e => updateMaterial(idx, 'unitCost', parseFloat(e.target.value) || 0)} className="w-full pl-4 pr-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(m.total)}</td>
                  <td className="py-1.5 px-2">
                    <button onClick={() => removeMaterial(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'labor' && (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 font-medium text-gray-500">Categoría</th>
                <th className="text-center py-2 px-2 font-medium text-gray-500 w-16">Trabajadores</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-20">Horas</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-24">Salario Real/hr</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-24">Importe</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
              {local.labor.map((l, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-1.5 px-2">
                    <input type="text" value={l.category} onChange={e => updateLabor(idx, 'category', e.target.value)} placeholder="Ej: Oficial, Ayudante..." className="w-full px-1.5 py-1 text-xs bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800" />
                  </td>
                  <td className="py-1.5 px-2">
                    <input type="number" min="1" step="1" value={l.workers} onChange={e => updateLabor(idx, 'workers', parseInt(e.target.value) || 1)} className="w-full px-1.5 py-1 text-xs text-center bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                  </td>
                  <td className="py-1.5 px-2">
                    <input type="number" min="0" step="0.5" value={l.hours} onChange={e => updateLabor(idx, 'hours', parseFloat(e.target.value) || 0)} className="w-full px-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="relative">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">$</span>
                      <input type="number" min="0" step="0.01" value={l.hourlyWage} onChange={e => updateLabor(idx, 'hourlyWage', parseFloat(e.target.value) || 0)} className="w-full pl-4 pr-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(l.total)}</td>
                  <td className="py-1.5 px-2">
                    <button onClick={() => removeLabor(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'equipment' && (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 font-medium text-gray-500">Descripción</th>
                <th className="text-center py-2 px-2 font-medium text-gray-500 w-16">Unidad</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-20">Cantidad</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-24">Costo Unit.</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-24">Importe</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
              {local.equipment.map((e, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-1.5 px-2">
                    <input type="text" value={e.description} onChange={e2 => updateEquipment(idx, 'description', e2.target.value)} placeholder="Ej: Andamio, Cortadora..." className="w-full px-1.5 py-1 text-xs bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800" />
                  </td>
                  <td className="py-1.5 px-2">
                    <input type="text" value={e.unit} onChange={e2 => updateEquipment(idx, 'unit', e2.target.value)} className="w-full px-1.5 py-1 text-xs text-center bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800" />
                  </td>
                  <td className="py-1.5 px-2">
                    <input type="number" min="0" step="0.01" value={e.quantity} onChange={e2 => updateEquipment(idx, 'quantity', parseFloat(e2.target.value) || 0)} className="w-full px-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="relative">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">$</span>
                      <input type="number" min="0" step="0.01" value={e.unitCost} onChange={e2 => updateEquipment(idx, 'unitCost', parseFloat(e2.target.value) || 0)} className="w-full pl-4 pr-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(e.total)}</td>
                  <td className="py-1.5 px-2">
                    <button onClick={() => removeEquipment(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add row button */}
        <div className="px-2 py-1.5 border-t border-gray-100 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-900/20">
          <button
            onClick={() => { if (tab === 'materials') addMaterial(); else if (tab === 'labor') addLabor(); else addEquipment(); }}
            className="text-[10px] text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1 font-medium"
          >
            <Plus className="w-3 h-3" /> Agregar renglón
          </button>
        </div>
      </div>

      {/* ── SUMMARY (TARJETA DE COSTOS) ── */}
      {totals && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Resumen de Costos</span>
          </div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {/* Direct Cost breakdown */}
            <div className="space-y-1">
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Materiales</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.totalMaterials)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Mano de Obra</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.totalLabor)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Herramienta ({local.toolPct}%)</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.toolCost)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Equipo</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.totalEquipment)}</span>
              </div>
              <div className="flex justify-between py-1 mt-1 border-t border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-gray-100">
                <span>Costo Directo (CD)</span>
                <span className="tabular-nums">{fmt(totals.directCost)}</span>
              </div>
            </div>

            {/* Indirect costs */}
            <div className="space-y-1">
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Indirectos ({local.indirectPct}%)</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.indirectCost)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Financiamiento ({local.financingPct}%)</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.financingCost)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Utilidad ({local.profitPct}%)</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.profit)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Adicionales ({local.additionalPct}%)</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.additionalCost)}</span>
              </div>
              <div className="flex justify-between py-1 mt-1 border-t-2 border-primary-400 bg-primary-50 dark:bg-primary-900/20 -mx-3 px-3 rounded-b-lg font-bold text-primary-700 dark:text-primary-300">
                <span>Precio Unitario (PU)</span>
                <span className="tabular-nums text-sm">{fmt(totals.unitPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPARISON WITH CURRENT TIERS ── */}
      {totals && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg text-[10px]">
          <span className="text-gray-500 font-medium">Comparación:</span>
          {[
            { label: 'Good', price: goodPrice, color: 'text-blue-600' },
            { label: 'Better', price: betterPrice, color: 'text-amber-600' },
            { label: 'Best', price: bestPrice, color: 'text-emerald-600' },
          ].map(({ label, price, color }) => {
            const diff = price != null ? ((price - totals.unitPrice) / totals.unitPrice * 100) : null;
            return (
              <span key={label} className={`${color} font-medium`}>
                {label}: {fmt(price)}
                {diff != null && (
                  <span className={`ml-1 ${diff >= 0 ? 'text-emerald-500' : 'text-red-400'} tabular-nums`}>
                    ({diff >= 0 ? '+' : ''}{diff.toFixed(1)}%)
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* ── SAVE BUTTON ── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 shadow-sm transition-all"
        >
          {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saveMutation.isPending ? 'Guardando...' : hasChanges ? 'Guardar Desglose' : 'Guardado'}
        </button>
      </div>
    </div>
  );
}
