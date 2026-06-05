import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Plus, ArrowRight, Eye, CheckCircle2, XCircle, Clock, ClipboardList } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import type { QuotationRequest } from '../types';

const statusStyles: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  REVISADO: 'bg-blue-100 text-blue-800',
  COTIZADO: 'bg-green-100 text-green-800',
  RECHAZADO: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  REVISADO: 'Revisado',
  COTIZADO: 'Cotizado',
  RECHAZADO: 'Rechazado',
};

const statusIcons: Record<string, typeof Clock> = {
  PENDIENTE: Clock,
  REVISADO: Eye,
  COTIZADO: CheckCircle2,
  RECHAZADO: XCircle,
};

export default function QuotationRequestsPage() {
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';

  const { data: requests, isLoading } = useQuery<QuotationRequest[]>({
    queryKey: ['quotation-requests'],
    queryFn: async () => {
      const { data } = await api.get<QuotationRequest[]>('/quotation-requests');
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isClient ? 'Mis Solicitudes de Cotización' : 'Solicitudes de Cotización'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isClient ? 'Tus solicitudes de cotización y su estado' : 'Solicitudes enviadas por clientes'}
          </p>
        </div>
        {isClient && (
          <Link to="/quotation-requests/new" className="btn-primary inline-flex items-center gap-2 w-fit">
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((req) => {
            const StatusIcon = statusIcons[req.status] || Clock;
            return (
              <div key={req.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon className="w-4 h-4 text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {req.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                      {req.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                      <span>{req.createdAt ? new Date(req.createdAt).toLocaleDateString('es-MX', { dateStyle: 'short' }) : ''}</span>
                      {req.customer?.contactName && !isClient && (
                        <span>{req.customer.contactName}</span>
                      )}
                      {req.quotation && (
                        <Link to={`/quotations/${req.quotation.id}`} className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                          Cotización: {req.quotation.number} <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[req.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[req.status] || req.status}
                    </span>
                    <Link
                      to={`/quotation-requests/${req.id}`}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <ClipboardList className="w-12 h-12 mb-3" />
          <p className="text-sm font-medium">Sin solicitudes</p>
          <p className="text-xs mt-1">
            {isClient ? 'Crea una solicitud para que te coticemos' : 'No hay solicitudes de clientes'}
          </p>
          {isClient && (
            <Link to="/quotation-requests/new" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus className="w-4 h-4" />
              Nueva Solicitud
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
