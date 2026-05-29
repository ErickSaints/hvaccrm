import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Send, BarChart3, Mail, MessageSquare, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useSuperAdminConfirm } from '../contexts/SuperAdminContext';

interface Campaign {
  id: number;
  name: string;
  description: string | null;
  type: 'EMAIL' | 'SMS' | 'BOTH';
  status: 'BORRADOR' | 'ACTIVA' | 'PAUSADA' | 'COMPLETADA';
  subject: string | null;
  content: string | null;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  revenueAttributed: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  createdBy: { name: string };
}

const typeStyles: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-800',
  SMS: 'bg-green-100 text-green-800',
  BOTH: 'bg-purple-100 text-purple-800',
};

const typeLabels: Record<string, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  BOTH: 'Ambos',
};

const statusStyles: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  ACTIVA: 'bg-green-100 text-green-800',
  PAUSADA: 'bg-amber-100 text-amber-800',
  COMPLETADA: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<string, string> = {
  BORRADOR: 'Borrador',
  ACTIVA: 'Activa',
  PAUSADA: 'Pausada',
  COMPLETADA: 'Completada',
};

export default function MarketingCampaignsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'EMAIL' | 'SMS' | 'BOTH'>('EMAIL');
  const [formSubject, setFormSubject] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formAudienceFilter, setFormAudienceFilter] = useState('');
  const [formScheduledAt, setFormScheduledAt] = useState('');
  const queryClient = useQueryClient();
  const confirmSuperAdmin = useSuperAdminConfirm();

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.data || []);
    }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: formName,
        type: formType,
        subject: formSubject || undefined,
        content: formContent || undefined,
        scheduledAt: formScheduledAt || undefined,
      };
      if (formAudienceFilter) {
        try {
          payload.audienceFilter = JSON.parse(formAudienceFilter);
        } catch {
          payload.audienceFilter = formAudienceFilter;
        }
      }
      await api.post('/campaigns', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaña creada');
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al crear campaña'),
  });

  const sendMutation = useMutation({
    mutationFn: (id: number) => api.post(`/campaigns/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaña enviada');
      setDetailOpen(false);
      setSelectedCampaign(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al enviar campaña'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaña eliminada');
      setDetailOpen(false);
      setSelectedCampaign(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al eliminar campaña'),
  });

  const filtered = campaigns?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setFormName('');
    setFormType('EMAIL');
    setFormSubject('');
    setFormContent('');
    setFormAudienceFilter('');
    setFormScheduledAt('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const openDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDetailOpen(true);
  };

  const handleSend = (campaign: Campaign) => {
    if (confirm(`¿Enviar la campaña "${campaign.name}"?`)) {
      sendMutation.mutate(campaign.id);
    }
  };

  const handleDelete = (campaign: Campaign) => {
    confirmSuperAdmin(() => deleteMutation.mutate(campaign.id));
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
            <h1 className="text-xl lg:text-2xl font-bold text-white">Campañas de Marketing</h1>
            <p className="text-primary-200 text-sm mt-1">Gestiona campañas de email y SMS</p>
          </div>
          <button onClick={openCreateModal} className="btn-primary bg-white/20 border-white/30 text-white hover:bg-white/30 inline-flex items-center gap-2 backdrop-blur-sm">
            <Plus className="w-4 h-4" />
            Nueva Campaña
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Buscar campañas..."
        />
      </div>

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered?.length === 0 ? (
        <div className="card text-center py-12">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {search ? 'Sin resultados' : 'No hay campañas registradas'}
          </p>
          {!search && (
            <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus className="w-4 h-4" />
              Crear primera campaña
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Nombre</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Tipo</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Estado</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Enviados</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Apertura</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Creada</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered?.map(campaign => (
                <tr
                  key={campaign.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => openDetail(campaign)}
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{campaign.name}</span>
                    {campaign.subject && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[240px]">
                        {campaign.subject}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeStyles[campaign.type]}`}>
                      {typeLabels[campaign.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[campaign.status]}`}>
                      {statusLabels[campaign.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {campaign.sentCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {campaign.sentCount > 0
                      ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1) + '%'
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {new Date(campaign.createdAt).toLocaleDateString('es-MX', { dateStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetail(campaign); }}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {campaign.status === 'BORRADOR' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSend(campaign); }}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Enviar"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(campaign); }}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nueva Campaña</h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre *</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="input-field"
                  placeholder="Campaña de verano 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo *</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as 'EMAIL' | 'SMS' | 'BOTH')}
                  className="input-field"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="BOTH">Ambos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Asunto</label>
                <input
                  value={formSubject}
                  onChange={e => setFormSubject(e.target.value)}
                  className="input-field"
                  placeholder="No te pierdas nuestras ofertas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contenido</label>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Escribe el contenido de la campaña..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Filtro de audiencia (JSON)
                </label>
                <textarea
                  value={formAudienceFilter}
                  onChange={e => setFormAudienceFilter(e.target.value)}
                  rows={3}
                  className="input-field font-mono text-xs"
                  placeholder='{"tags": {"$in": ["cliente-frecuente"]}}'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Programar envío</label>
                <input
                  type="datetime-local"
                  value={formScheduledAt}
                  onChange={e => setFormScheduledAt(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={!formName || createMutation.isPending}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {createMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Crear Campaña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setDetailOpen(false); setSelectedCampaign(null); }} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedCampaign.name}
              </h2>
              <button
                onClick={() => { setDetailOpen(false); setSelectedCampaign(null); }}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeStyles[selectedCampaign.type]}`}>
                  {typeLabels[selectedCampaign.type]}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[selectedCampaign.status]}`}>
                  {statusLabels[selectedCampaign.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedCampaign.subject && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Asunto</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedCampaign.subject}</p>
                  </div>
                )}
                {selectedCampaign.content && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Contenido</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedCampaign.content}</p>
                  </div>
                )}
                {selectedCampaign.scheduledAt && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Programado para</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedCampaign.scheduledAt).toLocaleString('es-MX')}
                    </p>
                  </div>
                )}
                {selectedCampaign.sentAt && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Enviado el</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedCampaign.sentAt).toLocaleString('es-MX')}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Creado por</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedCampaign.createdBy.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Creado el</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(selectedCampaign.createdAt).toLocaleString('es-MX')}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  Estadísticas de envío
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedCampaign.sentCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Enviados</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedCampaign.openedCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Abiertos</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedCampaign.clickedCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Clics</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${selectedCampaign.revenueAttributed.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Ingresos</p>
                  </div>
                </div>
                {selectedCampaign.sentCount > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Tasa de apertura</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {((selectedCampaign.openedCount / selectedCampaign.sentCount) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-primary-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min((selectedCampaign.openedCount / selectedCampaign.sentCount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Tasa de clics</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {selectedCampaign.openedCount > 0
                            ? ((selectedCampaign.clickedCount / selectedCampaign.openedCount) * 100).toFixed(1)
                            : '0.0'}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              selectedCampaign.openedCount > 0
                                ? (selectedCampaign.clickedCount / selectedCampaign.openedCount) * 100
                                : 0,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                {selectedCampaign.status === 'BORRADOR' && (
                  <button
                    onClick={() => handleSend(selectedCampaign)}
                    disabled={sendMutation.isPending}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    {sendMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Enviar
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedCampaign)}
                  disabled={deleteMutation.isPending}
                  className="btn-secondary inline-flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  {deleteMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
