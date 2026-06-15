import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Send, Clock, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const statusStyles: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  EN_ESPERA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  ENVIADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const statusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente', EN_ESPERA: 'En Espera', ENVIADO: 'Enviado',
};

export default function RequisitionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: req, isLoading } = useQuery({
    queryKey: ['material-requisition', id],
    queryFn: () => api.get(`/material-requisitions/${id}`).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.put(`/material-requisitions/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requisition', id] });
      queryClient.invalidateQueries({ queryKey: ['material-requisitions'] });
      toast.success('Estado actualizado');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/material-requisitions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requisitions'] });
      toast.success('Requisición eliminada');
      navigate('/requisitions');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al eliminar'),
  });

  if (isLoading) return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" /></div>;
  if (!req) return <div className="text-center py-16 text-gray-500">Requisición no encontrada</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/requisitions')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{req.title}</h1>
              <span className="text-[10px] font-mono text-gray-400">{req.number}</span>
            </div>
            <p className="text-sm text-gray-500">Creada el {new Date(req.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {req.status === 'PENDIENTE' && (
            <>
              <button onClick={() => statusMutation.mutate('EN_ESPERA')} className="btn-secondary inline-flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5" /> En Espera
              </button>
              <button onClick={() => { if (window.confirm('¿Enviar requisición?')) statusMutation.mutate('ENVIADO'); }} className="btn-primary inline-flex items-center gap-1.5 text-xs">
                <Send className="w-3.5 h-3.5" /> Enviar
              </button>
              <Link to={`/requisitions/${id}/edit`} className="btn-secondary inline-flex items-center gap-1.5 text-xs">
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </Link>
              <button onClick={() => { if (window.confirm('¿Eliminar requisición?')) deleteMutation.mutate(); }} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {req.status === 'EN_ESPERA' && (
            <button onClick={() => { if (window.confirm('¿Enviar requisición?')) statusMutation.mutate('ENVIADO'); }} className="btn-primary inline-flex items-center gap-1.5 text-xs">
              <Send className="w-3.5 h-3.5" /> Enviar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Estado</p>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[req.status]}`}>
            {statusLabels[req.status]}
          </span>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Solicitó</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.requestedBy.name}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Sucursal</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.branch?.name || '—'}</p>
        </div>
      </div>

      {req.notes && (
        <div className="card p-4 mb-6">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Notas</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{req.notes}</p>
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Artículos ({req.items.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left pb-2 font-medium text-gray-500 text-[10px] uppercase tracking-wider">#</th>
                <th className="text-left pb-2 font-medium text-gray-500 text-[10px] uppercase tracking-wider">Descripción</th>
                <th className="text-right pb-2 font-medium text-gray-500 text-[10px] uppercase tracking-wider">Cantidad</th>
                <th className="text-center pb-2 font-medium text-gray-500 text-[10px] uppercase tracking-wider">Unidad</th>
                <th className="text-left pb-2 font-medium text-gray-500 text-[10px] uppercase tracking-wider">Notas</th>
              </tr>
            </thead>
            <tbody>
              {req.items.map((item: any, idx: number) => (
                <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <td className="py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="py-2.5 font-medium text-gray-900 dark:text-gray-100">{item.description}</td>
                  <td className="py-2.5 text-right tabular-nums text-gray-900 dark:text-gray-100">{item.quantity}</td>
                  <td className="py-2.5 text-center text-gray-500">{item.unit}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{item.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {req.approvedBy && (
        <div className="card p-4 mt-4">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Aprobado por</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.approvedBy.name}</p>
        </div>
      )}
    </div>
  );
}
