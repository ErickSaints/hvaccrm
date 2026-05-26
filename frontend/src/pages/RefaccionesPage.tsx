import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Loader2, Package, AlertCircle, ShoppingCart, Truck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface Customer {
  id: number;
  companyName?: string;
  contactName: string;
}

interface PartProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  availableQuantity: number;
  thumbnail: string;
  freeShipping: boolean;
  deliveryDays: number;
  source: string;
}

export default function RefaccionesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        setSearchTerm(query.trim());
      }, 400);
    } else {
      setSearchTerm('');
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get<Customer[]>('/customers');
      return data;
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['ml-search', searchTerm],
    queryFn: () => api.get(`/mercadolibre/search?q=${encodeURIComponent(searchTerm)}&limit=50`).then((r) => r.data),
    enabled: searchTerm.length > 0,
    staleTime: 0,
  });

  const quoteMutation = useMutation({
    mutationFn: async ({ product, qty }: { product: PartProduct; qty: number }) => {
      if (!selectedCustomerId && user?.role !== 'CLIENT') {
        throw new Error('Selecciona un cliente');
      }
      const { data } = await api.post('/mercadolibre/create-quotation', {
        itemId: product.id,
        title: product.title,
        price: product.price,
        quantity: qty,
        thumbnail: product.thumbnail,
        customerId: selectedCustomerId || undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success('Cotización generada exitosamente');
      navigate(`/quotations/${data.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al generar la cotización');
    },
  });

  const setQty = (id: string, val: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, val) }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Herramientas e Insumos</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Busca herramientas, refacciones, gases, tubería, soldaduras y más para HVAC-R</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar herramienta, refacción, gas, tubería, soldadura..."
            className="input-field pl-10"
            autoFocus
          />
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            <User className="w-3 h-3 inline mr-1" />
            Cliente
          </label>
          <select
            value={selectedCustomerId ?? ''}
            onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
            className="input-field"
          >
            <option value="">Seleccionar cliente...</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName ? `${c.companyName} - ${c.contactName}` : c.contactName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        {!searchTerm && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="text-lg font-medium text-gray-400 dark:text-gray-500">Busca cualquier refacción o herramienta</p>
            <p className="text-sm mt-1">Encuentra productos y genera una cotización al instante</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
            <p className="text-red-600 font-medium">Error al buscar productos</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Servicio temporalmente no disponible</p>
            <button onClick={() => setSearchTerm(query.trim())} className="btn-secondary mt-4">Reintentar</button>
          </div>
        )}

        {data?.results?.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{data.total} resultados para "<strong>{data.query}</strong>"</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.results.map((product: PartProduct) => (
                <div key={product.id} className="card group hover:shadow-lg transition-shadow flex flex-col">
                  <div className="aspect-square bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden mb-3 flex items-center justify-center p-4">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 flex-1">{product.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">{product.condition}</span>
                    {product.freeShipping && (
                      <span className="text-green-600 flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Envío gratis
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" /> {product.deliveryDays} días hábiles
                    </span>
                  </div>
                  <p className="text-xl font-bold text-primary-600 mb-3">
                    ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cant:</label>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQty(product.id, (quantities[product.id] || 1) - 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[2rem] text-center border-x border-gray-300">
                        {quantities[product.id] || 1}
                      </span>
                      <button
                        onClick={() => setQty(product.id, (quantities[product.id] || 1) + 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => quoteMutation.mutate({ product, qty: quantities[product.id] || 1 })}
                    disabled={quoteMutation.isPending || (user?.role !== 'CLIENT' && !selectedCustomerId)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quoteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    Solicitar Cotización
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchTerm && !isLoading && data?.results?.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No se encontraron resultados</p>
            <p className="text-sm mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}