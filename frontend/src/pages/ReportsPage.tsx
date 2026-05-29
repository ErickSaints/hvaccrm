import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, TicketCheck, ClipboardList, ShieldCheck, FileText, Wrench,
  TrendingUp, DollarSign, CheckCircle2, BarChart3, Filter, Download,
} from 'lucide-react';
import api from '../lib/api';
import type { ReportsSummary } from '../types';

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const PIE_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#6B7280', '#EF4444', '#8B5CF6'];

const STATUS_LABELS: Record<string, string> = {
  ABIERTO: 'Abierto', EN_PROCESO: 'En Proceso', RESUELTO: 'Resuelto', CERRADO: 'Cerrado',
  PENDIENTE: 'Pendiente', EN_PROGRESO: 'En Progreso', COMPLETADO: 'Completado', CANCELADO: 'Cancelado',
  BORRADOR: 'Borrador', ENVIADA: 'Enviada', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida',
};

const LEVEL_LABELS: Record<string, string> = {
  Emergencia: 'Emergencia', Atención: 'Atención', Programar: 'Programar',
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border text-sm">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-gray-600 dark:text-gray-400">
            {p.name}: <span className="font-medium">{typeof p.value === 'number' ? p.value.toLocaleString('es-MX') : p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{typeof value === 'number' ? value.toLocaleString('es-MX') : value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery<ReportsSummary>({
    queryKey: ['reports-summary', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get(`/reports/summary?startDate=${startDate}T00:00:00.000Z&endDate=${endDate}T23:59:59.999Z`);
      return data;
    },
  });

  const s = data?.summary;

  const statCards = [
    { label: 'Clientes', value: s?.totalCustomers ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Tickets Activos', value: s?.activeTickets ?? 0, icon: TicketCheck, color: 'bg-amber-500' },
    { label: 'Órdenes Pendientes', value: s?.pendingOrders ?? 0, icon: ClipboardList, color: 'bg-emerald-500' },
    { label: 'Pólizas Activas', value: s?.activePolicies ?? 0, icon: ShieldCheck, color: 'bg-violet-500' },
    { label: 'Cotizaciones (período)', value: s?.periodQuotations ?? 0, icon: FileText, color: 'bg-cyan-500' },
    { label: 'Órdenes Completadas', value: s?.periodCompletedOrders ?? 0, icon: CheckCircle2, color: 'bg-teal-500' },
    { label: 'Equipos', value: s?.totalEquipment ?? 0, icon: Wrench, color: 'bg-rose-500' },
    { label: 'Técnicos', value: s?.technicians ?? 0, icon: BarChart3, color: 'bg-indigo-500' },
    { label: 'Ingresos (período)', value: `$${(s?.periodRevenue ?? 0).toLocaleString('es-MX')}`, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Aprobación Cotiz.', value: `${s?.approvalRate ?? 0}%`, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Reportes Ejecutivos</h1>
            <p className="text-primary-200 text-sm mt-1">Dashboard de indicadores clave de rendimiento</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4 text-primary-200" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white/15 border-white/20 text-white placeholder-white/50 rounded-xl px-3 py-1.5 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 w-36" />
              <span className="text-primary-200">a</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white/15 border-white/20 text-white placeholder-white/50 rounded-xl px-3 py-1.5 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 w-36" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Ingresos Mensuales (12 meses)</h2>
          {data?.monthlyRevenue ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Ingresos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">Cargando...</div>
          )}
        </div>

        {/* Ticket Trends */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Tendencia de Tickets (12 meses)</h2>
          {data?.ticketTrends ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.ticketTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="creados" name="Creados" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="resueltos" name="Resueltos" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">Cargando...</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tickets by Status */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Tickets x Estado</h2>
          {data?.ticketsByStatus && data.ticketsByStatus.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.ticketsByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {data.ticketsByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">Sin datos</div>
          )}
          <div className="mt-2 space-y-1">
            {data?.ticketsByStatus.filter((d) => d.value > 0).map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{STATUS_LABELS[d.name] || d.name}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets by Level */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Tickets x Nivel</h2>
          {data?.ticketsByLevel && data.ticketsByLevel.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.ticketsByLevel} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {data.ticketsByLevel.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">Sin datos</div>
          )}
          <div className="mt-2 space-y-1">
            {data?.ticketsByLevel.filter((d) => d.value > 0).map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className={`flex items-center gap-1.5 ${d.name === 'Emergencia' ? 'text-red-600 font-medium' : d.name === 'Atención' ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full inline-block ${d.name === 'Emergencia' ? 'bg-red-500' : d.name === 'Atención' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  {d.name}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quotations by Status */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Cotizaciones x Estado</h2>
          {data?.quotationsByStatus && data.quotationsByStatus.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.quotationsByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {data.quotationsByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">Sin datos</div>
          )}
          <div className="mt-2 space-y-1">
            {data?.quotationsByStatus.filter((d) => d.value > 0).map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{STATUS_LABELS[d.name] || d.name}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{d.value}</span>
              </div>
            ))}
          </div>
          {s && (
            <div className="mt-3 pt-2 border-t text-xs text-gray-500">
              Tasa aprobación: <span className="font-semibold text-green-600">{s.approvalRate}%</span>
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Órdenes x Estado</h2>
          {data?.ordersByStatus && data.ordersByStatus.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.ordersByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {data.ordersByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">Sin datos</div>
          )}
          <div className="mt-2 space-y-1">
            {data?.ordersByStatus.filter((d) => d.value > 0).map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{STATUS_LABELS[d.name] || d.name}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{d.value}</span>
              </div>
            ))}
          </div>
          {s && (
            <div className="mt-3 pt-2 border-t text-xs text-gray-500">
              Tasa finalización: <span className="font-semibold text-green-600">{s.completionRate}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Technician Performance */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Rendimiento de Técnicos</h2>
        {data?.technicianPerformance && data.technicianPerformance.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.technicianPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="completadas" name="Completadas" fill="#10B981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="pendientes" name="Pendientes" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              <Bar dataKey="abiertos" name="Tickets Abiertos" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">Sin datos de técnicos</div>
        )}
      </div>

      {/* Top Customers */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top Clientes por Ingresos</h2>
        </div>
        {data?.topCustomers && data.topCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs uppercase">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium text-right">Órdenes</th>
                  <th className="pb-2 font-medium text-right">Total Gastado</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((c, i) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2.5 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 font-medium text-gray-900 dark:text-gray-100">{c.name}</td>
                    <td className="py-2.5 text-right text-gray-600 dark:text-gray-400">{c.orderCount}</td>
                    <td className="py-2.5 text-right font-medium text-gray-900 dark:text-gray-100">${c.totalSpent.toLocaleString('es-MX')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">Sin datos de clientes</p>
        )}
      </div>
    </div>
  );
}
