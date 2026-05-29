import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit2,
  Loader2,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  Repeat,
  ClipboardList,
  CalendarCheck,
  Clock,
  User,
  Wrench,
  Package,
  Plus,
} from 'lucide-react';
import api from '../lib/api';
import type { MaintenancePolicy, MaintenanceLog, ServiceOrder } from '../types';

interface PolicyDetail extends MaintenancePolicy {
  serviceOrders?: ServiceOrder[];
  maintenanceLogs?: MaintenanceLog[];
}

function statusBadge(status: string) {
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
    <span className={`text-sm font-medium px-3 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

const frequencyLabels: Record<string, string> = {
  MENSUAL: 'Mensual',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

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

function logStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDIENTE: 'bg-amber-100 text-amber-800',
    COMPLETADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-gray-100 text-gray-800',
  };
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  const { data: policy, isLoading } = useQuery<PolicyDetail>({
    queryKey: ['maintenance-policy', id],
    queryFn: async () => {
      const { data } = await api.get<PolicyDetail>(`/policies/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });

  const { data: maintenanceLogs } = useQuery<MaintenanceLog[]>({
    queryKey: ['maintenance', 'by-policy', id],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceLog[]>('/maintenance', {
        params: { policyId: id },
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

  if (!policy) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Póliza no encontrada</p>
        <Link to="/policies" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
          Volver a pólizas
        </Link>
      </div>
    );
  }

  const logs = maintenanceLogs || policy.maintenanceLogs || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/policies')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {statusBadge(policy.status)}
              <span className="text-xs text-gray-400 dark:text-gray-500">{policy.number}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{policy.name}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/policies/${policy.id}/edit`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </Link>
          <Link
            to={`/service-orders/new?policyId=${policy.id}`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            Crear Orden
          </Link>
          <Link
            to={`/maintenance/new?policyId=${policy.id}`}
            className="btn-primary inline-flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4" />
            Programar Visita
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Información
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Órdenes ({policy.serviceOrders?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Mantenimientos ({logs.length})
          </button>
        </nav>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Detalles de la Póliza</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Número</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1 font-medium">{policy.number}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{policy.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Frecuencia</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1 flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {frequencyLabels[policy.frequency] || policy.frequency}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visitas</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{policy.visitCount} visita(s)</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio por Visita</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">${policy.pricePerVisit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio Total</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1 flex items-center gap-1.5 font-semibold">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  ${policy.totalPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha de Inicio</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {new Date(policy.startDate).toLocaleDateString('es-MX', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha de Fin</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {new Date(policy.endDate).toLocaleDateString('es-MX', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            {policy.description && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Descripción</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{policy.description}</p>
              </div>
            )}
            {policy.notes && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notas</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{policy.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cliente</h2>
              {policy.customer ? (
                <div>
                  <Link
                    to={`/customers/${policy.customerId}`}
                    className="text-primary-600 hover:text-primary-700 flex items-center gap-1.5 text-sm font-medium"
                  >
                    <Building2 className="w-4 h-4" />
                    {policy.customer.companyName || policy.customer.contactName}
                  </Link>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{policy.customer.contactName}</p>
                  {policy.customer.phone && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      {policy.customer.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">#{policy.customerId}</p>
              )}
            </div>

            <div className="card space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resumen</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <ClipboardList className="w-4 h-4" />
                    <span className="text-sm">Órdenes</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{policy.serviceOrders?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarCheck className="w-4 h-4" />
                    <span className="text-sm">Mantenimientos</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{logs.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          {policy.serviceOrders && policy.serviceOrders.length > 0 ? (
            <div className="space-y-3">
              {policy.serviceOrders.map((order: ServiceOrder) => (
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
                        {order.assignedUser && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {order.assignedUser.name}
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
              <p className="text-gray-500 dark:text-gray-400 mb-6">No hay órdenes vinculadas a esta póliza</p>
              <Link
                to={`/service-orders/new?policyId=${policy.id}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear Orden
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div>
          {logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log: MaintenanceLog) => (
                <div key={log.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{log.description}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Programado: {new Date(log.scheduledDate).toLocaleDateString('es-MX')}
                        </span>
                        {log.completedDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-green-500" />
                            Completado: {new Date(log.completedDate).toLocaleDateString('es-MX')}
                          </span>
                        )}
                        {log.assignedUser && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.assignedUser.name}
                          </span>
                        )}
                        {log.equipment && (
                          <span className="flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {log.equipment.type}
                          </span>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{log.notes}</p>
                      )}
                    </div>
                    <div className="shrink-0">{logStatusBadge(log.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Sin mantenimientos programados</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">No hay visitas de mantenimiento registradas para esta póliza</p>
              <Link
                to={`/maintenance/new?policyId=${policy.id}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Programar Mantenimiento
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
