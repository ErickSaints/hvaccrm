import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Clock, Eye, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import type { QuotationRequest } from '../types';

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  PENDIENTE: { label: 'Pendiente', icon: Clock, color: 'text-amber-600 bg-amber-100' },
  REVISADO: { label: 'Revisado', icon: Eye, color: 'text-blue-600 bg-blue-100' },
  COTIZADO: { label: 'Cotizado', icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
  RECHAZADO: { label: 'Rechazado', icon: XCircle, color: 'text-red-600 bg-red-100' },
};

export default function QuotationRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const isBackoffice = currentUser?.role !== 'CLIENT';

  const { data: req, isLoading, error: queryError } = useQuery<QuotationRequest>({
    queryKey: ['quotation-request', id],
    queryFn: async () => {
      const { data } = await api.get<QuotationRequest>(`/quotation-requests/${id}`);
      return data;
    },
    enabled: !!id,
    retry: false,
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/quotation-requests/${id}/convert`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotation-request', id] });
      queryClient.invalidateQueries({ queryKey: ['quotation-requests'] });
      toast.success('Cotización creada');
      navigate(`/quotations/${data.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al crear cotización'
          : 'Error al crear cotización';
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (queryError) {
    const errMsg = (queryError as any)?.response?.data?.error || 'Error al cargar la solicitud';
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">{errMsg}</p>
        <button onClick={() => navigate('/quotation-requests')} className="text-primary-600 hover:text-primary-700 text-sm mt-2">
          Volver a solicitudes
        </button>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Solicitud no encontrada</p>
        <button onClick={() => navigate('/quotation-requests')} className="text-primary-600 hover:text-primary-700 text-sm mt-2">
          Volver a solicitudes
        </button>
      </div>
    );
  }

  const cfg = statusConfig[req.status] || statusConfig.PENDIENTE;
  const StatusIcon = cfg.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{req.title}</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {req.createdAt ? new Date(req.createdAt).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }) : ''}
              </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${cfg.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {cfg.label}
          </span>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {req.description}
        </div>

        {req.notes && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notas del vendedor:</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{req.notes}</p>
          </div>
        )}

        {isBackoffice && !req.quotation && req.status !== 'COTIZADO' && req.status !== 'RECHAZADO' && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending}
              className="btn-primary inline-flex items-center gap-2"
            >
              {convertMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Crear Cotización
            </button>
          </div>
        )}

        {req.quotation && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-700 dark:text-green-300">Cotización generada</p>
              <p className="text-sm font-semibold text-green-800 dark:text-green-200 mt-0.5">
                {req.quotation.number} — ${typeof req.quotation.total === 'number' ? req.quotation.total.toLocaleString('es-MX') : '0'}
              </p>
            </div>
            <Link to={`/quotations/${req.quotation.id}`} className="btn-primary text-sm inline-flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Ver Cotización
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
