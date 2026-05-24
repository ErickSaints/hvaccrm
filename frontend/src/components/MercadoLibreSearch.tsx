import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, ShoppingCart, Package, Truck, Plus, X, AlertCircle } from 'lucide-react';
import api from '../lib/api';

interface MLProduct {
  id: string;
  title: string;
  originalPrice: number;
  markedUpPrice: number;
  markupPercentage: number;
  currency: string;
  condition: string;
  availableQuantity: number;
  thumbnail: string;
  permalink: string;
  shipping: {
    freeShipping: boolean;
    storePickup: boolean;
    deliveryEstimate: string;
  };
  seller: { nickname: string };
  location: string;
}

interface Props {
  onSelectItem: (item: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    source: string;
    sourceId: string;
    permalink: string;
  }) => void;
  onClose: () => void;
}

export default function MercadoLibreSearch({ onSelectItem, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['ml-search', searchTerm],
    queryFn: () => api.get(`/mercadolibre/search?q=${encodeURIComponent(searchTerm)}&limit=15`).then((r) => r.data),
    enabled: searchTerm.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSearchTerm(query.trim());
  };

  const handleAddItem = (product: MLProduct) => {
    onSelectItem({
      description: `${product.title} (Ref: ${product.id})`,
      quantity: 1,
      unitPrice: product.markedUpPrice,
      total: product.markedUpPrice,
      source: 'MERCADO_LIBRE',
      sourceId: product.id,
      permalink: product.permalink,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Buscar en Mercado Libre</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="px-6 py-4 border-b border-gray-100">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar herramienta, refacción, equipo HVAC-R..."
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

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!searchTerm && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Busca cualquier producto de Mercado Libre</p>
              <p className="text-sm">Los precios incluyen un <strong>{data?.appliedMarkup || 35}%</strong> de margen</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
              <p className="text-red-600">Error al buscar en Mercado Libre</p>
              <button onClick={handleSearch} className="btn-secondary mt-3">Reintentar</button>
            </div>
          )}

          {data?.results?.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                {data.total} resultados para "{data.query}" | Precios con {data.appliedMarkup}% de margen aplicado
              </p>
              {data.results.map((product: MLProduct) => (
                <div
                  key={product.id}
                  className="flex items-start gap-4 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
                >
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-16 h-16 object-contain rounded-lg bg-gray-50 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{product.condition}</span>
                      {product.shipping.freeShipping && (
                        <span className="text-green-600 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Envío gratis
                        </span>
                      )}
                      {product.location && <span>{product.location}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div>
                        <p className="text-lg font-bold text-primary-600">
                          ${product.markedUpPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-400 line-through">
                          ${product.originalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ML
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                        +{product.markupPercentage}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddItem(product)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0 mt-1"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchTerm && !isLoading && data?.results?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No se encontraron resultados para "{searchTerm}"</p>
              <p className="text-sm">Intenta con otros términos de búsqueda</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400 text-center">
          Los precios mostrados incluyen un margen del {data?.appliedMarkup || 35}%. 
          Datos obtenidos de Mercado Libre México.
        </div>
      </div>
    </div>
  );
}
