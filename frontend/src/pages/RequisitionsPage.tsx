import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ClipboardList, Loader2, Eye, Trash2, Send, Clock, CheckCircle, XCircle, Filter, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface Item {
  id: number; description: string; quantity: number; unit: string; notes: string | null;
}

interface Requisition {
  id: number; number: string; title: string; status: 'PENDIENTE' | 'EN_ESPERA' | 'ENVIADO';
  notes: string | null; createdAt: string; updatedAt: string;
  requestedBy: { id: number; name: string };
  approvedBy: { id: number; name: string } | null;
  branch: { id: number; name: string } | null;
  items: Item[];
}

const statusStyles: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  EN_ESPERA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  ENVIADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const statusIcons: Record<string, any> = {
  PENDIENTE: Clock, EN_ESPERA: Loader2, ENVIADO: CheckCircle,
};

export default function RequisitionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['material-requisitions', search, statusFilter],
    queryFn: () => api.get('/material-requisitions', {
      params: { search: search || undefined, status: statusFilter || undefined, limit: 100 },
    }).then(r => r.data),
  });

  const requisitions: Requisition[] = data?.data ?? data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/material-requisitions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requisitions'] });
      toast.success('Requisición eliminada');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al eliminar'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/material-requisitions/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requisitions'] });
      toast.success('Estado actualizado');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al cambiar estado'),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Requisiciones de Materiales</h1>
          <p className="text-sm text-gray-500">{requisitions.length} registros</p>
        </div>
        <Link to="/requisitions/new" className="btn-primary inline-flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nueva Requisición
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por título o folio..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm w-44">
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_ESPERA">En Espera</option>
          <option value="ENVIADO">Enviado</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" /><div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" /></div>)}</div>
      ) : requisitions.length === 0 ? (
        <div className="card py-16 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">Sin requisiciones</h3>
          <p className="text-sm text-gray-500 mb-4">Crea tu primera requisición de materiales</p>
          <Link to="/requisitions/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Nueva Requisición
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {requisitions.map(req => {
            const StatusIcon = statusIcons[req.status];
            return (
              <div key={req.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${statusStyles[req.status]}`}>
                        <StatusIcon className="w-3 h-3" /> {req.status === 'PENDIENTE' ? 'Pendiente' : req.status === 'EN_ESPERA' ? 'En Espera' : 'Enviado'}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{req.number}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{req.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                      <span>Solicitó: {req.requestedBy.name}</span>
                      <span>{req.items.length} artículos</span>
                      {req.branch && <span>Sucursal: {req.branch.name}</span>}
                      <span>{new Date(req.createdAt).toLocaleDateString('es-MX')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link to={`/requisitions/${req.id}`} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors" title="Ver detalle">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    {req.status === 'PENDIENTE' && (
                      <>
                        <button onClick={() => statusMutation.mutate({ id: req.id, status: 'EN_ESPERA' })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Poner en espera">
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (window.confirm(`¿Enviar requisición "${req.title}"?`)) statusMutation.mutate({ id: req.id, status: 'ENVIADO' }); }} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Enviar">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (window.confirm(`¿Eliminar "${req.title}"?`)) deleteMutation.mutate(req.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {req.status === 'EN_ESPERA' && (
                      <button onClick={() => { if (window.confirm(`¿Enviar requisición "${req.title}"?`)) statusMutation.mutate({ id: req.id, status: 'ENVIADO' }); }} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Enviar">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
