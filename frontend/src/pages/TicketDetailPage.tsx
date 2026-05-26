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
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronDown,
  Plus,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Ticket, User as UserType } from '../types';

interface TicketDetail extends Ticket {
  changelog?: {
    id: number;
    action: string;
    description?: string;
    createdAt: string;
    userId?: number;
    user?: UserType;
  }[];
}

function levelBadge(level: string) {
  switch (level) {
    case 'EMERGENCIA':
      return <span className="badge-emergencia">Emergencia</span>;
    case 'ATENCION':
      return <span className="badge-atencion">Atención</span>;
    case 'PROGRAMAR':
      return <span className="badge-programar">Programar</span>;
    default:
      return null;
  }
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    ABIERTO: 'bg-blue-100 text-blue-800',
    EN_PROCESO: 'bg-amber-100 text-amber-800',
    RESUELTO: 'bg-green-100 text-green-800',
    CERRADO: 'bg-gray-100 text-gray-800',
  };
  const labels: Record<string, string> = {
    ABIERTO: 'Abierto',
    EN_PROCESO: 'En Proceso',
    RESUELTO: 'Resuelto',
    CERRADO: 'Cerrado',
  };
  return (
    <span className={`text-sm font-medium px-3 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

const statusOptions = [
  { value: 'ABIERTO', label: 'Abierto' },
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'RESUELTO', label: 'Resuelto' },
  { value: 'CERRADO', label: 'Cerrado' },
];

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [statusDropdown, setStatusDropdown] = useState(false);
  const [assignDropdown, setAssignDropdown] = useState(false);
  const [resolution, setResolution] = useState('');
  const [showResolutionInput, setShowResolutionInput] = useState(false);

  const { data: ticket, isLoading } = useQuery<TicketDetail>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const { data } = await api.get<TicketDetail>(`/tickets/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<UserType[]>('/users');
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ status, resolution: res }: { status: string; resolution?: string }) => {
      await api.put(`/tickets/${id}`, { status, ...(res ? { resolution: res } : {}) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Estado actualizado');
      setStatusDropdown(false);
      setShowResolutionInput(false);
      setResolution('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Error al actualizar estado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/tickets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket eliminado');
      navigate('/tickets');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Error al eliminar ticket');
    },
  });

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar este ticket?')) {
      deleteMutation.mutate();
    }
  };

  const assignMutation = useMutation({
    mutationFn: async (assignedTo: number | null) => {
      await api.put(`/tickets/${id}`, { assignedTo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Técnico asignado');
      setAssignDropdown(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Error al asignar técnico');
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === ticket?.status) {
      setStatusDropdown(false);
      return;
    }
    if (newStatus === 'RESUELTO') {
      setShowResolutionInput(true);
      return;
    }
    statusMutation.mutate({ status: newStatus });
  };

  const handleResolve = () => {
    if (!resolution.trim()) {
      toast.error('Describe la resolución');
      return;
    }
    statusMutation.mutate({ status: 'RESUELTO', resolution });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Ticket no encontrado</p>
        <Link to="/tickets" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
          Volver a tickets
        </Link>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';
  const canResolve = ticket.status !== 'RESUELTO' && ticket.status !== 'CERRADO';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/tickets')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {levelBadge(ticket.level)}
              {statusBadge(ticket.status)}
              <span className="text-xs text-gray-400 dark:text-gray-500">#{ticket.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ticket.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canResolve && (
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
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                    {statusOptions
                      .filter((s) => s.value !== ticket.status)
                      .map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusChange(opt.value)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setAssignDropdown(!assignDropdown)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Asignar
                <ChevronDown className="w-4 h-4" />
              </button>
              {assignDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAssignDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                    <button
                      onClick={() => assignMutation.mutate(null)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Sin asignar
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-800" />
                    {users?.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => assignMutation.mutate(u.id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        <span>{u.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{u.role}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <Link
            to={`/service-orders/new?ticketId=${ticket.id}`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            Crear OS
          </Link>
          <button onClick={handleDelete} className="btn-danger inline-flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>

      {showResolutionInput && (
        <div className="card border-2 border-green-200 bg-green-50">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Resolución del Ticket
          </h3>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={3}
            className="input-field mb-3"
            placeholder="Describe cómo se resolvió el problema..."
          />
          <div className="flex gap-2">
            <button onClick={handleResolve} className="btn-success inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Marcar como Resuelto
            </button>
            <button onClick={() => { setShowResolutionInput(false); setResolution(''); }} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Descripción</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
            {ticket.resolution && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Resolución
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.resolution}</p>
              </div>
            )}
          </div>

          {ticket.changelog && ticket.changelog.length > 0 && (
            <div className="card space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                Historial de Cambios
              </h2>
              <div className="space-y-3">
                {ticket.changelog.map((log) => (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mt-1.5" />
                      <div className="w-px flex-1 bg-gray-200" />
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{log.user?.name || 'Sistema'}</span>{' '}
                        {log.description || log.action}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(log.createdAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Información</h2>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Cliente</p>
              {ticket.customer ? (
                <Link to={`/customers/${ticket.customerId}`} className="text-primary-600 hover:text-primary-700 flex items-center gap-1.5 text-sm font-medium">
                  <Building2 className="w-4 h-4" />
                  {ticket.customer.companyName || ticket.customer.contactName}
                </Link>
              ) : (
                <p className="text-gray-900 dark:text-gray-100 text-sm">#{ticket.customerId}</p>
              )}
            </div>

            {ticket.equipment && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Equipo</p>
                <Link to={`/equipment/${ticket.equipmentId}`} className="text-primary-600 hover:text-primary-700 flex items-center gap-1.5 text-sm font-medium">
                  <Wrench className="w-4 h-4" />
                  {ticket.equipment.type}{ticket.equipment.brand ? ` - ${ticket.equipment.brand}` : ''}
                </Link>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Asignado a</p>
              <p className="text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                {ticket.assignedUser?.name || 'Sin asignar'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Creado</p>
              <p className="text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Service Orders linked to this ticket */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                Órdenes de Servicio
              </h2>
              <Link
                to={`/service-orders/new?ticketId=${ticket.id}`}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Nueva OS
              </Link>
            </div>
            {(ticket as any).serviceOrders?.length > 0 ? (
              <div className="space-y-2">
                {(ticket as any).serviceOrders.map((os: any) => (
                  <Link
                    key={os.id}
                    to={`/service-orders/${os.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-primary-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{os.number}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        os.status === 'COMPLETADO' ? 'bg-green-100 text-green-700' :
                        os.status === 'EN_PROGRESO' ? 'bg-blue-100 text-blue-700' :
                        os.status === 'CANCELADO' ? 'bg-gray-100 text-gray-500' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {os.status === 'PENDIENTE' ? 'Pendiente' :
                         os.status === 'EN_PROGRESO' ? 'En Progreso' :
                         os.status === 'COMPLETADO' ? 'Completado' :
                         os.status === 'CANCELADO' ? 'Cancelado' : os.status}
                      </span>
                    </div>
                    {os.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{os.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                      {os.photos?.length > 0 && <span>{os.photos.length} foto(s)</span>}
                      {os.report && <span>Reporte #{os.report.id}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">Sin órdenes de servicio vinculadas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
