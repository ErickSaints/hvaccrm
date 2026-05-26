import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit2,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Hash,
  Wrench,
  TicketCheck,
  ClipboardList,
  ShieldCheck,
  Loader2,
  Calendar,
  Package,
} from 'lucide-react';
import api from '../lib/api';
import type { Customer, Equipment, Ticket, ServiceOrder, MaintenancePolicy } from '../types';

interface TimelineEvent {
  type: string;
  id: number;
  title: string;
  description: string;
  status: string;
  date: string;
  user?: string;
  link: string;
}

interface CustomerDetail extends Customer {
  tickets?: Ticket[];
  serviceOrders?: ServiceOrder[];
  policies?: MaintenancePolicy[];
}

const tabs = [
  { id: 'info', label: 'Información', icon: FileText },
  { id: 'timeline', label: 'Historial', icon: Calendar },
  { id: 'equipment', label: 'Equipos', icon: Wrench },
  { id: 'tickets', label: 'Tickets', icon: TicketCheck },
  { id: 'orders', label: 'Órdenes de Servicio', icon: ClipboardList },
  { id: 'policies', label: 'Pólizas', icon: ShieldCheck },
];

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

function policyStatusBadge(status: string) {
  const styles: Record<string, string> = {
    ACTIVA: 'bg-green-100 text-green-800',
    EXPIRADA: 'bg-red-100 text-red-800',
    CANCELADA: 'bg-gray-100 text-gray-800',
  };
  const labels: Record<string, string> = {
    ACTIVA: 'Activa',
    EXPIRADA: 'Expirada',
    CANCELADA: 'Cancelada',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  const { data: customer, isLoading } = useQuery<CustomerDetail>({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await api.get<CustomerDetail>(`/customers/${id}`, {
        params: {
          include: 'equipment,tickets,serviceOrders,policies',
        },
      });
      return data;
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Cliente no encontrado</p>
        <Link to="/customers" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
          Volver a clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customers')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customer.contactName}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{customer.companyName || 'Sin empresa'}</p>
          </div>
        </div>
        <Link
          to={`/customers/${customer.id}/edit`}
          className="btn-primary inline-flex items-center gap-2 w-fit"
        >
          <Edit2 className="w-4 h-4" />
          Editar
        </Link>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Datos Generales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contacto</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{customer.contactName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Empresa</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{customer.companyName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teléfono</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <a href={`tel:${customer.phone}`} className="text-primary-600 hover:text-primary-700">{customer.phone}</a>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teléfono 2</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{customer.phone2 || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</p>
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="text-primary-600 hover:text-primary-700 flex items-center gap-1.5 mt-1">
                    <Mail className="w-4 h-4" />
                    {customer.email}
                  </a>
                ) : (
                  <p className="text-gray-900 dark:text-gray-100 mt-1">—</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dirección</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {customer.address}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ciudad</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{customer.city || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{customer.state || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código Postal</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{customer.zipCode || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RFC / Tax ID</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{customer.taxId || '—'}</p>
              </div>
            </div>
            {customer.notes && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notas</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resumen</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600">
                  <Wrench className="w-4 h-4" />
                  <span className="text-sm">Equipos</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{customer.equipment?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600">
                  <TicketCheck className="w-4 h-4" />
                  <span className="text-sm">Tickets</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{customer.tickets?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600">
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-sm">Órdenes</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{customer.serviceOrders?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm">Pólizas</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{customer.policies?.length ?? 0}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Registrado</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {customer.createdAt
                  ? new Date(customer.createdAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && <TimelineTab customerId={Number(id)} />}

      {activeTab === 'equipment' && (
        <div>
          {customer.equipment && customer.equipment.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customer.equipment.map((eq: Equipment) => (
                <Link
                  key={eq.id}
                  to={`/equipment/${eq.id}`}
                  className="card hover:shadow-md transition-shadow block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{eq.type}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    {eq.brand && (
                      <p><span className="font-medium text-gray-600">Marca:</span> {eq.brand}</p>
                    )}
                    {eq.model && (
                      <p><span className="font-medium text-gray-600">Modelo:</span> {eq.model}</p>
                    )}
                    {eq.serialNumber && (
                      <p className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {eq.serialNumber}
                      </p>
                    )}
                    {eq.location && (
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {eq.location}
                      </p>
                    )}
                    {eq.lastService && (
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Último servicio: {new Date(eq.lastService).toLocaleDateString('es-MX')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Sin equipos registrados</h3>
              <p className="text-gray-500 dark:text-gray-400">Este cliente no tiene equipos asociados</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tickets' && (
        <div>
          {customer.tickets && customer.tickets.length > 0 ? (
            <div className="space-y-3">
              {customer.tickets.map((ticket: Ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="card block hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {levelBadge(ticket.level)}
                        <span className="text-xs text-gray-400 dark:text-gray-500">#{ticket.id}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{ticket.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ticket.description}</p>
                      {ticket.equipment && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {ticket.equipment.type} {ticket.equipment.brand ? `- ${ticket.equipment.brand}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">{ticketStatusBadge(ticket.status)}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <TicketCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Sin tickets</h3>
              <p className="text-gray-500 dark:text-gray-400">Este cliente no tiene tickets registrados</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          {customer.serviceOrders && customer.serviceOrders.length > 0 ? (
            <div className="space-y-3">
              {customer.serviceOrders.map((order: ServiceOrder) => (
                <Link
                  key={order.id}
                  to={`/service-orders/${order.id}`}
                  className="card block hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order.number}</span>
                        {order.equipment && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">{order.equipment.type}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{order.description || 'Sin descripción'}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                        {order.scheduledDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.scheduledDate).toLocaleDateString('es-MX')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          ${order.totalCost?.toFixed(2) ?? '0.00'}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">{orderStatusBadge(order.status)}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Sin órdenes de servicio</h3>
              <p className="text-gray-500 dark:text-gray-400">Este cliente no tiene órdenes de servicio</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'policies' && (
        <div>
          {customer.policies && customer.policies.length > 0 ? (
            <div className="space-y-3">
              {customer.policies.map((policy: MaintenancePolicy) => (
                <Link
                  key={policy.id}
                  to={`/policies/${policy.id}`}
                  className="card block hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{policy.number}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{policy.frequency}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{policy.name}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                        <span>{new Date(policy.startDate).toLocaleDateString('es-MX')} - {new Date(policy.endDate).toLocaleDateString('es-MX')}</span>
                        <span>{policy.visitCount} visitas</span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          ${policy.totalPrice?.toFixed(2) ?? '0.00'}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">{policyStatusBadge(policy.status)}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Sin pólizas</h3>
              <p className="text-gray-500 dark:text-gray-400">Este cliente no tiene pólizas de mantenimiento</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TIMELINE_ICONS: Record<string, any> = {
  ticket: TicketCheck,
  service_order: ClipboardList,
  quotation: FileText,
  report: FileText,
  policy: ShieldCheck,
};

const TIMELINE_COLORS: Record<string, string> = {
  ticket: 'text-amber-600 bg-amber-100',
  service_order: 'text-emerald-600 bg-emerald-100',
  quotation: 'text-violet-600 bg-violet-100',
  report: 'text-blue-600 bg-blue-100',
  policy: 'text-rose-600 bg-rose-100',
};

const TIMELINE_LABELS: Record<string, string> = {
  ticket: 'Ticket',
  service_order: 'Orden de Servicio',
  quotation: 'Cotización',
  report: 'Reporte de Servicio',
  policy: 'Póliza',
};

function TimelineTab({ customerId }: { customerId: number }) {
  const { data: events, isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['customer-timeline', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${customerId}/timeline`);
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary-600 animate-spin" /></div>;
  }

  if (!events || events.length === 0) {
    return (
      <div className="card text-center py-12">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Sin actividad</h3>
        <p className="text-gray-500 dark:text-gray-400">No hay eventos registrados para este cliente</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-0">
        {events.map((event) => {
          const Icon = TIMELINE_ICONS[event.type] || FileText;
          const color = TIMELINE_COLORS[event.type] || 'text-gray-600 bg-gray-100';
          const label = TIMELINE_LABELS[event.type] || event.type;
          return (
            <Link
              key={`${event.type}-${event.id}`}
              to={event.link}
              className="relative flex items-start gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors -mx-4 rounded-lg"
            >
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">{label}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {new Date(event.date).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{event.description}</p>
                )}
                {event.user && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{event.user}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
