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
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Ticket, ServiceOrder, Quotation, Equipment, Invoice, PaginatedResponse } from '../types';

function statusBadge(status: string, type: 'ticket' | 'order' | 'quotation') {
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

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TicketCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeTickets.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tickets activos</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Órdenes activas</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Cotizaciones pendientes</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Equipos registrados</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Facturas recientes</p>
            </div>
          </div>
          <Link to="/invoices" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
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
                  {statusBadge(t.status, 'ticket')}
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
                  {statusBadge(o.status, 'order')}
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
                  {statusBadge(q.status, 'quotation')}
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
