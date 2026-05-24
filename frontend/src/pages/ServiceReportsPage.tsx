import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, FileText } from 'lucide-react';
import api from '../lib/api';
import type { ServiceReport } from '../types';

export default function ServiceReportsPage() {
  const [search, setSearch] = useState('');

  const { data: reports, isLoading } = useQuery<ServiceReport[]>({
    queryKey: ['service-reports'],
    queryFn: async () => {
      const { data } = await api.get<ServiceReport[]>('/service-reports');
      return data;
    },
  });

  const filtered = reports?.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.customer?.contactName?.toLowerCase().includes(q) ||
        r.customer?.companyName?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Servicio</h1>
          <p className="text-gray-500 mt-1">Historial de reportes técnicos</p>
        </div>
        <Link
          to="/service-reports/new"
          className="btn-primary inline-flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          Nuevo Reporte
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por título o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/5" />
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
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Título</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Orden #</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Técnico</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Fecha</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/service-reports/${report.id}`}
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      {report.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {report.serviceOrder?.number || `#${report.serviceOrderId}`}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {report.customer?.contactName || report.customer?.companyName || `#${report.customerId}`}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {report.technician?.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {report.serviceOrder?.completedDate
                      ? new Date(report.serviceOrder.completedDate).toLocaleDateString('es-MX')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/service-reports/${report.id}`}
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
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {search ? 'Sin resultados' : 'No hay reportes de servicio'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search
              ? 'Intenta con otros términos de búsqueda'
              : 'Los reportes se generan desde las ordenes de servicio'}
          </p>
          {!search && (
            <Link to="/service-orders" className="btn-secondary inline-flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Ver Ordenes de Servicio
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
