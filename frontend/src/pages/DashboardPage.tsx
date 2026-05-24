import { useQuery } from '@tanstack/react-query';
import {
  Users,
  TicketCheck,
  ClipboardList,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ArrowRight,
  Wrench,
  Package,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../lib/api';
import type { DashboardStats, ChartData, Ticket, ServiceOrder, MaintenanceLog } from '../types';

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

const STAT_CARDS = [
  { label: 'Total Clientes', icon: Users, color: 'bg-blue-500', key: 'totalCustomers' as const },
  { label: 'Tickets Activos', icon: TicketCheck, color: 'bg-amber-500', key: 'activeTickets' as const },
  { label: 'Órdenes Pendientes', icon: ClipboardList, color: 'bg-emerald-500', key: 'pendingOrders' as const },
  { label: 'Pólizas Activas', icon: ShieldCheck, color: 'bg-violet-500', key: 'activePolicies' as const },
  { label: 'Cotizaciones del Mes', icon: FileText, color: 'bg-cyan-500', key: 'monthlyQuotations' as const },
  { label: 'Equipos Registrados', icon: Package, color: 'bg-rose-500', key: 'totalEquipment' as const },
  { label: 'Técnicos', icon: Wrench, color: 'bg-indigo-500', key: 'technicians' as const },
  { label: 'Órdenes Completadas', icon: BarChart3, color: 'bg-teal-500', key: 'completedOrdersThisMonth' as const },
];

const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/stats');
      return data;
    },
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData>({
    queryKey: ['dashboard-chart-data'],
    queryFn: async () => {
      const { data } = await api.get<ChartData>('/dashboard/chart-data');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {statsLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : STAT_CARDS.map((card) => {
              const Icon = card.icon;
              const value = stats ? stats[card.key] : 0;
              return (
                <div key={card.key} className="card p-3">
                  <div className="flex flex-col items-center text-center gap-1">
                    <div className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <p className="text-lg font-bold text-gray-900">{value}</p>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Ingresos Mensuales</h2>
          </div>
          {chartLoading ? (
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData?.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString('es-MX')}`} />
                <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ticket Trends */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Tendencia de Tickets</h2>
          </div>
          {chartLoading ? (
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData?.ticketTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="creados" stroke="#3b82f6" strokeWidth={2} name="Creados" />
                <Line type="monotone" dataKey="resueltos" stroke="#22c55e" strokeWidth={2} name="Resueltos" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tickets by Level */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TicketCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Tickets por Nivel</h2>
          </div>
          {chartLoading ? (
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData?.ticketsByLevel}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {(chartData?.ticketsByLevel || []).map((_entry: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tickets by Status */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900">Tickets por Estado</h2>
          </div>
          {chartLoading ? (
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData?.ticketsByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" fontSize={12} width={90} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {(chartData?.ticketsByStatus || []).map((_entry: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Lists Row */}
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
                            <span className="text-xs text-gray-400 truncate">#{ticket.id}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {ticket.customer?.contactName || ticket.customer?.companyName || `Cliente #${ticket.customerId}`}
                          </p>
                        </div>
                        <div className="shrink-0">{ticketStatusBadge(ticket.status)}</div>
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
                          <p className="text-sm font-medium text-gray-900 truncate">{order.number}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {order.description || order.customer?.contactName || `Cliente #${order.customerId}`}
                          </p>
                        </div>
                        <div className="shrink-0">{orderStatusBadge(order.status)}</div>
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
                    <div key={log.id} className="p-3 rounded-lg hover:bg-gray-50 transition-colors -mx-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{log.description}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {log.scheduledDate
                              ? new Date(log.scheduledDate).toLocaleDateString('es-MX', {
                                  year: 'numeric', month: 'short', day: 'numeric',
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
