import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, Save, Loader2, Edit2, X, DollarSign, Tag, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface PricebookCategory {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  _count?: { items: number };
}

interface PricebookItem {
  id: number;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string;
  basePrice: number | null;
  costPrice: number | null;
  supplier: string | null;
  categoryId: number | null;
  category?: PricebookCategory;
  active: boolean;
}

const fmt = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—';

const CATEGORY_COLORS: Record<string, string> = {
  Instalacion: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Mantenimiento: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Diagnostico: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Reparacion: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Refacciones: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

export default function PricebookPage() {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PricebookItem | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading: catsLoading } = useQuery<PricebookCategory[]>({
    queryKey: ['pricebook-categories'],
    queryFn: () => api.get('/pricebook/categories').then(r => r.data),
  });

  const { data: items, isLoading: itemsLoading } = useQuery<PricebookItem[]>({
    queryKey: ['pricebook-items'],
    queryFn: () => {
      return api.get('/pricebook/items/all').then(r => {
        const d = r.data;
        return Array.isArray(d) ? d : (d.data || []);
      });
    },
  });

  const filteredItems = (items || []).filter(i =>
    (selectedCategoryId == null || i.category?.id === selectedCategoryId) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku?.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCategories = (categories || []).filter(c => c.active);

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/pricebook/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-items'] });
      toast.success('Artículo eliminado');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al eliminar'),
  });

  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null);

  function resetItemForm() {
    setFormSku(''); setFormName(''); setFormDescription(''); setFormUnit('pieza');
    setFormBasePrice(''); setFormCostPrice(''); setFormSupplier(''); setFormCategoryId(null);
  }

  function openCreateItem() {
    setEditingItem(null); resetItemForm(); setFormCategoryId(selectedCategoryId); setItemModalOpen(true);
  }

  function openEditItem(item: PricebookItem) {
    setEditingItem(item);
    setFormSku(item.sku || ''); setFormName(item.name); setFormDescription(item.description || '');
    setFormUnit(item.unit); setFormBasePrice(item.basePrice != null ? String(item.basePrice) : '');
    setFormCostPrice(item.costPrice != null ? String(item.costPrice) : '');
    setFormSupplier(item.supplier || ''); setFormCategoryId(item.categoryId);
    setItemModalOpen(true);
  }

  function closeItemModal() { setItemModalOpen(false); setEditingItem(null); }

  const itemMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        sku: formSku || undefined, name: formName, description: formDescription || undefined,
        unit: formUnit, basePrice: formBasePrice ? parseFloat(formBasePrice) : undefined,
        costPrice: formCostPrice ? parseFloat(formCostPrice) : undefined,
        supplier: formSupplier || undefined, categoryId: formCategoryId ?? undefined,
      };
      if (editingItem) { await api.put(`/pricebook/items/${editingItem.id}`, payload); }
      else { await api.post('/pricebook/items', payload); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-items'] });
      queryClient.invalidateQueries({ queryKey: ['pricebook-categories'] });
      toast.success(editingItem ? 'Artículo actualizado' : 'Artículo creado');
      closeItemModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al guardar'),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Catálogo de Precios</h1>
          <p className="text-sm text-gray-500">{filteredItems.length} conceptos{selectedCategoryId ? ` en esta categoría` : ''}</p>
        </div>
        <button onClick={openCreateItem} className="btn-primary inline-flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nuevo Concepto
        </button>
      </div>

      {/* Search + Categories bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar concepto..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCategoryId(null)} className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${selectedCategoryId === null ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
            Todos
          </button>
          {activeCategories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${selectedCategoryId === cat.id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid/list */}
      {itemsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card py-16 text-center">
          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
            {search ? 'Sin resultados' : 'No hay conceptos'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {search ? 'Prueba con otro término de búsqueda' : 'Agrega tu primer concepto al tarifario'}
          </p>
          {!search && (
            <button onClick={openCreateItem} className="btn-primary inline-flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Nuevo Concepto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredItems.map(item => (
            <div key={item.id} className="card p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {item.sku && <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">{item.sku}</span>}
                    <span className="text-[10px] text-gray-400">{item.unit}</span>
                    {item.category && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[item.category.name] || 'bg-gray-100 text-gray-600'}`}>{item.category.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => openEditItem(item)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Editar">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (window.confirm(`¿Eliminar "${item.name}"?`)) deleteItemMutation.mutate(item.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {item.description && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2">{item.description}</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
                <span className="text-[10px] text-gray-400">
                  {item.costPrice != null ? `Costo: ${fmt(item.costPrice)}` : ''}
                </span>
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400 tabular-nums">{fmt(item.basePrice)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Modal */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeItemModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingItem ? 'Editar Concepto' : 'Nuevo Concepto'}
              </h2>
              <button onClick={closeItemModal} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre *</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} className="input-field" placeholder="Nombre del concepto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Clave</label>
                  <input value={formSku} onChange={e => setFormSku(e.target.value)} className="input-field" placeholder="INST-MSP-1T" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unidad</label>
                  <select value={formUnit} onChange={e => setFormUnit(e.target.value)} className="input-field">
                    <option value="pieza">Pieza</option>
                    <option value="metro">Metro</option>
                    <option value="kg">Kg</option>
                    <option value="litro">Litro</option>
                    <option value="caja">Caja</option>
                    <option value="servicio">Servicio</option>
                    <option value="hr">Hora</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} className="input-field" placeholder="Describe el alcance de los trabajos..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Precio Base</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={formBasePrice} onChange={e => setFormBasePrice(e.target.value)} type="number" step="0.01" min="0" className="input-field pl-9" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Costo</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={formCostPrice} onChange={e => setFormCostPrice(e.target.value)} type="number" step="0.01" min="0" className="input-field pl-9" placeholder="0.00" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categoría</label>
                  <select value={formCategoryId ?? ''} onChange={e => setFormCategoryId(e.target.value ? Number(e.target.value) : null)} className="input-field">
                    <option value="">Sin categoría</option>
                    {activeCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Proveedor</label>
                  <input value={formSupplier} onChange={e => setFormSupplier(e.target.value)} className="input-field" placeholder="Proveedor" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={closeItemModal} className="btn-secondary text-sm">Cancelar</button>
                <button type="button" onClick={() => itemMutation.mutate()} disabled={itemMutation.isPending || !formName.trim()} className="btn-primary inline-flex items-center gap-2 text-sm">
                  {itemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
