import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Tag, Package, Save, Loader2, Edit2, X, DollarSign, Upload } from 'lucide-react';
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
    queryKey: ['pricebook-items', selectedCategoryId],
    queryFn: () => {
      const params = selectedCategoryId ? `?categoryId=${selectedCategoryId}` : '';
      return api.get(`/pricebook/items${params}`).then(r => {
        const d = r.data;
        return Array.isArray(d) ? d : (d.data || []);
      });
    },
  });

  const filteredItems = (items || []).filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku?.toLowerCase().includes(search.toLowerCase())
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

  /* ───────── Item form state ───────── */
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null);

  function resetItemForm() {
    setFormSku('');
    setFormName('');
    setFormDescription('');
    setFormUnit('pieza');
    setFormBasePrice('');
    setFormCostPrice('');
    setFormSupplier('');
    setFormCategoryId(null);
  }

  function openCreateItem() {
    setEditingItem(null);
    resetItemForm();
    setFormCategoryId(selectedCategoryId);
    setItemModalOpen(true);
  }

  function openEditItem(item: PricebookItem) {
    setEditingItem(item);
    setFormSku(item.sku || '');
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormUnit(item.unit);
    setFormBasePrice(item.basePrice != null ? String(item.basePrice) : '');
    setFormCostPrice(item.costPrice != null ? String(item.costPrice) : '');
    setFormSupplier(item.supplier || '');
    setFormCategoryId(item.categoryId);
    setItemModalOpen(true);
  }

  function closeItemModal() {
    setItemModalOpen(false);
    setEditingItem(null);
  }

  const itemMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        sku: formSku || undefined,
        name: formName,
        description: formDescription || null,
        unit: formUnit,
        basePrice: formBasePrice ? parseFloat(formBasePrice) : null,
        costPrice: formCostPrice ? parseFloat(formCostPrice) : null,
        supplier: formSupplier || null,
        categoryId: formCategoryId,
      };
      if (editingItem) {
        await api.put(`/pricebook/items/${editingItem.id}`, payload);
      } else {
        await api.post('/pricebook/items', payload);
      }
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
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="card bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 p-6 lg:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">Catálogo de Precios Unitarios</h1>
            <p className="text-primary-200 text-sm mt-1">Precios base por concepto para cotización de servicios HVAC</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openCreateItem} className="btn-primary bg-white/20 border-white/30 text-white hover:bg-white/30 inline-flex items-center gap-2 backdrop-blur-sm">
              <Plus className="w-4 h-4" />
              Nuevo Concepto
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* ─── Left sidebar: categories ─── */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="card-static">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categorías
            </h3>
            {catsLoading ? (
              <div className="animate-pulse space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : activeCategories.length === 0 ? (
              <p className="text-sm text-gray-400">Sin categorías</p>
            ) : (
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategoryId === null
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Todos los conceptos</span>
                      <span className="text-xs text-gray-400">
                        {categories?.reduce((sum, c) => sum + (c._count?.items || 0), 0) || 0}
                      </span>
                    </div>
                  </button>
                </li>
                {activeCategories.map(cat => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategoryId === cat.id
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{cat.name}</span>
                        <span className="text-xs text-gray-400">{cat._count?.items || 0}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ─── Right side: items table ─── */}
        <div className="flex-1 min-w-0">
          <div className="card-static p-0">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar concepto por nombre o clave..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {itemsLoading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-1/6" />
                      <div className="h-4 bg-gray-200 rounded w-20" />
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {search ? 'Sin resultados' : 'No hay conceptos'}
                </h3>
                <p className="text-gray-500">
                  {search ? 'Ajusta los filtros de búsqueda' : 'Agrega tu primer concepto al tarifario'}
                </p>
                {!search && (
                  <button onClick={openCreateItem} className="btn-primary inline-flex items-center gap-2 mt-4">
                    <Plus className="w-4 h-4" />
                    Nuevo Concepto
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Concepto</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Clave</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Unidad</th>
                      <th className="text-center px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Categoría</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Costo</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          PRECIO BASE
                        </span>
                      </th>
                      <th className="text-right px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="min-w-0 max-w-xs">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.sku ? (
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-gray-600 dark:text-gray-400">{item.sku}</code>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.unit}</td>
                        <td className="px-4 py-3 text-center">
                          {item.category ? (
                            <span className="text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full font-medium">{item.category.name}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.costPrice != null ? (
                            <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{fmt(item.costPrice)}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.basePrice != null ? (
                            <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">{fmt(item.basePrice)}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditItem(item)}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Eliminar "${item.name}"?`)) {
                                  deleteItemMutation.mutate(item.id);
                                }
                              }}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Item Modal ─── */}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Clave (SKU)</label>
                  <input value={formSku} onChange={e => setFormSku(e.target.value)} className="input-field" placeholder="Ej: INST-MSP-1T" />
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
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} className="input-field" placeholder="Descripción detallada del concepto, incluye alcance de los trabajos..." rows={3} />
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
                <button type="button" onClick={closeItemModal} className="btn-secondary">Cancelar</button>
                <button
                  type="button"
                  onClick={() => itemMutation.mutate()}
                  disabled={itemMutation.isPending || !formName.trim()}
                  className="btn-primary inline-flex items-center gap-2"
                >
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
