import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TicketCheck,
  ClipboardList,
  FileText,
  Wrench,
  ArrowRight,
  Plus,
  Receipt,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Ticket, ServiceOrder, Quotation, Equipment, Invoice, PaginatedResponse } from '../types';

const COLORS = {
  ABIERTO: '#3B82F6',
  EN_PROCESO: '#F59E0B',
  RESUELTO: '#10B981',
  CERRADO: '#6B7280',
  PENDIENTE: '#F59E0B',
  EN_PROGRESO: '#3B82F6',
  COMPLETADO: '#10B981',
  CANCELADO: '#EF4444',
  BORRADOR: '#6B7280',
  ENVIADA: '#3B82F6',
  APROBADA: '#10B981',
  RECHAZADA: '#EF4444',
  VENCIDA: '#F59E0B',
};

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    ABIERTO: 'bg-blue-100 text-blue-800',
    EN_PROCESO: 'bg-amber-100 text-amber-800',
    RESUELTO: 'bg-green-100 text-green-800',
    CERRADO: 'bg-gray-100 text-gray-800',
    PENDIENTE: 'bg-amber-100 text-amber-800',
    EN_PROGRESO: 'bg-blue-100 text-blue-800',
    COMPLETADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-red-100 text-red-800',
    BORRADOR: 'bg-gray-100 text-gray-800',
    ENVIADA: 'bg-blue-100 text-blue-800',
    APROBADA: 'bg-green-100 text-green-800',
    RECHAZADA: 'bg-red-100 text-red-800',
    VENCIDA: 'bg-amber-100 text-amber-800',
  };
  const labels: Record<string, string> = {
    ABIERTO: 'Abierto', EN_PROCESO: 'En Proceso', RESUELTO: 'Resuelto', CERRADO: 'Cerrado',
    PENDIENTE: 'Pendiente', EN_PROGRESO: 'En Progreso', COMPLETADO: 'Completado', CANCELADO: 'Cancelado',
    BORRADOR: 'Borrador', ENVIADA: 'Enviada', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

function ChartCard({ title, data, dataKey }: { title: string; data: { name: string; value: number }[]; dataKey: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h3>
      {total > 0 ? (
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={20} outerRadius={36} dataKey="value" strokeWidth={0}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.name as keyof typeof COLORS] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1">
            {data.filter(d => d.value > 0).map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[d.name as keyof typeof COLORS] || '#6B7280' }} />
                  {d.name}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Sin datos</p>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();

  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: ['client-tickets'],
    queryFn: async () => {
      const { data } = await api.get<Ticket[]>('/tickets');
      return data;
    },
  });

  const { data: orders } = useQuery<ServiceOrder[]>({
    queryKey: ['client-orders'],
    queryFn: async () => {
      const { data } = await api.get<ServiceOrder[]>('/service-orders');
      return data;
    },
  });

  const { data: quotations } = useQuery<Quotation[]>({
    queryKey: ['client-quotations'],
    queryFn: async () => {
      const { data } = await api.get<Quotation[]>('/quotations');
      return data;
    },
  });

  const { data: equipment } = useQuery<Equipment[]>({
    queryKey: ['client-equipment'],
    queryFn: async () => {
      const { data } = await api.get<Equipment[]>('/equipment');
      return data;
    },
  });

  const { data: invoicesData } = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['client-invoices'],
    queryFn: async () => {
      const { data } = await api.get('/invoices?page=1&limit=5');
      return data;
    },
  });

  const activeTickets = tickets?.filter((t) => t.status !== 'CERRADO' && t.status !== 'RESUELTO') || [];
  const pendingOrders = orders?.filter((o) => o.status === 'PENDIENTE' || o.status === 'EN_PROGRESO') || [];
  const pendingQuotations = quotations?.filter((q) => q.status === 'BORRADOR' || q.status === 'ENVIADA') || [];
  const invoices = invoicesData?.data ?? [];

  const ticketStatusData = Object.entries(
    tickets?.reduce((acc, t) => {
      const label = { ABIERTO: 'Abierto', EN_PROCESO: 'En Proceso', RESUELTO: 'Resuelto', CERRADO: 'Cerrado' }[t.status] || t.status;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  ).map(([name, value]) => ({ name, value }));

  const orderStatusData = Object.entries(
    orders?.reduce((acc, o) => {
      const label = { PENDIENTE: 'Pendiente', EN_PROGRESO: 'En Progreso', COMPLETADO: 'Completado', CANCELADO: 'Cancelado' }[o.status] || o.status;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  ).map(([name, value]) => ({ name, value }));

  const quotationStatusData = Object.entries(
    quotations?.reduce((acc, q) => {
      const label = { BORRADOR: 'Borrador', ENVIADA: 'Enviada', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida' }[q.status] || q.status;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  ).map(([name, value]) => ({ name, value }));

  const nextService = orders
    ?.filter((o) => o.scheduledDate && o.status !== 'COMPLETADO' && o.status !== 'CANCELADO')
    ?.sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())[0];

  const serviceDate = nextService?.scheduledDate ? new Date(nextService.scheduledDate) : null;
  const isToday = serviceDate && serviceDate.toDateString() === new Date().toDateString();
  const daysUntil = serviceDate ? Math.ceil((serviceDate.getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bienvenido, {user?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Panel de cliente</p>
        </div>
        <Link to="/tickets/new" className="btn-primary inline-flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TicketCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeTickets.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Activos</p>
            </div>
          </div>
          <Link to="/tickets" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pendingOrders.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">En proceso</p>
            </div>
          </div>
          <Link to="/service-orders" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pendingQuotations.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pendientes</p>
            </div>
          </div>
          <Link to="/quotations" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{equipment?.length || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Equipos</p>
            </div>
          </div>
          <Link to="/equipment" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{invoices.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Facturas</p>
            </div>
          </div>
          <Link to="/invoices" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Next Service + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Scheduled Service */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-primary-600" />
            Próximo Servicio
          </h2>
          {nextService && serviceDate ? (
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                isToday ? 'bg-green-100 text-green-800' : daysUntil !== null && daysUntil <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isToday ? 'Hoy' : daysUntil !== null && daysUntil <= 3 ? `En ${daysUntil} días` : serviceDate.toLocaleDateString('es-MX', { dateStyle: 'long' })}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{nextService.number}</p>
              {nextService.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{nextService.description}</p>
              )}
              <Link to={`/service-orders/${nextService.id}`} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mt-1">
                Ver detalle <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500">
              <CalendarClock className="w-8 h-8 mb-2" />
              <p className="text-sm">Sin servicios programados</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/tickets/new" className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <Plus className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Nuevo Ticket</span>
            </Link>
            <Link to="/tickets" className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
              <TicketCheck className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Mis Tickets</span>
            </Link>
            <Link to="/quotations" className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
              <FileText className="w-5 h-5 text-violet-600" />
              <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Cotizaciones</span>
            </Link>
            <Link to="/client/settings" className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Wrench className="w-5 h-5 text-gray-600" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Configuración</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ChartCard title="Tickets por Estado" data={ticketStatusData} dataKey="value" />
        <ChartCard title="Órdenes por Estado" data={orderStatusData} dataKey="value" />
        <ChartCard title="Cotizaciones por Estado" data={quotationStatusData} dataKey="value" />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mis Tickets Recientes</h2>
            <Link to="/tickets" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {tickets && tickets.length > 0 ? tickets.slice(0, 5).map((t) => (
              <Link key={t.id} to={`/tickets/${t.id}`} className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors -mx-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString('es-MX', { dateStyle: 'short' })}
                    </p>
                  </div>
                  {statusBadge(t.status)}
                </div>
              </Link>
            )) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin tickets</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mis Órdenes de Servicio</h2>
            <Link to="/service-orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {orders && orders.length > 0 ? orders.slice(0, 5).map((o) => (
              <Link key={o.id} to={`/service-orders/${o.id}`} className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors -mx-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{o.number}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {o.scheduledDate
                        ? new Date(o.scheduledDate).toLocaleDateString('es-MX', { dateStyle: 'short' })
                        : 'Sin programar'}
                    </p>
                  </div>
                  {statusBadge(o.status)}
                </div>
              </Link>
            )) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin órdenes</p>
            )}
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mis Cotizaciones</h2>
            <Link to="/quotations" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {quotations && quotations.length > 0 ? quotations.slice(0, 5).map((q) => (
              <Link key={q.id} to={`/quotations/${q.id}`} className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors -mx-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{q.title || q.number}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${q.total?.toLocaleString('es-MX') || '0'}</p>
                  </div>
                  {statusBadge(q.status)}
                </div>
              </Link>
            )) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin cotizaciones</p>
            )}
          </div>
        </div>

        {/* My Equipment */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mis Equipos</h2>
            <Link to="/equipment" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {equipment && equipment.length > 0 ? equipment.slice(0, 5).map((e) => (
              <div key={e.id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors -mx-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{e.type}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{e.brand} {e.model ? `- ${e.model}` : ''}</p>
              </div>
            )) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin equipos registrados</p>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mis Facturas</h2>
            <Link to="/invoices" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {invoices.length > 0 ? invoices.map((inv) => (
              <Link key={inv.id} to={`/invoices/${inv.id}`} className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors -mx-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{inv.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(inv.createdAt).toLocaleDateString('es-MX', { dateStyle: 'short' })} · ${inv.total?.toLocaleString('es-MX') || '0'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    inv.status === 'PAGADA' ? 'bg-green-100 text-green-800' :
                    inv.status === 'EMITIDA' ? 'bg-blue-100 text-blue-800' :
                    inv.status === 'VENCIDA' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {inv.status === 'PAGADA' ? 'Pagada' :
                     inv.status === 'EMITIDA' ? 'Emitida' :
                     inv.status === 'VENCIDA' ? 'Vencida' :
                     inv.status || '—'}
                  </span>
                </div>
              </Link>
            )) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin facturas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
