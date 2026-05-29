import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Tag, FolderOpen, DollarSign, TrendingUp, X, Save, Loader2, Edit2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface PricebookCategory {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  _count?: { items: number };
  items?: PricebookItem[];
}

interface PricebookItem {
  id: number;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string;
  goodPrice: number | null;
  betterPrice: number | null;
  bestPrice: number | null;
  costPrice: number | null;
  supplier: string | null;
  categoryId: number | null;
  category?: PricebookCategory;
  active: boolean;
}

export default function PricebookPage() {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
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

  function calcMargin(cost: number | null, price: number | null): number | null {
    if (cost == null || price == null || cost === 0) return null;
    return ((price - cost) / cost) * 100;
  }

  function getMarginColor(margin: number | null): string {
    if (margin == null) return 'text-gray-400';
    if (margin >= 50) return 'text-green-600 dark:text-green-400';
    if (margin >= 30) return 'text-emerald-600 dark:text-emerald-400';
    if (margin >= 15) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  function bestTier(item: PricebookItem): 'good' | 'better' | 'best' | null {
    const tiers: { key: 'good' | 'better' | 'best'; price: number | null }[] = [
      { key: 'good', price: item.goodPrice },
      { key: 'better', price: item.betterPrice },
      { key: 'best', price: item.bestPrice },
    ];
    const valid = tiers.filter(t => t.price != null && t.price > 0);
    if (valid.length === 0) return null;
    const cost = item.costPrice || 0;
    const best = valid.reduce((a, b) =>
      calcMargin(cost, a.price)! > calcMargin(cost, b.price)! ? a : b
    );
    return best.key;
  }

  const toggleCategoryActive = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      await api.put(`/pricebook/categories/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-categories'] });
      toast.success('Estado actualizado');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al actualizar'),
  });

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
  const [formGoodPrice, setFormGoodPrice] = useState('');
  const [formBetterPrice, setFormBetterPrice] = useState('');
  const [formBestPrice, setFormBestPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null);

  function resetItemForm() {
    setFormSku('');
    setFormName('');
    setFormDescription('');
    setFormUnit('pieza');
    setFormGoodPrice('');
    setFormBetterPrice('');
    setFormBestPrice('');
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
    setFormGoodPrice(item.goodPrice != null ? String(item.goodPrice) : '');
    setFormBetterPrice(item.betterPrice != null ? String(item.betterPrice) : '');
    setFormBestPrice(item.bestPrice != null ? String(item.bestPrice) : '');
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
        goodPrice: formGoodPrice ? parseFloat(formGoodPrice) : null,
        betterPrice: formBetterPrice ? parseFloat(formBetterPrice) : null,
        bestPrice: formBestPrice ? parseFloat(formBestPrice) : null,
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

  /* ───────── Category form state ───────── */
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');

  function resetCategoryForm() {
    setCatName('');
    setCatDescription('');
  }

  function openCreateCategory() {
    resetCategoryForm();
    setCategoryModalOpen(true);
  }

  function closeCategoryModal() {
    setCategoryModalOpen(false);
  }

  const categoryMutation = useMutation({
    mutationFn: async () => {
      await api.post('/pricebook/categories', {
        name: catName,
        description: catDescription || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-categories'] });
      toast.success('Categoría creada');
      closeCategoryModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al crear categoría'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tarifa Precio</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Lista de precios Good-Better-Best</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreateCategory} className="btn-secondary inline-flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Nueva Categoría
          </button>
          <button onClick={openCreateItem} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Artículo
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* ─── Left sidebar: categories ─── */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="card-static">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categorías
            </h3>
            {catsLoading ? (
              <div className="animate-pulse space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                ))}
              </div>
            ) : activeCategories.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Sin categorías</p>
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
                      <span>Todos los artículos</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
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
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {cat._count?.items || 0}
                        </span>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar artículos por nombre o SKU..."
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
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {search ? 'Sin resultados' : 'No hay artículos'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {search
                    ? 'Ajusta los filtros de búsqueda'
                    : 'Agrega tu primer artículo al tarifario'}
                </p>
                {!search && (
                  <button onClick={openCreateItem} className="btn-primary inline-flex items-center gap-2 mt-4">
                    <Plus className="w-4 h-4" />
                    Nuevo Artículo
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Artículo</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">SKU</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Unidad</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Costo</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          GOOD
                        </span>
                      </th>
                      <th className="text-right px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          BETTER
                        </span>
                      </th>
                      <th className="text-right px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          BEST
                        </span>
                      </th>
                      <th className="text-right px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Margen</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {filteredItems.map(item => {
                      const cost = item.costPrice;
                      const goodMargin = calcMargin(cost, item.goodPrice);
                      const betterMargin = calcMargin(cost, item.betterPrice);
                      const bestMargin = calcMargin(cost, item.bestPrice);
                      const best = bestTier(item);

                      return (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                              {item.description && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {item.sku ? (
                              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-gray-600 dark:text-gray-400">{item.sku}</code>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">{item.unit}</td>
                          <td className="px-4 py-3.5 text-right">
                            {cost != null ? (
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                ${cost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className={`px-4 py-3.5 text-right ${best === 'good' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                            {item.goodPrice != null ? (
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  ${item.goodPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </span>
                                {goodMargin != null && (
                                  <p className={`text-xs font-semibold ${getMarginColor(goodMargin)}`}>
                                    {goodMargin.toFixed(1)}%
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className={`px-4 py-3.5 text-right ${best === 'better' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                            {item.betterPrice != null ? (
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  ${item.betterPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </span>
                                {betterMargin != null && (
                                  <p className={`text-xs font-semibold ${getMarginColor(betterMargin)}`}>
                                    {betterMargin.toFixed(1)}%
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className={`px-4 py-3.5 text-right ${best === 'best' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                            {item.bestPrice != null ? (
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  ${item.bestPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </span>
                                {bestMargin != null && (
                                  <p className={`text-xs font-semibold ${getMarginColor(bestMargin)}`}>
                                    {bestMargin.toFixed(1)}%
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {best ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3" />
                                {best === 'good' ? 'GOOD' : best === 'better' ? 'BETTER' : 'BEST'}
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
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
                                  if (confirm('¿Eliminar artículo?')) deleteItemMutation.mutate(item.id);
                                }}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h2>
              <button onClick={closeItemModal} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre *</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} className="input-field" placeholder="Nombre del artículo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">SKU</label>
                <input value={formSku} onChange={e => setFormSku(e.target.value)} className="input-field" placeholder="Código SKU" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} className="input-field" placeholder="Descripción opcional" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Proveedor</label>
                  <input value={formSupplier} onChange={e => setFormSupplier(e.target.value)} className="input-field" placeholder="Proveedor" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Costo</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={formCostPrice} onChange={e => setFormCostPrice(e.target.value)} type="number" step="0.01" min="0" className="input-field pl-9" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categoría</label>
                  <select value={formCategoryId ?? ''} onChange={e => setFormCategoryId(e.target.value ? Number(e.target.value) : null)} className="input-field">
                    <option value="">Sin categoría</option>
                    {activeCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Precios de venta</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">GOOD</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input value={formGoodPrice} onChange={e => setFormGoodPrice(e.target.value)} type="number" step="0.01" min="0" className="input-field pl-9" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">BETTER</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input value={formBetterPrice} onChange={e => setFormBetterPrice(e.target.value)} type="number" step="0.01" min="0" className="input-field pl-9" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">BEST</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input value={formBestPrice} onChange={e => setFormBestPrice(e.target.value)} type="number" step="0.01" min="0" className="input-field pl-9" placeholder="0.00" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={closeItemModal} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => itemMutation.mutate()}
                  disabled={itemMutation.isPending || !formName.trim()}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {itemMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Category Modal ─── */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeCategoryModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nueva Categoría</h2>
              <button onClick={closeCategoryModal} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre *</label>
                <input value={catName} onChange={e => setCatName(e.target.value)} className="input-field" placeholder="Nombre de la categoría" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <textarea value={catDescription} onChange={e => setCatDescription(e.target.value)} className="input-field" placeholder="Descripción opcional" rows={2} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={closeCategoryModal} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => categoryMutation.mutate()}
                  disabled={categoryMutation.isPending || !catName.trim()}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {categoryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
