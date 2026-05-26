import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Camera, Save, Loader2, Mail, Phone, Shield, Calendar, CreditCard, Clock } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import type { User as UserType } from '../types';

interface SubscriptionInfo {
  id: number;
  status: string;
  startDate: string;
  endDate: string;
  plan: { id: number; name: string; price: number };
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  SALES: 'Ventas',
  CLIENT: 'Cliente',
  PROYECTOS: 'Proyectos',
  COMPRAS: 'Compras',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-blue-100 text-blue-700',
  SALES: 'bg-green-100 text-green-700',
  CLIENT: 'bg-amber-100 text-amber-700',
  PROYECTOS: 'bg-indigo-100 text-indigo-700',
  COMPRAS: 'bg-pink-100 text-pink-700',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const { data: profile } = useQuery<UserType>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get<UserType>('/profile');
      return data;
    },
    enabled: !!user,
  });

  const { data: subData } = useQuery<{ subscription: SubscriptionInfo | null; trialEndsAt: string | null }>({
    queryKey: ['subscription-my'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/my');
      return data;
    },
    enabled: !!user,
  });
  const subscription = subData?.subscription;
  const trialEndsAt = subData?.trialEndsAt ? new Date(subData.trialEndsAt) : null;
  const isOnTrial = trialEndsAt && trialEndsAt > new Date();

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      await api.put('/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil actualizado');
      setIsEditing(false);
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al actualizar'
          : 'Error al actualizar';
      toast.error(message);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/profile/avatar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Avatar actualizado');
    },
    onError: () => {
      toast.error('Error al subir avatar');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      avatarMutation.mutate(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const currentUser = profile || user;
  if (!currentUser) return null;

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    EXPIRED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Información personal y configuración de cuenta</p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white"
            >
              <Camera className="w-6 h-6" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4 w-full">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: currentUser.name,
                        email: currentUser.email,
                        phone: currentUser.phone || '',
                      });
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{currentUser.name}</h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        roleColors[currentUser.role]
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {roleLabels[currentUser.role] || currentUser.role}
                    </span>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">
                    Editar
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {currentUser.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {currentUser.phone || 'Sin teléfono'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Trial Info */}
      {isOnTrial && (
        <div className="card bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" />
            Período de Prueba
          </h3>
          <p className="text-gray-600 text-sm">
            Estás en tu período de prueba gratuito. Tu prueba vence el{' '}
            <strong>{trialEndsAt?.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
            Realiza el pago para continuar usando el servicio sin interrupciones.
          </p>
        </div>
      )}

      {/* Subscription Info */}
      {subscription && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            Suscripción
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Plan</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{subscription.plan.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                  statusColors[subscription.status] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {subscription.status === 'ACTIVA' ? 'Activa' : subscription.status === 'PENDIENTE' ? 'Pendiente' : subscription.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Inicio</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                {subscription.startDate
                  ? new Date(subscription.startDate).toLocaleDateString('es-MX')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vencimiento</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                {subscription.endDate
                  ? new Date(subscription.endDate).toLocaleDateString('es-MX')
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
