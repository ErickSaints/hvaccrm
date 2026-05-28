import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, FileText, Loader2, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import type { Invoice, PaginatedResponse } from '../types';
import Pagination from '../components/Pagination';

const statusStyles: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  EMITIDA: 'bg-blue-100 text-blue-800',
  PAGADA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800',
  VENCIDA: 'bg-amber-100 text-amber-800',
};

const statusLabels: Record<string, string> = {
  BORRADOR: 'Borrador',
  EMITIDA: 'Emitida',
  PAGADA: 'Pagada',
  CANCELADA: 'Cancelada',
  VENCIDA: 'Vencida',
};

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      const { data } = await api.get(`/invoices?${params}`);
      return data;
    },
  });

  const invoices = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Facturas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona las facturas del sistema</p>
        </div>
        <Link to="/invoices/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Factura
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Número</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Título</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Total</th>
                <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Fecha</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {invoices && invoices.length > 0 ? invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{inv.number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{inv.customer?.contactName || `Cliente #${inv.customerId}`}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 truncate max-w-[200px] block">{inv.title}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">${inv.total.toLocaleString('es-MX')}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyles[inv.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[inv.status] || inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(inv.createdAt).toLocaleDateString('es-MX', { dateStyle: 'short' })}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/invoices/${inv.id}`} className="text-primary-600 hover:text-primary-700 p-1 inline-block">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Sin facturas</p>
                    <Link to="/invoices/new" className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-block mt-1">
                      Crear primera factura
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
