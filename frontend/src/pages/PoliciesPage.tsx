import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import type { MaintenancePolicy } from '../types';

const statusFilters = [
  { key: '', label: 'Todas' },
  { key: 'ACTIVA', label: 'Activa' },
  { key: 'EXPIRADA', label: 'Expirada' },
  { key: 'CANCELADA', label: 'Cancelada' },
] as const;

const frequencyLabels: Record<string, string> = {
  MENSUAL: 'Mensual',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

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
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function PoliciesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: policies, isLoading } = useQuery<MaintenancePolicy[]>({
    queryKey: ['maintenance-policies'],
    queryFn: async () => {
      const { data } = await api.get<MaintenancePolicy[]>('/policies');
      return data;
    },
  });

  const filtered = policies?.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.number.toLowerCase().includes(q) ||
        p.customer?.contactName?.toLowerCase().includes(q) ||
        p.customer?.companyName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Pólizas de Mantenimiento</h1>
            <p className="text-primary-200 text-sm mt-1">Gestión de pólizas de mantenimiento preventivo</p>
          </div>
          <Link to="/policies/new" className="btn-primary bg-white/20 border-white/30 text-white hover:bg-white/30 inline-flex items-center gap-2 backdrop-blur-sm">
            <Plus className="w-4 h-4" />
            Nueva Póliza
          </Link>
        </div>
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
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, número o cliente..."
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
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/5" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Número</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Nombre</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Frecuencia</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Visitas</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Precio Total</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Fecha Fin</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((policy) => (
                <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/policies/${policy.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                      {policy.number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{policy.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {policy.customer?.contactName || policy.customer?.companyName || `#${policy.customerId}`}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{frequencyLabels[policy.frequency] || policy.frequency}</td>
                  <td className="px-6 py-4 text-center text-gray-600">{policy.visitCount}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">${policy.totalPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">{statusBadge(policy.status)}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {policy.endDate ? new Date(policy.endDate).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/policies/${policy.id}`}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-block"
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
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            {search || statusFilter ? 'Sin resultados' : 'No hay pólizas'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search || statusFilter
              ? 'Intenta con otros filtros de búsqueda'
              : 'Comienza creando la primera póliza de mantenimiento'}
          </p>
          {!search && !statusFilter && (
            <Link to="/policies/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Póliza
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
