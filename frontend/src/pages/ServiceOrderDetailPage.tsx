import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit2,
  Loader2,
  Calendar,
  User,
  Wrench,
  Building2,
  FileText,
  ClipboardList,
  Send,
  Ticket,
  Shield,
  Clock,
  DollarSign,
  ChevronDown,
  Camera,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ServiceOrder } from '../types';

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDIENTE: 'bg-amber-100 text-amber-800',
    EN_PROGRESO: 'bg-blue-100 text-blue-800',
    COMPLETADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-gray-100 text-gray-800',
  };
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    EN_PROGRESO: 'En Progreso',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado',
  };
  return (
    <span className={`text-sm font-medium px-3 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

const statusOptions = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROGRESO', label: 'En Progreso' },
  { value: 'COMPLETADO', label: 'Completado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export default function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusDropdown, setStatusDropdown] = useState(false);

  const { data: order, isLoading } = useQuery<ServiceOrder>({
    queryKey: ['service-order', id],
    queryFn: async () => {
      const { data } = await api.get<ServiceOrder>(`/service-orders/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/service-orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order', id] });
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Estado actualizado');
      setStatusDropdown(false);
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/service-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Orden de servicio eliminada');
      navigate('/service-orders');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Error al eliminar orden de servicio');
    },
  });

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar esta orden de servicio?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Orden de servicio no encontrada</p>
        <Link to="/service-orders" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
          Volver a ordenes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/service-orders')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {statusBadge(order.status)}
              <span className="text-xs text-gray-400">#{order.number}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Orden de Servicio {order.number}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {order.status !== 'COMPLETADO' && order.status !== 'CANCELADO' && (
            <div className="relative">
              <button
                onClick={() => setStatusDropdown(!statusDropdown)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Cambiar Estado
                <ChevronDown className="w-4 h-4" />
              </button>
              {statusDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                    {statusOptions
                      .filter((s) => s.value !== order.status)
                      .map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => statusMutation.mutate(opt.value)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
          <Link
            to={`/service-orders/${order.id}/edit`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </Link>
          <Link
            to={`/service-reports/new?serviceOrderId=${order.id}`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Crear Reporte
          </Link>
          <button onClick={handleDelete} className="btn-danger inline-flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Descripción</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {order.description || 'Sin descripción'}
            </p>
          </div>

          {order.ticket && (
            <div className="card border-blue-200 bg-blue-50 space-y-3">
              <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Ticket Vinculado
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Link
                  to={`/tickets/${order.ticketId}`}
                  className="text-blue-700 hover:text-blue-800 font-medium"
                >
                  #{order.ticketId} - {order.ticket.title}
                </Link>
                <span className="text-xs text-blue-600">
                  Estado: {order.ticket.status}
                </span>
              </div>
            </div>
          )}

          {order.policy && (
            <div className="card border-green-200 bg-green-50 space-y-3">
              <h2 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Póliza de Mantenimiento
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Link
                  to={`/maintenance-policies/${order.policyId}`}
                  className="text-green-700 hover:text-green-800 font-medium"
                >
                  {order.policy.number} - {order.policy.name}
                </Link>
                <span className="text-xs text-green-600">
                  Estado: {order.policy.status}
                </span>
              </div>
            </div>
          )}

          {order.status === 'COMPLETADO' && (
            <div className="card border-green-200 bg-green-50 space-y-3">
              <h2 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Reporte de Servicio
              </h2>
              {order.report ? (
                <Link
                  to={`/service-reports/${order.report.id}`}
                  className="text-green-700 hover:text-green-800 font-medium inline-flex items-center gap-1"
                >
                  Ver reporte: {order.report.title}
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-green-700">Sin reporte generado</p>
                  <Link
                    to={`/service-reports/new?serviceOrderId=${order.id}`}
                    className="text-green-700 hover:text-green-800 font-medium underline"
                  >
                    Crear reporte
                  </Link>
                </div>
              )}
            </div>
          )}

          {order.notes && (
            <div className="card space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {order.photos && order.photos.length > 0 && (
            <div className="card space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary-600" />
                Fotografías ({order.photos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {order.photos.map((photo: any) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Foto'}
                      className="w-full h-32 object-cover rounded-xl border border-gray-200"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Error'; }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 rounded-b-xl">
                      {photo.caption && <p className="text-xs text-white truncate">{photo.caption}</p>}
                      {photo.type && (
                        <span className="text-[10px] text-white/80">
                          {photo.type === 'ANTES' ? 'Antes' : photo.type === 'DESPUES' ? 'Después' : photo.type === 'PROCESO' ? 'Proceso' : photo.type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Información</h2>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cliente</p>
              {order.customer ? (
                <Link to={`/customers/${order.customerId}`} className="text-primary-600 hover:text-primary-700 flex items-center gap-1.5 text-sm font-medium">
                  <Building2 className="w-4 h-4" />
                  {order.customer.companyName || order.customer.contactName}
                </Link>
              ) : (
                <p className="text-gray-900 text-sm">#{order.customerId}</p>
              )}
            </div>

            {order.equipment && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Equipo</p>
                <p className="text-gray-900 text-sm flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-gray-400" />
                  {order.equipment.type}{order.equipment.brand ? ` - ${order.equipment.brand}` : ''}
                  {order.equipment.model ? ` (${order.equipment.model})` : ''}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Técnico Asignado</p>
              <p className="text-gray-900 text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" />
                {order.assignedUser?.name || 'Sin asignar'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Fecha Programada</p>
              <p className="text-gray-900 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                {order.scheduledDate
                  ? new Date(order.scheduledDate).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'No programada'}
              </p>
            </div>

            {order.completedDate && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Fecha Completado</p>
                <p className="text-gray-900 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-green-500" />
                  {new Date(order.completedDate).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              Costos
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Horas de Trabajo</span>
                <span className="font-medium text-gray-900">
                  {order.laborHours ? `${order.laborHours} hrs` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Costo Mano de Obra</span>
                <span className="font-medium text-gray-900">${order.laborCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Costo Materiales</span>
                <span className="font-medium text-gray-900">${order.materialsCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-3">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${order.totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
