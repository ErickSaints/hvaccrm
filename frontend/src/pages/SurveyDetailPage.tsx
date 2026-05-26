import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { ArrowLeft, Camera, Package, Layers, MapPin, User, Calendar, Loader2, Pencil } from 'lucide-react';
import api from '../lib/api';

interface SurveyDetail {
  id: number;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  createdAt: string;
  customer: { contactName: string; companyName?: string; phone: string };
  createdBy: { name: string; email: string };
  photos: Array<{ id: number; url: string; caption: string | null }>;
  materials: Array<{ id: number; description: string; quantity: number; unit: string; category: string | null; notes: string | null }>;
  drawings: Array<{ id: number; name: string | null; canvasData: string }>;
}

const statusColor: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-600',
  COMPLETADO: 'bg-green-100 text-green-700',
  EN_PROGRESO: 'bg-blue-100 text-blue-700',
  CANCELADO: 'bg-red-100 text-red-600',
};

const statusLabel: Record<string, string> = {
  BORRADOR: 'Borrador',
  COMPLETADO: 'Completado',
  EN_PROGRESO: 'En Progreso',
  CANCELADO: 'Cancelado',
};

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: survey, isLoading } = useQuery<SurveyDetail>({
    queryKey: ['survey', id],
    queryFn: () => api.get(`/surveys/${id}`).then(r => r.data),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  if (!survey) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Levantamiento no encontrado</p>
        <Link to="/surveys" className="text-primary-600 hover:underline mt-2 inline-block">Volver a levantamientos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/surveys" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[survey.status] || 'bg-gray-100 text-gray-600'}`}>
                {statusLabel[survey.status] || survey.status}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{survey.customer.companyName || survey.customer.contactName}</p>
          </div>
        </div>
        <Link to={`/surveys/${survey.id}/edit`} className="btn-primary inline-flex items-center gap-2">
          <Pencil className="w-4 h-4" />
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card space-y-3 text-sm">
            <h3 className="font-semibold text-gray-900">Detalles</h3>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{survey.location || 'Sin ubicación'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 shrink-0" />
              <span>{survey.createdBy.name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{new Date(survey.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            {survey.description && (
              <p className="text-gray-600 pt-2 border-t border-gray-100">{survey.description}</p>
            )}
          </div>

          <div className="card text-sm space-y-2">
            <h3 className="font-semibold text-gray-900">Cliente</h3>
            <p className="text-gray-700">{survey.customer.companyName || survey.customer.contactName}</p>
            <p className="text-gray-500">{survey.customer.contactName}</p>
            {survey.customer.phone && <p className="text-gray-500">{survey.customer.phone}</p>}
          </div>

          <div className="card text-sm space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              Materiales ({survey.materials.length})
            </h3>
            {survey.materials.length === 0 ? (
              <p className="text-gray-400">Sin materiales registrados</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {survey.materials.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-gray-700">{m.description}</p>
                      <span className="text-[10px] text-gray-400">{m.category}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800 shrink-0 ml-2">
                      {m.quantity} {m.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-gray-400" />
              Fotos ({survey.photos.length})
            </h2>
            {survey.photos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Sin fotos</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {survey.photos.map((photo) => (
                  <div key={photo.id} className="group">
                    <img
                      src={photo.url}
                      alt={photo.caption || ''}
                      className="w-full h-36 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(photo.url, '_blank')}
                    />
                    {photo.caption && (
                      <p className="text-xs text-gray-500 mt-1">{photo.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawings */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-gray-400" />
              Dibujos y Croquis ({survey.drawings.length})
            </h2>
            {survey.drawings.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Sin dibujos</p>
            ) : (
              <div className="space-y-4">
                {survey.drawings.map((drawing) => (
                  <DrawingViewer key={drawing.id} drawing={drawing} />
                ))}
              </div>
            )}
          </div>

          {/* Materials table */}
          {survey.materials.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-400" />
                Lista de Materiales
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th className="pb-2 pr-4">Descripción</th>
                      <th className="pb-2 pr-4">Cant</th>
                      <th className="pb-2 pr-4">Unidad</th>
                      <th className="pb-2 pr-4">Categoría</th>
                      <th className="pb-2">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {survey.materials.map((m) => (
                      <tr key={m.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 pr-4 text-gray-900">{m.description}</td>
                        <td className="py-2 pr-4 text-gray-700">{m.quantity}</td>
                        <td className="py-2 pr-4 text-gray-700">{m.unit}</td>
                        <td className="py-2 pr-4">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {m.category || 'Otros'}
                          </span>
                        </td>
                        <td className="py-2 text-gray-500">{m.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DrawingViewer({ drawing }: { drawing: { id: number; name: string | null; canvasData: string } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !drawing.canvasData) return;
    const c = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 400,
      backgroundColor: '#f8fafc',
      selection: false,
      interactive: false,
    });
    try {
      const data = JSON.parse(drawing.canvasData);
      c.loadFromJSON(data, () => {
        c.renderAll();
      });
    } catch {
      // Ignore parse errors
    }
    return () => { c.dispose(); };
  }, [drawing.canvasData]);

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">{drawing.name || 'Dibujo'}</h4>
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-[#f8fafc]">
        <canvas ref={canvasRef} className="w-full max-h-[400px]" />
      </div>
    </div>
  );
}
