import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Printer,
  Calendar,
  User,
  Wrench,
  Building2,
  Clock,
  FileText,
  Package,
  Image,
  PenLine,
} from 'lucide-react';
import api from '../lib/api';
import type { ServiceReport } from '../types';

export default function ServiceReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading } = useQuery<ServiceReport>({
    queryKey: ['service-report', id],
    queryFn: async () => {
      const { data } = await api.get<ServiceReport>(`/service-reports/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Reporte de servicio no encontrado</p>
        <Link to="/service-reports" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
          Volver a reportes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/service-reports')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reporte de Servicio</h1>
            <p className="text-gray-500 mt-1">#{report.id} - {report.title}</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      <div className="card print:shadow-none print:border-gray-300" id="report-content">
        <div className="text-center border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.title}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Reporte #{report.id}
            </span>
            {report.serviceOrder?.number && (
              <span className="flex items-center gap-1">
                <Wrench className="w-4 h-4" />
                OS: {report.serviceOrder.number}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
              Información del Cliente
            </h2>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    {report.customer?.companyName || report.customer?.contactName}
                  </p>
                  {report.customer?.contactName && report.customer?.companyName && (
                    <p className="text-sm text-gray-600">Contacto: {report.customer.contactName}</p>
                  )}
                  {report.customer?.phone && (
                    <p className="text-sm text-gray-600">Tel: {report.customer.phone}</p>
                  )}
                  {report.customer?.address && (
                    <p className="text-sm text-gray-600">{report.customer.address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
              Información del Servicio
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Técnico:</span>{' '}
                  {report.technician?.name || 'No asignado'}
                </p>
              </div>
              {report.equipment && (
                <div className="flex items-start gap-2">
                  <Wrench className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.equipment.type}</p>
                    {report.equipment.brand && (
                      <p className="text-sm text-gray-600">Marca: {report.equipment.brand}</p>
                    )}
                    {report.equipment.model && (
                      <p className="text-sm text-gray-600">Modelo: {report.equipment.model}</p>
                    )}
                    {report.equipment.serialNumber && (
                      <p className="text-sm text-gray-600">Serie: {report.equipment.serialNumber}</p>
                    )}
                  </div>
                </div>
              )}
              {report.serviceOrder?.completedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Fecha:</span>{' '}
                    {new Date(report.serviceOrder.completedDate).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {(report.arrivalTime || report.departureTime) && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Horario:</span>{' '}
                    {report.arrivalTime || '--:--'} - {report.departureTime || '--:--'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {report.description && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">
              Descripción
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
          </div>
        )}

        {report.diagnosis && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">
              Diagnóstico
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{report.diagnosis}</p>
          </div>
        )}

        {report.workPerformed && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">
              Trabajo Realizado
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{report.workPerformed}</p>
          </div>
        )}

        {report.recommendations && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">
              Recomendaciones
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{report.recommendations}</p>
          </div>
        )}

        {report.photos && report.photos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Fotografías
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.photos.map((photo, index) => (
                <div key={photo.id || index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={photo.caption || `Foto ${index + 1}`}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`p-3 bg-gray-50 ${photo.url ? '' : 'hidden'}`}>
                    {photo.caption && (
                      <p className="text-sm font-medium text-gray-900">{photo.caption}</p>
                    )}
                    {photo.type && (
                      <p className="text-xs text-gray-500 mt-1">{photo.type}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.usedMaterials && report.usedMaterials.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Materiales Utilizados
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b border-gray-200">
                      Material
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700 border-b border-gray-200 w-24">
                      Cantidad
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b border-gray-200 w-32">
                      P. Unitario
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b border-gray-200 w-32">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.usedMaterials.map((material, index) => (
                    <tr key={material.id || index} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 py-3 text-gray-900">{material.name}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{material.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-700">${material.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">${material.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-900 border-t-2 border-gray-200">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 border-t-2 border-gray-200">
                      ${report.usedMaterials.reduce((sum, m) => sum + m.total, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {report.signature && (
          <div className="mt-12 pt-8 border-t-2 border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pb-2 mb-6 flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              Firma de Conformidad
            </h2>
            <div className="max-w-md">
              <div className="border-b-2 border-gray-900 mb-4 pt-8">
                <p className="text-center text-gray-700 font-medium">{report.signature}</p>
              </div>
              <p className="text-xs text-gray-500 text-center">Nombre y firma de quien recibe el servicio</p>
            </div>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Reporte generado el {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="mt-1">Documento oficial - Sistema HVAC-R CRM</p>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 1rem !important;
          }
          @page {
            margin: 1in;
          }
        }
      `}</style>
    </div>
  );
}
