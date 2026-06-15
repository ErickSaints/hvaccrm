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
          @page { margin: 1.8cm 1.5cm; size: letter; }
          html, body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body > div, body > div > div, body > div > div > div { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-area { display: none !important; }
        }
        .print-doc { font-family: 'Helvetica', 'Arial', sans-serif; color: #1f2937; max-width: 100%; }
        .print-doc .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 3px solid #1e40af; }
        .print-doc .header .left h1 { font-size: 22px; margin: 0 0 2px; color: #1e40af; }
        .print-doc .header .left p { margin: 0; font-size: 9px; color: #6b7280; }
        .print-doc .header .right { text-align: right; font-size: 8px; color: #374151; line-height: 1.6; }
        .print-doc .title-area { margin: 14px 0 4px; }
        .print-doc .title-area .doc-title { font-size: 14px; color: #1e40af; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
        .print-doc .title-area .doc-number { font-size: 10px; color: #6b7280; margin-top: 2px; }
        .print-doc .title-area .doc-subject { font-size: 14px; font-weight: 700; color: #111827; margin-top: 4px; }
        .print-doc .info-boxes { display: flex; gap: 14px; margin: 12px 0 16px; }
        .print-doc .info-boxes > div { flex: 1; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 10px; }
        .print-doc .info-boxes .label { font-size: 7px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 3px; }
        .print-doc .info-boxes .value { font-size: 9px; color: #1f2937; line-height: 1.5; }
        .print-doc .info-boxes .value.nobreak { white-space: nowrap; }
        .print-doc table.items { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 9px; }
        .print-doc table.items thead th { background: #1e40af; color: white; padding: 6px 8px; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        .print-doc table.items thead th:nth-child(1) { width: 55%; }
        .print-doc table.items thead th:nth-child(2) { width: 10%; text-align: center; }
        .print-doc table.items thead th:nth-child(3) { width: 17%; text-align: right; }
        .print-doc table.items thead th:nth-child(4) { width: 18%; text-align: right; }
        .print-doc table.items tbody td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
        .print-doc table.items tbody td:nth-child(2) { text-align: center; }
        .print-doc table.items tbody td:nth-child(3) { text-align: right; }
        .print-doc table.items tbody td:nth-child(4) { text-align: right; font-weight: 600; }
        .print-doc table.items tbody tr:nth-child(even) td { background: #f9fafb; }
        .print-doc table.items tbody tr:last-child td { border-bottom: 2px solid #1e40af; }
        .print-doc .totals { margin-left: auto; width: 240px; font-size: 9px; }
        .print-doc .totals > div { display: flex; justify-content: space-between; padding: 2px 0; }
        .print-doc .totals .total { border-top: 2px solid #1e40af; margin-top: 2px; padding-top: 4px; font-weight: 700; font-size: 11px; color: #1e40af; }
        .print-doc .notes { margin-top: 14px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
        .print-doc .notes h3 { font-size: 9px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .print-doc .notes p { font-size: 8px; color: #6b7280; white-space: pre-wrap; margin: 0; }
        .print-doc .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 7px; color: #9ca3af; }
      `}</style>
      <div className="print-only print-doc">
        <div className="header">
          <div className="left">
            <h1>HVAC-R CRM</h1>
            <p>El CRM inteligente para HVAC-R · www.hvaccrm.com</p>
          </div>
          <div className="right">
            <div>Av. Principal 123, Col. Centro</div>
            <div>Ciudad de México, CDMX</div>
            <div>contacto@hvaccrm.com · (55) 1234-5678</div>
          </div>
        </div>
        <div className="title-area">
          <div className="doc-title">Cotizaci&oacute;n</div>
          <div className="doc-number">{quotation.number}</div>
          {quotation.title && <div className="doc-subject">{quotation.title}</div>}
        </div>
        <div className="info-boxes">
          <div>
            <div className="label">Cliente</div>
            <div className="value">{quotation.customer?.companyName || quotation.customer?.contactName || `Cliente #${quotation.customerId}`}<br />{quotation.customer?.contactName}{quotation.customer?.companyName ? '' : <br />}{quotation.customer?.address && <><br />{quotation.customer.address}</>}</div>
          </div>
          <div>
            <div className="label">Fechas</div>
            <div className="value">Creada: {new Date(quotation.createdAt).toLocaleDateString('es-MX')}<br />Vence: {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('es-MX') : 'N/A'}</div>
          </div>
          <div>
            <div className="label">Contacto</div>
            <div className="value">{quotation.customer?.phone && <>{quotation.customer.phone}<br /></>}{quotation.customer?.email || ''}</div>
          </div>
        </div>
        <table className="items">
          <thead>
            <tr>
              <th>Descripci&oacute;n</th>
              <th>Cant.</th>
              <th>P. Unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${item.total.toFixed(2)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>Sin partidas</td></tr>
            )}
          </tbody>
        </table>
        <div className="totals">
          <div><span>Subtotal</span><span>${quotation.subtotal.toFixed(2)}</span></div>
          <div><span>IVA</span><span>${quotation.tax.toFixed(2)}</span></div>
          {quotation.discount > 0 && <div><span>Descuento</span><span style={{ color: '#dc2626' }}>-${quotation.discount.toFixed(2)}</span></div>}
          <div className="total"><span>Total</span><span>${quotation.total.toFixed(2)}</span></div>
        </div>
        {quotation.notes && (
          <div className="notes">
            <h3>Notas</h3>
            <p>{quotation.notes}</p>
          </div>
        )}
        {quotation.terms && (
          <div className="notes">
            <h3>T&eacute;rminos y condiciones</h3>
            <p>{quotation.terms}</p>
          </div>
        )}
        <div className="footer">
          Documento generado electr&oacute;nicamente por HVAC-R CRM &middot; {new Date().toLocaleDateString('es-MX')}
        </div>
      </div>
    </div>
  );
}
