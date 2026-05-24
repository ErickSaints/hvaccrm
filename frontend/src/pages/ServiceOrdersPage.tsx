import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Filter, ClipboardList, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ServiceOrder } from '../types';

const statusFilters = [
  { key: '', label: 'Todos' },
  { key: 'PENDIENTE', label: 'Pendiente' },
  { key: 'EN_PROGRESO', label: 'En Progreso' },
  { key: 'COMPLETADO', label: 'Completado' },
  { key: 'CANCELADO', label: 'Cancelado' },
] as const;

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
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
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

export default function ServiceOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: orders, isLoading } = useQuery<ServiceOrder[]>({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const { data } = await api.get<ServiceOrder[]>('/service-orders');
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/service-orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    },
  });

  const filtered = orders?.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.number.toLowerCase().includes(q) ||
        o.customer?.contactName?.toLowerCase().includes(q) ||
        o.customer?.companyName?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordenes de Servicio</h1>
          <p className="text-gray-500 mt-1">Gestión de ordenes de servicio técnico</p>
        </div>
        <Link to="/service-orders/new" className="btn-primary inline-flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Nueva Orden
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                statusFilter === f.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/5" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Número</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Descripción</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Fecha Programada</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Asignado a</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/service-orders/${order.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                      {order.number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.customer?.contactName || order.customer?.companyName || `#${order.customerId}`}
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                    {order.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {order.scheduledDate
                      ? new Date(order.scheduledDate).toLocaleDateString('es-MX')
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => statusMutation.mutate({ id: order.id, status: e.target.value })}
                      className="bg-transparent border-0 cursor-pointer focus:ring-0 p-0"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1">{statusBadge(order.status)}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.assignedUser?.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/service-orders/${order.id}`}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-block"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {search || statusFilter ? 'Sin resultados' : 'No hay ordenes de servicio'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search || statusFilter
              ? 'Intenta con otros filtros de búsqueda'
              : 'Comienza creando la primera orden de servicio'}
          </p>
          {!search && !statusFilter && (
            <Link to="/service-orders/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Orden
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
