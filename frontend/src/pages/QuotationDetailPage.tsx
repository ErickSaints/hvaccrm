import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Printer,
  Send,
  ChevronDown,
  Building2,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { Quotation } from '../types';
import { useSuperAdminConfirm } from '../contexts/SuperAdminContext';

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

const statusActions: { value: string; label: string; icon?: React.ElementType }[] = [
  { value: 'ENVIADA', label: 'Marcar como Enviada', icon: Send },
  { value: 'APROBADA', label: 'Aprobar', icon: CheckCircle2 },
  { value: 'RECHAZADA', label: 'Rechazar', icon: XCircle },
  { value: 'VENCIDA', label: 'Marcar como Vencida', icon: Clock },
];

function statusBadge(status: string) {
  return (
    <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export default function QuotationDetailPage() {
  const confirmSuperAdmin = useSuperAdminConfirm();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusDropdown, setStatusDropdown] = useState(false);

  const { data: quotation, isLoading, error: queryError } = useQuery<Quotation>({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const { data } = await api.get<Quotation>(`/quotations/${id}`);
      return data;
    },
    enabled: Boolean(id),
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.put(`/quotations/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Estado actualizado');
      setStatusDropdown(false);
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Cotización eliminada');
      navigate('/quotations');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Error al eliminar cotización');
    },
  });

  const handleDelete = () => {
    confirmSuperAdmin(() => deleteMutation.mutate());
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quotations/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al generar PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${quotation?.number || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al descargar PDF');
    }
  };

  const handleSend = () => {
    statusMutation.mutate('ENVIADA');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (queryError) {
    const errMsg = (queryError as any)?.response?.data?.error || 'Error al cargar la cotización';
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-medium">{errMsg}</p>
        <Link to="/quotations" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
          Volver a cotizaciones
        </Link>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Cotización no encontrada</p>
        <Link to="/quotations" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
          Volver a cotizaciones
        </Link>
      </div>
    );
  }

  const items = quotation.items || [];
  const canChangeStatus = quotation.status === 'BORRADOR' || quotation.status === 'ENVIADA';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/quotations')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {statusBadge(quotation.status)}
              <span className="text-xs text-gray-400 dark:text-gray-500">{quotation.number}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{quotation.title || 'Cotización'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canChangeStatus && (
            <div className="relative">
              <button
                onClick={() => setStatusDropdown(!statusDropdown)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Cambiar Estado
                <ChevronDown className="w-4 h-4" />
              </button>
              {statusDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                    {statusActions
                      .filter((a) => a.value !== quotation.status)
                      .map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.value}
                            onClick={() => statusMutation.mutate(action.value)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                          >
                            {Icon && <Icon className="w-4 h-4" />}
                            {action.label}
                          </button>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}
          <button onClick={handleDownloadPdf} className="btn-secondary inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Descargar PDF
          </button>
          <button onClick={handlePrint} className="btn-secondary inline-flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <button onClick={handleDelete} className="btn-danger inline-flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="print-area">
        <div className="card print:shadow-none print:border-none">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{quotation.number}</h2>
              <p className="text-gray-500 dark:text-gray-400">{quotation.title || 'Cotización'}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">${quotation.total.toFixed(2)}</div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {quotation.validUntil
                  ? `Válida hasta ${new Date(quotation.validUntil).toLocaleDateString('es-MX')}`
                  : 'Sin fecha de vencimiento'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Cliente</p>
              {quotation.customer ? (
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{quotation.customer.contactName}</p>
                  {quotation.customer.companyName && (
                    <p className="text-sm text-gray-600">{quotation.customer.companyName}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">{quotation.customer.address}</p>
                  {quotation.customer.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{quotation.customer.phone}</p>}
                  {quotation.customer.email && <p className="text-sm text-gray-500 dark:text-gray-400">{quotation.customer.email}</p>}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Cliente #{quotation.customerId}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Fechas</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Creada: {new Date(quotation.createdAt).toLocaleDateString('es-MX')}
              </div>
              {quotation.validUntil && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  Vence: {new Date(quotation.validUntil).toLocaleDateString('es-MX')}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Creado por</p>
              {quotation.createdBy && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {quotation.createdBy.name}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Descripción</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 dark:text-gray-300 w-20">Cant.</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-700 dark:text-gray-300 w-32">P. Unitario</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-700 dark:text-gray-300 w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-3 py-3 text-gray-900 dark:text-gray-100">{item.description}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-3 py-3 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-gray-100">${item.total.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">Sin partidas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
            <div className="space-y-2 ml-auto w-full sm:w-72">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">${quotation.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">${quotation.tax.toFixed(2)}</span>
              </div>
              {quotation.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Descuento</span>
                  <span className="font-medium text-red-600">-${quotation.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-900 dark:text-gray-100">Total</span>
                <span className="text-gray-900 dark:text-gray-100">${quotation.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {quotation.notes && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Notas</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
            </div>
          )}

          {quotation.terms && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Términos y condiciones</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.terms}</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .print-only { display: none; }
        @media print {
          @page { margin: 1.5cm 1.8cm; size: letter; }
          * { box-shadow: none !important; text-shadow: none !important; background: transparent !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-only { display: flex !important; }
          .print-area { margin: 0; padding: 0; }
          .print-area .card { border: none !important; padding: 0 !important; }
          .print-area .text-3xl { font-size: 18px !important; color: #1e40af !important; }
          .print-area .grid { display: flex !important; gap: 16px !important; margin-bottom: 14px !important; }
          .print-area .grid > div { flex: 1; border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px 12px; }
          .print-area .grid p:first-child { font-size: 7px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; font-weight: 700; }
          .print-area .grid .font-medium { font-size: 9px; color: #1f2937; font-weight: 600; }
          .print-area .grid .text-sm { font-size: 8px; color: #4b5563; }
          .print-area .grid .text-xs { font-size: 7px; }
          .print-area .grid svg { display: none; }
          .print-area table { font-size: 9px; border-collapse: collapse; width: 100%; margin-bottom: 12px; }
          .print-area table thead tr { border: none; }
          .print-area table thead th { background: #1e40af !important; color: white !important; padding: 6px 8px; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; border: none; }
          .print-area table thead th:nth-child(2) { text-align: center; width: 50px; }
          .print-area table thead th:nth-child(3) { text-align: right; width: 80px; }
          .print-area table thead th:nth-child(4) { text-align: right; width: 80px; }
          .print-area table tbody tr { border: none; }
          .print-area table tbody td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; color: #374151; }
          .print-area table tbody td:nth-child(2) { text-align: center; }
          .print-area table tbody td:nth-child(3) { text-align: right; }
          .print-area table tbody td:nth-child(4) { text-align: right; font-weight: 600; }
          .print-area table tbody tr:nth-child(even) td { background: #f9fafb !important; }
          .print-area table tbody tr:last-child td { border-bottom: 2px solid #1e40af; }
          .print-area .border-t-2 { border: none !important; padding-top: 0 !important; margin-top: 0 !important; }
          .print-area .border-t-2 .ml-auto { width: 240px !important; margin-left: auto !important; }
          .print-area .border-t-2 .space-y-2 > div { padding: 2px 0; font-size: 9px; display: flex; justify-content: space-between; }
          .print-area .border-t-2 .font-bold { border-top: 2px solid #1e40af; margin-top: 2px; padding-top: 4px; font-size: 11px; color: #1e40af; }
          .print-area .border-t-2 .text-red-600 { color: #dc2626 !important; }
          .print-area .border-t { border-top: 1px solid #e5e7eb !important; margin-top: 10px !important; padding-top: 8px !important; }
          .print-area .border-t h3 { font-size: 9px; }
          .print-area .border-t p { font-size: 8px; color: #6b7280; }
          .print-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 3px solid #1e40af; }
          .print-header-left h1 { font-size: 18px; margin: 0 0 2px; color: #1e40af; }
          .print-header-left p { margin: 0; font-size: 8px; color: #6b7280; }
          .print-header-right { text-align: right; font-size: 7px; color: #374151; line-height: 1.6; }
        }
      `}</style>
      <div className="print-only print-header">
        <div className="print-header-left">
          <h1>HVAC-R CRM</h1>
          <p>El CRM inteligente para HVAC-R · www.hvaccrm.com</p>
        </div>
        <div className="print-header-right">
          <div>Av. Principal 123, Col. Centro</div>
          <div>Ciudad de México, CDMX</div>
          <div>contacto@hvaccrm.com · (55) 1234-5678</div>
        </div>
      </div>
    </div>
  );
}
