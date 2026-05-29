import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  TicketCheck,
  ClipboardList,
  ShieldCheck,
  FileText,
  ArrowRight,
  Wrench,
  Package,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../lib/api';
import type { DashboardStats, ChartData, Ticket, ServiceOrder, MaintenanceLog } from '../types';

const statCards = [
  { label: 'Total Clientes', icon: Users, gradient: 'from-primary-500 to-primary-600', key: 'totalCustomers' as const, lightBg: 'bg-primary-50' },
  { label: 'Tickets Activos', icon: TicketCheck, gradient: 'from-amber-500 to-orange-600', key: 'activeTickets' as const, lightBg: 'bg-amber-50' },
  { label: 'Órdenes Pendientes', icon: ClipboardList, gradient: 'from-emerald-500 to-emerald-600', key: 'pendingOrders' as const, lightBg: 'bg-emerald-50' },
  { label: 'Pólizas Activas', icon: ShieldCheck, gradient: 'from-violet-500 to-violet-600', key: 'activePolicies' as const, lightBg: 'bg-violet-50' },
  { label: 'Cotizaciones del Mes', icon: FileText, gradient: 'from-cyan-500 to-cyan-600', key: 'monthlyQuotations' as const, lightBg: 'bg-cyan-50' },
  { label: 'Equipos Registrados', icon: Package, gradient: 'from-rose-500 to-rose-600', key: 'totalEquipment' as const, lightBg: 'bg-rose-50' },
  { label: 'Técnicos', icon: Wrench, gradient: 'from-indigo-500 to-indigo-600', key: 'technicians' as const, lightBg: 'bg-indigo-50' },
  { label: 'Órdenes Completadas', icon: BarChart3, gradient: 'from-teal-500 to-teal-600', key: 'completedOrdersThisMonth' as const, lightBg: 'bg-teal-50' },
];

const PIE_COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#22c55e', '#8b5cf6', '#ec4899'];

function statBadge(level: string) {
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

function ticketBadge(status: string) {
  const styles: Record<string, string> = {
    ABIERTO: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    EN_PROCESO: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    RESUELTO: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    CERRADO: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
  };
  const labels: Record<string, string> = {
    ABIERTO: 'Abierto',
    EN_PROCESO: 'En Proceso',
    RESUELTO: 'Resuelto',
    CERRADO: 'Cerrado',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
}

function orderBadge(status: string) {
  const styles: Record<string, string> = {
    PENDIENTE: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
    EN_PROGRESO: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    COMPLETADO: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    CANCELADO: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  };
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    EN_PROGRESO: 'En Progreso',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse !p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="card animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Resumen general del sistema</p>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {statsLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card) => {
              const Icon = card.icon;
              const value = stats ? stats[card.key] : 0;
              return (
                <div key={card.key} className={`${card.lightBg} dark:bg-gray-800/50 rounded-2xl p-4 border border-transparent dark:border-gray-700/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`w-9 h-9 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg shadow-black/10`}>
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.label}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
      </motion.div>

      {/* Charts row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="card">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Ingresos Mensuales</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Evolución de ingresos</p>
            </div>
          </div>
          {chartLoading ? (
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData?.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: '#9ca3af' }} />
                <YAxis fontSize={12} tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    background: '#1e293b',
                    color: '#f1f5f9',
                  }}
                  formatter={(v: number) => [`$${v.toLocaleString('es-MX')}`, 'Ingresos']}
                />
                <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ticket Trends */}
        <div className="card">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BarChart3 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tendencia de Tickets</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Creados vs resueltos</p>
            </div>
          </div>
          {chartLoading ? (
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData?.ticketTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: '#9ca3af' }} />
                <YAxis fontSize={12} tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    background: '#1e293b',
                    color: '#f1f5f9',
                  }}
                />
                <Line type="monotone" dataKey="creados" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Creados" />
                <Line type="monotone" dataKey="resueltos" stroke="#22c55e" strokeWidth={2.5} dot={false} name="Resueltos" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tickets by Level */}
        <div className="card">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <TicketCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tickets por Nivel</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Distribución por prioridad</p>
            </div>
          </div>
          {chartLoading ? (
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
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
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    background: '#1e293b',
                    color: '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tickets by Status */}
        <div className="card">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <BarChart3 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tickets por Estado</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Estado actual de tickets</p>
            </div>
          </div>
          {chartLoading ? (
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData?.ticketsByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis type="number" fontSize={12} tick={{ fill: '#9ca3af' }} />
                <YAxis dataKey="name" type="category" fontSize={12} width={90} tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    background: '#1e293b',
                    color: '#f1f5f9',
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {(chartData?.ticketsByStatus || []).map((_entry: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Bottom lists */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <div>
          {ticketsLoading ? (
            <SkeletonList />
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tickets Recientes</h2>
                <Link
                  to="/tickets"
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-1">
                {recentTickets && recentTickets.length > 0 ? (
                  recentTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/tickets/${ticket.id}`}
                      className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors -mx-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {statBadge(ticket.level)}
                            <span className="text-xs text-gray-400 dark:text-gray-500">#{ticket.id}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{ticket.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {ticket.customer?.contactName || ticket.customer?.companyName || `Cliente #${ticket.customerId}`}
                          </p>
                        </div>
                        <div className="shrink-0">{ticketBadge(ticket.status)}</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Sin tickets recientes</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div>
          {ordersLoading ? (
            <SkeletonList />
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Órdenes Recientes</h2>
                <Link
                  to="/service-orders"
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-1">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/service-orders/${order.id}`}
                      className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors -mx-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{order.number}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {order.description || order.customer?.contactName || `Cliente #${order.customerId}`}
                          </p>
                        </div>
                        <div className="shrink-0">{orderBadge(order.status)}</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Sin órdenes recientes</p>
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
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Próximos Mantenimientos</h2>
                <Link
                  to="/maintenance"
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-1">
                {upcomingMaintenance && upcomingMaintenance.length > 0 ? (
                  upcomingMaintenance.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors -mx-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{log.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {log.scheduledDate
                              ? new Date(log.scheduledDate).toLocaleDateString('es-MX', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                })
                              : 'Fecha no disponible'}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Sin mantenimientos programados</p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
