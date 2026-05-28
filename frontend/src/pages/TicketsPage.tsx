import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Filter, TicketCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { Ticket, PaginatedResponse } from '../types';
import Pagination from '../components/Pagination';

const levelFilters = [
  { key: '', label: 'Todos', className: '' },
  { key: 'EMERGENCIA', label: 'Emergencia', className: 'badge-emergencia' },
  { key: 'ATENCION', label: 'Atención', className: 'badge-atencion' },
  { key: 'PROGRAMAR', label: 'Programar', className: 'badge-programar' },
] as const;

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

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedResponse<Ticket>>({
    queryKey: ['tickets', page, search, levelFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (levelFilter) params.set('level', levelFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/tickets?${params}`);
      return data;
    },
  });

  const tickets = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.put(`/tickets/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de tickets de servicio</p>
        </div>
        <Link to="/tickets/new" className="btn-primary inline-flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {levelFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => { setLevelFilter(f.key); setPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                levelFilter === f.key
                  ? f.className || 'bg-gray-900 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por título o cliente..."
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
              <option value="">Todos los estados</option>
              <option value="ABIERTO">Abierto</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="RESUELTO">Resuelto</option>
              <option value="CERRADO">Cerrado</option>
            </select>
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
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : tickets.length > 0 ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Nivel</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Título</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Asignado a</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Creado</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">{levelBadge(ticket.level)}</td>
                  <td className="px-6 py-4">
                    <Link to={`/tickets/${ticket.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600">
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {ticket.customer?.contactName || ticket.customer?.companyName || `#${ticket.customerId}`}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={ticket.status}
                      onChange={(e) => statusMutation.mutate({ id: ticket.id, status: e.target.value })}
                      className="text-xs font-medium rounded-full border-0 bg-transparent cursor-pointer focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="ABIERTO">Abierto</option>
                      <option value="EN_PROCESO">En Proceso</option>
                      <option value="RESUELTO">Resuelto</option>
                      <option value="CERRADO">Cerrado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {ticket.assignedUser?.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(ticket.createdAt).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/tickets/${ticket.id}`}
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
          <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
        </div>
      ) : (
        <div className="card text-center py-12">
          <TicketCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            {search || levelFilter || statusFilter ? 'Sin resultados' : 'No hay tickets'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search || levelFilter || statusFilter
              ? 'Intenta con otros filtros de búsqueda'
              : 'Comienza creando el primer ticket'}
          </p>
          {!search && !levelFilter && !statusFilter && (
            <Link to="/tickets/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Ticket
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
