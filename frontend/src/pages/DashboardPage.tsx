import { useQuery } from '@tanstack/react-query';
import {
  Users,
  TicketCheck,
  ClipboardList,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { DashboardStats, Ticket, ServiceOrder, MaintenanceLog } from '../types';

function statCardBg(index: number) {
  const colors = [
    'bg-blue-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-cyan-500',
  ];
  return colors[index % colors.length];
}

function statCardLabel(index: number) {
  const labels = [
    'Total Clientes',
    'Tickets Activos',
    'Órdenes Pendientes',
    'Pólizas Activas',
    'Cotizaciones del Mes',
  ];
  return labels[index % labels.length];
}

function statCardIcon(index: number) {
  const icons = [Users, TicketCheck, ClipboardList, ShieldCheck, FileText];
  const Icon = icons[index % icons.length];
  return Icon;
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

function ticketStatusBadge(status: string) {
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
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

function orderStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDIENTE: 'bg-gray-100 text-gray-800',
    EN_PROGRESO: 'bg-blue-100 text-blue-800',
    COMPLETADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-red-100 text-red-800',
  };
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    EN_PROGRESO: 'En Progreso',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="card animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/stats');
      return data;
    },
  });

  const { data: recentTickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ['dashboard-recent-tickets'],
    queryFn: async () => {
      const { data } = await api.get<Ticket[]>('/dashboard/recent-tickets');
      return data;
    },
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<ServiceOrder[]>({
    queryKey: ['dashboard-recent-orders'],
    queryFn: async () => {
      const { data } = await api.get<ServiceOrder[]>('/dashboard/recent-orders');
      return data;
    },
  });

  const { data: upcomingMaintenance, isLoading: maintenanceLoading } = useQuery<MaintenanceLog[]>({
    queryKey: ['dashboard-upcoming-maintenance'],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceLog[]>('/dashboard/upcoming-maintenance');
      return data;
    },
  });

  const statValues = stats
    ? [
        stats.totalCustomers,
        stats.activeTickets,
        stats.pendingOrders,
        stats.activePolicies,
        stats.monthlyQuotations,
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : statValues.map((value, i) => {
              const Icon = statCardIcon(i);
              const isCritical = i === 1 && stats && stats.criticalTickets > 0;
              return (
                <div key={i} className="card">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${statCardBg(i)} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{statCardLabel(i)}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        {isCritical && (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            {stats.criticalTickets} críticos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Three Column Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <div>
          {ticketsLoading ? (
            <SkeletonList />
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Tickets Recientes</h2>
                <Link
                  to="/tickets"
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentTickets && recentTickets.length > 0 ? (
                  recentTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/tickets/${ticket.id}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors -mx-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {levelBadge(ticket.level)}
                            <span className="text-xs text-gray-400 truncate">
                              #{ticket.id}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {ticket.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {ticket.customer?.contactName || ticket.customer?.companyName || `Cliente #${ticket.customerId}`}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {ticketStatusBadge(ticket.status)}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Sin tickets recientes</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Service Orders */}
        <div>
          {ordersLoading ? (
            <SkeletonList />
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Órdenes Recientes</h2>
                <Link
                  to="/service-orders"
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/service-orders/${order.id}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors -mx-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {order.number}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {order.description || order.customer?.contactName || `Cliente #${order.customerId}`}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {orderStatusBadge(order.status)}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Sin órdenes recientes</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Maintenance */}
        <div>
          {maintenanceLoading ? (
            <SkeletonList />
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Próximos Mantenimientos</h2>
                <Link
                  to="/maintenance"
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingMaintenance && upcomingMaintenance.length > 0 ? (
                  upcomingMaintenance.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg hover:bg-gray-50 transition-colors -mx-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {log.description}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {log.scheduledDate
                              ? new Date(log.scheduledDate).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Fecha no disponible'}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Sin mantenimientos programados</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
