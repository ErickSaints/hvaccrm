import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, FileText, Filter } from 'lucide-react';
import api from '../lib/api';
import type { Quotation, PaginatedResponse } from '../types';
import Pagination from '../components/Pagination';

const statusStyles: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  ENVIADA: 'bg-blue-100 text-blue-800',
  APROBADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-100 text-red-800',
  VENCIDA: 'bg-amber-100 text-amber-800',
};

const statusLabels: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  VENCIDA: 'Vencida',
};

const statusFilters = [
  { value: '', label: 'Todos' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'ENVIADA', label: 'Enviada' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
  { value: 'VENCIDA', label: 'Vencida' },
];

function statusBadge(status: string) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export default function QuotationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedResponse<Quotation>>({
    queryKey: ['quotations', page, search, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const { data } = await api.get(`/quotations?${params}`);
      return data;
    },
  });

  const quotations = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const isExpired = (q: Quotation) => {
    if (!q.validUntil || q.status !== 'ENVIADA') return false;
    return new Date(q.validUntil) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Cotizaciones</h1>
            <p className="text-primary-200 text-sm mt-1">Gestión de cotizaciones y presupuestos</p>
          </div>
          <Link to="/quotations/new" className="btn-primary bg-white/20 border-white/30 text-white hover:bg-white/30 inline-flex items-center gap-2 backdrop-blur-sm">
            <Plus className="w-4 h-4" />
            Nueva Cotización
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <select
            value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field pl-9 pr-8 appearance-none cursor-pointer"
          >
            {statusFilters.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="input-field text-sm"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            className="btn-secondary text-sm mt-5"
          >
            Limpiar fechas
          </button>
        )}
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
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : quotations.length > 0 ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Número</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Título</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Total</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Fecha</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Válida hasta</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotations.map((q) => {
                const expired = isExpired(q);
                return (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{q.number}</td>
                    <td className="px-6 py-4 text-gray-600">{q.title || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {q.customer?.contactName || q.customer?.companyName || `#${q.customerId}`}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                      ${q.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {expired ? (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Vencida</span>
                      ) : (
                        statusBadge(q.status)
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(q.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                      {q.validUntil
                        ? new Date(q.validUntil).toLocaleDateString('es-MX')
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/quotations/${q.id}`}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-block"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
        </div>
      ) : (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            {search || statusFilter || dateFrom || dateTo ? 'Sin resultados' : 'No hay cotizaciones'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search || statusFilter || dateFrom || dateTo
              ? 'Intenta con otros filtros de búsqueda'
              : 'Comienza creando la primera cotización'}
          </p>
          {!search && !statusFilter && !dateFrom && !dateTo && (
            <Link to="/quotations/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Cotización
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
