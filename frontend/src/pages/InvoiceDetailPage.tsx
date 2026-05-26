import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Printer, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { Invoice } from '../types';

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

const statusActions: { value: string; label: string; icon?: React.ElementType }[] = [
  { value: 'EMITIDA', label: 'Emitir', icon: FileText },
  { value: 'PAGADA', label: 'Marcar como Pagada', icon: CheckCircle2 },
  { value: 'CANCELADA', label: 'Cancelar', icon: XCircle },
  { value: 'VENCIDA', label: 'Marcar como Vencida', icon: Clock },
];

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data } = await api.get<Invoice>(`/invoices/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.put(`/invoices/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Factura no encontrada</p>
        <Link to="/invoices" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
          Volver a facturas
        </Link>
      </div>
    );
  }

  const canChangeStatus = invoice.status === 'BORRADOR' || invoice.status === 'EMITIDA';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusStyles[invoice.status] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabels[invoice.status] || invoice.status}
              </span>
              <span className="text-xs text-gray-400">{invoice.number}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canChangeStatus && (
            <div className="relative">
              {statusActions.filter((a) => a.value !== invoice.status).map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.value}
                    onClick={() => statusMutation.mutate(action.value)}
                    className="btn-primary inline-flex items-center gap-2 mr-2"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
          <button onClick={handlePrint} className="btn-secondary inline-flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      <div className="card print:shadow-none">
        <div className="text-center border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{invoice.title}</h1>
          <p className="text-gray-500">Factura #{invoice.number}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Cliente</h3>
            <p className="text-gray-900 font-medium">{invoice.customer?.contactName}</p>
            {invoice.customer?.companyName && <p className="text-gray-600 text-sm">{invoice.customer.companyName}</p>}
            {invoice.customer?.email && <p className="text-gray-500 text-sm">{invoice.customer.email}</p>}
          </div>
          <div className="text-right">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Detalles</h3>
            <p className="text-gray-600 text-sm">Creada: {new Date(invoice.createdAt).toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>
            {invoice.dueDate && <p className="text-gray-600 text-sm">Vence: {new Date(invoice.dueDate).toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>}
            {invoice.paidAt && <p className="text-green-600 text-sm font-medium">Pagada: {new Date(invoice.paidAt).toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">${invoice.subtotal.toLocaleString('es-MX')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">IVA</span>
              <span className="text-gray-900">${invoice.tax.toLocaleString('es-MX')}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Descuento</span>
                <span className="text-red-600">-${invoice.discount.toLocaleString('es-MX')}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">${invoice.total.toLocaleString('es-MX')}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas</h3>
            <p className="text-gray-600 text-sm">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
