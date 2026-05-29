import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, QrCode, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useSuperAdminConfirm } from '../contexts/SuperAdminContext';

interface Asset {
  id: number;
  name: string;
  description: string | null;
  serialNumber: string | null;
  location: string | null;
  qrCode: string | null;
  customerId: number;
  customer: { contactName: string; companyName?: string };
}

export default function AssetsPage() {
  const confirmSuperAdmin = useSuperAdminConfirm();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: () => api.get('/assets').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Activo eliminado');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al eliminar'),
  });

  const filtered = assets?.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.serialNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Equipos registrados con código QR</p>
        </div>
        <Link to="/assets/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Activo
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Buscar activos..."
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered?.length === 0 ? (
        <div className="card text-center py-12">
          <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No hay activos registrados</p>
          <Link to="/assets/new" className="btn-primary inline-flex items-center gap-2 mt-4">
            <Plus className="w-4 h-4" />
            Crear primer activo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((asset) => (
            <Link
              key={asset.id}
              to={`/assets/${asset.id}`}
              className="card hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{asset.name}</h3>
                  {asset.serialNumber && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">SN: {asset.serialNumber}</p>
                  )}
                  {asset.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{asset.location}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {asset.customer.companyName || asset.customer.contactName}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span className="p-1.5 text-gray-300 group-hover:text-primary-600 transition-colors">
                    <QrCode className="w-5 h-5" />
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmSuperAdmin(() => deleteMutation.mutate(asset.id)); }}
                    className="p-1.5 text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
