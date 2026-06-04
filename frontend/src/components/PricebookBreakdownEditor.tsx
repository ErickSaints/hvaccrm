import { useState, useCallback, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Plus, Trash2, Save, X, ChevronRight,
  Package, Users, Wrench, Calculator,
  Percent, DollarSign, AlertCircle, Info, RefreshCw,
  Check, Hash, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface MaterialLine {
  description: string; unit: string; quantity: number; unitCost: number; wastePct: number; total: number;
}

interface LaborLine {
  category: string; workers: number; dailyWage: number; fsrFactor: number; realDailyWage: number; total: number;
}

interface EquipmentLine {
  description: string; unit: string; quantity: number; hourlyCost: number; hoursPerDay: number; total: number;
}

interface FsrConfig {
  year: number; daysOff: number; holidays: number; vacationDays: number;
  aguinaldoDays: number; primaVacacionalPct: number; imssPct: number; infonavitPct: number; otherPct: number;
}

interface Totals {
  totalMaterials: number; totalLabor: number; toolCost: number; totalEquipment: number;
  directCost: number; indirectCost: number; financingCost: number; profit: number;
  additionalCost: number; unitPrice: number;
}

interface BreakdownData {
  itemId: number; exists: boolean;
  fsrEnabled: boolean; fsrConfig: FsrConfig;
  rendimiento: number; rendimientoUnit: string;
  indirectPct: number; financingPct: number; profitPct: number; additionalPct: number; toolPct: number;
  materials: MaterialLine[]; labor: LaborLine[]; equipment: EquipmentLine[];
  totals: Totals;
}

interface Props {
  itemId: number;
  basePrice: number | null;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const defaultFsrConfig = (): FsrConfig => ({
  year: 2025, daysOff: 78, holidays: 8, vacationDays: 12,
  aguinaldoDays: 15, primaVacacionalPct: 25, imssPct: 5, infonavitPct: 0, otherPct: 0,
});

function computeFsrFactor(cfg: FsrConfig): number {
  const totalDiasLibres = cfg.daysOff + cfg.holidays + cfg.vacationDays;
  const diasLaborados = 365 - totalDiasLibres;
  if (diasLaborados <= 0) return 1.0;
  const factorPrestaciones =
    (cfg.aguinaldoDays / 365) +
    (cfg.vacationDays * (cfg.primaVacacionalPct / 100) / 365) +
    (cfg.imssPct / 100) +
    (cfg.infonavitPct / 100) +
    (cfg.otherPct / 100);
  return (365 / diasLaborados) * (1 + factorPrestaciones);
}

function calcTotals(d: {
  indirectPct: number; financingPct: number; profitPct: number; additionalPct: number; toolPct: number;
  materials: MaterialLine[]; labor: LaborLine[]; equipment: EquipmentLine[];
}): Totals {
  const totalMaterials = d.materials.reduce((s, m) => s + m.total, 0);
  const totalLabor = d.labor.reduce((s, l) => s + l.total, 0);
  const totalEquipment = d.equipment.reduce((s, e) => s + e.total, 0);
  const toolCost = (totalLabor + totalEquipment) * (d.toolPct / 100);
  const directCost = totalMaterials + totalLabor + totalEquipment + toolCost;
  const indirectCost = directCost * (d.indirectPct / 100);
  const financingCost = (directCost + indirectCost) * (d.financingPct / 100);
  const profit = (directCost + indirectCost + financingCost) * (d.profitPct / 100);
  const additionalCost = directCost * (d.additionalPct / 100);
  const unitPrice = directCost + indirectCost + financingCost + profit + additionalCost;
  return { totalMaterials, totalLabor, toolCost, totalEquipment, directCost, indirectCost, financingCost, profit, additionalCost, unitPrice };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PricebookBreakdownEditor({ itemId, basePrice, onClose }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'materials' | 'labor' | 'equipment' | 'fsr'>('materials');
  const [showApplyModal, setShowApplyModal] = useState(false);

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

  const updateItemMutation = useMutation({
    mutationFn: async (payload: { basePrice?: number }) => {
      const r = await api.put(`/pricebook/items/${itemId}`, payload);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['pricebook-items'] });
      queryClient.invalidateQueries({ queryKey: ['pricebook-categories'] });
      toast.success('Precios actualizados');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al actualizar precios'),
  });

  // ── Local state ────────────────────────────────────────────────────────
  const [local, setLocal] = useState<{
    fsrEnabled: boolean; fsrConfig: FsrConfig;
    rendimiento: number; rendimientoUnit: string;
    indirectPct: number; financingPct: number; profitPct: number;
    additionalPct: number; toolPct: number;
    materials: MaterialLine[]; labor: LaborLine[]; equipment: EquipmentLine[];
  } | null>(null);

  // Initialize local state from server data
  if (!local && breakdown) {
    setLocal({
      fsrEnabled: breakdown.fsrEnabled,
      fsrConfig: { ...defaultFsrConfig(), ...breakdown.fsrConfig },
      rendimiento: breakdown.rendimiento || 1,
      rendimientoUnit: breakdown.rendimientoUnit || 'pza/jor',
      indirectPct: breakdown.indirectPct,
      financingPct: breakdown.financingPct,
      profitPct: breakdown.profitPct,
      additionalPct: breakdown.additionalPct,
      toolPct: breakdown.toolPct,
      materials: breakdown.materials.length > 0 ? breakdown.materials : [emptyMaterial()],
      labor: breakdown.labor.length > 0 ? breakdown.labor : [emptyLabor()],
      equipment: breakdown.equipment.length > 0 ? breakdown.equipment : [emptyEquipment()],
    });
  }

  const totals = calcTotals(local ?? breakdown ?? {} as any);
  const fsrFactor = local ? computeFsrFactor(local.fsrConfig) : 1;
  const hasChanges = local && breakdown && (
    local.fsrEnabled !== breakdown.fsrEnabled ||
    JSON.stringify(local.fsrConfig) !== JSON.stringify(breakdown.fsrConfig) ||
    local.rendimiento !== breakdown.rendimiento ||
    local.rendimientoUnit !== breakdown.rendimientoUnit ||
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

  function updateField(field: string, value: any) {
    setLocal(prev => prev ? { ...prev, [field]: value } : prev);
  }

  function updateFsrConfig<K extends keyof FsrConfig>(field: K, value: number) {
    setLocal(prev => {
      if (!prev) return prev;
      const fsrConfig = { ...prev.fsrConfig, [field]: value };
      return { ...prev, fsrConfig };
    });
  }

  // Materials
  function updateMaterial(idx: number, field: keyof MaterialLine, value: string | number) {
    setLocal(prev => {
      if (!prev) return prev;
      const materials = prev.materials.map((m, i) => {
        if (i !== idx) return m;
        const updated = { ...m, [field]: value };
        if (field === 'quantity' || field === 'unitCost' || field === 'wastePct') {
          updated.total = updated.quantity * updated.unitCost * (1 + updated.wastePct / 100);
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

  // Labor
  function updateLabor(idx: number, field: keyof LaborLine, value: string | number) {
    setLocal(prev => {
      if (!prev) return prev;
      let fsrConfig = prev.fsrConfig;
      const labor = prev.labor.map((l, i) => {
        if (i !== idx) return l;
        const updated = { ...l, [field]: value };
        if (field === 'dailyWage' || field === 'fsrFactor') {
          updated.realDailyWage = updated.dailyWage * updated.fsrFactor;
          updated.total = updated.workers * updated.realDailyWage;
        }
        if (field === 'workers') {
          updated.total = updated.workers * updated.realDailyWage;
        }
        return updated;
      });
      return { ...prev, labor };
    });
  }

  function recalcAllLabor(factor: number) {
    setLocal(prev => {
      if (!prev) return prev;
      const labor = prev.labor.map(l => {
        const realDailyWage = l.dailyWage * factor;
        return { ...l, fsrFactor: factor, realDailyWage, total: l.workers * realDailyWage };
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

  // Equipment
  function updateEquipment(idx: number, field: keyof EquipmentLine, value: string | number) {
    setLocal(prev => {
      if (!prev) return prev;
      const equipment = prev.equipment.map((e, i) => {
        if (i !== idx) return e;
        const updated = { ...e, [field]: value };
        if (field === 'hourlyCost' || field === 'hoursPerDay' || field === 'quantity') {
          updated.total = updated.quantity * updated.hourlyCost * updated.hoursPerDay;
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
      fsrEnabled: local.fsrEnabled,
      fsrConfig: local.fsrConfig,
      rendimiento: local.rendimiento,
      rendimientoUnit: local.rendimientoUnit,
      indirectPct: local.indirectPct,
      financingPct: local.financingPct,
      profitPct: local.profitPct,
      additionalPct: local.additionalPct,
      toolPct: local.toolPct,
      materials: local.materials.map(m => ({
        ...m,
        total: m.quantity * m.unitCost * (1 + (m.wastePct || 0) / 100),
      })),
      labor: local.labor.map(l => ({
        ...l,
        realDailyWage: l.dailyWage * l.fsrFactor,
        total: l.workers * l.dailyWage * l.fsrFactor,
      })),
      equipment: local.equipment.map(e => ({
        ...e,
        total: e.quantity * e.hourlyCost * e.hoursPerDay,
      })),
    });
  }

  function handleApplyToTiers(markupPct: number) {
    if (!totals) return;
    const pu = totals.unitPrice;
    const apply = (pct: number) => Math.round(pu * (1 + pct / 100) * 100) / 100;
    updateItemMutation.mutate({ basePrice: apply(markupPct) });
    setShowApplyModal(false);
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

      {/* ── FSR INDICATOR ── */}
      {local.fsrEnabled && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/40">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="text-[10px] text-blue-700 dark:text-blue-300">
            FSR activo: <strong>{fsrFactor.toFixed(4)}</strong> |
            Días laborados: {(365 - local.fsrConfig.daysOff - local.fsrConfig.holidays - local.fsrConfig.vacationDays)} |
            Rendimiento: {local.rendimiento} {local.rendimientoUnit}
          </span>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {([
          { key: 'materials' as const, label: 'Materiales', icon: Package },
          { key: 'labor' as const, label: 'Mano de Obra', icon: Users },
          { key: 'equipment' as const, label: 'Equipo', icon: Wrench },
          { key: 'fsr' as const, label: 'FSR y %', icon: Settings },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === key
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── MATERIALS TAB ── */}
      {tab === 'materials' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 font-medium text-gray-500">Descripción</th>
                <th className="text-center py-2 px-2 font-medium text-gray-500 w-14">Unidad</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-16">Cant.</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-22">Costo Unit.</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-14">Desp.%</th>
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
                  <td className="py-1.5 px-2">
                    <input type="number" min="0" max="100" step="0.1" value={m.wastePct} onChange={e => updateMaterial(idx, 'wastePct', parseFloat(e.target.value) || 0)} className="w-full px-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                  </td>
                  <td className="py-1.5 px-2 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(m.total)}</td>
                  <td className="py-1.5 px-2">
                    <button onClick={() => removeMaterial(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-2 py-1.5 border-t border-gray-100 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-900/20">
            <button onClick={addMaterial} className="text-[10px] text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1 font-medium">
              <Plus className="w-3 h-3" /> Agregar material
            </button>
          </div>
        </div>
      )}

      {/* ── LABOR TAB ── */}
      {tab === 'labor' && (
        <div className="space-y-3">
          {local.fsrEnabled && (
            <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/40">
              <div className="flex items-center gap-2 text-[11px] text-blue-700 dark:text-blue-300">
                <Calculator className="w-3.5 h-3.5" />
                <span>FSR calculado: <strong className="text-blue-800 dark:text-blue-200">{fsrFactor.toFixed(4)}</strong></span>
                <span className="text-blue-400">|</span>
                <span>SDI = Salario × {fsrFactor.toFixed(4)}</span>
              </div>
              <button
                onClick={() => recalcAllLabor(fsrFactor)}
                className="text-[10px] bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-700/40 transition-colors inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Recalcular todo con FSR
              </button>
            </div>
          )}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Categoría</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500 w-14">Trab.</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500 w-22">Salario Base/día</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500 w-20">Factor FSR</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500 w-22">Salario Real/día</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500 w-22">Importe/jor</th>
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
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">$</span>
                        <input type="number" min="0" step="0.01" value={l.dailyWage} onChange={e => updateLabor(idx, 'dailyWage', parseFloat(e.target.value) || 0)} className="w-full pl-4 pr-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="number" min="1" step="0.0001" value={l.fsrFactor} onChange={e => updateLabor(idx, 'fsrFactor', parseFloat(e.target.value) || 1)} className="w-full px-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums font-mono" />
                    </td>
                    <td className="py-1.5 px-2 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(l.realDailyWage)}</td>
                    <td className="py-1.5 px-2 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(l.total)}</td>
                    <td className="py-1.5 px-2">
                      <button onClick={() => removeLabor(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-2 py-1.5 border-t border-gray-100 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-900/20">
              <button onClick={addLabor} className="text-[10px] text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1 font-medium">
                <Plus className="w-3 h-3" /> Agregar categoría
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EQUIPMENT TAB ── */}
      {tab === 'equipment' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 font-medium text-gray-500">Descripción</th>
                <th className="text-center py-2 px-2 font-medium text-gray-500 w-14">Unidad</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-14">Cant.</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-22">Costo/hr</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-16">Hrs/día</th>
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
                      <input type="number" min="0" step="0.01" value={e.hourlyCost} onChange={e2 => updateEquipment(idx, 'hourlyCost', parseFloat(e2.target.value) || 0)} className="w-full pl-4 pr-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                    </div>
                  </td>
                  <td className="py-1.5 px-2">
                    <input type="number" min="0" step="0.5" value={e.hoursPerDay} onChange={e2 => updateEquipment(idx, 'hoursPerDay', parseFloat(e2.target.value) || 0)} className="w-full px-1.5 py-1 text-xs text-right bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded focus:outline-none focus:bg-white dark:focus:bg-gray-800 tabular-nums" />
                  </td>
                  <td className="py-1.5 px-2 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(e.total)}</td>
                  <td className="py-1.5 px-2">
                    <button onClick={() => removeEquipment(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-2 py-1.5 border-t border-gray-100 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-900/20">
            <button onClick={addEquipment} className="text-[10px] text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1 font-medium">
              <Plus className="w-3 h-3" /> Agregar equipo
            </button>
          </div>
        </div>
      )}

      {/* ── FSR + PERCENTAGES TAB ── */}
      {tab === 'fsr' && (
        <div className="space-y-4">
          {/* Rendimiento */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> Rendimiento
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] text-gray-500 mb-1">Unidades por jornada</label>
                <input type="number" min="0.01" step="0.01" value={local.rendimiento} onChange={e => updateField('rendimiento', parseFloat(e.target.value) || 1)} className="w-full px-2 py-1.5 text-xs text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500/30 tabular-nums" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-gray-500 mb-1">Unidad de rendimiento</label>
                <input type="text" value={local.rendimientoUnit} onChange={e => updateField('rendimientoUnit', e.target.value)} className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-2">Costo por unidad = Costo total por jornada ÷ {local.rendimiento} {local.rendimientoUnit}</p>
          </div>

          {/* FSR Configuration */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3 h-3" /> Factor de Salario Real (FSR)
              </span>
              <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer">
                <input type="checkbox" checked={local.fsrEnabled} onChange={e => updateField('fsrEnabled', e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                Habilitar FSR
              </label>
            </div>
            {local.fsrEnabled ? (
              <Fragment>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                  {([
                    { key: 'daysOff' as const, label: 'Días Descanso', def: 78 },
                    { key: 'holidays' as const, label: 'Festivos', def: 8 },
                    { key: 'vacationDays' as const, label: 'Vacaciones', def: 12 },
                    { key: 'aguinaldoDays' as const, label: 'Aguinaldo (días)', def: 15 },
                    { key: 'primaVacacionalPct' as const, label: 'Prima Vac. %', def: 25, suffix: '%' },
                    { key: 'imssPct' as const, label: 'IMSS %', def: 5, suffix: '%' },
                    { key: 'infonavitPct' as const, label: 'Infonavit %', def: 0, suffix: '%' },
                    { key: 'otherPct' as const, label: 'Otras %', def: 0, suffix: '%' },
                  ]).map(({ key, label, suffix }) => (
                    <div key={key} className="flex flex-col">
                      <label className="text-[9px] text-gray-500 mb-0.5">{label}</label>
                      <input type="number" min="0" step="0.1" value={local.fsrConfig[key]} onChange={e => updateFsrConfig(key, parseFloat(e.target.value) || 0)} className="w-full px-1.5 py-1 text-[11px] text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500/30 tabular-nums" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded text-[11px]">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">FSR =</span>
                  <span className="text-blue-700 dark:text-blue-300">
                    (365 / 365-{local.fsrConfig.daysOff}-{local.fsrConfig.holidays}-{local.fsrConfig.vacationDays}) × (1 + {(
                      (local.fsrConfig.aguinaldoDays / 365) +
                      (local.fsrConfig.vacationDays * local.fsrConfig.primaVacacionalPct / 100 / 365) +
                      (local.fsrConfig.imssPct / 100) +
                      (local.fsrConfig.infonavitPct / 100) +
                      (local.fsrConfig.otherPct / 100)
                    ).toFixed(4)})
                  </span>
                  <span className="text-blue-800 dark:text-blue-200 font-bold ml-auto text-sm">= {fsrFactor.toFixed(4)}</span>
                </div>
              </Fragment>
            ) : (
              <p className="text-[10px] text-gray-400 italic">FSR deshabilitado — se usará el factor manual de cada renglón</p>
            )}
          </div>

          {/* Percentage Factors */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Percent className="w-3 h-3" /> Factores Porcentuales
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {([
                { key: 'toolPct' as const, label: 'Herramienta', suffix: '% (MO+Eq)', def: 3 },
                { key: 'indirectPct' as const, label: 'Indirectos', suffix: '% CD', def: 27.48 },
                { key: 'financingPct' as const, label: 'Financiamiento', suffix: '% (CD+CI)', def: 2 },
                { key: 'profitPct' as const, label: 'Utilidad', suffix: '% (CD+CI+CF)', def: 10 },
                { key: 'additionalPct' as const, label: 'Adicionales', suffix: '% CD', def: 0 },
              ]).map(({ key, label, suffix }) => (
                <div key={key} className="flex flex-col">
                  <label className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1">{label}</label>
                  <div className="relative">
                    <input type="number" min="0" max="100" step="0.01" value={local[key]} onChange={e => updateField(key, parseFloat(e.target.value) || 0)} className="w-full pl-2 pr-7 py-1.5 text-xs text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-medium tabular-nums" />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">{suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SUMMARY (TARJETA DE COSTOS) ── */}
      {totals && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Resumen de Costos</span>
          </div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Materiales</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.totalMaterials)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Mano de Obra ({local.labor.length} cuadrilla{local.labor.length !== 1 ? 's' : ''})</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.totalLabor)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Equipo</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.totalEquipment)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Herramienta ({local.toolPct}%)</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.toolCost)}</span>
              </div>
              <div className="flex justify-between py-1 mt-1 border-t border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-gray-100">
                <span>Costo Directo (CD)</span>
                <span className="tabular-nums">{fmt(totals.directCost)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Costo por jornada</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.directCost)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Rendimiento</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{local.rendimiento} {local.rendimientoUnit}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500">Costo unitario</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmt(totals.directCost / local.rendimiento)}</span>
              </div>
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

      {/* ── COMPARISON + APPLY ── */}
      {totals && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg text-[10px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-500 font-medium">Comparación con precio base:</span>
            {(() => {
              const diff = basePrice != null ? ((basePrice - totals.unitPrice) / totals.unitPrice * 100) : null;
              return (
                <span className="text-primary-600 font-medium">
                  Base: {fmt(basePrice)}
                  {diff != null && (
                    <span className={`ml-1 ${diff >= 0 ? 'text-emerald-500' : 'text-red-400'} tabular-nums`}>
                      ({diff >= 0 ? '+' : ''}{diff.toFixed(1)}%)
                    </span>
                  )}
                </span>
              );
            })()}
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-sm transition-all"
          >
            <Check className="w-3 h-3" /> Aplicar PU a precios
          </button>
        </div>
      )}

      {/* ── APPLY MODAL ── */}
      {showApplyModal && (
        <ApplyModalWrapper onClose={() => setShowApplyModal(false)} onApply={handleApplyToTiers} unitPrice={totals?.unitPrice || 0} isPending={updateItemMutation.isPending} />
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

// ── Apply Modal ──────────────────────────────────────────────────────────────

function ApplyModalWrapper({ onClose, onApply, unitPrice, isPending }: {
  onClose: () => void;
  onApply: (markupPct: number) => void;
  unitPrice: number;
  isPending: boolean;
}) {
  const [markupPct, setMarkupPct] = useState(15);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-5 w-full max-w-sm mx-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Aplicar PU a precios</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400 tabular-nums">{fmt(unitPrice)}</span>
            <span className="text-[10px] text-gray-500 ml-2">Precio Unitario calculado</span>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 mb-1">Ajuste sobre PU calculado (%)</label>
            <input type="number" min="-100" max="500" step="1" value={markupPct} onChange={e => setMarkupPct(parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 text-sm text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500/30 tabular-nums" />
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
            <div className="text-[10px] text-gray-500 mb-1">Nuevo Precio Base</div>
            <div className="text-lg font-bold text-primary-600 dark:text-primary-400 tabular-nums">{fmt(Math.round(unitPrice * (1 + markupPct / 100) * 100) / 100)}</div>
            <div className="text-[10px] text-gray-400">PU calculado × {(100 + markupPct) / 100} ({markupPct >= 0 ? '+' : ''}{markupPct}%)</div>
          </div>
          <button
            onClick={() => onApply(markupPct)}
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 shadow-sm transition-all"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {isPending ? 'Aplicando...' : 'Aplicar Precio Base'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty defaults ──────────────────────────────────────────────────────────

const emptyMaterial = (): MaterialLine => ({ description: '', unit: 'pza', quantity: 1, unitCost: 0, wastePct: 0, total: 0 });
const emptyLabor = (): LaborLine => ({ category: '', workers: 1, dailyWage: 0, fsrFactor: 1.0, realDailyWage: 0, total: 0 });
const emptyEquipment = (): EquipmentLine => ({ description: '', unit: 'hr', quantity: 1, hourlyCost: 0, hoursPerDay: 8, total: 0 });
