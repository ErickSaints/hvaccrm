import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Package, Plus, X, Tag, DollarSign } from 'lucide-react';
import api from '../lib/api';

interface PricebookItem {
  id: number;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string;
  basePrice: number | null;
  category?: { id: number; name: string };
}

interface PricebookCategory {
  id: number;
  name: string;
  _count?: { items: number };
}

interface Props {
  onSelectItem: (item: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }) => void;
  onClose: () => void;
}

export default function PricebookSearch({ onSelectItem, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: categories } = useQuery<PricebookCategory[]>({
    queryKey: ['pricebook-categories'],
    queryFn: () => api.get('/pricebook/categories').then(r => r.data),
  });

  const { data: items, isLoading } = useQuery<PricebookItem[]>({
    queryKey: ['pricebook-search', searchTerm, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory) params.set('categoryId', String(selectedCategory));
      return api.get(`/pricebook/items?${params}`).then(r => {
        const d = r.data;
        return Array.isArray(d) ? d : (d.data || []);
      });
    },
    enabled: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSearchTerm(query.trim());
  };

  const handleAddItem = (item: PricebookItem) => {
    const price = item.basePrice || 0;
    const desc = item.description
      ? `${item.name} — ${item.description}`
      : item.name;
    onSelectItem({
      description: desc,
      quantity: 1,
      unitPrice: price,
      total: price,
    });
    onClose();
  };

  const formatPrice = (val: number | null) => {
    if (val == null) return null;
    return '$' + val.toLocaleString('es-MX', { minimumFractionDigits: 2 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Catálogo de Precios</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="px-6 py-4 border-b border-gray-100">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en catálogo..."
                className="input-field pl-10"
                autoFocus
              />
            </div>
            <button type="submit" disabled={!query.trim() || isLoading} className="btn-primary flex items-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </div>
        </form>

        {categories && categories.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${selectedCategory === null ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          )}

          {!isLoading && (!items || items.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay artículos en esta categoría</p>
              <p className="text-sm">Busca por nombre o selecciona otra categoría</p>
            </div>
          )}

          {items && items.length > 0 && (
            <div className="space-y-2">
              {items.map(item => {
                const price = item.basePrice || 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                        {item.sku && (
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{item.sku}</code>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">{item.unit}</span>
                        {item.category && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{item.category.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        {item.basePrice != null && (
                          <span className="text-xs flex items-center gap-1 font-semibold text-gray-900">
                            <DollarSign className="w-3 h-3" />
                            {formatPrice(item.basePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddItem(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0 mt-1"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
