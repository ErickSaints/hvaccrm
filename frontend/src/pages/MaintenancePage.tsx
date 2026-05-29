import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  CalendarCheck,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import api from '../lib/api';
import type { MaintenanceLog, MaintenancePolicy } from '../types';

const statusFilters = [
  { key: '', label: 'Todos' },
  { key: 'PENDIENTE', label: 'Pendiente' },
  { key: 'COMPLETADO', label: 'Completado' },
] as const;

function statusBadge(status: string) {
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
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
  return days;
}

export default function MaintenancePage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [policyFilter, setPolicyFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const { data: logs, isLoading } = useQuery<MaintenanceLog[]>({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceLog[]>('/maintenance');
      return data;
    },
  });

  const { data: policies } = useQuery<MaintenancePolicy[]>({
    queryKey: ['maintenance-policies'],
    queryFn: async () => {
      const { data } = await api.get<MaintenancePolicy[]>('/policies');
      return data;
    },
  });

  const filtered = logs?.filter((log) => {
    if (statusFilter && log.status !== statusFilter) return false;
    if (policyFilter && String(log.policyId) !== policyFilter) return false;
    if (dateFrom && log.scheduledDate && log.scheduledDate.split('T')[0] < dateFrom) return false;
    if (dateTo && log.scheduledDate && log.scheduledDate.split('T')[0] > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.description?.toLowerCase().includes(q) ||
        log.policy?.name?.toLowerCase().includes(q) ||
        log.policy?.number?.toLowerCase().includes(q) ||
        log.policy?.customer?.contactName?.toLowerCase().includes(q) ||
        log.policy?.customer?.companyName?.toLowerCase().includes(q) ||
        log.assignedUser?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);

  const logsByDate = useMemo(() => {
    const map = new Map<string, MaintenanceLog[]>();
    (filtered || []).forEach((log) => {
      if (log.scheduledDate) {
        const key = log.scheduledDate.split('T')[0];
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(log);
      }
    });
    return map;
  }, [filtered]);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
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
            <h1 className="text-xl lg:text-2xl font-bold text-white">Mantenimientos</h1>
            <p className="text-primary-200 text-sm mt-1">Programación de visitas de mantenimiento</p>
          </div>
          <Link to="/maintenance/new" className="btn-primary bg-white/20 border-white/30 text-white hover:bg-white/30 inline-flex items-center gap-2 backdrop-blur-sm">
            <Plus className="w-4 h-4" />
            Programar Mantenimiento
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setView('list')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
            view === 'list'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <List className="w-4 h-4" />
          Lista
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
            view === 'calendar'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendario
        </button>
      </div>

      {view === 'list' ? (
        <>
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
                  placeholder="Buscar por descripción, póliza, cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={policyFilter}
              onChange={(e) => setPolicyFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">Todas las pólizas</option>
              {policies?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number} - {p.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field w-auto"
              placeholder="Desde"
            />
            <span className="text-gray-400 dark:text-gray-500">a</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field w-auto"
              placeholder="Hasta"
            />
          </div>

          {isLoading ? (
            <div className="card">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/5" />
                    <div className="h-4 bg-gray-200 rounded w-1/5" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                    <div className="h-4 bg-gray-200 rounded w-1/6" />
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
                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Descripción</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Póliza</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Cliente</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Fecha Programada</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-600">Estado</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Asignado a</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {log.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {log.policy ? (
                          <Link to={`/policies/${log.policyId}`} className="text-primary-600 hover:text-primary-700">
                            {log.policy.number}
                          </Link>
                        ) : (
                          `#${log.policyId}`
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {log.policy?.customer?.contactName || log.policy?.customer?.companyName || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {log.scheduledDate
                          ? new Date(log.scheduledDate).toLocaleDateString('es-MX')
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">{statusBadge(log.status)}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          {log.assignedUser?.name || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/maintenance/${log.id}`}
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
              <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                {search || statusFilter || policyFilter || dateFrom || dateTo ? 'Sin resultados' : 'No hay mantenimientos'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {search || statusFilter || policyFilter || dateFrom || dateTo
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Comienza programando el primer mantenimiento'}
              </p>
              {!search && !statusFilter && !policyFilter && !dateFrom && !dateTo && (
                <Link to="/maintenance/new" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Programar Mantenimiento
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {monthNames[calMonth]} {calYear}
            </h2>
            <button onClick={nextMonth} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {dayNames.map((day) => (
              <div key={day} className="bg-gray-50 dark:bg-gray-800 px-2 py-2 text-center text-xs font-semibold text-gray-600">
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="bg-white dark:bg-gray-900 min-h-[100px] p-1" />;
              }
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayLogs = logsByDate.get(dateStr) || [];
              const today = new Date();
              const isToday =
                today.getDate() === day &&
                today.getMonth() === calMonth &&
                today.getFullYear() === calYear;

              return (
                <div
                  key={dateStr}
                  className={`bg-white dark:bg-gray-900 min-h-[100px] p-1 ${isToday ? 'bg-primary-50' : ''}`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-primary-600 text-white' : 'text-gray-700'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayLogs.slice(0, 3).map((log) => (
                      <div
                        key={log.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate ${
                          log.status === 'COMPLETADO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                        title={log.description}
                      >
                        {log.description || 'Mantenimiento'}
                      </div>
                    ))}
                    {dayLogs.length > 3 && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 px-1">+{dayLogs.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
