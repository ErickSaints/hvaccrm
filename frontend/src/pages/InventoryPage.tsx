import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, AlertTriangle, Edit2, Eye, DollarSign, Layers, MapPin } from 'lucide-react';
import api from '../lib/api';
import type { InventoryItem, PaginatedResponse } from '../types';
import Pagination from '../components/Pagination';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedResponse<InventoryItem>>({
    queryKey: ['inventory', page, search, category, lowStock],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (lowStock) params.set('lowStock', 'true');
      const { data } = await api.get(`/inventory?${params}`);
      return data;
    },
  });

  const { data: categories } = useQuery<string[]>({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/categories');
      return data;
    },
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Inventario</h1>
            <p className="text-primary-200 text-sm mt-1">Control de refacciones, materiales y consumibles</p>
          </div>
          <Link to="/inventory/new" className="btn-primary bg-white/20 border-white/30 text-white hover:bg-white/30 inline-flex items-center gap-2 backdrop-blur-sm">
          <Plus className="w-4 h-4" />
          Nuevo Artículo
        </Link>
      </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="input-field w-auto min-w-[160px]"
            >
              <option value="">Todas las categorías</option>
              {categories?.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStock}
                onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Solo stock bajo
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-1/6" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/6" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Código</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Nombre</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Categoría</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Stock</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Precio</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Ubicación</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {items.map((item) => {
                    const isLow = item.currentStock <= item.minStock;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-gray-600 dark:text-gray-400">{item.code}</code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <Layers className="w-3 h-3 mr-1" />
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`font-medium ${
                              isLow ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {item.currentStock}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">/{item.unit}</span>
                            {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                          {item.minStock > 0 && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Mín: {item.minStock}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <DollarSign className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              ${item.unitPrice.toLocaleString('es-MX')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-xs">{item.location || item.branch?.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/inventory/${item.id}`}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/inventory/${item.id}/edit`}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
          </>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              {search || category || lowStock ? 'Sin resultados' : 'No hay artículos'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {search || category || lowStock
                ? 'Ajusta los filtros de búsqueda'
                : 'Agrega tu primer artículo al inventario'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
