import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, QrCode, Wrench, FileText, Loader2, MapPin, Barcode, Calendar } from 'lucide-react';
import api from '../lib/api';

interface AssetDetail {
  id: number;
  name: string;
  description: string | null;
  serialNumber: string | null;
  location: string | null;
  qrCode: string | null;
  customer: { contactName: string; companyName?: string; phone: string };
  maintenanceLogs: Array<{
    id: number;
    description: string;
    status: string;
    scheduledDate: string;
    completedDate?: string;
    equipment?: { type: string; brand?: string; model?: string };
    assignedUser?: { name: string };
  }>;
  serviceReports: Array<{
    id: number;
    title: string;
    createdAt: string;
    diagnosis?: string;
    workPerformed?: string;
    technician?: { name: string };
    equipment?: { type: string };
    photos: Array<{ url: string; caption?: string }>;
  }>;
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const baseUrl = window.location.origin;

  const { data: asset, isLoading } = useQuery<AssetDetail>({
    queryKey: ['asset', id],
    queryFn: () => api.get(`/assets/${id}`).then(r => r.data),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  if (!asset) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Activo no encontrado</p>
        <Link to="/assets" className="text-primary-600 hover:underline mt-2 inline-block">Volver a activos</Link>
      </div>
    );
  }

  const qrUrl = `${baseUrl}/assets/${asset.id}`;
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/assets" className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{asset.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{asset.customer.companyName || asset.customer.contactName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info + QR */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card space-y-4">
            <div className="flex justify-center">
              <img src={qrImage} alt={`QR para ${asset.name}`} className="w-48 h-48" />
            </div>
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 break-all">{qrUrl}</p>
            <a
              href={qrImage}
              download={`qr-${asset.name.replace(/\s+/g, '-')}.png`}
              className="btn-secondary w-full text-center inline-block text-sm"
            >
              Descargar QR
            </a>
          </div>

          <div className="card space-y-3 text-sm">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Detalles</h3>
            {asset.serialNumber && (
              <div className="flex items-center gap-2 text-gray-600">
                <Barcode className="w-4 h-4" />
                <span>SN: {asset.serialNumber}</span>
              </div>
            )}
            {asset.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{asset.location}</span>
              </div>
            )}
            {asset.description && (
              <p className="text-gray-600 mt-2">{asset.description}</p>
            )}
          </div>
        </div>

        {/* Maintenance & Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Last Maintenance */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              Últimos Mantenimientos
            </h2>
            {asset.maintenanceLogs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Sin registros de mantenimiento</p>
            ) : (
              <div className="space-y-3">
                {asset.maintenanceLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{log.description}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        log.status === 'COMPLETADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {log.status === 'COMPLETADO' ? 'Completado' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.scheduledDate).toLocaleDateString('es-MX')}
                      </span>
                      {log.equipment && <span>{log.equipment.type}</span>}
                      {log.assignedUser && <span>{log.assignedUser.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Last Service Reports */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              Últimos Reportes de Servicio
            </h2>
            {asset.serviceReports.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Sin reportes de servicio</p>
            ) : (
              <div className="space-y-4">
                {asset.serviceReports.map((report) => (
                  <div key={report.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Link to={`/service-reports/${report.id}`} className="font-medium text-primary-600 hover:text-primary-700 text-sm">
                      {report.title}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(report.createdAt).toLocaleDateString('es-MX')}
                      {report.technician && ` — ${report.technician.name}`}
                    </p>
                    {report.diagnosis && (
                      <p className="text-sm text-gray-600 mt-2"><strong>Diagnóstico:</strong> {report.diagnosis}</p>
                    )}
                    {report.workPerformed && (
                      <p className="text-sm text-gray-600 mt-1"><strong>Trabajo:</strong> {report.workPerformed}</p>
                    )}
                    {report.photos.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {report.photos.map((photo, i) => (
                          <img key={i} src={photo.url} alt={photo.caption || ''} className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-700" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
