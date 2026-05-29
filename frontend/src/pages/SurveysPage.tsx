import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Ruler, Trash2, Camera, Package, Layers } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useSuperAdminConfirm } from '../contexts/SuperAdminContext';

interface Survey {
  id: number;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  createdAt: string;
  customer: { contactName: string; companyName?: string };
  createdBy: { name: string };
  photos: any[];
  materials: any[];
  drawings: any[];
}

export default function SurveysPage() {
  const confirmSuperAdmin = useSuperAdminConfirm();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: surveys, isLoading } = useQuery<Survey[]>({
    queryKey: ['surveys'],
    queryFn: () => api.get('/surveys').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/surveys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Levantamiento eliminado');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al eliminar'),
  });

  const filtered = surveys?.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.customer.contactName.toLowerCase().includes(search.toLowerCase()) ||
    s.customer.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    BORRADOR: 'bg-gray-100 text-gray-600',
    COMPLETADO: 'bg-green-100 text-green-700',
    EN_PROGRESO: 'bg-blue-100 text-blue-700',
    CANCELADO: 'bg-red-100 text-red-600',
  };

  const statusLabel: Record<string, string> = {
    BORRADOR: 'Borrador',
    COMPLETADO: 'Completado',
    EN_PROGRESO: 'En Progreso',
    CANCELADO: 'Cancelado',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Levantamientos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Inspecciones técnicas, dibujos isométricos y listas de materiales</p>
        </div>
        <Link to="/surveys/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Levantamiento
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Buscar levantamientos..."
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered?.length === 0 ? (
        <div className="card text-center py-12">
          <Ruler className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No hay levantamientos registrados</p>
          <Link to="/surveys/new" className="btn-primary inline-flex items-center gap-2 mt-4">
            <Plus className="w-4 h-4" />
            Crear primer levantamiento
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((survey) => (
            <Link
              key={survey.id}
              to={`/surveys/${survey.id}`}
              className="card hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{survey.title}</h3>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${statusColor[survey.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel[survey.status] || survey.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {survey.customer.companyName || survey.customer.contactName}
                  </p>
                  {survey.location && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{survey.location}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {survey.photos.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {survey.materials.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {survey.drawings.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    {survey.createdBy.name} · {new Date(survey.createdAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmSuperAdmin(() => deleteMutation.mutate(survey.id)); }}
                  className="p-1.5 text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
